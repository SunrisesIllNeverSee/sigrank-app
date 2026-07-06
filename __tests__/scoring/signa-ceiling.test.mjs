/**
 * __tests__/scoring/signa-ceiling.test.mjs
 * CLAIM 3: RS01 weights sum to 0.85 (tt muted), so max achievable SIGNA is 85.0 —
 * exactly the TRANSMITTER signaMin gate, making it reachable only at perfection.
 * Also: the live weights fail secret-config's sum≈1 validator. PASSES if TRUE.
 * Run: node --test __tests__/scoring/signa-ceiling.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Live placeholder weights (lib/scoring/ruleset.ts:29-35).
const W = { comp: 0.3, sd: 0.2, pc: 0.2, ct: 0.15, tt: 0 }

// Port of computeSignaRate (engine.ts:55-60): weighted sum, clamped [0,100].
const signa = (s) =>
  Math.max(0, Math.min(100, W.comp*s.comp + W.sd*s.sd + W.pc*s.pc + W.ct*s.ct + W.tt*s.tt))

test('RS01 weights sum to 0.85, not 1.0', () => {
  const sum = W.comp + W.sd + W.pc + W.ct + W.tt
  assert.equal(Number(sum.toFixed(10)), 0.85)
})

test('max achievable SIGNA (all components = 100) is exactly 85', () => {
  const max = signa({ comp: 100, sd: 100, pc: 100, ct: 100, tt: 100 })
  assert.equal(max, 85, 'ceiling below 100 confirms the compressed class curve')
})

test('TRANSMITTER (signaMin 85) requires a PERFECT operator', () => {
  // Drop any single surviving axis below 100 → SIGNA < 85 → TRANSMITTER unreachable.
  const almost = signa({ comp: 100, sd: 100, pc: 100, ct: 99, tt: 100 })
  assert.ok(almost < 85, `SIGNA=${almost}; anything less than perfect misses the 85 gate`)
})

test('live 0.85 weights would FAIL secret-config validWeights (sum ≈ 1)', () => {
  // Port of validWeights (secret-config.ts:54-67): rejects unless |sum-1| < 1e-6.
  const sum = W.comp + W.sd + W.pc + W.ct + W.tt
  const wouldValidate = Math.abs(sum - 1) < 1e-6
  assert.equal(wouldValidate, false,
    'the current live shape cannot be pushed through SIGRANK_RULESET env override')
})
