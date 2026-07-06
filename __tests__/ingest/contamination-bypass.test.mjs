/**
 * __tests__/ingest/contamination-bypass.test.mjs
 * CLAIM 4: contaminationCheck is threshold-based, not a model. Setting cache_creation
 * to just over cache_read/100 clears BOTH guards while cache_read (and thus Υ) stays
 * arbitrarily large. PASSES if the claim is TRUE (bypass works).
 * Run: node --test __tests__/ingest/contamination-bypass.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Port of contaminationCheck (lib/ingest/battery.ts:87-107).
function contaminationFlagged(rt) {
  if (rt.tokens_cache_read > 1_000 && rt.tokens_cache_creation === 0) return true
  if (rt.tokens_cache_creation > 0 &&
      rt.tokens_cache_read / rt.tokens_cache_creation > 100) return true
  return false
}
// Υ = cache_read × output / input²  (README §, methodology-refinement page).
const upsilon = (rt) =>
  (rt.tokens_cache_read * rt.tokens_output) / (rt.tokens_input_fresh ** 2)

test('a huge cache_read with cache_creation just over 1% passes both guards', () => {
  const cacheRead = 5_000_000_000
  const rt = {
    tokens_input_fresh: 1_000,           // tiny input → input² blows Υ up
    tokens_output: 10_000_000,
    tokens_cache_read: cacheRead,
    tokens_cache_creation: Math.ceil(cacheRead / 100) + 1, // ratio just UNDER 100:1
  }
  assert.equal(contaminationFlagged(rt), false,
    'inflator clears the battery — if flagged, the guard is tighter than claimed')
  assert.ok(upsilon(rt) > 1e10,
    `Υ = ${upsilon(rt).toExponential(2)} — arbitrarily large despite passing`)
})

test('the guard only catches the LAZIEST fabrication (literal zero creation)', () => {
  const lazy = { tokens_cache_read: 5_000_000_000, tokens_cache_creation: 0,
                 tokens_input_fresh: 1_000, tokens_output: 10_000_000 }
  assert.equal(contaminationFlagged(lazy), true, 'zero-creation is the only shape it reliably stops')
})
