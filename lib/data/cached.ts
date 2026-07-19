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
 * ⚠ 2MB LIMIT WORKAROUND: `getLeaderboard` returns ~2.5MB (1,640 operators ×
 * full nested objects), which exceeds `unstable_cache`'s 2MB per-entry cap
 * on Vercel. The Data Cache silently fails to set, so every request re-queries
 * Supabase. We use an in-memory memo cache (`./memo.ts`) instead — no size
 * limit, deduplicates concurrent requests, persists across warm serverless
 * invocations. See `./memo.ts` for the full rationale.
 */

import { unstable_cache } from "next/cache";

import {
  getLeaderboard as _getLeaderboard,
  getOperator as _getOperator,
  getOperatorSubmissions as _getOperatorSubmissions,
  getOperatorHistory as _getOperatorHistory,
  getMetricLeaders as _getMetricLeaders,
  getHallOfSignal as _getHallOfSignal,
  getHomepageStats as _getHomepageStats,
  getClassDistribution as _getClassDistribution,
  getOnlineHourly as _getOnlineHourly,
  getOnlineWeekly as _getOnlineWeekly,
  getOnlineByCountry as _getOnlineByCountry,
  getOperatorReport as _getOperatorReport,
  getOperatorRecords as _getOperatorRecords,
} from "@/lib/data/queries";

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
} from "@/lib/data/types";
import type { BoardParams, HistoryParams } from "@/lib/data/mappers";
import type {
  OperatorSubmission,
  OperatorReport,
  OperatorStaticRecord,
  OperatorDynamicRecord,
  OperatorRecordsResult,
} from "@/lib/data/queries";

// ── Board-tagged reads (revalidate: 300s) ────────────────────────────────

// ⚠ getLeaderboard uses the in-memory memo cache instead of unstable_cache
// because the serialized payload (~2.5MB for 1,640 operators) exceeds
// Vercel's 2MB Data Cache limit. The memo cache has no size limit and
// deduplicates concurrent requests (a 100-request burst = 1 DB hit).
// Cache key includes JSON-serialized params so different filters cache
// separately. TTL matches the original unstable_cache revalidate (300s).
export function getLeaderboard(params: BoardParams = {}): Promise<LeaderboardRow[]> {
  const key = `board:leaderboard:${JSON.stringify(params)}`;
  return memoize(key, 300, () => _getLeaderboard(params));
}

export const getHallOfSignal = unstable_cache(
  _getHallOfSignal,
  ["hall-of-signal"],
  { revalidate: 300, tags: ["board"] },
);

export const getClassDistribution = unstable_cache(
  _getClassDistribution,
  ["class-distribution"],
  { revalidate: 300, tags: ["board"] },
);

export const getMetricLeaders = unstable_cache(
  _getMetricLeaders,
  ["metric-leaders"],
  { revalidate: 300, tags: ["board"] },
);

export const getHomepageStats = unstable_cache(
  _getHomepageStats,
  ["homepage-stats"],
  { revalidate: 300, tags: ["board"] },
);

export const getOnlineHourly = unstable_cache(
  _getOnlineHourly,
  ["online-hourly"],
  { revalidate: 300, tags: ["board"] },
);

export const getOnlineWeekly = unstable_cache(
  _getOnlineWeekly,
  ["online-weekly"],
  { revalidate: 300, tags: ["board"] },
);

export const getOnlineByCountry = unstable_cache(
  _getOnlineByCountry,
  ["online-by-country"],
  { revalidate: 300, tags: ["board"] },
);

// ── Operator-tagged reads (revalidate: 120s) ─────────────────────────────

export const getOperator = unstable_cache(_getOperator, ["operator"], {
  revalidate: 120,
  tags: ["operator"],
});

export const getOperatorSubmissions = unstable_cache(
  _getOperatorSubmissions,
  ["operator-submissions"],
  { revalidate: 120, tags: ["operator"] },
);

export const getOperatorHistory = unstable_cache(
  _getOperatorHistory,
  ["operator-history"],
  { revalidate: 120, tags: ["operator"] },
);

export const getOperatorReport = unstable_cache(
  _getOperatorReport,
  ["operator-report"],
  { revalidate: 120, tags: ["operator"] },
);

export const getOperatorRecords = unstable_cache(
  _getOperatorRecords,
  ["operator-records"],
  { revalidate: 300, tags: ["board"] },
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
