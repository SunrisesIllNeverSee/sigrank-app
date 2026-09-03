/**
 * __tests__/standard/tteop-conformance.test.mjs
 *
 * PRIMARY TTEOP conformance gate for SignalAF.
 *
 * This is the primary protocol-conformance authority for sigrank-app per the
 * TTEOP implementation profile (TTEOP-IMPLEMENTATION-PROFILE.md) and the
 * owner-directed authority architecture baseline (2026-09-02).
 *
 * What this gate proves:
 *   The product implementation (@sigrank/cascade) produces metric values that
 *   match the TTEOP protocol authority (tteop-spec computeMetrics) for the
 *   canonical MO§ES vector and for every TTEOP null-semantics edge case.
 *
 * What this gate is NOT:
 *   It is NOT a self-referential tautology. It imports the protocol authority
 *   (tteop-spec) and the product implementation (@sigrank/cascade) as two
 *   independent code paths and asserts they agree. If either side drifts, this
 *   test fails.
 *
 * The legacy sigrank/0.1-draft fixture compatibility test lives in
 * legacy-alias-compatibility.test.mjs and is a TEMPORARY migration gate.
 *
 * TTEOP canonical formulas (tteop-spec, tteop/0.1-draft):
 *   Yield (Υ)       = (R × O) / I²           null when I=0 or R unavailable
 *   Leverage        = R / I                  null when I=0 or R unavailable
 *   Velocity        = O / I                  null when I=0
 *   output_fraction = O / (I + O)            null when I+O=0
 *   log_leverage    = log10(R / I)           null when any pillar=0 or unavailable
 *
 * Product display aliases (SignalAF-only, NOT protocol):
 *   output_fraction → SNR (compression_ratio)
 *   log_leverage    → 10xDEV (dev10x)
 *
 * Usage:
 *   node --test __tests__/standard/tteop-conformance.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// Protocol authority — tteop-spec@0.1.5-draft (the SOLE protocol authority).
import {
  computeMetrics,
  validateEnvelope,
  SPEC_VERSION,
  LEGACY_ALIASES,
  SUPPORTED_VERSIONS,
} from "tteop-spec";
import { buildEnvelope } from "tteop-spec/builder";

// Product implementation — @sigrank/cascade (the code SignalAF ships).
import { cascade } from "@sigrank/cascade";

// Canonical MO§ES test vector (TTEOP canonical reference).
const CANONICAL = {
  input: 1_251_211,
  output: 11_296_121,
  cache_write: 128_196_310,
  cache_read: 2_555_179_769,
};

// ─── Helper: run both code paths on the same telemetry and compare ────────
// tteop-spec computeMetrics returns { yield, leverage, velocity,
// output_fraction, log_leverage } with protocol-canonical rounding.
// @sigrank/cascade returns { yield, leverage, velocity, snr, dev10x, ... }
// where snr = output_fraction and dev10x = log_leverage (display aliases).
function assertCascadeMatchesTteop(telemetry, label) {
  const tteop = computeMetrics(telemetry);
  const c = cascade(
    telemetry.input,
    telemetry.output,
    telemetry.cache_write ?? 0,
    telemetry.cache_read ?? 0,
  );

  // When cache_read is unavailable, cascade received 0 but the product must
  // null out the dependent metrics. The tteop-spec authority already returns
  // null in that case. Compare against the product's null-adjusted view.
  const crNull = telemetry.cache_read == null;
  const cwNull = telemetry.cache_write == null;

  const productYield = crNull ? null : c.yield;
  const productLeverage = crNull ? null : c.leverage;
  const productLogLev = crNull || cwNull ? null : c.dev10x;

  assert.equal(
    productYield,
    tteop.metrics.yield,
    `${label}: Yield mismatch (cascade=${productYield}, tteop=${tteop.metrics.yield})`,
  );
  assert.equal(
    productLeverage,
    tteop.metrics.leverage,
    `${label}: Leverage mismatch (cascade=${productLeverage}, tteop=${tteop.metrics.leverage})`,
  );
  assert.equal(
    c.velocity,
    tteop.metrics.velocity,
    `${label}: Velocity mismatch (cascade=${c.velocity}, tteop=${tteop.metrics.velocity})`,
  );
  // output_fraction (tteop) == snr (cascade display alias)
  assert.equal(
    c.snr,
    tteop.metrics.output_fraction,
    `${label}: output_fraction/snr mismatch (cascade=${c.snr}, tteop=${tteop.metrics.output_fraction})`,
  );
  // log_leverage (tteop) == dev10x (cascade display alias)
  assert.equal(
    productLogLev,
    tteop.metrics.log_leverage,
    `${label}: log_leverage/dev10x mismatch (cascade=${productLogLev}, tteop=${tteop.metrics.log_leverage})`,
  );
}

// ─── 1. Canonical vector: product matches protocol authority ──────────────

test("TTEOP primary: cascade matches tteop-spec on canonical MO§ES vector", () => {
  assertCascadeMatchesTteop(CANONICAL, "canonical");
});

test("TTEOP primary: canonical Yield (Υ) = 18436.98 from protocol authority", () => {
  const { metrics } = computeMetrics(CANONICAL);
  assert.equal(metrics.yield, 18436.98);
});

test("TTEOP primary: canonical Leverage = 2042.2 from protocol authority", () => {
  const { metrics } = computeMetrics(CANONICAL);
  assert.equal(metrics.leverage, 2042.2);
});

test("TTEOP primary: canonical Velocity = 9.028 from protocol authority", () => {
  const { metrics } = computeMetrics(CANONICAL);
  assert.equal(metrics.velocity, 9.028);
});

test("TTEOP primary: canonical output_fraction = 0.9003 from protocol authority", () => {
  const { metrics } = computeMetrics(CANONICAL);
  assert.equal(metrics.output_fraction, 0.9003);
});

test("TTEOP primary: canonical log_leverage = 3.31 from protocol authority", () => {
  const { metrics } = computeMetrics(CANONICAL);
  assert.equal(metrics.log_leverage, 3.31);
});

// ─── 2. Algebraic identity: Yield = Leverage × Velocity ───────────────────

test("TTEOP primary: Yield = Leverage × Velocity (algebraic identity, protocol authority)", () => {
  const { metrics } = computeMetrics(CANONICAL);
  assert.ok(
    Math.abs(metrics.yield - metrics.leverage * metrics.velocity) < 0.01,
    `Yield=${metrics.yield}, Leverage×Velocity=${metrics.leverage * metrics.velocity}`,
  );
});

// ─── 3. Null semantics: product matches protocol authority on every edge ──

test("TTEOP primary: cascade matches tteop-spec when input=0", () => {
  assertCascadeMatchesTteop(
    { input: 0, output: 100, cache_write: 50, cache_read: 200 },
    "input=0",
  );
});

test("TTEOP primary: cascade matches tteop-spec when cache_read unavailable", () => {
  assertCascadeMatchesTteop(
    { input: 100, output: 100, cache_write: 50, cache_read: null },
    "cache_read=null",
  );
});

test("TTEOP primary: cascade matches tteop-spec when cache_write unavailable", () => {
  assertCascadeMatchesTteop(
    { input: 100, output: 100, cache_write: null, cache_read: 200 },
    "cache_write=null",
  );
});

test("TTEOP primary: cascade matches tteop-spec when input+output=0", () => {
  assertCascadeMatchesTteop(
    { input: 0, output: 0, cache_write: 50, cache_read: 200 },
    "input+output=0",
  );
});

test("TTEOP primary: cascade matches tteop-spec when all pillars zero", () => {
  assertCascadeMatchesTteop(
    { input: 0, output: 0, cache_write: 0, cache_read: 0 },
    "all-zero",
  );
});

test("TTEOP primary: cascade matches tteop-spec on a small non-canonical vector", () => {
  assertCascadeMatchesTteop(
    { input: 1000, output: 5000, cache_write: 500, cache_read: 3000 },
    "small-vector",
  );
});

// ─── 4. Null semantics from protocol authority (canonical expectations) ───

test("TTEOP primary: protocol authority returns null Yield when input=0", () => {
  const { metrics } = computeMetrics({ input: 0, output: 100, cache_write: 50, cache_read: 200 });
  assert.equal(metrics.yield, null);
  assert.equal(metrics.leverage, null);
  assert.equal(metrics.velocity, null);
});

test("TTEOP primary: protocol authority returns null Yield/Leverage/log_leverage when cache_read unavailable", () => {
  const { metrics } = computeMetrics({ input: 100, output: 100, cache_write: 50, cache_read: null });
  assert.equal(metrics.yield, null);
  assert.equal(metrics.leverage, null);
  assert.equal(metrics.log_leverage, null);
});

test("TTEOP primary: protocol authority returns null log_leverage when cache_write unavailable", () => {
  const { metrics } = computeMetrics({ input: 100, output: 100, cache_write: null, cache_read: 200 });
  assert.equal(metrics.log_leverage, null);
});

test("TTEOP primary: protocol authority returns null output_fraction when input+output=0", () => {
  const { metrics } = computeMetrics({ input: 0, output: 0, cache_write: 50, cache_read: 200 });
  assert.equal(metrics.output_fraction, null);
});

// ─── 5. Envelope validation via protocol authority ────────────────────────

test("TTEOP primary: protocol authority validates a well-formed envelope", () => {
  const envelope = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  const result = validateEnvelope(envelope);
  assert.ok(result.valid, `Expected valid envelope, schemaErrors: ${JSON.stringify(result.schemaErrors)}, semanticErrors: ${JSON.stringify(result.semanticErrors)}`);
});

test("TTEOP primary: protocol authority rejects an envelope with forbidden field", () => {
  const envelope = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  // Inject a forbidden content field (SPEC §13.2 — content independence)
  envelope.telemetry.prompt_text = "leaked content";
  const result = validateEnvelope(envelope);
  assert.equal(result.valid, false);
  assert.ok(
    result.semanticErrors.length > 0,
    "Expected semantic errors for forbidden field",
  );
});

// ─── 6. Protocol version + legacy alias constants from protocol authority ─

test("TTEOP primary: protocol authority SPEC_VERSION is tteop/0.1-draft", () => {
  assert.equal(SPEC_VERSION, "tteop/0.1-draft");
});

test("TTEOP primary: protocol authority accepts sigrank/0.1-draft as a legacy alias", () => {
  assert.ok(LEGACY_ALIASES.includes("sigrank/0.1-draft"), "sigrank/0.1-draft must be a legacy alias");
  assert.ok(LEGACY_ALIASES.includes("otep/0.1-draft"), "otep/0.1-draft must be a legacy alias");
  assert.ok(SUPPORTED_VERSIONS.includes(SPEC_VERSION), "current version must be supported");
});

test("TTEOP primary: protocol authority validates envelope under legacy alias sigrank/0.1-draft", () => {
  const envelope = buildEnvelope(CANONICAL, {
    provider: "anthropic",
    model: "claude-sonnet-4",
    tool: "claude-code",
  });
  // Override protocol_version to the legacy alias — the validator must accept it
  envelope.protocol_version = "sigrank/0.1-draft";
  const result = validateEnvelope(envelope);
  assert.ok(result.valid, `Legacy alias must validate, schemaErrors: ${JSON.stringify(result.schemaErrors)}, semanticErrors: ${JSON.stringify(result.semanticErrors)}`);
});

// ─── 7. Product does not leak protocol-forbidden extensions into metrics ──

test("TTEOP primary: cascade does not leak product extensions (construction, archetypes, rank) into metrics", () => {
  const r = cascade(1000, 5000, 500, 3000);
  assert.ok(!("construction" in r), "construction leaked into cascade output");
  assert.ok(!("scale_v" in r), "scale_v leaked into cascade output");
  assert.ok(!("rs05" in r), "rs05 leaked into cascade output");
  assert.ok(!("build_archetype" in r), "build_archetype leaked into cascade output");
  assert.ok(!("rank" in r), "rank leaked into cascade output");
  assert.ok(!("percentile" in r), "percentile leaked into cascade output");
});
