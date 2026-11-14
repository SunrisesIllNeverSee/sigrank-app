/**
 * lib/data/cached.ts — data-layer caching wrapper over queries.ts.
 *
 * Wraps the public-page read functions from ./queries in Next.js
 * `unstable_cache` so expensive reads (e.g. /hall's multi-call fan-out to
 * getLeaderboard) collapse to cache hits after the first request per
 * param-combo. This works regardless of whether the calling page is ISR or
 * dynamic — the cache lives at the data layer, not the rendering layer.
 *
 * Why a separate file: keeps queries.ts as the pure DB facade (no Next.js
 * cache primitives) and concentrates the cache policy here in one place.
 * The barrel (./index.ts) re-exports these cached versions so every existing
 * call site (@/lib/data) gets caching transparently — zero call-site edits.
 *
 * Cache tags:
 *   ['board']    — leaderboard, hall, class distribution, metric leaders,
 *                  homepage stats, online widgets. revalidate: 300s.
 *   ['operator'] — per-operator reads (profile, submissions, history).
 *                  revalidate: 120s.
 *
 * NOT cached (writes): bumpComparisonsRan stays in ./queries and is
 * re-exported directly.
 *
 * Migration note: `unstable_cache` is the Next 15 primitive; when the repo
 * moves to Next 16 (parked, state/NEXT16_MIGRATION_DEFERRED.md), swap to
 * `"use cache"` directives. The cache policy (tags, revalidate windows)
 * stays the same.
 *
 * 2MB LIMIT: the full unfiltered `getLeaderboard` field (~2.5MB for 1,640
 * operators) exceeds `unstable_cache`'s 2MB per-entry cap. getLeaderboard goes
 * through the shared Data Cache and falls back to the in-memory memo
 * (`./memo.ts`) only for results over the cap — see the comment on
 * `sharedLeaderboard` below.
 */

import { unstable_cache } from "next/cache";

import {
  fetchLeaderboardOrThrow as _fetchLeaderboardOrThrow,
  getIndexableOperatorRows as _getIndexableOperatorRows,
  getOperator as _getOperator,
  getOperatorSubmissions as _getOperatorSubmissions,
  getOperatorHistory as _getOperatorHistory,
  getOperatorSnapshotRecords as _getOperatorSnapshotRecords,
  getOperatorWatchCount as _getOperatorWatchCount,
  getMetricLeaders as _getMetricLeaders,
  getHallOfSignal as _getHallOfSignal,
  getHomepageStats as _getHomepageStats,
  getClassDistribution as _getClassDistribution,
  getOnlineHourly as _getOnlineHourly,
  getOnlineWeekly as _getOnlineWeekly,
  getOnlineByCountry as _getOnlineByCountry,
  getOperatorReport as _getOperatorReport,
  getOperatorRecords as _getOperatorRecords,
} from "@/lib/board/queries";

import { memoize } from "./memo";

import type {
  LeaderboardRow,
  HallRecord,
  HomepageStats,
  ClassDistributionRow,
  HourlyPoint,
  WeeklyPoint,
  CountryCount,
  HistoryPoint,
} from "@/lib/board/types";
import type { BoardParams, HistoryParams } from "@/lib/board/mappers";
import type {
  LeaderboardResult,
  OperatorSubmission,
  OperatorReport,
  OperatorStaticRecord,
  OperatorDynamicRecord,
  OperatorRecordsResult,
} from "@/lib/board/queries";

// ── Board-tagged reads (revalidate: 3600s) ───────────────────────────────
// TTL is a fallback only — revalidateTouchedWindows() fires on every verified
// submission and busts all board + operator caches on-demand. The 3600s TTL
// means that if no submissions arrive for an hour, the cache refreshes once
// instead of every 5 minutes (12x fewer DB hits during idle periods).

// getLeaderboard — shared cache (2026-11-14, Supabase egress block).
// It used to live in a per-instance in-memory memo, so every cold serverless
// instance / region / build worker refetched the whole board from Supabase.
// It now goes through Next's Data Cache (unstable_cache, tag "board",
// revalidate 3600), which is shared across instances and is busted by
// revalidateTag("board") in revalidateTouchedWindows. Cache key = the params.
//
// The Data Cache caps an entry at 2 MB and silently refuses bigger ones. The
// entry is the mapped rows exactly as returned (nothing is trimmed: the board
// must show identical data). Measured sizes are in
// __tests__/board/leaderboard-cache-size.test.ts: ~1.9 KB per row, so the
// claimed-only boards (hundreds of operators) are well below the cap, and the
// full unfiltered field (~1,700 operators) is over it. Over-cap results are
// detected inside the cached function, stored as a tiny marker, and served
// from the old in-memory memo instead (seeded by the same fetch, so there is no
// second database read on that instance). Failures are never cached: the
// cached function THROWS when the database is unreadable, and unstable_cache
// does not store a thrown result.

/** Stay under the 2 MB Data Cache cap with headroom for cache metadata. */
export const LEADERBOARD_CACHE_MAX_BYTES = 1_800_000;

type CachedLeaderboard = { rows: LeaderboardRow[] } | { oversize: true };

