/**
 * lib/board/selection.ts — the board's "which snapshot rows does the page keep"
 * rule, as pure functions. Added 2026-11-14 for the Supabase egress block.
 *
 * Two implementations of the SAME rule live here so a test can prove parity:
 *
 *   selectLegacy()   — what getLeaderboard has always done: take EVERY
 *                      metric_snapshots row, filter, then collapse in JS
 *                      (pickPerKey ladder in mappers.ts). Used by the
 *                      default (flag OFF) path and by mode=hitl|agentic|hybrid.
 *   selectSqlModel() — a faithful JS model of the SQL in
 *                      migration 0059 (branch feat/board-selection-migration)
 *                      (board_candidates / board_pick_snapshots /
 *                      board_operator_platforms). The flag-ON path asks the
 *                      database for exactly these rows instead of all of them.
 *
 * boardSelectionArgs() is the single translation from BoardParams to the SQL
 * arguments, shared by the live caller and the model.
 *
 * Pure + dependency-light: no Supabase, no Next.
 */

import { includesBoardMode, resolveWorkflowMode } from "./workflow-mode";
import { filterToWindow, boardWindowByEnum } from "./windows";
import {
  latestPerOperator,
  latestPerOperatorPlatform,
  num,
  operatorTotalCollapse,
  type BoardParams,
  type DbMetricSnapshot,
} from "./mappers";

/** The All board's row rule (mirrors compute_board_ranks, migration 0028):
 *  input and output present and positive. Workflow mode is a VIEW filter,
 *  never an eligibility filter. SQL twin: `input_tokens > 0 AND output_tokens > 0`. */
export function isBoardEligible(s: DbMetricSnapshot): boolean {
  return s.input_tokens != null && s.input_tokens > 0 &&
    s.output_tokens != null && s.output_tokens > 0;
}

export function resolvedModeForSnapshot(s: DbMetricSnapshot) {
  if (s.input_tokens == null || s.output_tokens == null ||
      s.cache_creation_tokens == null || s.cache_read_tokens == null ||
      s.input_tokens <= 0 || s.output_tokens <= 0) return null;
  return resolveWorkflowMode({
    inputTokens: num(s.input_tokens), outputTokens: num(s.output_tokens),
    cacheWriteTokens: num(s.cache_creation_tokens), cacheReadTokens: num(s.cache_read_tokens),
    assessment: s.workflow_mode, evidenceUrl: s.workflow_evidence_url,
  });
}

/** Collapse level: one row per operator, or one per (operator, platform). */
export type SelectionLevel = "operator" | "platform";

/** Arguments of the SQL functions (p_* names), derived from BoardParams. */
export interface BoardSelectionArgs {
  p_level: SelectionLevel;
  p_prefer_window: string | null;
  p_window_filter: boolean;
  /** days + buffer of the window, null for all-time / unknown window (no recency). */
  p_max_age_days: number | null;
}

export function boardSelectionArgs(params: BoardParams): BoardSelectionArgs {
  const win = params.window ? boardWindowByEnum(params.window) : undefined;
  return {
    // operatorTotal and the default board both keep one row per operator.
    p_level: params.perPlatform && !params.operatorTotal ? "platform" : "operator",
    p_prefer_window: params.window ? params.window : null,
    p_window_filter: !!(params.windowFilter && params.window),
    p_max_age_days: win && win.days != null ? win.days + win.buffer : null,
  };
}

/**
 * Can the SQL selection serve these params? The workflow-mode filters
 * (hitl / agentic / hybrid) decide row INCLUSION from a JS-only resolver
 * before the collapse, and allSnapshots keeps every row — both stay on the
 * legacy path. mode "all" never filters, so it is served from SQL.
 */
export function canUseDbSelection(params: BoardParams): boolean {
  if (params.allSnapshots) return false;
  if (params.mode && params.mode !== "all") return false;
  return true;
}

export interface SnapshotSelection {
  /** The rows the board keeps, in the order getLeaderboard builds rows from. */
  snapRows: DbMetricSnapshot[];
  /** operatorTotal only: distinct submitted platforms per operator. */
  platformsByOperator: Map<string, string[]> | null;
}

/** The pre-egress-fix pipeline, moved verbatim out of getLeaderboard. */
export function selectLegacy(
  allSnaps: DbMetricSnapshot[],
  params: BoardParams,
): SnapshotSelection {
  const windowed =
    params.windowFilter && params.window
      ? filterToWindow(allSnaps, params.window)
      : allSnaps;
  const yieldable = windowed.filter(isBoardEligible);
  const boardCandidates = params.mode
    ? yieldable.filter((s) => includesBoardMode(params.mode!, resolvedModeForSnapshot(s)))
    : yieldable;
  let platformsByOperator: Map<string, string[]> | null = null;
  let snapRows: DbMetricSnapshot[];
  if (params.allSnapshots) {
    snapRows = boardCandidates;
  } else if (params.operatorTotal) {
    const collapsed = operatorTotalCollapse(boardCandidates, params.window);
    platformsByOperator = collapsed.platformsByOperator;
    snapRows = [...collapsed.byOperator.values()];
  } else if (params.perPlatform) {
    snapRows = [...latestPerOperatorPlatform(boardCandidates, params.window).values()];
  } else {
    snapRows = [...latestPerOperator(boardCandidates, params.window).values()];
  }
  return { snapRows, platformsByOperator };
}

