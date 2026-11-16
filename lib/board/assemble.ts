/**
 * lib/board/assemble.ts — turn the chosen snapshot rows + operators + ranks
 * into LeaderboardRows (join, filter, sort, re-rank, limit). Pure.
 *
 * Moved verbatim out of getLeaderboard (2026-11-14, egress fix) so the legacy
 * path and the DB-selection path run the SAME row builder; the parity test
 * feeds both selections through it.
 */

import { SORT_DEFAULT } from "@/lib/constants";
import { tierOf } from "@/components/sigrank/types";
import type { LeaderboardRow } from "@/lib/board/types";
import type { WorkflowMode } from "@/lib/board/workflow-mode";
import { sortValue } from "@/lib/board/fallback";
import {
  applySnapshotRollups,
  mapOperator,
  mapSnapshot,
  telemetryFromSnapshot,
  type BoardParams,
  type DbMetricSnapshot,
  type DbOperator,
} from "@/lib/board/mappers";
import { resolvedModeForSnapshot } from "@/lib/board/selection";

/**
 * A LeaderboardRow carrying the operator's distinct submitted-platform SET — only
 * populated on the `operatorTotal` board path (BOARD redesign, 2026-06-27), where a
 * single total row stands in for an operator who may have run claude + codex + multi.
 * The UI badges this set ("claude·codex·multi"). It's a structural superset of
 * LeaderboardRow so a `LeaderboardRowWithPlatforms[]` is assignable to a
 * `LeaderboardRow[]` and the optional field is read back via to-entry's local cast.
 */
export interface LeaderboardRowWithPlatforms extends LeaderboardRow {
  /** Distinct platforms the operator submitted, e.g. ['claude','codex','multi']. */
  platforms?: string[];
}

export function assembleLeaderboard(
  snapRows: DbMetricSnapshot[],
  platformsByOperator: Map<string, string[]> | null,
  opById: Map<string, DbOperator>,
  pctById: Map<string, number>,
  params: BoardParams,
): LeaderboardRowWithPlatforms[] {
  const modeOf = (snap: DbMetricSnapshot): WorkflowMode | null =>
    params.mode && snap.metric_snapshot_id
      ? resolvedModeForSnapshot(snap)
      : null;
  let rows: LeaderboardRowWithPlatforms[] = [];
  for (const snap of snapRows) {
    const op = opById.get(snap.operator_id);
    if (!op) continue;
    // operatorTotal: the distinct platforms this operator submitted (for the UI
    // multi-platform badge). Only attached on the operatorTotal path; other paths
    // leave `platforms` undefined (the per-row platform column is the source there).
    const platforms = platformsByOperator?.get(snap.operator_id);
    rows.push({
      operator: applySnapshotRollups(mapOperator(op), snap),
      snapshot: mapSnapshot(snap),
      source_submission_id: snap.source_submission_id ?? null,
      window_start: snap.window_start ?? null,
      window_end: snap.window_end ?? null,
      workflow_mode: params.mode ? modeOf(snap) : snap.workflow_mode ?? null,
      workflow_evidence_url: snap.workflow_evidence_url ?? null,
      workflow_mode_version: snap.workflow_mode_version ??
        (params.mode && modeOf(snap) === "hitl" ? "hcm-v1" : null),
      mode_assessed_at: snap.mode_assessed_at ?? null,
      global_rank: 0, // recomputed after sort
      percentile: pctById.get(snap.operator_id) ?? 0,
      telemetry: telemetryFromSnapshot(snap),
      window_type: snap.window_type ?? null,
      platform: snap.platform ?? op.primary_domain ?? null,
      snapshot_date: snap.snapshot_date ?? null,
      ...(platforms && platforms.length > 0 ? { platforms } : {}),
    });
  }
  // Honest empty (mirrors the snapRows guard): if operators didn't resolve for
  // the windowed snapshots (e.g. RLS divergence on an anon-key deploy), the
  // board is empty rather than fabricated mock seeds.
  if (rows.length === 0) return [];

  // Apply the same filter → sort → re-rank → limit pipeline as the mock path.
  // Filter on the row's platform (snapshot.platform, falling back to
  // primary_domain) — NOT operator.primary_domain alone. This way operators
  // who submitted on codex/multi/pi appear under those platform filters even
  // if their primary_domain is "claude" or "other".
  // claimedOnly (2026-09-27): drop unclaimed operators before re-rank so
  // global_rank is contiguous over the displayed set (claimed ops only) —
  // the same basis the profile rank uses.
  if (params.claimedOnly) rows = rows.filter((r) => r.operator.claimed);
  if (params.platform && params.platform !== "all") {
    rows = rows.filter(
      (r) =>
        (r.platform ?? r.operator.primary_domain)?.toLowerCase() ===
        params.platform!.toLowerCase(),
    );
  }
  if (params.classScope && params.classScope !== "all") {
    const scope = params.classScope!.toLowerCase();
    rows = rows.filter(
      (r) => tierOf(r.snapshot.class_tier).toLowerCase() === scope,
    );
  }
  const sort = params.sort ?? SORT_DEFAULT;
  rows.sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
  rows = rows.map((r, i) => ({ ...r, global_rank: i + 1 }));
  // claimedOnly: derive percentile over the same displayed set so the p-chip
  // agrees with the rank column (rank_history's percentile counts a wider
  // population — every op with a 30d snapshot — and disagrees).
  if (params.claimedOnly) {
    const n = rows.length;
    rows = rows.map((r) => ({
      ...r,
      percentile:
        n > 1
          ? Math.round(((n - r.global_rank) / (n - 1)) * 100 * 100) / 100
          : 100,
    }));
  }
  if (params.limit && params.limit > 0) rows = rows.slice(0, params.limit);
  return rows;
}