const sharedLeaderboard = unstable_cache(
  async (params: BoardParams): Promise<CachedLeaderboard> => {
    const rows = await _fetchLeaderboardOrThrow(params);
    if (JSON.stringify(rows).length > LEADERBOARD_CACHE_MAX_BYTES) {
      // Seed the memo so this instance does not fetch again.
      void memoize(memoKey(params), 3600, async () => rows);
      return { oversize: true };
    }
    return { rows };
  },
  ["board-leaderboard-v1"],
  { revalidate: 3600, tags: ["board"] },
);

function memoKey(params: BoardParams): string {
  return `board:leaderboard:${JSON.stringify(params)}`;
}

/**
 * Cached leaderboard read that also says whether the live database was
 * unavailable (see LeaderboardResult). strictLive callers keep their throw.
 */
export async function getLeaderboardResult(
  params: BoardParams = {},
): Promise<LeaderboardResult> {
  try {
    const hit = await sharedLeaderboard(params);
    if ("rows" in hit) return { rows: hit.rows, unavailable: false };
    return {
      rows: await memoize(memoKey(params), 3600, () => _fetchLeaderboardOrThrow(params)),
      unavailable: false,
    };
  } catch (error) {
    if (params.strictLive) throw error;
    console.warn("getLeaderboard failed:", error);
    return { rows: [], unavailable: true };
  }
}

export async function getLeaderboard(params: BoardParams = {}): Promise<LeaderboardRow[]> {
  return (await getLeaderboardResult(params)).rows;
}

export const getHallOfSignal = unstable_cache(
  _getHallOfSignal,
  ["hall-of-signal"],
  { revalidate: 3600, tags: ["board"] },
);

export const getClassDistribution = unstable_cache(
  _getClassDistribution,
  ["class-distribution"],
  { revalidate: 3600, tags: ["board"] },
);

export const getMetricLeaders = unstable_cache(
  _getMetricLeaders,
  ["metric-leaders"],
  { revalidate: 3600, tags: ["board"] },
);

export const getHomepageStats = unstable_cache(
  _getHomepageStats,
  ["homepage-stats"],
  { revalidate: 3600, tags: ["board"] },
);

export const getOnlineHourly = unstable_cache(
  _getOnlineHourly,
  ["online-hourly"],
  { revalidate: 3600, tags: ["board"] },
);

export const getOnlineWeekly = unstable_cache(
  _getOnlineWeekly,
  ["online-weekly"],
  { revalidate: 3600, tags: ["board"] },
);

export const getOnlineByCountry = unstable_cache(
  _getOnlineByCountry,
  ["online-by-country"],
  { revalidate: 3600, tags: ["board"] },
);

// ── Operator-tagged reads (staggered revalidate) ─────────────────────────
// Staggered windows so they don't all expire simultaneously on a cold miss.
// The /user/[codename] page fires 8 queries in parallel; if all caches
// expire at the same 120s mark, every query hits Supabase at once. With
// staggered windows, only 1-2 queries miss at any given time — the rest
// serve from cache, spreading the DB load over time.
//
// getOperator is the critical-path query (needed before the other 7 can
// fire), so it gets the shortest window (90s) — it's also the most likely
// to be revalidated on-demand via revalidateTouchedWindows.
// The rest get progressively longer windows.

export const getOperator = unstable_cache(_getOperator, ["operator"], {
  revalidate: 90,
  tags: ["operator"],
});

export const getOperatorSubmissions = unstable_cache(
  _getOperatorSubmissions,
  ["operator-submissions"],
  { revalidate: 180, tags: ["operator"] },
);

export const getOperatorHistory = unstable_cache(
  _getOperatorHistory,
  ["operator-history"],
  { revalidate: 150, tags: ["operator"] },
);

export const getOperatorSnapshotRecords = unstable_cache(
  _getOperatorSnapshotRecords,
  ["operator-snapshot-records"],
  { revalidate: 150, tags: ["operator"] },
);

export const getOperatorWatchCount = unstable_cache(
  _getOperatorWatchCount,
  ["operator-watch-count"],
  { revalidate: 150, tags: ["operator"] },
);

export const getOperatorReport = unstable_cache(
  _getOperatorReport,
  ["operator-report"],
  { revalidate: 240, tags: ["operator"] },
);

export const getOperatorRecords = unstable_cache(
  _getOperatorRecords,
  ["operator-records"],
  { revalidate: 300, tags: ["board"] },
);

// Sitemap operator population (SEARCH-RECOVERY Phase 1): small claimed-only
// corpus, well under the 2MB unstable_cache cap. Tagged both "board" and
// "operator" so revalidateTouchedWindows busts it on any verified submission;
// the 300s TTL matches the HTTP-fetch revalidate it replaced.
export const getIndexableOperatorRows = unstable_cache(
  _getIndexableOperatorRows,
  ["indexable-operator-rows"],
  { revalidate: 300, tags: ["board", "operator"] },
);

// ── Re-export types so consumers importing from @/lib/data still see them ──
export type {
  LeaderboardRow,
  HallRecord,
  HomepageStats,
  ClassDistributionRow,
  HourlyPoint,
  WeeklyPoint,
  CountryCount,
  HistoryPoint,
};
export type { BoardParams, HistoryParams };
export type { OperatorSubmission };
export type { OperatorReport };
export type { OperatorStaticRecord, OperatorDynamicRecord, OperatorRecordsResult };
