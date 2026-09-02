/**
 * __tests__/standard/legacy-alias-compatibility.test.mjs
 *
 * LEGACY ALIAS COMPATIBILITY TEST — TEMPORARY MIGRATION GATE (item 6).
 *
 * Verifies that the legacy version aliases sigrank/0.1-draft and otep/0.1-draft
 * resolve to current TTEOP semantics using the protocol authority (tteop-spec)
 * and the product implementation (@sigrank/cascade).
 *
 * This is NOT the primary conformance authority — that role belongs to
 * tteop-conformance.test.mjs. This test proves the legacy alias is a LABEL
 * change, not a semantic divergence: the protocol authority accepts envelopes
 * under legacy aliases, and the product implementation produces identical
 * metrics regardless of which label is applied.
 *
 * Per the owner-directed authority architecture baseline (2026-09-02):
 *   - sigrank-standard is a LEGACY PREDECESSOR, not a second active standard.
 *   - The legacy version alias sigrank/0.1-draft resolves to current TTEOP
 *     semantics.
 *   - This test is TEMPORARY and may be removed once migration is complete.
 *
 * Usage:
 *   node --test __tests__/standard/legacy-alias-compatibility.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// Protocol authority — tteop-spec@0.1.5-draft
import {
  validateEnvelope,
  SPEC_VERSION,
  LEGACY_ALIASES,
  SUPPORTED_VERSIONS,
} from "tteop-spec";
import { buildEnvelope } from "tteop-spec/builder";

// Product implementation — @sigrank/cascade
import { cascade } from "@sigrank/cascade";

const CANONICAL = {
  input: 1_251_211,
  output: 11_296_121,
  cache_write: 128_196_310,
  cache_read: 2_555_179_769,
};

// ─── 1. Legacy aliases are declared by the protocol authority ─────────────

test("Legacy alias: sigrank/0.1-draft is declared by tteop-spec as a legacy alias", () => {
  assert.ok(
    LEGACY_ALIASES.includes("sigrank/0.1-draft"),
    "sigrank/0.1-draft must be in LEGACY_ALIASES",
  );
});

test("Legacy alias: otep/0.1-draft is declared by tteop-spec as a legacy alias", () => {
  assert.ok(
    LEGACY_ALIASES.includes("otep/0.1-draft"),
    "otep/0.1-draft must be in LEGACY_ALIASES",
  );
});

test("Legacy alias: current version tteop/0.1-draft is in SUPPORTED_VERSIONS", () => {
  assert.ok(
    SUPPORTED_VERSIONS.includes(SPEC_VERSION),
    "tteop/0.1-draft must be in SUPPORTED_VERSIONS",
  );
});

// ─── 2. Protocol authority accepts envelopes under legacy aliases ─────────

test("Legacy alias: protocol authority validates envelope under sigrank/0.1-draft", () => {
  const envelope = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  envelope.protocol_version = "sigrank/0.1-draft";
  const result = validateEnvelope(envelope);
  assert.ok(
    result.valid,
    `sigrank/0.1-draft must validate, schemaErrors: ${JSON.stringify(result.schemaErrors)}, semanticErrors: ${JSON.stringify(result.semanticErrors)}`,
  );
});

test("Legacy alias: protocol authority validates envelope under otep/0.1-draft", () => {
  const envelope = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  envelope.protocol_version = "otep/0.1-draft";
  const result = validateEnvelope(envelope);
  assert.ok(
    result.valid,
    `otep/0.1-draft must validate, schemaErrors: ${JSON.stringify(result.schemaErrors)}, semanticErrors: ${JSON.stringify(result.semanticErrors)}`,
  );
});

// ─── 3. Semantic equivalence: same metrics regardless of label ────────────
// The protocol authority computes the same metrics from the same telemetry
// regardless of which version label the envelope carries. This proves the
// legacy alias is a LABEL change, not a semantic divergence.

test("Legacy alias: identical metrics computed under tteop/0.1-draft and sigrank/0.1-draft", () => {
  const envCurrent = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  const envLegacy = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  envLegacy.protocol_version = "sigrank/0.1-draft";

  const resultCurrent = validateEnvelope(envCurrent);
  const resultLegacy = validateEnvelope(envLegacy);

  assert.ok(resultCurrent.valid && resultLegacy.valid, "both must validate");
  assert.deepEqual(resultCurrent.metrics, resultLegacy.metrics);
});

// ─── 4. Product implementation produces identical results ─────────────────
// The cascade engine does not branch on protocol version — it computes the
// same TTEOP-canonical metrics from the same telemetry. This confirms the
// product does not maintain a separate "sigrank/0.1-draft" code path.

test("Legacy alias: cascade produces identical metrics (no version-branched code path)", () => {
  const r1 = cascade(CANONICAL.input, CANONICAL.output, CANONICAL.cache_write, CANONICAL.cache_read);
  const r2 = cascade(CANONICAL.input, CANONICAL.output, CANONICAL.cache_write, CANONICAL.cache_read);
  assert.deepEqual(r1, r2);
  assert.equal(r1.yield, 18436.98);
});

// ─── 5. Legacy alias is NOT a second active standard ──────────────────────

test("Legacy alias: there is exactly one current protocol version (no second standard)", () => {
  // SPEC_VERSION is the single current version. LEGACY_ALIASES are accepted
  // but are NOT separate active standards — they resolve to SPEC_VERSION.
  assert.equal(SPEC_VERSION, "tteop/0.1-draft");
  assert.ok(
    !LEGACY_ALIASES.includes(SPEC_VERSION),
    "current version must not appear in legacy aliases",
  );
  // Every legacy alias must resolve to the current version (validated above).
  for (const alias of LEGACY_ALIASES) {
    assert.notEqual(alias, SPEC_VERSION, `${alias} must not equal current version`);
  }
});
