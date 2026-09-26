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
  latestPerOperatorPlatform,
  operatorTotalCollapse,
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
/** Row type extension: operatorTotal-collapse rows carry the operator's
 *  distinct submitted-platform SET (same as the live path in queries.ts). */
type RowWithPlatforms = LeaderboardRow & { platforms?: string[] };

interface ColdStore {
  opById: Map<string, DbOperator>;
  snaps: DbMetricSnapshot[];
}

const COLD_STORE: ColdStore | null = (() => {
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
    if (!ops.length || !snaps.length) return null;
    return { opById: new Map(ops.map((o) => [o.operator_id, o])), snaps };
  } catch {
    return null;
  }
})();

/** Build LeaderboardRows from chosen snapshots (shared by both collapse paths). */
function buildRows(
  snaps: Iterable<DbMetricSnapshot>,
  platformsByOperator?: Map<string, string[]> | null,
): RowWithPlatforms[] {
  if (!COLD_STORE) return [];
  const rows: RowWithPlatforms[] = [];
  for (const snap of snaps) {
    const op = COLD_STORE.opById.get(snap.operator_id);
    if (!op) continue;
    const platforms = platformsByOperator?.get(snap.operator_id);
    rows.push({
      operator: mapOperator(op),
      snapshot: mapSnapshot(snap),
      global_rank: 0,
      percentile: 0,
      telemetry: telemetryFromSnapshot(snap),
      window_type: snap.window_type ?? null,
      platform: snap.platform ?? op.primary_domain ?? null,
      snapshot_date: snap.snapshot_date ?? null,
      ...(platforms && platforms.length > 0 ? { platforms } : {}),
    });
  }
  return rows;
}

const COLD_STORE_ROWS: LeaderboardRow[] = (() => {
  if (!COLD_STORE) return [];
  // Deduplicate: same as latestPerOperator on the live path — one row per
  // operator_id (first encountered, which is the most-recent after DB ordering).
  // Without this, a snapshot.json with both '30d' + 'all_time' rows per operator
  // produces duplicate leaderboard entries.
  return buildRows(latestPerOperator(COLD_STORE.snaps).values());
})();

/**
 * Live-scope cold-store rows — mirrors the live pipeline's ordering exactly:
 * window filter on SNAPSHOTS (before collapse, so a windowed board picks each
 * operator's latest in-window row rather than collapsing to all_time first),
 * then the ghost-row guard, then the same collapse ladder (allSnapshots /
 * operatorTotal / perPlatform / latestPerOperator) with the operator's
 * platform SET attached on the total path.
 */
function liveColdStoreRows(params: BoardParams): RowWithPlatforms[] {
  if (!COLD_STORE) return [];
  const windowed =
    params.windowFilter && params.window
      ? filterToWindow(COLD_STORE.snaps, params.window)
      : COLD_STORE.snaps;
  const yieldable = windowed.filter(
    (s) =>
      s.input_tokens != null &&
      s.input_tokens > 0 &&
      s.output_tokens != null &&
      s.output_tokens > 0,
  );
  let platformsByOperator: Map<string, string[]> | null = null;
  let snapRows: DbMetricSnapshot[];
  if (params.allSnapshots) {
    snapRows = yieldable;
  } else if (params.operatorTotal) {
    const collapsed = operatorTotalCollapse(yieldable);
    platformsByOperator = collapsed.platformsByOperator;
    snapRows = [...collapsed.byOperator.values()];
  } else if (params.perPlatform) {
    snapRows = [...latestPerOperatorPlatform(yieldable).values()];
  } else {
    snapRows = [...latestPerOperator(yieldable).values()];
  }
  return buildRows(snapRows, platformsByOperator);
}

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
  /** True when `base` was already window-filtered at the SNAPSHOT level
   *  (liveColdStoreRows) — the row-level filter would be a redundant second
   *  pass whose recency reference is computed over the collapsed subset. */
  alreadyWindowed = false,
): { rows: LeaderboardRow[]; eligible: number | null } {
  let rows = [...base];
  // 730: narrow to the window ONLY when the caller opts in (the /board route);
  // legacy callers keep the full field. Mirrors the live path's windowFilter gate.
  if (params.windowFilter && params.window && !alreadyWindowed)
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
    // Match the live path (queries.ts): the row's platform, OR the operator's
    // submitted platform SET on operatorTotal rows — a 'multi' row still
    // matches platform=claude when they submitted on claude.
    const want = params.platform.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.platform ?? r.operator.primary_domain)?.toLowerCase() === want ||
        ((r as RowWithPlatforms).platforms?.some(
          (p) => p.toLowerCase() === want,
        ) ?? false),
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
 *
 * Parity with the live path (queries.ts): window filtering happens on
 * snapshots BEFORE the collapse ladder, and breakdown=platforms returns
 * per-(operator,platform) rows — not operator-total-shaped ones.
 */
export function filterLiveFallbackBoard(
  params: BoardParams = {},
): { rows: LeaderboardRow[]; eligible: number | null; hasStore: boolean } {
  if (!COLD_STORE || COLD_STORE.snaps.length === 0)
    return { rows: [], eligible: 0, hasStore: false };
  const out = applyBoardFilters(liveColdStoreRows(params), params, true);
  return { ...out, hasStore: true };
}

/** Pull a numeric sort value from a row for a given sort key.
 * Extracted to lib/data/sort-value.ts so client components can import it
 * without pulling in 60KB of mock data + cold store. */
import { sortValue } from "@/lib/analytics/sort-value";
export { sortValue };
