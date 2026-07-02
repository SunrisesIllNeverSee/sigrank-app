/**
 * lib/data/index.ts — THE data facade barrel.
 *
 * This is the ONLY data import surface for feature builders: every page / route
 * that needs operator data imports from `@/lib/data`, and none of them import
 * Supabase directly. The implementation is split across four sibling modules
 * (re-exported here so the public front door is unchanged):
 *
 *   - ./mappers  — shared DB row shapes (DbOperator/DbMetricSnapshot), the query
 *                  param contracts (BoardParams/HistoryParams), and the pure
 *                  transforms that shape raw rows into facade types.
 *   - ./fallback — the no-DB / DB-error path (cold-store snapshot → mock seeds),
 *                  so the app always builds + renders and degrades gracefully.
 *   - ./queries  — the async DB read/write functions (getLeaderboard, getOperator,
 *                  bumpComparisonsRan, …), each: no creds → fallback; live → mapped;
 *                  query error → fallback.
 *   - ./cached   — unstable_cache wrappers over the read functions (data-layer
 *                  caching, 2026-07-02). Board reads revalidate 300s, operator
 *                  reads 120s. bumpComparisonsRan (a write) is NOT cached — it
 *                  re-exports directly from ./queries below.
 *
 * Split out of a single 959-line module (repo-move Phase 2) with ZERO call-site
 * edits — every consumer still imports the same names from `@/lib/data`.
 */

export * from '@/lib/data/mappers'
export * from '@/lib/data/fallback'

// Cached read functions (data-layer caching via unstable_cache).
// These shadow the raw query exports — consumers get caching transparently.
export {
  getLeaderboard,
  getOperator,
  getOperatorSubmissions,
  getOperatorHistory,
  getMetricLeaders,
  getHallOfSignal,
  getHomepageStats,
  getClassDistribution,
  getOnlineHourly,
  getOnlineWeekly,
  getOnlineByCountry,
} from '@/lib/data/cached'

// Writes are NOT cached — re-export directly from queries.
export { bumpComparisonsRan } from '@/lib/data/queries'
export type { OperatorSubmission } from '@/lib/data/queries'

// Re-export the row/record types from the neutral types module (extracted from
// mock.ts 2026-06-26) so feature builders import data + types from this facade.
export type {
  LeaderboardRow,
  HistoryPoint,
  HomepageStats,
  HallRecord,
  ClassDistributionRow,
  TelemetryRaw,
  HourlyPoint,
  WeeklyPoint,
  CountryCount,
} from '@/lib/data/types'
