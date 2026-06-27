import { getLeaderboard, type LeaderboardRow } from '@/lib/data'

/**
 * lib/marketing/top-operator-column.ts — the live "top operator to date" gold column
 * for the Three Degrees chart (owner 2026-06-27).
 *
 * The chart's gold column tracks whoever currently LEADS the live board among REAL
 * operators (excludes staged seeds, The Field, retired rows), on the ALL-TIME window —
 * reconciling the earlier 7d-under-a-"to date"-label mismatch. Everything is the
 * canonical board compute (computeCascadeMetrics, via the same operatorTotal path the
 * board uses), so the chart can never disagree with the board.
 *
 * Returns null when there is no qualifying real operator yet → the chart falls back to
 * its frozen reference numbers (graceful-degradation contract).
 */

/** The seven gold-column display strings, formatted to match the chart's existing style. */
export interface GoldColumn {
  yield_: string
  snr: string
  velocity: string
  leverage: string
  dev10x: string
  efficiency: string
  opRatio: string
  /** The 10xDEV table read: exponent + linear amplification (10^x). */
  devLinear: string
}

/** Is this a REAL operator (not a staged seed / The Field / a retired-and-anonymized row)? */
function isRealOperator(row: LeaderboardRow): boolean {
  const code = row.operator.codename.toLowerCase()
  if (code === 'the-field') return false
  if (code.startsWith('static seed') || code.startsWith('app seed')) return false
  // Deleted accounts are anonymized to codename 'retired-<hash>' (account deletion) — skip.
  if (code.startsWith('retired-')) return false
  if (row.operator.isPlaceholder) return false
  // Must have a real compounding cascade (a non-compounding/empty row isn't "top operator").
  const c = row.snapshot.cascade
  return Boolean(c && !c.nonCompounding)
}

/** Format a leverage-style "N×" value. */
function timesStr(n: number): string {
  return `${n.toFixed(1)}×`
}

/**
 * Fetch the current top real operator (all-time) and format its cascade into the gold
 * column. Null if none qualifies (→ chart uses its static fallback).
 */
export async function getTopOperatorColumn(): Promise<GoldColumn | null> {
  const board = await getLeaderboard({
    window: 'all_time',
    windowFilter: true,
    operatorTotal: true,
  })
  // getLeaderboard returns yield-ranked rows; take the first REAL one.
  const top = board.find(isRealOperator)
  const c = top?.snapshot.cascade
  if (!c) return null

  const velocity = c.velocity
  const leverage = c.leverage
  return {
    yield_: c.yield_.toFixed(2),
    snr: c.snr.toFixed(2),
    velocity: velocity.toFixed(2),
    leverage: timesStr(leverage),
    dev10x: (c.dev10x ?? 0).toFixed(2),
    efficiency: c.efficiency.toFixed(2),
    // Operating Ratio C:I:O — input-normalized (matches the chart's other columns).
    opRatio: `${Math.round(leverage)} : 1 : ${velocity.toFixed(velocity < 1 ? 2 : 2)}`,
    // 10xDEV table: linear amplification = 10^dev10x ≈ leverage (the telescoping identity).
    devLinear: timesStr(leverage),
  }
}
