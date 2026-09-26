/**
 * lib/data/fallback.ts — the no-DB / DB-error fallback path.
 *
 * Every facade function (lib/data/queries.ts) degrades to this layer when there
 * are no Supabase creds or a query throws, so the app always builds + renders.
 * The fallback base is the build-time cold-store snapshot (a recent REAL copy of
 * the live board) when present, else the hand-authored mock seeds — never blank.
 *
 * Built by reusing the SAME mappers as the live DB path so fallback rows are
 * shape-identical to live rows. Part of the lib/data split: mappers ← fallback ←
 * queries ← index (barrel). Consumers still import via `@/lib/data`.
 */

import { SORT_DEFAULT } from "@/lib/constants";
import { filterToWindow } from "@/lib/board/windows";
import coldStore from "@/lib/board/snapshot.json";
import { MOCK_LEADERBOARD } from "@/lib/board/mock";
import type { LeaderboardRow } from "@/lib/board/types";
import { tierOf } from "@/components/sigrank/types";
import {
  type BoardParams,
  type DbMetricSnapshot,
  type DbOperator,
  latestPerOperator,
  mapOperator,
  mapSnapshot,
  telemetryFromSnapshot,
} from "@/lib/board/mappers";
import { isLiveBoardOperator } from "@/lib/board/live";

/**
 * Cold-store fallback base (owner 2026-06-20). The build-time snapshot.json is a
 * recent REAL copy of the live board (scripts/snapshot-db.mjs, run 1–2×/day). When
 * present + non-empty it is the fallback's data source — so a DB blip serves real,
 * recent data instead of the hand-authored mock. The mock remains the last-resort
 * default if the snapshot is empty/absent (graceful degradation, never blank).
 *
 * Built once (module load) by reusing the SAME mappers as the live DB path
 * (mapOperator / mapSnapshot / telemetryFromSnapshot) so cold-store rows are
 * shape-identical to live rows. Ranking is recomputed per query in filterMockBoard.
 */
const COLD_STORE_ROWS: LeaderboardRow[] = (() => {
  try {
    // The snapshot is a PARTIAL DB shape (script selects only the columns the
    // mappers read; mapOperator/mapSnapshot coalesce the rest with ?? null), so
    // cast through unknown — the mappers are the contract, not the JSON's literal type.
    const store = coldStore as unknown as {
      operators?: DbOperator[];
      metric_snapshots?: DbMetricSnapshot[];
    };
    const ops = store.operators ?? [];
    const snaps = store.metric_snapshots ?? [];
    if (!ops.length || !snaps.length) return [];
    const opById = new Map(ops.map((o) => [o.operator_id, o]));
    // Deduplicate: same as latestPerOperator on the live path — one row per
    // operator_id (first encountered, which is the most-recent after DB ordering).
    // Without this, a snapshot.json with both '30d' + 'all_time' rows per operator
    // produces duplicate leaderboard entries. (Bug: COLD_STORE_ROWS was iterating
    // all snaps blindly; latestPerOperator was only called on the live DB path.)
    const latestSnap = latestPerOperator(snaps);
    const rows: LeaderboardRow[] = [];
    for (const [, snap] of latestSnap) {
      const op = opById.get(snap.operator_id);
      if (!op) continue;
      rows.push({
        operator: mapOperator(op),
        snapshot: mapSnapshot(snap),
        global_rank: 0,
        percentile: 0,
        telemetry: telemetryFromSnapshot(snap),
        window_type: snap.window_type ?? null,
        platform: snap.platform ?? op.primary_domain ?? null,
        snapshot_date: snap.snapshot_date ?? null,
      });
    }
    return rows;
  } catch {
    return [];
  }
})();

/** The fallback base: cold-store snapshot if we have one, else the mock seeds. */
export function fallbackRows(): LeaderboardRow[] {
  return COLD_STORE_ROWS.length > 0 ? COLD_STORE_ROWS : MOCK_LEADERBOARD;
}

/** The cold-store's capture timestamp (snapshot.json header), for provenance labels. */
export function coldStoreGeneratedAt(): string | null {
  const g = (coldStore as { generated_at?: string | null }).generated_at;
  return typeof g === "string" && g ? g.slice(0, 10) : null;
}

/**
 * Shared board pipeline for the fallback paths: window → LIVE eligibility →
 * platform → class → sort → re-rank → limit. Mirrors the live path's ordering
 * in queries.ts (eligibility before rank/limit) so scope=live means the same
 * thing on both data sources.
 *
 * Returns the ranked rows plus `eligible` — the live-population count measured
 * after eligibility but before user filters (platform/class) and limit; null
 * when params.live isn't set (legacy callers don't pay for the extra count).
 */
function applyBoardFilters(
  base: readonly LeaderboardRow[],
  params: BoardParams,
): { rows: LeaderboardRow[]; eligible: number | null } {
  let rows = [...base];
  // 730: narrow to the window ONLY when the caller opts in (the /board route);
  // legacy callers keep the full field. Mirrors the live path's windowFilter gate.
  if (params.windowFilter && params.window)
    rows = filterToWindow(rows, params.window);
  // LIVE SCOPE (2026-09-26): claimed operators + The Field only, before any
  // user filter/rank/limit — same position as the eligibility filter in
  // queries.ts. The Field is unclaimed but stays (owner-confirmed baseline).
  if (params.live) rows = rows.filter((r) => isLiveBoardOperator(r.operator));
  // Eligible = distinct OPERATORS, not rows — a per-platform breakdown emits
  // several rows per operator, but the live population is counted in people.
  const eligible = params.live
    ? new Set(rows.map((r) => r.operator.operator_id)).size
    : null;
  if (params.platform && params.platform !== "all") {
    rows = rows.filter(
      (r) =>
        (r.platform ?? r.operator.primary_domain)?.toLowerCase() ===
        params.platform!.toLowerCase(),
    );
  }
  if (params.classScope && params.classScope !== "all") {
    const scope = params.classScope!.toLowerCase();
    rows = rows.filter((r) =>
      tierOf(r.snapshot.class_tier).toLowerCase() === scope,
    );
  }
  const sort = params.sort ?? SORT_DEFAULT;
  rows.sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
  // Re-rank within the filtered/sorted view for stable display ranks.
  rows = rows.map((r, i) => ({ ...r, global_rank: i + 1 }));
  if (params.limit && params.limit > 0) rows = rows.slice(0, params.limit);
  return { rows, eligible };
}

export function filterMockBoard(params: BoardParams = {}): LeaderboardRow[] {
  return applyBoardFilters(fallbackRows(), params).rows;
}

/**
 * LIVE-SCOPE fallback (2026-09-26): the cold-store snapshot ONLY — a real,
 * dated copy of the production board. NEVER the hand-authored mock rows: the
 * production live shell must not silently render synthetic operators. An
 * empty/absent cold store yields an honest empty result (callers render the
 * unavailable state, not fabricated data).
 */
export function filterLiveFallbackBoard(
  params: BoardParams = {},
): { rows: LeaderboardRow[]; eligible: number | null; hasStore: boolean } {
  if (COLD_STORE_ROWS.length === 0)
    return { rows: [], eligible: 0, hasStore: false };
  const out = applyBoardFilters(COLD_STORE_ROWS, params);
  return { ...out, hasStore: true };
}

/** Pull a numeric sort value from a row for a given sort key.
 * Extracted to lib/data/sort-value.ts so client components can import it
 * without pulling in 60KB of mock data + cold store. */
import { sortValue } from "@/lib/analytics/sort-value";
export { sortValue };
