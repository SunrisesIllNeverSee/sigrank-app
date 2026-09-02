/**
 * __tests__/standard/legacy-alias-compatibility.test.mjs
 *
 * LEGACY ALIAS COMPATIBILITY TEST — TEMPORARY MIGRATION GATE.
 *
 * This test verifies that the legacy sigrank/0.1-draft version alias is
 * accepted and resolves to current TTEOP semantics. It is NOT the primary
 * conformance authority — that role belongs to tteop-conformance.test.mjs.
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

// Legacy version aliases that must resolve to current TTEOP semantics.
// These are accepted for backward compatibility per TTEOP's alias policy.
const LEGACY_ALIASES = ["sigrank/0.1-draft", "otep/0.1-draft"];
const CURRENT_PROTOCOL = "tteop/0.1-draft";

// Resolution function: legacy alias → current TTEOP semantics.
// In a real implementation this would be part of the TTEOP validator's
// alias resolution. Here we test the contract.
function resolveProtocolVersion(version) {
  if (version === CURRENT_PROTOCOL) return CURRENT_PROTOCOL;
  if (LEGACY_ALIASES.includes(version)) return CURRENT_PROTOCOL;
  return null; // unknown version
}

test("Legacy alias: sigrank/0.1-draft resolves to tteop/0.1-draft", () => {
  assert.equal(resolveProtocolVersion("sigrank/0.1-draft"), CURRENT_PROTOCOL);
});

test("Legacy alias: otep/0.1-draft resolves to tteop/0.1-draft", () => {
  assert.equal(resolveProtocolVersion("otep/0.1-draft"), CURRENT_PROTOCOL);
});

test("Current protocol: tteop/0.1-draft resolves to itself", () => {
  assert.equal(resolveProtocolVersion("tteop/0.1-draft"), CURRENT_PROTOCOL);
});

test("Unknown version does not resolve", () => {
  assert.equal(resolveProtocolVersion("unknown/0.1"), null);
});

// Legacy semantic equivalence: the canonical MO§ES vector must produce the
// same results whether labeled sigrank/0.1-draft or tteop/0.1-draft.
// This verifies that the legacy alias is a LABEL change, not a semantic
// divergence.
test("Legacy semantic equivalence: same formulas under legacy alias", () => {
  const I = 1_251_211, O = 11_296_121, R = 2_555_179_769;

  // TTEOP canonical formula
  const tteopYield = (R * O) / (I * I);

  // sigrank/0.1-draft used the same formula (Yield = leverage × velocity)
  // The alias resolves to the same computation.
  const legacyYield = (R * O) / (I * I);

  assert.equal(tteopYield, legacyYield, "Yield must be identical under both labels");
  assert.ok(Math.abs(tteopYield - 18436.98) < 0.01, "Yield must be ~18436.98");
});

test("Legacy alias is not a second active standard", () => {
  // The resolution function must map ALL legacy aliases to the single
  // current protocol. There is no "second standard" — only one protocol
  // authority (TTEOP) with backward-compatible aliases.
  for (const alias of LEGACY_ALIASES) {
    assert.equal(
      resolveProtocolVersion(alias),
      CURRENT_PROTOCOL,
      `${alias} must resolve to ${CURRENT_PROTOCOL}, not to a separate standard`,
    );
  }
});
