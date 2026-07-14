import { getLeaderboard, type LeaderboardRow } from "@/lib/data";
import { isOutlierRow } from "@/lib/data/outlier-classify";

/**
 * lib/marketing/top-operator-column.ts — the live columns for the Three Degrees chart
 * (owner 2026-06-27, updated 2026-07-13).
 *
 * Three columns, all computed from the live ALL-TIME board via the same operatorTotal
 * path the board uses (computeCascadeMetrics), so the chart can never disagree with the
 * board:
 *
 *   1. "Average Users"  — median of ALL real operators on the all-time board.
 *   2. "Power users"    — median of the top 100 real operators (by yield).
 *   3. "Top Evals"      — the single top real operator (gold column, unchanged).
 *
 * Why median, not mean: the token-cascade metrics are heavily right-skewed (not normal
 * distribution). A single IGNITER-class operator with 9 quadrillion input tokens pulls
 * the mean yield to 427 vs the median of 2.5 — a 170× spread. The median is the honest
 * "typical operator": it's the exact 50th percentile, immune to any outlier no matter
 * how extreme. The trimmed mean (drop 5% each end) still lands at 17.6 vs 2.5 — still
 * pulled by the upper-middle. Median is the cleanest cut.
 *
 * Returns null when there are not enough qualifying real operators → the chart falls
 * back to its frozen reference numbers (graceful-degradation contract).
 */

/** The seven column display strings, formatted to match the chart's existing style. */
export interface GoldColumn {
  yield_: string;
  snr: string;
  velocity: string;
  leverage: string;
  dev10x: string;
  efficiency: string;
  opRatio: string;
  /** The 10xDEV table read: exponent + linear amplification (10^x). */
  devLinear: string;
}

/** Is this a REAL operator (not a staged seed / The Field / a retired-and-anonymized row)?
 * Also filters outliers/bots via the shared isOutlier classifier (owner 2026-07-14). */
function isRealOperator(row: LeaderboardRow): boolean {
  const code = row.operator.codename.toLowerCase();
  if (code === "the-field") return false;
  if (code.startsWith("static seed") || code.startsWith("app seed"))
    return false;
  // Deleted accounts are anonymized to codename 'retired-<hash>' (account deletion) — skip.
  if (code.startsWith("retired-")) return false;
  if (row.operator.isPlaceholder) return false;
  // Must have a real compounding cascade (a non-compounding/empty row isn't "top operator").
  const c = row.snapshot.cascade;
  if (!c || c.nonCompounding) return false;
  // Outlier/bot filter (shared classifier — same logic as leaderboard + profile + compare).
  return !isOutlierRow(row);
}

/** Format a leverage-style "N×" value. */
function timesStr(n: number): string {
  return `${n.toFixed(1)}×`;
}

/** Median of a sorted numeric array (assumes already sorted ascending). */
function medianSorted(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Extract the 7 cascade metrics from a row into a numeric tuple. */
function cascadeMetrics(row: LeaderboardRow) {
  const c = row.snapshot.cascade;
  if (!c || c.nonCompounding) return null;
  return {
    yield_: c.yield_,
    snr: c.snr,
    velocity: c.velocity,
    leverage: c.leverage,
    dev10x: c.dev10x ?? 0,
    efficiency: c.efficiency,
  };
}

/** Format a column from a set of cascade metrics. */
function formatColumn(m: NonNullable<ReturnType<typeof cascadeMetrics>>): GoldColumn {
  return {
    yield_: m.yield_.toFixed(2),
    snr: m.snr.toFixed(2),
    velocity: m.velocity.toFixed(2),
    leverage: timesStr(m.leverage),
    dev10x: m.dev10x.toFixed(2),
    efficiency: m.efficiency.toFixed(2),
    opRatio: `${Math.round(m.leverage)} : 1 : ${m.velocity.toFixed(2)}`,
    devLinear: timesStr(m.leverage),
  };
}

/** Fallback values when the board has no qualifying real operators yet. */
const GOLD_FALLBACK: GoldColumn = {
  yield_: "488.65",
  snr: "0.58",
  velocity: "1.36",
  leverage: "360.2×",
  dev10x: "2.56",
  efficiency: "93.17",
  opRatio: "360 : 1 : 1.36",
  devLinear: "360×",
};

/** Frozen fallback for the "Average Users" median column (pre-seed reference). */
const AVG_FALLBACK: GoldColumn = {
  yield_: "1.57",
  snr: "0.33",
  velocity: "0.50",
  leverage: "3.2×",
  dev10x: "0.50",
  efficiency: "1.00",
  opRatio: "3.5 : 1 : 0.50",
  devLinear: "3.2×",
};

/** Frozen fallback for the "Power users" median column (pre-seed reference). */
const POWER_FALLBACK: GoldColumn = {
  yield_: "1.51",
  snr: "0.07",
  velocity: "0.08",
  leverage: "22.3×",
  dev10x: "1.35",
  efficiency: "5.61",
  opRatio: "22 : 1 : 0.08",
  devLinear: "22.4×",
};

/**
 * Fetch the current top real operator (all-time) and format its cascade into the gold
 * column. Null if none qualifies (→ chart uses its static fallback).
 */
export async function getTopOperatorColumn(): Promise<GoldColumn | null> {
  const board = await getLeaderboard({
    window: "all_time",
    windowFilter: true,
    operatorTotal: true,
  });
  // getLeaderboard returns yield-ranked rows; take the first REAL one.
  const top = board.find(isRealOperator);
  const c = top?.snapshot.cascade;
  if (!c) return null;

  const velocity = c.velocity;
  const leverage = c.leverage;
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
  };
}

