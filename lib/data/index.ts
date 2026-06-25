/**
 * lib/data/index.ts — THE data facade barrel.
 *
 * This is the ONLY data import surface for feature builders: every page / route
 * that needs operator data imports from `@/lib/data`, and none of them import
 * Supabase directly. The implementation is split across three sibling modules
 * (re-exported here so the public front door is unchanged):
 *
 *   - ./mappers  — shared DB row shapes (DbOperator/DbMetricSnapshot), the query
 *                  param contracts (BoardParams/HistoryParams), and the pure
 *                  transforms that shape raw rows into facade types.
 *   - ./fallback — the no-DB / DB-error path (cold-store snapshot → mock seeds),
 *                  so the app always builds + renders and degrades gracefully.
 *   - ./queries  — the async DB read functions (getLeaderboard, getOperator, …),
 *                  each: no creds → fallback; live → mapped; query error → fallback.
 *
 * Split out of a single 959-line module (repo-move Phase 2) with ZERO call-site
 * edits — every consumer still imports the same names from `@/lib/data`.
 */

export * from '@/lib/data/mappers'
export * from '@/lib/data/fallback'
export * from '@/lib/data/queries'

// Re-export the row/record types from the mock module (the canonical type source)
// so feature builders import data + types from this single facade.
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
} from '@/lib/data/mock'
