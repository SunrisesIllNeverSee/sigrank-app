/**
 * __tests__/data/windows.test.mjs
 *
 * Lock tests for the 730 window-membership core (lib/data/windows.ts). Mirrors
 * the pure math in JS — the same discipline canonical.test.mjs uses for the
 * cascade (no TypeScript path aliases needed). If lib/data/windows.ts changes
 * its model, update this mirror in lockstep.
 *
 * Model under test: board(W) = window_type === enum(W) (exact, NON-cumulative)
 * AND (W=all_time ? no-recency : age ≤ days+buffer). ref ("now") is DATA-RELATIVE
 * — the latest snapshot_date in the window group — so static seeds never empty a
 * board and the math is deterministic.
 *
 *   node --test __tests__/data/windows.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ---- Inline mirror of lib/data/windows.ts (keep in sync) ----
const MS_PER_DAY = 86_400_000
const BOARD_WINDOWS = [
  { slug: '7d', enum: '7d', days: 7, buffer: 1 },
  { slug: '30d', enum: '30d', days: 30, buffer: 3 },
  { slug: '90d', enum: '90d', days: 90, buffer: 3 },
  { slug: 'all', enum: 'all_time', days: null, buffer: 0 },
]
const BY_ENUM = new Map(BOARD_WINDOWS.map((w) => [w.enum, w]))
const parseSnapshotDate = (d) => (d ? Date.parse(`${d.slice(0, 10)}T00:00:00Z`) : NaN)

function windowReference(candidates) {
  let ref = NaN
  for (const c of candidates) {
    const t = parseSnapshotDate(c.snapshot_date)
    if (!Number.isNaN(t) && (Number.isNaN(ref) || t > ref)) ref = t
  }
  return ref
}
function inWindow(win, snap, ref) {
  if (snap.window_type !== win.enum) return false
  if (win.days == null) return true
  const t = parseSnapshotDate(snap.snapshot_date)
  if (Number.isNaN(t) || Number.isNaN(ref)) return true
  const ageDays = (ref - t) / MS_PER_DAY
  return ageDays <= win.days + win.buffer
}
function filterToWindow(rows, windowEnum) {
  const win = BY_ENUM.get(windowEnum)
  if (!win) return rows.filter((r) => r.window_type === windowEnum)
  const candidates = rows.filter((r) => r.window_type === win.enum)
  if (win.days == null) return candidates
  const ref = windowReference(candidates)
  return candidates.filter((r) => inWindow(win, r, ref))
}

// ---- helpers ----
const w = (enumValue) => BY_ENUM.get(enumValue)
const day = (n) => new Date(Date.UTC(2026, 5, 1) - n * MS_PER_DAY).toISOString().slice(0, 10) // n days before 2026-06-01
const REF = Date.UTC(2026, 5, 1) // 2026-06-01

// ---- exact window_type match (non-cumulative) ----
test('exact: a 30d snapshot is NOT in the 7d window', () => {
  assert.equal(inWindow(w('7d'), { window_type: '30d', snapshot_date: day(0) }, REF), false)
})
test('exact: a 7d snapshot is in the 7d window', () => {
  assert.equal(inWindow(w('7d'), { window_type: '7d', snapshot_date: day(0) }, REF), true)
})
test('exact: a 7d snapshot does NOT leak into 30d/90d (windows are cohorts)', () => {
  const snap = { window_type: '7d', snapshot_date: day(0) }
  assert.equal(inWindow(w('30d'), snap, REF), false)
  assert.equal(inWindow(w('90d'), snap, REF), false)
})

// ---- recency buffer edges (inclusive) ----
test('7d buffer: 8 days old (7+1) is included; 9 days old is dropped', () => {
  assert.equal(inWindow(w('7d'), { window_type: '7d', snapshot_date: day(8) }, REF), true)
  assert.equal(inWindow(w('7d'), { window_type: '7d', snapshot_date: day(9) }, REF), false)
})
test('30d buffer: 33 days old (30+3) is included; 34 days old is dropped', () => {
  assert.equal(inWindow(w('30d'), { window_type: '30d', snapshot_date: day(33) }, REF), true)
  assert.equal(inWindow(w('30d'), { window_type: '30d', snapshot_date: day(34) }, REF), false)
})
test('90d buffer: 93 days old (90+3) is included; 94 days old is dropped', () => {
  assert.equal(inWindow(w('90d'), { window_type: '90d', snapshot_date: day(93) }, REF), true)
  assert.equal(inWindow(w('90d'), { window_type: '90d', snapshot_date: day(94) }, REF), false)
})

// ---- all_time has no recency filter ----
test('all_time: a 1000-day-old all_time snapshot still counts', () => {
  assert.equal(inWindow(w('all_time'), { window_type: 'all_time', snapshot_date: day(1000) }, REF), true)
})
test('all_time: a 30d snapshot is NOT in all_time (exact window_type)', () => {
  assert.equal(inWindow(w('all_time'), { window_type: '30d', snapshot_date: day(0) }, REF), false)
})

// ---- data-relative ref: static seeds (all same old date) never empty a board ----
test('data-relative ref: 8 same-dated 30d seeds all survive (freshest defines now)', () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({
    operator_id: `op${i}`,
    window_type: '30d',
    snapshot_date: '2026-05-14', // 36 days before wall-clock 2026-06-19, but ref = this date
  }))
  const out = filterToWindow(rows, '30d')
  assert.equal(out.length, 8)
})

// ---- filterToWindow end-to-end across a mixed corpus ----
test('filterToWindow: splits a mixed corpus into per-window cohorts', () => {
  const rows = [
    { operator_id: 'a', window_type: '7d', snapshot_date: day(0) },
    { operator_id: 'b', window_type: '7d', snapshot_date: day(0) },
    { operator_id: 'c', window_type: '30d', snapshot_date: day(0) },
    { operator_id: 'd', window_type: '90d', snapshot_date: day(0) },
    { operator_id: 'e', window_type: 'all_time', snapshot_date: day(900) },
    { operator_id: 'f', window_type: 'all_time', snapshot_date: day(0) },
  ]
  assert.equal(filterToWindow(rows, '7d').length, 2)
  assert.equal(filterToWindow(rows, '30d').length, 1)
  assert.equal(filterToWindow(rows, '90d').length, 1)
  assert.equal(filterToWindow(rows, 'all_time').length, 2) // both, despite the 900-day-old one
})

// ---- unknown enum → exact match, no recency ----
test('unknown enum: exact window_type match, no recency applied', () => {
  const rows = [
    { operator_id: 'x', window_type: 'today', snapshot_date: day(500) },
    { operator_id: 'y', window_type: '30d', snapshot_date: day(0) },
  ]
  assert.equal(filterToWindow(rows, 'today').length, 1)
})