/**
 * Compute the median cascade metrics of ALL real operators on the all-time board.
 * This is the "Average Users" column — the typical operator (50th percentile).
 * Returns null if fewer than 2 qualifying operators → chart uses fallback.
 */
export async function getAverageUsersColumn(): Promise<GoldColumn | null> {
  const board = await getLeaderboard({
    window: "all_time",
    windowFilter: true,
    operatorTotal: true,
  });
  const real = board.filter(isRealOperator);
  if (real.length < 2) return null;

  const metrics = real.map(cascadeMetrics).filter(Boolean) as NonNullable<ReturnType<typeof cascadeMetrics>>[];
  if (metrics.length < 2) return null;

  return formatColumn({
    yield_: medianSorted(metrics.map((m) => m.yield_).sort((a, b) => a - b)),
    snr: medianSorted(metrics.map((m) => m.snr).sort((a, b) => a - b)),
    velocity: medianSorted(metrics.map((m) => m.velocity).sort((a, b) => a - b)),
    leverage: medianSorted(metrics.map((m) => m.leverage).sort((a, b) => a - b)),
    dev10x: medianSorted(metrics.map((m) => m.dev10x).sort((a, b) => a - b)),
    efficiency: medianSorted(metrics.map((m) => m.efficiency).sort((a, b) => a - b)),
  });
}

/**
 * Compute the median cascade metrics of the TOP 100 real operators (by yield) on the
 * all-time board. This is the "Power users" column — the typical elite performer
 * (50th percentile of the top 100).
 * Returns null if fewer than 2 qualifying operators → chart uses fallback.
 */
export async function getPowerUsersColumn(): Promise<GoldColumn | null> {
  const board = await getLeaderboard({
    window: "all_time",
    windowFilter: true,
    operatorTotal: true,
  });
  // Board is yield-ranked descending; take the first 100 real operators.
  const real = board.filter(isRealOperator).slice(0, 100);
  if (real.length < 2) return null;

  const metrics = real.map(cascadeMetrics).filter(Boolean) as NonNullable<ReturnType<typeof cascadeMetrics>>[];
  if (metrics.length < 2) return null;

  return formatColumn({
    yield_: medianSorted(metrics.map((m) => m.yield_).sort((a, b) => a - b)),
    snr: medianSorted(metrics.map((m) => m.snr).sort((a, b) => a - b)),
    velocity: medianSorted(metrics.map((m) => m.velocity).sort((a, b) => a - b)),
    leverage: medianSorted(metrics.map((m) => m.leverage).sort((a, b) => a - b)),
    dev10x: medianSorted(metrics.map((m) => m.dev10x).sort((a, b) => a - b)),
    efficiency: medianSorted(metrics.map((m) => m.efficiency).sort((a, b) => a - b)),
  });
}

export { GOLD_FALLBACK, AVG_FALLBACK, POWER_FALLBACK };
