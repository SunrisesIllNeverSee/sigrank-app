import type { LeaderboardRow } from "./types";

export function isPublishedBoardRow(row: LeaderboardRow): boolean {
  return !row.operator.isPlaceholder && row.operator.status !== "retired"
    && !row.pending && row.global_rank > 0;
}
