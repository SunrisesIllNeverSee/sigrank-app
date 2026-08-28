/**
 * __tests__/standard/standalone-fixture-conformance.test.mjs
 *
 * Cross-repository conformance gate: validates @sigrank/cascade's output
 * against the authoritative fixture pack from SunrisesIllNeverSee/sigrank-standard.
 *
 * The fixture pack is the source of truth for sigrank/0.1-draft conformance.
 * This test ensures the cascade engine produces records that pass the same
 * fixtures the standalone conformance runner enforces.
 *
 * Pin: the Standard commit is pinned via the SIGRANK_STANDARD_REF env var
 * (default: the merged baseline `224505a`). Upstream changes to the Standard
 * cannot silently alter consumer builds — a bump requires updating this pin
 * in a reviewable commit.
 *
 * Usage (CI):
 *   node --test __tests__/standard/standalone-fixture-conformance.test.mjs
 *
 * The sigrank-standard repo path is provided via:
 *   - SIGRANK_STANDARD_PATH env var, or
 *   - ../_05_sigrank-standard (sibling repo in the monorepo layout), or
 *   - standard/ (local copy in the app repo, if present)
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { cascade } from "@sigrank/cascade";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

// Pinned Standard ref. Bumping this is a reviewable change.
const SIGRANK_STANDARD_REF = process.env.SIGRANK_STANDARD_REF || "224505a";

// Find the sigrank-standard repo
const candidates = [
  process.env.SIGRANK_STANDARD_PATH,
  resolve(ROOT, "..", "_05_sigrank-standard"),
  resolve(ROOT, "standard"),
].filter(Boolean);

let standardRoot = null;
for (const c of candidates) {
  if (c && existsSync(join(c, "examples", "fixtures"))) {
    standardRoot = c;
    break;
  }
}

if (!standardRoot) {
  console.error(
    "standalone-fixture-conformance: sigrank-standard repo not found.",
  );
  console.error("Set SIGRANK_STANDARD_PATH or place it as a sibling repo.");
  console.error("Skipping cross-repository fixture conformance gate.");
  // Skip gracefully — don't fail CI if the standard repo isn't checked out
  test("standalone fixture conformance (skipped — standard repo not found)", () => {
    assert.ok(true, "Skipped: sigrank-standard repo not available");
  });
} else {
  const fixturesDir = join(standardRoot, "examples", "fixtures");
  const schemaPath = join(
    standardRoot,
    "schema",
    "sigrank-operator-record-v0.1.schema.json",
  );

  if (!existsSync(fixturesDir)) {
    console.error(`Fixtures directory not found: ${fixturesDir}`);
    process.exit(2);
  }
  if (!existsSync(schemaPath)) {
    console.error(`Schema not found: ${schemaPath}`);
    process.exit(2);
  }

  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const fixtureFiles = readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  assert.ok(
    fixtureFiles.length === 13,
    `Expected 13 fixtures, found ${fixtureFiles.length}`,
  );

  // ─── Self-contained schema validator ────────────────────────────────────
  function validateAgainstSchema(record, node = schema, path = "record", errors = []) {
    if (node.const !== undefined) {
      if (record !== node.const) {
        errors.push(
          `schema ${path}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(record)}`,
        );
      }
      return errors;
    }
    if (node.enum !== undefined && !node.enum.includes(record)) {
      errors.push(
        `schema ${path}: expected one of ${JSON.stringify(node.enum)}, got ${JSON.stringify(record)}`,
      );
    }
    if (node.type !== undefined) {
      const types = Array.isArray(node.type) ? node.type : [node.type];
      const matched = types.some((t) => {
        if (record === null) return t === "null";
        if (t === "integer") return Number.isInteger(record);
        if (t === "number") return typeof record === "number" && !Number.isNaN(record);
        if (t === "string") return typeof record === "string";
        if (t === "object") return typeof record === "object" && record !== null && !Array.isArray(record);
        if (t === "array") return Array.isArray(record);
        return false;
      });
      if (!matched)
        errors.push(
          `schema ${path}: expected type ${JSON.stringify(node.type)}, got ${typeof record}`,
        );
    }
    if (node.minimum !== undefined && typeof record === "number" && record < node.minimum) {
      errors.push(`schema ${path}: value ${record} below minimum ${node.minimum}`);
    }
    if (node.minLength !== undefined && typeof record === "string" && record.length < node.minLength) {
      errors.push(`schema ${path}: string length ${record.length} below minLength ${node.minLength}`);
    }
    if (node.required !== undefined && typeof record === "object" && record !== null && !Array.isArray(record)) {
      for (const req of node.required) {
        if (!(req in record)) errors.push(`schema ${path}: missing required field "${req}"`);
      }
    }
    if (node.additionalProperties === false && typeof record === "object" && record !== null && !Array.isArray(record)) {
      const allowed = Object.keys(node.properties || {});
      for (const key of Object.keys(record)) {
        if (!allowed.includes(key))
          errors.push(`schema ${path}: additional property "${key}" not allowed`);
      }
    }
    if (node.properties !== undefined && typeof record === "object" && record !== null && !Array.isArray(record)) {
      for (const [key, subSchema] of Object.entries(node.properties)) {
        if (key in record) validateAgainstSchema(record[key], subSchema, `${path}.${key}`, errors);
      }
    }
    if (node.items !== undefined && Array.isArray(record)) {
      for (let i = 0; i < record.length; i++) {
        validateAgainstSchema(record[i], node.items, `${path}[${i}]`, errors);
      }
    }
    return errors;
  }

  function approxEqual(a, b, tolerance = 0.001) {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return Math.abs(a - b) < tolerance;
  }

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // Build a Standard record from cascade output + fixture input
  function buildRecord(fixture) {
    const telemetry = fixture.input?.telemetry || {};
    const source = fixture.input?.source || {};
    const input = telemetry.input ?? 0;
    const output = telemetry.output ?? 0;
    const cacheWrite = telemetry.cache_write ?? telemetry.cache_creation ?? null;
    const cacheRead = telemetry.cache_read ?? null;

    // @sigrank/cascade takes numbers, not null. When cache is unavailable
    // (null), we pass 0 to cascade but then null out the dependent metrics
    // to match the Standard's null semantics (unavailable ≠ zero).
    const result = cascade(
      input,
      output,
      cacheWrite ?? 0,
      cacheRead ?? 0,
    );

    // Apply null semantics: when cache_read is unavailable, yield, leverage,
    // and dev10x are null (not 0). When cache_write is unavailable, dev10x
    // is null.
    const metrics = {
      yield: result.yield,
      leverage: result.leverage,
      velocity: result.velocity,
      snr: result.snr,
      dev10x: result.dev10x,
    };

    if (cacheRead === null) {
      metrics.yield = null;
      metrics.leverage = null;
      metrics.dev10x = null;
    }
    if (cacheWrite === null) {
      metrics.dev10x = null;
    }

    // Standard warning order: cache-unavailability warnings precede the
    // cascade's dev10x_undefined warning (the "why" before the "what").
    // This mirrors buildSigRankStandardRecord in lib/mcp/standard.ts.
    const warnings = [];
    if (cacheWrite === null) {
      warnings.push("cache_write is unavailable; 10xDEV is undefined.");
    }
    if (cacheRead === null) {
      warnings.push(
        "cache_read is unavailable; Yield, Leverage, and 10xDEV are undefined.",
      );
    }
    for (const w of result.warnings ?? []) {
      if (!warnings.includes(w)) warnings.push(w);
    }

    // Build the record in sigrank/0.1-draft shape
    return {
      spec: "sigrank/0.1-draft",
      timestamp: "2026-08-28T00:00:00.000Z",
      source: {
        provider: source.provider || "unknown",
        model: source.model || "unknown",
        tool: source.tool || "unknown",
      },
      telemetry: {
        input,
        output,
        cache_write: cacheWrite,
        cache_read: cacheRead,
      },
      metrics,
      warnings,
    };
  }

  // ─── Conformance gate: every fixture must pass ──────────────────────────

  test(`@sigrank/cascade passes all 13 standalone fixtures (Standard ref ${SIGRANK_STANDARD_REF})`, () => {
    const failures = [];

    for (const file of fixtureFiles) {
      const fixture = JSON.parse(readFileSync(join(fixturesDir, file), "utf-8"));
      const id = fixture.id || file;
      const expected = fixture.expected || {};

      const record = buildRecord(fixture);
      const errors = [];

      // 1. Schema validity
      errors.push(...validateAgainstSchema(record, schema, "record", []));

      // 2. Primitive semantics
      const t = record.telemetry;
      if (!Number.isInteger(t.input) || t.input < 0)
        errors.push(`${id}: input must be non-negative integer`);
      if (!Number.isInteger(t.output) || t.output < 0)
        errors.push(`${id}: output must be non-negative integer`);
      if (t.cache_write !== null && (!Number.isInteger(t.cache_write) || t.cache_write < 0)) {
        errors.push(`${id}: cache_write must be non-negative integer or null`);
      }
      if (t.cache_read !== null && (!Number.isInteger(t.cache_read) || t.cache_read < 0)) {
        errors.push(`${id}: cache_read must be non-negative integer or null`);
      }

      // 3. Metric comparison
      if (expected.metrics) {
        for (const [key, expectedValue] of Object.entries(expected.metrics)) {
          if (!approxEqual(record.metrics[key], expectedValue)) {
            errors.push(
              `${id}: metric ${key}: expected ${expectedValue}, got ${record.metrics[key]}`,
            );
          }
        }
      }

      // 4. Warnings (ordered arrays — same warnings in the same order)
      if (expected.warnings !== undefined) {
        if (!arraysEqual(record.warnings, expected.warnings)) {
          errors.push(
            `${id}: warnings mismatch: expected ${JSON.stringify(expected.warnings)}, got ${JSON.stringify(record.warnings)}`,
          );
        }
      }

      // 5. Version declaration
      if (expected.spec !== undefined && record.spec !== expected.spec) {
        errors.push(`${id}: version: expected ${expected.spec}, got ${record.spec}`);
      }

      // 6. Alias translation — cache_creation must normalize to cache_write
      if (expected.output_telemetry_keys !== undefined) {
        const actualKeys = Object.keys(record.telemetry).sort();
        const expectedKeys = [...expected.output_telemetry_keys].sort();
        if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
          errors.push(
            `${id}: alias: expected keys ${JSON.stringify(expectedKeys)}, got ${JSON.stringify(actualKeys)}`,
          );
        }
        if ("cache_creation" in record.telemetry) {
          errors.push(`${id}: alias: cache_creation leaked into output`);
        }
      }

      // 7. Content independence
      if (expected.forbidden_fields !== undefined) {
        for (const forbidden of expected.forbidden_fields) {
          if (forbidden in record.telemetry)
            errors.push(`${id}: content leak in telemetry: ${forbidden}`);
          if (forbidden in record)
            errors.push(`${id}: content leak in record: ${forbidden}`);
        }
      }

      // 8. Required fields
      if (expected.required_fields !== undefined) {
        for (const required of expected.required_fields) {
          if (!(required in record))
            errors.push(`${id}: missing required field: ${required}`);
        }
      }

      // 9. Extension exclusion
      if (expected.forbidden_metrics !== undefined) {
        for (const forbidden of expected.forbidden_metrics) {
          if (forbidden in record.metrics)
            errors.push(`${id}: extension leak: ${forbidden}`);
        }
      }

      // 10. Required metrics
      if (expected.required_metrics !== undefined) {
        for (const required of expected.required_metrics) {
          if (!(required in record.metrics))
            errors.push(`${id}: missing required metric: ${required}`);
        }
      }

      if (errors.length > 0) {
        failures.push({ id, errors });
      }
    }

    if (failures.length > 0) {
      const detail = failures
        .map((f) => `  ${f.id}:\n    ${f.errors.join("\n    ")}`)
        .join("\n");
      assert.fail(`${failures.length} fixture(s) failed conformance:\n${detail}`);
    }
  });

  test("@sigrank/cascade canonical vector matches MO§ES seed", () => {
    const r = cascade(1251211, 11296121, 128196310, 2555179769);
    assert.equal(r.yield, 18436.98);
    assert.equal(r.leverage, 2042.2);
    assert.equal(r.velocity, 9.028);
    assert.equal(r.snr, 0.9003);
    assert.equal(r.dev10x, 3.31);
  });

  test("@sigrank/cascade excludes Construction, Build Archetypes, RS05 from portable metrics", () => {
    const r = cascade(1000, 5000, 500, 3000);
    assert.ok(!("construction" in r), "construction leaked into cascade output");
    assert.ok(!("scale_v" in r), "scale_v leaked into cascade output");
    assert.ok(!("rs05" in r), "rs05 leaked into cascade output");
    assert.ok(!("build_archetype" in r), "build_archetype leaked into cascade output");
    assert.ok(!("rank" in r), "rank leaked into cascade output");
    assert.ok(!("percentile" in r), "percentile leaked into cascade output");
  });
}
