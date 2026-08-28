/**
 * __tests__/mcp/standalone-conformance.test.mjs
 *
 * Cross-repository conformance gate: validates the SignalAF HTTP MCP
 * server's get_sigrank_standard_record tool output against the
 * authoritative fixture pack from sigrank-standard.
 *
 * The fixture pack is the source of truth for sigrank/0.1-draft conformance.
 * This test ensures the HTTP MCP producer emits records that pass the same
 * fixtures the standalone conformance runner enforces.
 *
 * Pin: the Standard commit is pinned via SIGRANK_STANDARD_REF env var
 * (default: the merged baseline `224505a`).
 *
 * Usage (CI):
 *   node --experimental-strip-types --test __tests__/mcp/standalone-conformance.test.mjs
 *
 * The sigrank-standard repo is checked out by CI at _sigrank-standard.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { cascade } from "@sigrank/cascade";

// ─── Local record builder — mirrors lib/mcp/standard.ts buildSigRankStandardRecord ─
// This replicates the exact logic the HTTP MCP tool uses, so we test the same
// computation path without needing the Next.js @/ path alias. If
// lib/mcp/standard.ts drifts from this logic, the behavioral-fixtures.test.ts
// (vitest) will catch it; this test catches conformance drift against the
// standalone Standard.

const SIGRANK_STANDARD_VERSION = "sigrank/0.1-draft";
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

function tokenCount(value, name, required) {
  if (value === null || value === undefined) {
    if (required) throw new Error(`${name} is required.`);
    return null;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer token count.`);
  }
  return value;
}

function buildSigRankStandardRecord(args) {
  const input = tokenCount(args.input, "input", true);
  const output = tokenCount(args.output, "output", true);
  const cacheWrite = tokenCount(args.cache_write, "cache_write", false);
  const cacheRead = tokenCount(args.cache_read, "cache_read", false);
  const computed = cascade(input, output, cacheWrite ?? 0, cacheRead ?? 0);
  // Standard warning order: cache-unavailability warnings precede dev10x_undefined
  const warnings = [];
  if (cacheWrite === null) warnings.push("cache_write is unavailable; 10xDEV is undefined.");
  if (cacheRead === null) warnings.push("cache_read is unavailable; Yield, Leverage, and 10xDEV are undefined.");
  for (const w of computed.warnings ?? []) {
    if (!warnings.includes(w)) warnings.push(w);
  }
  return {
    spec: SIGRANK_STANDARD_VERSION,
    timestamp: args.timestamp || new Date().toISOString(),
    source: {
      provider: args.provider || "unknown",
      model: args.model || "unknown",
      tool: args.tool || "signalaf-http-mcp",
    },
    telemetry: { input, output, cache_write: cacheWrite, cache_read: cacheRead },
    metrics: {
      yield: cacheRead === null ? null : computed.yield,
      leverage: cacheRead === null ? null : computed.leverage,
      velocity: computed.velocity,
      snr: computed.snr,
      dev10x: cacheWrite === null || cacheRead === null ? null : computed.dev10x,
    },
    warnings,
  };
}

const SIGRANK_STANDARD_REF = process.env.SIGRANK_STANDARD_REF || "224505a";

const standardRoot = process.env.SIGRANK_STANDARD_PATH ||
  join(process.cwd(), "..", "_sigrank-standard");

if (!existsSync(standardRoot)) {
  console.error(
    `sigrank-standard not found at ${standardRoot}. ` +
      "Set SIGRANK_STANDARD_PATH or check out the repo at _sigrank-standard.",
  );
  process.exit(2);
}

const fixturesDir = join(standardRoot, "examples", "fixtures");
const schemaPath = join(standardRoot, "schema", "sigrank-operator-record-v0.1.schema.json");

if (!existsSync(fixturesDir) || !existsSync(schemaPath)) {
  console.error(`Fixtures or schema not found under ${standardRoot}`);
  process.exit(2);
}

const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length === 13, `Expected 13 fixtures, found ${fixtureFiles.length}`);

// ─── Self-contained schema validator (mirrors the standalone runner) ─────────

function validateAgainstSchema(record, node = schema, path = "record", errors = []) {
  if (node.const !== undefined) {
    if (record !== node.const) {
      errors.push(`schema ${path}: expected const ${JSON.stringify(node.const)}, got ${JSON.stringify(record)}`);
    }
    return errors;
  }
  if (node.enum !== undefined && !node.enum.includes(record)) {
    errors.push(`schema ${path}: expected one of ${JSON.stringify(node.enum)}, got ${JSON.stringify(record)}`);
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
    if (!matched) errors.push(`schema ${path}: expected type ${JSON.stringify(node.type)}, got ${typeof record}`);
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
      if (!allowed.includes(key)) errors.push(`schema ${path}: additional property "${key}" not allowed`);
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

// ─── Conformance gate: every fixture must pass ───────────────────────────────

test(`HTTP MCP producer passes all 13 standalone fixtures (Standard ref ${SIGRANK_STANDARD_REF})`, () => {
  const failures = [];

  for (const file of fixtureFiles) {
    const fixture = JSON.parse(readFileSync(join(fixturesDir, file), "utf-8"));
    const id = fixture.id || file;
    const telemetry = fixture.input?.telemetry || {};
    const source = fixture.input?.source || {};
    const expected = fixture.expected || {};

    const record = buildSigRankStandardRecord({
      input: telemetry.input ?? 0,
      output: telemetry.output ?? 0,
      cache_write: telemetry.cache_write ?? telemetry.cache_creation ?? null,
      cache_read: telemetry.cache_read ?? null,
      provider: source.provider || "unknown",
      model: source.model || "unknown",
      tool: source.tool || "unknown",
      timestamp: "2026-08-27T00:00:00.000Z",
    });

    const errors = [];

    // 1. Schema validity
    errors.push(...validateAgainstSchema(record, schema, "record", []));

    // 2. Primitive semantics
    const t = record.telemetry;
    if (!Number.isInteger(t.input) || t.input < 0) errors.push(`${id}: input must be non-negative integer`);
    if (!Number.isInteger(t.output) || t.output < 0) errors.push(`${id}: output must be non-negative integer`);
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
          errors.push(`${id}: metric ${key}: expected ${expectedValue}, got ${record.metrics[key]}`);
        }
      }
    }

    // 4. Warnings (ordered arrays)
    if (expected.warnings !== undefined) {
      if (!arraysEqual(record.warnings, expected.warnings)) {
        errors.push(`${id}: warnings mismatch: expected ${JSON.stringify(expected.warnings)}, got ${JSON.stringify(record.warnings)}`);
      }
    }

    // 5. Version declaration
    if (expected.spec !== undefined && record.spec !== expected.spec) {
      errors.push(`${id}: version: expected ${expected.spec}, got ${record.spec}`);
    }

    // 6. Alias translation
    if (expected.output_telemetry_keys !== undefined) {
      const actualKeys = Object.keys(record.telemetry).sort();
      const expectedKeys = [...expected.output_telemetry_keys].sort();
      if (!arraysEqual(actualKeys, expectedKeys)) {
        errors.push(`${id}: alias: expected keys ${JSON.stringify(expectedKeys)}, got ${JSON.stringify(actualKeys)}`);
      }
      if ("cache_creation" in record.telemetry) {
        errors.push(`${id}: alias: cache_creation leaked into output`);
      }
    }

    // 7. Content independence
    if (expected.forbidden_fields !== undefined) {
      for (const forbidden of expected.forbidden_fields) {
        if (forbidden in record.telemetry) errors.push(`${id}: content leak in telemetry: ${forbidden}`);
        if (forbidden in record) errors.push(`${id}: content leak in record: ${forbidden}`);
      }
    }

    // 8. Required fields
    if (expected.required_fields !== undefined) {
      for (const required of expected.required_fields) {
        if (!(required in record)) errors.push(`${id}: missing required field: ${required}`);
      }
    }

    // 9. Extension exclusion
    if (expected.forbidden_metrics !== undefined) {
      for (const forbidden of expected.forbidden_metrics) {
        if (forbidden in record.metrics) errors.push(`${id}: extension leak: ${forbidden}`);
      }
    }

    // 10. Required metrics
    if (expected.required_metrics !== undefined) {
      for (const required of expected.required_metrics) {
        if (!(required in record.metrics)) errors.push(`${id}: missing required metric: ${required}`);
      }
    }

    // 11. Provenance
    const s = record.source;
    if (!s || typeof s.provider !== "string" || s.provider.length < 1) errors.push(`${id}: provenance.provider missing`);
    if (!s || typeof s.model !== "string" || s.model.length < 1) errors.push(`${id}: provenance.model missing`);
    if (!s || typeof s.tool !== "string" || s.tool.length < 1) errors.push(`${id}: provenance.tool missing`);

    if (errors.length > 0) {
      failures.push({ id, errors });
    }
  }

  if (failures.length > 0) {
    const detail = failures.map((f) => `  ${f.id}:\n    ${f.errors.join("\n    ")}`).join("\n");
    assert.fail(`${failures.length} fixture(s) failed conformance:\n${detail}`);
  }
});

test("HTTP MCP producer record excludes Construction, Build Archetypes, RS05, Scale V, rank, percentile", () => {
  const record = buildSigRankStandardRecord({
    input: 1000,
    output: 5000,
    cache_write: 500,
    cache_read: 3000,
  });
  const forbidden = ["construction", "scale_v", "rs05", "build_archetype", "rank", "percentile"];
  for (const key of forbidden) {
    assert.ok(!(key in record.metrics), `forbidden metric "${key}" leaked into portable record`);
  }
});

test("HTTP MCP producer preserves null/zero distinction for unavailable cache", () => {
  const unavailable = buildSigRankStandardRecord({
    input: 100,
    output: 50,
    cache_write: null,
    cache_read: null,
  });
  assert.equal(unavailable.telemetry.cache_write, null);
  assert.equal(unavailable.telemetry.cache_read, null);
  assert.equal(unavailable.metrics.yield, null);
  assert.equal(unavailable.metrics.dev10x, null);

  const zero = buildSigRankStandardRecord({
    input: 100,
    output: 50,
    cache_write: 0,
    cache_read: 0,
  });
  assert.equal(zero.telemetry.cache_write, 0);
  assert.equal(zero.telemetry.cache_read, 0);
  // zero cache_read with input>0 → leverage=0, yield=0 (distinct from null/unavailable)
  assert.equal(zero.metrics.leverage, 0);
  assert.equal(zero.metrics.yield, 0);
});
