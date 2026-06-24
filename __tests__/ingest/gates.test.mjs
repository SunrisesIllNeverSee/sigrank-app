/**
 * __tests__/ingest/gates.test.mjs
 *
 * Spec-lock for the ingest integrity gates (lib/ingest/gates.ts — the anti-gaming
 * layer on POST /api/v1/snapshots). Runs with `node --test` (no deps). Mirrors the
 * canonical.test.mjs pattern: the pure gate decisions are inlined here so the
 * EXPECTED behavior is locked even though the runtime impl is TypeScript. Keep this
 * port byte-faithful to plausibilityGate + runIngestGates in lib/ingest/gates.ts.
 *
 * These verdicts MUST hold: a fabricated / impossible / replayed payload must not
 * be able to land on the board.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

const GATE_LIMITS = {
  TOTALS_TOLERANCE_FRAC: 0.005,
  MAX_OUTPUT_TOKENS_PER_MIN: 20_000,
  MAX_SUBMISSIONS_PER_WINDOW: 24,
}

/** Faithful port of plausibilityGate (lib/ingest/gates.ts). Returns reason codes+severity. */
function plausibilityGate(p) {
  const rt = p.raw_telemetry
  const out = []
  const pillars =
    rt.tokens_input_fresh + rt.tokens_output + rt.tokens_cache_read + rt.tokens_cache_creation
  if (rt.tokens_total > 0) {
    const tol = Math.max(1, rt.tokens_total * GATE_LIMITS.TOTALS_TOLERANCE_FRAC)
    if (Math.abs(pillars - rt.tokens_total) > tol) out.push(['totals_inconsistent', 'reject'])
    if (rt.sessions_count === 0) out.push(['tokens_without_sessions', 'reject'])
  }
  if (rt.turns_total < rt.sessions_count) out.push(['turns_lt_sessions', 'reject'])
  if (rt.tokens_output > 0 && rt.turns_total === 0) out.push(['output_without_turns', 'reject'])
  const spanMin = (Date.parse(p.window.end) - Date.parse(p.window.start)) / 60_000
  if (Number.isFinite(spanMin) && rt.active_minutes_est > spanMin + 1) out.push(['active_exceeds_window', 'flag'])
  const outPerMin = rt.tokens_output / Math.max(rt.active_minutes_est, 1)
  if (outPerMin > GATE_LIMITS.MAX_OUTPUT_TOKENS_PER_MIN) out.push(['implausible_output_rate', 'flag'])
  return out
}

/** Faithful port of runIngestGates decision aggregation (plausibility-only here). */
function decisionOf(reasons) {
  const hasReject = reasons.some((r) => r[1] === 'reject')
  const hasFlag = reasons.some((r) => r[1] === 'flag')
  return hasReject ? 'reject' : hasFlag ? 'flag' : 'accept'
}

const codes = (reasons) => reasons.map((r) => r[0])

/** A clean, internally-consistent 30d payload (MO§ES-shaped pillars). */
function cleanPayload(over = {}) {
  const rt = {
    sessions_count: 40,
    turns_total: 520,
    tokens_input_fresh: 1_251_211,
    tokens_output: 11_296_121,
    tokens_cache_read: 2_555_179_769,
    tokens_cache_creation: 128_196_310,
    active_minutes_est: 6000,
    ...over.raw_telemetry,
  }
  rt.tokens_total = over.raw_telemetry?.tokens_total ??
    rt.tokens_input_fresh + rt.tokens_output + rt.tokens_cache_read + rt.tokens_cache_creation
  return {
    window: { type: '30d', start: '2026-05-01T00:00:00Z', end: '2026-05-31T00:00:00Z' },
    raw_telemetry: rt,
  }
}

test('clean payload → accept (no integrity reasons)', () => {
  const r = plausibilityGate(cleanPayload())
  assert.equal(decisionOf(r), 'accept', `unexpected reasons: ${codes(r)}`)
})

test('fabricated tokens_total (≠ Σ pillars) → reject totals_inconsistent', () => {
  const r = plausibilityGate(cleanPayload({ raw_telemetry: { tokens_total: 999_999_999_999 } }))
  assert.ok(codes(r).includes('totals_inconsistent'))
  assert.equal(decisionOf(r), 'reject')
})

test('tokens with zero sessions → reject tokens_without_sessions', () => {
  const r = plausibilityGate(cleanPayload({ raw_telemetry: { sessions_count: 0 } }))
  assert.ok(codes(r).includes('tokens_without_sessions'))
  assert.equal(decisionOf(r), 'reject')
})

test('turns_total < sessions_count → reject turns_lt_sessions', () => {
  const r = plausibilityGate(cleanPayload({ raw_telemetry: { sessions_count: 40, turns_total: 10 } }))
  assert.ok(codes(r).includes('turns_lt_sessions'))
  assert.equal(decisionOf(r), 'reject')
})

test('output with zero turns → reject output_without_turns', () => {
  const r = plausibilityGate(cleanPayload({ raw_telemetry: { sessions_count: 0, turns_total: 0 } }))
  assert.ok(codes(r).includes('output_without_turns'))
  assert.equal(decisionOf(r), 'reject')
})

test('implausible output rate (huge output, tiny active minutes) → flag', () => {
  const r = plausibilityGate(
    cleanPayload({ raw_telemetry: { active_minutes_est: 5, tokens_output: 11_296_121 } }),
  )
  assert.ok(codes(r).includes('implausible_output_rate'))
  // flag (not reject) when totals stay consistent — a degraded, accepted-but-flagged submission
  assert.equal(decisionOf(r), 'flag')
})

test('active minutes exceed the window span → flag active_exceeds_window', () => {
  const r = plausibilityGate(
    cleanPayload({
      window: undefined,
      raw_telemetry: { active_minutes_est: 99_999_999 },
    }),
  )
  assert.ok(codes(r).includes('active_exceeds_window'))
})
