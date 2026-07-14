/**
 * lib/data/outlier-classify.ts — shared outlier/bot classification.
 *
 * One source of truth for whether an operator is in the Human Center of Mass
 * or classified as an Outlier & Bot. Used by:
 *   - Leaderboard category filter (components/sigrank/LeaderboardTable.tsx)
 *   - Three Degrees chart (lib/marketing/top-operator-column.ts isRealOperator)
 *   - Profile page (outlier badge + field averages)
 *   - Compare page (operator pool + field median reference line)
 *   - Hall page (outlier marking on records)
 *
 * (owner 2026-07-14: hand-picked + auto-classify approach.)
 */

/** Hand-picked humans — verified operators that bypass the input/total ratio filter.
 * These are real humans whose input/total falls below 1% but are confirmed not bots/outliers. */
export const HUMAN_WHITELIST = new Set([
  "signal-92b4f9f485", // MOSES — canonical anchor, verified human
  "transvaultorigin", // MOSES mock codename (fallback path)
]);

/** Classify an operator as an outlier/bot or a human.
 *
 * Human Center of Mass:
 *   - input/total 1%–80% (normal range), OR
 *   - input/total < 1% BUT passes the MOSES-like filter:
 *     velocity ≤ 2x, yield ≤ 1000, output > 1M, cache_write > 1M, OR
 *   - in the HUMAN_WHITELIST (hand-picked, bypasses all checks)
 *
 * Outliers & Bots:
 *   - input/total > 80% (input dump bots), OR
 *   - input/total < 1% AND fails the MOSES-like filter:
 *     velocity > 2x, yield > 1000, output < 1M, or cache_write < 1M
 */
export function isOutlier(params: {
  codename: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  velocity: number;
  yield_: number;
}): boolean {
  const code = params.codename.toLowerCase();
  if (HUMAN_WHITELIST.has(code)) return false;

  const total = params.input + params.output + params.cacheRead + params.cacheWrite;
  if (total <= 0) return false;

  const inputPct = params.input / total;
  if (inputPct > 0.8) return true; // input dump bots
  if (inputPct >= 0.01) return false; // normal human range

  // Gray zone (input < 1%): MOSES-like filter
  if (
    params.velocity > 2.0 ||
    params.yield_ > 1000 ||
    params.output < 1_000_000 ||
    params.cacheWrite < 1_000_000
  ) {
    return true; // extreme outlier
  }
  return false; // MOSES-like — stays human
}

/** Convenience: classify a LeaderboardRow. */
export function isOutlierRow(row: {
  operator: { codename: string };
  telemetry: { fresh_input: number; output: number; cache_read: number; cache_create: number };
  snapshot: { cascade?: { velocity: number; yield_: number } | null };
}): boolean {
  const c = row.snapshot.cascade;
  return isOutlier({
    codename: row.operator.codename,
    input: row.telemetry.fresh_input,
    output: row.telemetry.output,
    cacheRead: row.telemetry.cache_read,
    cacheWrite: row.telemetry.cache_create,
    velocity: c?.velocity ?? 0,
    yield_: c?.yield_ ?? 0,
  });
}

/** Convenience: classify a LeaderboardEntry (the client-side board row type). */
export function isOutlierEntry(e: {
  codename: string;
  input?: number | null;
  output?: number | null;
  cacheRead?: number | null;
  cacheWrite?: number | null;
  totalTokens?: number | null;
  velocity?: number | null;
  yield_?: number | null;
}): boolean {
  return isOutlier({
    codename: e.codename,
    input: e.input ?? 0,
    output: e.output ?? 0,
    cacheRead: e.cacheRead ?? 0,
    cacheWrite: e.cacheWrite ?? 0,
    velocity: e.velocity ?? 0,
    yield_: e.yield_ ?? 0,
  });
}
