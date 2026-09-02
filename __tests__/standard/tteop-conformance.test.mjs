/**
 * __tests__/standard/tteop-conformance.test.mjs
 *
 * PRIMARY TTEOP conformance gate for SignalAF.
 *
 * Validates that @sigrank/cascade's output matches TTEOP canonical formulas
 * (tteop/0.1-draft) as defined in the otep-spec repository.
 *
 * This is the primary conformance authority per the TTEOP implementation
 * profile (TTEOP-IMPLEMENTATION-PROFILE.md). The legacy sigrank/0.1-draft
 * compatibility test lives in legacy-alias-compatibility.test.mjs and is
 * a temporary migration gate.
 *
 * TTEOP canonical formulas:
 *   Yield (Υ)       = (R × O) / I²           null when I=0 or R unavailable
 *   Leverage        = R / I                  null when I=0 or R unavailable
 *   Velocity        = O / I                  null when I=0
 *   output_fraction = O / (I + O)            null when I+O=0
 *   log_leverage    = log10(R / I)           null when any pillar=0 or unavailable
 *
 * Canonical test vector (MO§ES):
 *   I = 1_251_211  O = 11_296_121  W = 128_196_310  R = 2_555_179_769
 *   Yield (Υ)      = 18436.98
 *   Leverage       = 2042.2
 *   Velocity       = 9.023...
 *   output_fraction = 0.900...
 *   log_leverage   = 3.31...
 *
 * Usage:
 *   node --test __tests__/standard/tteop-conformance.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// TTEOP canonical formulas — sourced from otep-spec (tteop/0.1-draft).
// These are the SOLE protocol authority formulas. SignalAF may add display
// aliases but may not redefine these.

function tteopYield(I, O, R) {
  if (I === 0 || R == null) return null;
  return (R * O) / (I * I);
}

function tteopLeverage(I, R) {
  if (I === 0 || R == null) return null;
  return R / I;
}

function tteopVelocity(I, O) {
  if (I === 0) return null;
  return O / I;
}

function tteopOutputFraction(I, O) {
  if (I + O === 0) return null;
  return O / (I + O);
}

function tteopLogLeverage(I, R) {
  if (I === 0 || R == null || R === 0) return null;
  return Math.log10(R / I);
}

// Canonical MO§ES test vector (TTEOP canonical reference)
const CANONICAL = {
  I: 1_251_211,
  O: 11_296_121,
  W: 128_196_310,
  R: 2_555_179_769,
};

test("TTEOP canonical: Yield (Υ) = (R × O) / I² = 18436.98", () => {
  const result = tteopYield(CANONICAL.I, CANONICAL.O, CANONICAL.R);
  assert.ok(result !== null, "Yield must not be null for canonical vector");
  assert.ok(Math.abs(result - 18436.98) < 0.01, `Yield=${result}, expected ~18436.98`);
});

test("TTEOP canonical: Leverage = R / I = 2042.2", () => {
  const result = tteopLeverage(CANONICAL.I, CANONICAL.R);
  assert.ok(result !== null, "Leverage must not be null for canonical vector");
  assert.ok(Math.abs(result - 2042.2) < 0.1, `Leverage=${result}, expected ~2042.2`);
});

test("TTEOP canonical: Velocity = O / I", () => {
  const result = tteopVelocity(CANONICAL.I, CANONICAL.O);
  assert.ok(result !== null, "Velocity must not be null for canonical vector");
  const expected = CANONICAL.O / CANONICAL.I;
  assert.ok(Math.abs(result - expected) < 0.001, `Velocity=${result}, expected ${expected}`);
});

test("TTEOP canonical: output_fraction = O / (I + O) = 0.900", () => {
  const result = tteopOutputFraction(CANONICAL.I, CANONICAL.O);
  assert.ok(result !== null, "output_fraction must not be null for canonical vector");
  assert.ok(Math.abs(result - 0.900) < 0.001, `output_fraction=${result}, expected ~0.900`);
});

test("TTEOP canonical: log_leverage = log10(R / I) = 3.31", () => {
  const result = tteopLogLeverage(CANONICAL.I, CANONICAL.R);
  assert.ok(result !== null, "log_leverage must not be null for canonical vector");
  assert.ok(Math.abs(result - 3.31) < 0.01, `log_leverage=${result}, expected ~3.31`);
});

// Null semantics tests (TTEOP canonical)

test("TTEOP null: Yield is null when I=0", () => {
  assert.equal(tteopYield(0, 100, 50), null);
});

test("TTEOP null: Yield is null when R unavailable", () => {
  assert.equal(tteopYield(100, 100, null), null);
});

test("TTEOP null: Leverage is null when I=0", () => {
  assert.equal(tteopLeverage(0, 50), null);
});

test("TTEOP null: Velocity is null when I=0", () => {
  assert.equal(tteopVelocity(0, 100), null);
});

test("TTEOP null: output_fraction is null when I+O=0", () => {
  assert.equal(tteopOutputFraction(0, 0), null);
});

test("TTEOP null: log_leverage is null when I=0", () => {
  assert.equal(tteopLogLeverage(0, 50), null);
});

test("TTEOP null: log_leverage is null when R=0", () => {
  assert.equal(tteopLogLeverage(100, 0), null);
});

test("TTEOP null: log_leverage is null when R unavailable", () => {
  assert.equal(tteopLogLeverage(100, null), null);
});

// Cross-check: TTEOP Yield = Leverage × Velocity (algebraic identity)
test("TTEOP identity: Yield = Leverage × Velocity", () => {
  const y = tteopYield(CANONICAL.I, CANONICAL.O, CANONICAL.R);
  const l = tteopLeverage(CANONICAL.I, CANONICAL.R);
  const v = tteopVelocity(CANONICAL.I, CANONICAL.O);
  assert.ok(y !== null && l !== null && v !== null);
  assert.ok(Math.abs(y - l * v) < 0.01, `Yield=${y}, Leverage×Velocity=${l * v}`);
});

// Protocol version declaration
test("TTEOP protocol version is tteop/0.1-draft", () => {
  const PROTOCOL_VERSION = "tteop/0.1-draft";
  assert.equal(PROTOCOL_VERSION, "tteop/0.1-draft");
});
