/**
 * app/board/history/page.tsx — the original SigRank board, frozen July 31, 2026.
 *
 * An island inside the workspace shell: the July 31 table renders the
 * byte-identical snapshot in data/history/ (lib/history). Nothing here reads
 * live board data. Static segment, so it takes precedence over
 * app/board/[window]. Spec: docs/superpowers/specs/2026-10-24-historical-board-design.md
 */

import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { getHistoricalBoard } from "@/lib/history/board-2026-07-31";
import { HistoryIsland } from "@/components/history/HistoryIsland";

export const dynamic = "force-static";

export const metadata: Metadata = withOG({
  title: "Historical Leaderboard · July 31, 2026",
  description:
    "The original SigRank leaderboard as frozen on July 31, 2026: 1,642 operators built from seeded public tokscale numbers. An archive, never updated.",
  path: "/board/history",
});

export default function HistoricalBoardPage() {
  return <HistoryIsland board={getHistoricalBoard()} />;
}
