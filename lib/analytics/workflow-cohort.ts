/**
 * lib/analytics/workflow-cohort.ts — verified workflow-cohort membership and
 * ranking for the dual rank contexts shown on the operator profile.
 *
 * The cohort rules mirror the live board's workflow filter EXACTLY
 * (components/live/LiveBoardWorkspace.tsx — the wfSel predicate):
 *
 *   hybrid (default board)  → the COMBINED FIELD — every row, no workflow
 *                             exclusion. The combined-field rank is the row's
 *                             global_rank on /board/all.
 *   hitl   (OPERATOR-IN-THE-LOOP) → resolved "hitl" | "hybrid"
 *   agentic (AUTONOMOUS)          → resolved "agentic" | "hybrid" | null
 *                                   (null = unresolved review candidate —
 *                                   legacy outlier, NOT proven autonomy)
 *
 * Cohort rank = position inside the cohort sorted by the board's default sort
 * (yield_ desc, SORT_DEFAULT in lib/constants) — the same ordering that
 * produces global_rank, so both contexts share one verified basis.
 */

import type { LeaderboardRow } from "@/lib/board/types";
import type { WorkflowMode } from "@/lib/board/workflow-mode";

export type WorkflowCohortKey = "hitl" | "agentic";

export interface WorkflowCohortRank {
  /** The operator's resolved mode (null = unresolved review candidate). */
  mode: WorkflowMode | null;
  /** Which presentation cohort they belong to. */
  cohort: WorkflowCohortKey;
  /** Display labels matching the board's pill names. */
  cohortLabel: string;
  cohortShort: string;
  /** Position within the cohort (1-based) sorted by the board default. */
  rank: number | null;
  /** Cohort size — shown as "of N" so the calculation is checkable. */
  size: number;
}

const yieldOf = (r: LeaderboardRow) => r.snapshot.cascade?.yield_ ?? -1;

/** The same membership predicate the board applies when wfSel !== "hybrid". */
export function inCohort(
  wf: WorkflowMode | null,
  cohort: WorkflowCohortKey,
): boolean {
  if (cohort === "hitl") return wf === "hitl" || wf === "hybrid";
  return wf === "agentic" || wf === "hybrid" || wf === null;
}

/**
 * Compute an operator's workflow-cohort rank on the combined field.
 * `boardRows` must be the same claimed, all-time rows the board shows
 * (getLeaderboard window:"all_time", operatorTotal, claimedOnly) so the
 * cohort slice matches what a reader reproduces by clicking the pill.
 */
export function workflowCohortRank(
  boardRows: LeaderboardRow[],
  codename: string,
): WorkflowCohortRank | null {
  const own = boardRows.find((r) => r.operator.codename === codename);
  if (!own) return null;
  const mode = own.workflow_mode ?? null;
  const cohort: WorkflowCohortKey =
    mode === "hitl" || mode === "hybrid" ? "hitl" : "agentic";
  const members = boardRows
    .filter((r) => inCohort(r.workflow_mode ?? null, cohort))
    .sort((a, b) => yieldOf(b) - yieldOf(a));
  const idx = members.findIndex((r) => r.operator.codename === codename);
  return {
    mode,
    cohort,
    cohortLabel: cohort === "hitl" ? "OPERATOR-IN-THE-LOOP" : "AUTONOMOUS",
    cohortShort: cohort === "hitl" ? "OITL" : "AUTO",
    rank: idx >= 0 ? idx + 1 : null,
    size: members.length,
  };
}
