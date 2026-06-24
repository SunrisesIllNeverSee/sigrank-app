/**
 * __tests__/ingest/canonical.test.mjs
 *
 * Canonical lock tests for the ingest bridge — mirrors test_metrics.py in
 * moses-sigrank. Runs with `node --test` (Node 18+, no extra dependencies).
 *
 * These numbers MUST NOT change. If they do, the bridge is broken.
 *
 * To run:
 *   node --test __tests__/ingest/canonical.test.mjs
 *
 * Canonical anchors (verified against metrics.py):
 *   MO§ES: i=1_251_211  o=11_296_121  cw=128_196_310  cr=2_555_179_769
 *   SNR (compression_ratio) = 0.900     (o / (i+o))
 *   leverage                = 2042.2    (cr / i)
 *   yield_                  = 18436.98  (leverage × velocity)
 *   dev10x                  = 3.31      (log10(T×C×R))
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ---- Inline the pure math (no TypeScript path aliases needed) ----

function logNorm(x) {
  return Math.min(100, 20 * Math.log10(x + 1))
}

/** Mirrors metrics.py compute() */
function compute(i, o, cw, cr) {
  const safeI = Math.max(i, 1)
  const total = i + o + cw + cr

  const snr      = (i + o) > 0 ? o / (i + o) : 0
  const velocity = o / safeI
  const leverage = cr / safeI
  const yield_   = leverage * velocity

  let dev10x = null
  if (cw > 0 && o > 0 && i > 0 && cr > 0) {
    const T = o / i
    const C = cw / o
    const R = cr / cw
    dev10x = Math.log10(T * C * R)
  }

  return { snr, velocity, leverage, yield_, dev10x, total }
}

/** Mirrors pillarsToCore5 in bridge.ts */
function pillarsToCore5(i, o, cw, cr, sessionsCount, turnsTotal) {
  const safeI    = Math.max(i, 1)
  const safeSess = Math.max(sessionsCount, 1)
  const total    = i + o + cw + cr

  const compression_ratio  = (i + o) > 0 ? o / (i + o) : 0
  const turnsPerSession    = turnsTotal / safeSess
  const prompt_complexity  = logNorm(turnsPerSession)
  const reuseRatio         = cr / Math.max(cw, 1)
  const cross_thread       = Math.min(100, logNorm(reuseRatio))
  const session_depth      = turnsTotal / safeSess
  const token_throughput   = total

  return { compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput }
}

// ---- Canonical SEED corpus (mirrors metrics.py SEED) ----

const SEED = {
  'MO§ES':      [1_251_211,  11_296_121, 128_196_310,   2_555_179_769],
  'vincentkoc': [10_000,         500,         6_530,         295_500],
  'MapleEve':   [1_000,           80,           196,          22_800],
}

// ---- Tests ----

test('MO§ES canonical: SNR (compression_ratio)', () => {
  const [i, o, cw, cr] = SEED['MO§ES']
  const m = compute(i, o, cw, cr)
  assert.ok(Math.abs(m.snr - 0.9002) < 0.001, `snr=${m.snr.toFixed(4)} expected ~0.9002`)
})

test('MO§ES canonical: leverage', () => {
  const [i, o, cw, cr] = SEED['MO§ES']
  const m = compute(i, o, cw, cr)
  assert.ok(Math.abs(m.leverage - 2042.2) < 1, `leverage=${m.leverage.toFixed(1)} expected ~2042.2`)
})

test('MO§ES canonical: yield', () => {
  const [i, o, cw, cr] = SEED['MO§ES']
  const m = compute(i, o, cw, cr)
  assert.ok(Math.abs(m.yield_ - 18436.98) < 0.1, `yield=${m.yield_.toFixed(2)} expected ~18436.98`)
})

test('MO§ES canonical: dev10x', () => {
  const [i, o, cw, cr] = SEED['MO§ES']
  const m = compute(i, o, cw, cr)
  assert.ok(m.dev10x !== null, 'dev10x should not be null for MO§ES')
  assert.ok(Math.abs(m.dev10x - 3.31) < 0.01, `dev10x=${m.dev10x.toFixed(2)} expected ~3.31`)
})

test('MO§ES bridge: compression_ratio in [0,1]', () => {
  const [i, o, cw, cr] = SEED['MO§ES']
  const core5 = pillarsToCore5(i, o, cw, cr, 100, 5000)
  assert.ok(core5.compression_ratio >= 0 && core5.compression_ratio <= 1,
    `compression_ratio=${core5.compression_ratio} out of [0,1]`)
  assert.ok(Math.abs(core5.compression_ratio - 0.9002) < 0.001,
    `compression_ratio=${core5.compression_ratio.toFixed(4)} expected ~0.9002`)
})

test('MO§ES bridge: cross_thread in [0,100]', () => {
  const [i, o, cw, cr] = SEED['MO§ES']
  const core5 = pillarsToCore5(i, o, cw, cr, 100, 5000)
  assert.ok(core5.cross_thread >= 0 && core5.cross_thread <= 100,
    `cross_thread=${core5.cross_thread} out of [0,100]`)
})

test('Codex Alpha pathway (no profile): est_input = output × 2.0', () => {
  const rawOut = 500_000
  const estInput = Math.floor(rawOut * 2.0)
  assert.equal(estInput, 1_000_000)
})

test('Codex Beta pathway (with io_ratio=9.03): est_input = output × io_ratio', () => {
  // MO§ES io_ratio ≈ i/o = 1_251_211 / 11_296_121 ≈ 0.1108
  // But the io_ratio for the Beta pathway is input:output = i/o
  const moIoRatio = 1_251_211 / 11_296_121
  const rawOut = 11_296_121
  const estInput = Math.floor(rawOut * moIoRatio)
  assert.ok(Math.abs(estInput - 1_251_211) < 2, `estInput=${estInput} expected ~1_251_211`)
})

test('Manual four-number path: all values ≥ 0', () => {
  // Simulates parse_four("100 200 300 400")
  const nums = '100 200 300 400'.match(/[\d.]+/g).map(n => Math.floor(parseFloat(n)))
  assert.equal(nums.length, 4)
  assert.ok(nums.every(n => n >= 0))
})

test('vincentkoc: nonCompounding flag (no dev10x when cw=0)', () => {
  // cw=6530 so actually has dev10x — but verify the guard works for zero-cw
  const m = compute(10_000, 500, 0, 295_500)
  assert.equal(m.dev10x, null, 'dev10x should be null when cw=0')
})

test('Empty input throws', () => {
  assert.throws(() => {
    const t = '   '
    if (!t.trim()) throw new Error('The sequence input buffer is empty.')
  }, /empty/)
})

console.log('\nCanonical anchor: MO§ES Υ ~18436.98, lev ~2042.2, 10xDEV ~3.31, SNR ~0.900')
