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
import { filterToWindow } from "@/lib/data/windows";
import coldStore from "@/lib/data/snapshot.json";
import { MOCK_LEADERBOARD } from "@/lib/data/mock";
import type { LeaderboardRow } from "@/lib/data/types";
import {
  type BoardParams,
  type DbMetricSnapshot,
  type DbOperator,
  latestPerOperator,
  mapOperator,
  mapSnapshot,
  telemetryFromSnapshot,
} from "@/lib/data/mappers";

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

export function filterMockBoard(params: BoardParams = {}): LeaderboardRow[] {
  let rows = [...fallbackRows()];
  // 730: narrow to the window ONLY when the caller opts in (the /board route);
  // legacy callers keep the full field. Mirrors the live path's windowFilter gate.
  if (params.windowFilter && params.window)
    rows = filterToWindow(rows, params.window);
  if (params.platform && params.platform !== "all") {
    rows = rows.filter(
      (r) =>
        r.operator.primary_domain.toLowerCase() ===
        params.platform!.toLowerCase(),
    );
  }
  if (params.classScope && params.classScope !== "all") {
    rows = rows.filter(
      (r) =>
        r.snapshot.class_tier.toLowerCase() ===
        params.classScope!.toLowerCase(),
    );
  }
  const sort = params.sort ?? SORT_DEFAULT;
  rows.sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
  // Re-rank within the filtered/sorted view for stable display ranks.
  rows = rows.map((r, i) => ({ ...r, global_rank: i + 1 }));
  if (params.limit && params.limit > 0) rows = rows.slice(0, params.limit);
  return rows;
}

/** Pull a numeric sort value from a row for a given sort key.
 * Extracted to lib/data/sort-value.ts so client components can import it
 * without pulling in 60KB of mock data + cold store. */
import { sortValue } from "@/lib/data/sort-value";
export { sortValue };
