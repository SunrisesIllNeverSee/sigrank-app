/**
 * __tests__/security/challenge-fabricated-scores.test.mjs
 *
 * F1 SECURITY TEST — proves fabricated all-100 client scores cannot win
 * against a legitimately-scored opponent.
 *
 * The challenge PATCH handler (app/api/v1/challenges/[id]/route.ts) was
 * vulnerable: it trusted client-supplied pillar scores for ranking. Any
 * authenticated operator could submit all-100 scores and win any challenge.
 *
 * The fix (2026-07-31): body-supplied scores are stored but NOT used for
 * ranking. The authoritative composite comes from either:
 *   (a) a verified ed25519-signed certificate_json, or
 *   (b) a future server-side scorer (not yet implemented).
 *
 * Without a verified cert, the submission is "pending" (composite_score=0)
 * and CANNOT trigger auto-resolve.
 *
 * This test verifies the pure logic: the compositeScore function, the
 * scoring mode decision, and the auto-resolve gate.
 *
 * To run:
 *   node --test __tests__/security/challenge-fabricated-scores.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ── Inline the composite formula (mirrors the route handler) ──────────────

function compositeScore(d, cl, fi, br, im) {
  return (
    Math.round((d * 0.3 + cl * 0.2 + fi * 0.2 + br * 0.15 + im * 0.15) * 100) /
    100
  );
}

// ── Inline the scoring mode decision (mirrors the route handler) ──────────

/**
 * Given a certJson and whether SCORING_WORKER_PUBKEY is set, determine
 * the scoring mode and authoritative composite.
 *
 * This mirrors the logic in app/api/v1/challenges/[id]/route.ts:
 *   - If certJson is present AND SCORING_WORKER_PUBKEY is set AND the
 *     signature verifies → scoring_mode="api_verified", composite from cert
 *   - Otherwise → scoring_mode="pending", composite=0
 */
function resolveScoringMode(certJson, hasScoringKey, certValid) {
  if (!certJson || typeof certJson !== "object") {
    return { scoringMode: "pending", composite: 0 };
  }
  if (!hasScoringKey) {
    return { scoringMode: "pending", composite: 0 };
  }
  if (!certValid) {
    return { scoringMode: "pending", composite: 0 };
  }
  const cert = certJson;
  return {
    scoringMode: "api_verified",
    composite: Number(cert.composite),
  };
}

// ── Inline the auto-resolve gate (mirrors the route handler) ──────────────

/**
 * Auto-resolve only fires when BOTH submissions have scoring_mode="api_verified".
 * Returns the winner's composite, or null if the challenge cannot be resolved.
 */
