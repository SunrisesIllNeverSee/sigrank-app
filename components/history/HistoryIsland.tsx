"use client";

/**
 * components/history/HistoryIsland.tsx — /board/history inside the workspace
 * shell. Stage = the July 31 table; left = mini profile of the selected row;
 * right = historical-only compare. State is local (the route stays static).
 */

import { useState } from "react";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { HistoricalLeaderboardTable } from "./legacy/LeaderboardTable";
import { HistoryHeader, HistoryTitleControls } from "./HistoryHeader";
import { MiniProfile } from "./MiniProfile";
import type { HistoricalBoard, HistoricalEntry } from "@/lib/history/types";
import "./history-island.css";

export type CompareSlots = [HistoricalEntry | null, HistoricalEntry | null];

export function HistoryIsland({ board }: { board: HistoricalBoard }) {
  const [selected, setSelected] = useState<HistoricalEntry | null>(null);
  const [compare, setCompare] = useState<CompareSlots>([null, null]);

  /** Fills A, then B; a third add replaces B. */
  const addToCompare = (e: HistoricalEntry) =>
    setCompare(([a, b]) => (a == null ? [e, b] : a.codename === e.codename ? [a, b] : [a, e]));
  const clearCompare = (slot: 0 | 1) =>
    setCompare((c) => (slot === 0 ? [null, c[1]] : [c[0], null]));
  void clearCompare;

  return (
    <WorkspaceShell
      active="board"
      title="Historical Leaderboard"
      titleControls={<HistoryTitleControls meta={board.meta} />}
      leftTitle="OPERATOR · JULY 31"
      left={<MiniProfile entry={selected} onAddToCompare={addToCompare} />}
      status={<>JULY 31, 2026 SNAPSHOT · {board.meta.totalOperators.toLocaleString("en-US")} OPERATORS · ARCHIVE</>}
    >
      <div className="hist-island">
        <HistoryHeader meta={board.meta} />
        <HistoricalLeaderboardTable
          entries={board.entries}
          totalUsers={board.meta.totalOperators}
          onSelect={setSelected}
          selectedCodename={selected?.codename}
        />
      </div>
    </WorkspaceShell>
  );
}

export default HistoryIsland;