// ───────────────────────────────────────────────────────────────────────────
// JS model of the SQL. Mirrors the migration clause by clause.
// ───────────────────────────────────────────────────────────────────────────

/** SQL: board_candidates(). Eligible rows, plus the window filter + recency. */
function sqlCandidates(
  all: readonly DbMetricSnapshot[],
  a: BoardSelectionArgs,
  operatorIds: ReadonlySet<string> | null,
): DbMetricSnapshot[] {
  // ref = max snapshot_date among the window's rows, BEFORE the eligibility and
  // operator restriction (filterToWindow computes it over every window row).
  let ref: string | null = null;
  if (a.p_window_filter && a.p_prefer_window != null) {
    for (const r of all) {
      if (r.window_type === a.p_prefer_window && (ref == null || r.snapshot_date > ref)) {
        ref = r.snapshot_date;
      }
    }
  }
  const DAY = 86_400_000;
  const dayNum = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`) / DAY;
  return all.filter((m) => {
    if (operatorIds && !operatorIds.has(m.operator_id)) return false;
    if (!isBoardEligible(m)) return false;
    if (a.p_window_filter && a.p_prefer_window != null) {
      if (m.window_type !== a.p_prefer_window) return false;
      if (a.p_max_age_days != null && ref != null &&
          dayNum(ref) - dayNum(m.snapshot_date) > a.p_max_age_days) return false;
    }
    return true;
  });
}

/** SQL ORDER BY: later date first; same date → larger id first; NULL id last. */
function newerFirst(x: DbMetricSnapshot, y: DbMetricSnapshot): number {
  if (x.snapshot_date !== y.snapshot_date) return x.snapshot_date > y.snapshot_date ? -1 : 1;
  const xi = x.metric_snapshot_id ?? null;
  const yi = y.metric_snapshot_id ?? null;
  if (xi === yi) return 0;
  if (xi === null) return 1;
  if (yi === null) return -1;
  return xi > yi ? -1 : 1;
}

/** SQL: board_pick_snapshots() — DISTINCT ON the key, ladder bucket first. */
function sqlPick(
  cands: readonly DbMetricSnapshot[],
  a: BoardSelectionArgs,
): DbMetricSnapshot[] {
  const bucket = (r: DbMetricSnapshot) =>
    (a.p_prefer_window != null && r.window_type === a.p_prefer_window ? 0 : 2) +
    (r.platform === "multi" ? 0 : 1);
  const keyOf = (r: DbMetricSnapshot) =>
    a.p_level === "platform" ? `${r.operator_id}|${r.platform ?? "∅"}` : r.operator_id;
  const best = new Map<string, DbMetricSnapshot>();
  for (const r of cands) {
    const k = keyOf(r);
    const cur = best.get(k);
    if (!cur) { best.set(k, r); continue; }
    const d = bucket(r) - bucket(cur);
    if (d < 0 || (d === 0 && newerFirst(r, cur) < 0)) best.set(k, r);
  }
  return [...best.values()].sort(newerFirst);
}

/** SQL: board_operator_platforms() — distinct non-empty platforms per operator,
 *  newest submission first (platform name breaks date ties). */
function sqlPlatforms(cands: readonly DbMetricSnapshot[]): Map<string, string[]> {
  const last = new Map<string, Map<string, string>>(); // op -> platform -> max date
  for (const r of cands) {
    const p = r.platform;
    if (p == null || p === "") continue;
    let m = last.get(r.operator_id);
    if (!m) last.set(r.operator_id, (m = new Map()));
    const cur = m.get(p);
    if (cur == null || r.snapshot_date > cur) m.set(p, r.snapshot_date);
  }
  const out = new Map<string, string[]>();
  for (const [op, m] of last) {
    out.set(
      op,
      [...m.entries()]
        .sort((x, y) => (x[1] === y[1] ? (x[0] < y[0] ? -1 : 1) : x[1] > y[1] ? -1 : 1))
        .map(([p]) => p),
    );
  }
  return out;
}

/** Model of the SQL function board_pick_snapshots(). */
export function modelBoardPickSnapshots(
  all: readonly DbMetricSnapshot[],
  a: BoardSelectionArgs,
  operatorIds: ReadonlySet<string> | null = null,
): DbMetricSnapshot[] {
  return sqlPick(sqlCandidates(all, a, operatorIds), a);
}

/** Model of the SQL function board_operator_platforms(). */
export function modelBoardOperatorPlatforms(
  all: readonly DbMetricSnapshot[],
  a: BoardSelectionArgs,
  operatorIds: ReadonlySet<string> | null = null,
): Map<string, string[]> {
  return sqlPlatforms(sqlCandidates(all, a, operatorIds));
}

/** The flag-ON selection, modeled in JS over the full table. `operatorIds`
 *  models p_operator_ids (the claimed-operator restriction). */
export function selectSqlModel(
  allSnaps: DbMetricSnapshot[],
  params: BoardParams,
  operatorIds: ReadonlySet<string> | null = null,
): SnapshotSelection {
  const a = boardSelectionArgs(params);
  return {
    snapRows: modelBoardPickSnapshots(allSnaps, a, operatorIds),
    platformsByOperator: params.operatorTotal
      ? modelBoardOperatorPlatforms(allSnaps, a, operatorIds)
      : null,
  };
}