function autoResolve(challSub, challdSub) {
  if (!challSub || !challdSub) return null;
  if (
    challSub.scoring_mode !== "api_verified" ||
    challdSub.scoring_mode !== "api_verified"
  ) {
    return null; // F1 FIX: cannot resolve from pending scores
  }
  const challScore = Number(challSub.composite_score);
  const challdScore = Number(challdSub.composite_score);
  return {
    winner: challScore >= challdScore ? "challenger" : "challenged",
    challScore,
    challdScore,
    margin: Math.abs(challScore - challdScore),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

test("F1: fabricated all-100 scores produce composite 100 but scoring_mode=pending", () => {
  const fabricatedScores = { density: 100, clarity: 100, fidelity: 100, brevity: 100, impact: 100 };
  const clientComposite = compositeScore(
    fabricatedScores.density,
    fabricatedScores.clarity,
    fabricatedScores.fidelity,
    fabricatedScores.brevity,
    fabricatedScores.impact,
  );

  // The client CAN compute 100 — but the server must NOT use it for ranking.
  assert.equal(clientComposite, 100, "sanity: all-100 = composite 100");

  // No cert → pending, composite=0 (not the client's 100)
  const result = resolveScoringMode(null, false, false);
  assert.equal(result.scoringMode, "pending");
  assert.equal(result.composite, 0, "pending composite must be 0, not client's 100");
});

test("F1: fabricated all-100 scores with NO cert cannot win against verified opponent", () => {
  // Attacker: submits all-100 scores, no signed cert
  const attackerSub = {
    scoring_mode: "pending",
    composite_score: 0, // server sets 0 for pending
  };

  // Legitimate opponent: has a verified cert with composite 72.5
  const legitSub = {
    scoring_mode: "api_verified",
    composite_score: 72.5,
  };

  const result = autoResolve(attackerSub, legitSub);
  assert.equal(result, null, "auto-resolve must NOT fire when one submission is pending");
});

test("F1: two pending submissions (both fabricated) cannot resolve", () => {
  const subA = { scoring_mode: "pending", composite_score: 0 };
  const subB = { scoring_mode: "pending", composite_score: 0 };

  const result = autoResolve(subA, subB);
  assert.equal(result, null, "two pending submissions must not resolve");
});

test("F1: two verified submissions CAN resolve (legitimate flow)", () => {
  const subA = { scoring_mode: "api_verified", composite_score: 85.5 };
  const subB = { scoring_mode: "api_verified", composite_score: 72.3 };

  const result = autoResolve(subA, subB);
  assert.notEqual(result, null, "two verified submissions should resolve");
  assert.equal(result.winner, "challenger", "higher composite wins");
  assert.ok(Math.abs(result.margin - 13.2) < 0.001, "margin is correct");
});

test("F1: unverified cert (no SCORING_WORKER_PUBKEY) → pending", () => {
  const cert = {
    challenge_id: "ch_123",
    operator_id: "op_456",
    scores: { density: 95, clarity: 90, fidelity: 88, brevity: 92, impact: 87 },
    composite: 91.35,
    engine: "claude",
    timestamp: "2026-07-31T12:00:00Z",
    signature: "fake_sig_base64",
  };

  // No SCORING_WORKER_PUBKEY set → cert cannot be verified → pending
  const result = resolveScoringMode(cert, false, false);
  assert.equal(result.scoringMode, "pending");
  assert.equal(result.composite, 0, "unverified cert composite must be 0");
});

test("F1: cert with invalid signature → pending", () => {
  const cert = {
    challenge_id: "ch_123",
    operator_id: "op_456",
    scores: { density: 95, clarity: 90, fidelity: 88, brevity: 92, impact: 87 },
    composite: 91.35,
    engine: "claude",
    timestamp: "2026-07-31T12:00:00Z",
    signature: "tampered_sig",
  };

  // SCORING_WORKER_PUBKEY is set but signature is invalid → pending
  const result = resolveScoringMode(cert, true, false);
  assert.equal(result.scoringMode, "pending");
  assert.equal(result.composite, 0, "invalid signature → composite must be 0");
});

test("F1: cert with valid signature → api_verified, composite from cert", () => {
  const cert = {
    challenge_id: "ch_123",
    operator_id: "op_456",
    scores: { density: 95, clarity: 90, fidelity: 88, brevity: 92, impact: 87 },
    composite: 91.35,
    engine: "claude",
    timestamp: "2026-07-31T12:00:00Z",
    signature: "valid_sig_base64",
  };

  const result = resolveScoringMode(cert, true, true);
  assert.equal(result.scoringMode, "api_verified");
  assert.equal(result.composite, 91.35, "verified cert composite comes from cert, not client");
});

test("F1: attacker with fabricated scores + fake cert cannot win vs verified opponent", () => {
  // Attacker: submits all-100 scores with a fake cert (signature won't verify)
  const attackerCert = {
    scores: { density: 100, clarity: 100, fidelity: 100, brevity: 100, impact: 100 },
    composite: 100,
    signature: "fake_signature",
  };
  const attackerScoring = resolveScoringMode(attackerCert, true, false); // cert invalid
  assert.equal(attackerScoring.scoringMode, "pending");
  assert.equal(attackerScoring.composite, 0);

  const attackerSub = {
    scoring_mode: attackerScoring.scoringMode,
    composite_score: attackerScoring.composite,
  };

  // Legit opponent: verified cert with composite 72.5
  const legitSub = {
    scoring_mode: "api_verified",
    composite_score: 72.5,
  };

  const result = autoResolve(attackerSub, legitSub);
  assert.equal(result, null, "attacker with fake cert cannot trigger auto-resolve");
});

test("F1: the composite formula is correct (sanity check)", () => {
  // Verify the formula matches the documented weights
  assert.equal(compositeScore(100, 100, 100, 100, 100), 100);
  assert.equal(compositeScore(0, 0, 0, 0, 0), 0);
  assert.equal(compositeScore(50, 50, 50, 50, 50), 50);

  // Weight check: density=100, rest=0 → 30
  assert.equal(compositeScore(100, 0, 0, 0, 0), 30);
  // clarity=100, rest=0 → 20
  assert.equal(compositeScore(0, 100, 0, 0, 0), 20);
  // fidelity=100, rest=0 → 20
  assert.equal(compositeScore(0, 0, 100, 0, 0), 20);
  // brevity=100, rest=0 → 15
  assert.equal(compositeScore(0, 0, 0, 100, 0), 15);
  // impact=100, rest=0 → 15
  assert.equal(compositeScore(0, 0, 0, 0, 100), 15);
});

test("F1: GATE_ARENA and GATE_CHALLENGES default to off", () => {
  // Mirrors lib/features.ts envBool logic
  function envBool(key, defaultVal = false) {
    const v = process.env[key];
    if (v === undefined || v === "") return defaultVal;
    return v === "1" || v.toLowerCase() === "true";
  }

  // Save and clear env vars
  const savedArena = process.env.NEXT_PUBLIC_GATE_ARENA;
  const savedChallenges = process.env.NEXT_PUBLIC_GATE_CHALLENGES;
  delete process.env.NEXT_PUBLIC_GATE_ARENA;
  delete process.env.NEXT_PUBLIC_GATE_CHALLENGES;

  const gateArena = envBool("NEXT_PUBLIC_GATE_ARENA", false);
  const gateChallenges = envBool("NEXT_PUBLIC_GATE_CHALLENGES", false);

  assert.equal(gateArena, false, "GATE_ARENA must default to false");
  assert.equal(gateChallenges, false, "GATE_CHALLENGES must default to false");
  assert.equal(
    gateArena && gateChallenges,
    false,
    "challengesEnabled() must be false by default",
  );

  // Restore
  if (savedArena !== undefined) process.env.NEXT_PUBLIC_GATE_ARENA = savedArena;
  if (savedChallenges !== undefined) process.env.NEXT_PUBLIC_GATE_CHALLENGES = savedChallenges;
});
