"use client";

/**
 * components/history/HistoryIsland.tsx — /board/history inside the workspace
 * shell. Stage = the July 31 table; left = mini profile of the selected row;
 * right = historical-only compare. State is local (the route stays static).
 */

import { useState, useSyncExternalStore } from "react";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { HistoricalLeaderboardTable } from "./legacy/LeaderboardTable";
import { HistoryHeader, HistoryTitleControls } from "./HistoryHeader";
import { MiniProfile } from "./MiniProfile";
import { ComparePanel } from "./ComparePanel";
import type { HistoricalBoard, HistoricalEntry } from "@/lib/history/types";
import "./history-island.css";

/* At ≤1050px the shell collapses both side panels (phones move the left one
   into the menu drawer), so a row tap must open the right panel / Details
   sheet, which then carries the mini profile above compare. */
const COMPACT_MQ = "(max-width: 1050px)";
function subscribeCompact(cb: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(COMPACT_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function useCompact(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(COMPACT_MQ).matches : false),
    () => false,
  );
}

export type CompareSlots = [HistoricalEntry | null, HistoricalEntry | null];

export function HistoryIsland({ board }: { board: HistoricalBoard }) {
  const [selected, setSelected] = useState<HistoricalEntry | null>(null);
  const [compare, setCompare] = useState<CompareSlots>([null, null]);
  const compact = useCompact();
  const [sheetSignal, setSheetSignal] = useState(0);

  const select = (e: HistoricalEntry) => {
    setSelected(e);
    if (compact) setSheetSignal((n) => n + 1);
  };

  /** Fills A, then B; a third add replaces B. */
  const addToCompare = (e: HistoricalEntry) =>
    setCompare(([a, b]) => (a == null ? [e, b] : a.codename === e.codename ? [a, b] : [a, e]));
  const clearCompare = (slot: 0 | 1) =>
    setCompare((c) => (slot === 0 ? [null, c[1]] : [c[0], null]));
  const pickCompare = (slot: 0 | 1, e: HistoricalEntry) =>
    setCompare((c) => (slot === 0 ? [e, c[1]] : [c[0], e]));

  return (
    <WorkspaceShell
      active="board"
      title="Historical Leaderboard"
      titleControls={<HistoryTitleControls meta={board.meta} />}
      leftTitle="OPERATOR · JULY 31"
      left={<MiniProfile entry={selected} onAddToCompare={addToCompare} />}
      rightTitle={compact ? "OPERATOR · COMPARE" : "COMPARE"}
      right={
        <>
          {compact ? <MiniProfile entry={selected} onAddToCompare={addToCompare} /> : null}
          <ComparePanel slots={compare} entries={board.entries} onPick={pickCompare} onClear={clearCompare} />
        </>
      }
      rightOpenSignal={sheetSignal}
      status={<>JULY 31, 2026 SNAPSHOT · {board.meta.totalOperators.toLocaleString("en-US")} OPERATORS · ARCHIVE</>}
    >
      <div className="hist-island">
        <HistoryHeader meta={board.meta} />
        <HistoricalLeaderboardTable
          entries={board.entries}
          totalUsers={board.meta.totalOperators}
          onSelect={select}
          selectedCodename={selected?.codename}
        />
      </div>
    </WorkspaceShell>
  );
}

export default HistoryIsland;
