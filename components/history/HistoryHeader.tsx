/**
 * components/history/HistoryHeader.tsx — snapshot identity for /board/history:
 * date, operator count, ARCHIVE · FROZEN badge, source fingerprint, explainer.
 */

import Link from "next/link";
import type { HistoricalBoard } from "@/lib/history/types";

const REPO = "https://github.com/SunrisesIllNeverSee/sigrank-app";

export function HistoryTitleControls({ meta }: { meta: HistoricalBoard["meta"] }) {
  return (
    <span className="hist-title-meta">
      <span>Snapshot: July 31, 2026</span>
      <span aria-hidden>·</span>
      <span>{meta.totalOperators.toLocaleString("en-US")} operators</span>
      <span className="hist-badge">ARCHIVE · FROZEN</span>
    </span>
  );
}

export function HistoryHeader({ meta }: { meta: HistoricalBoard["meta"] }) {
  return (
    <div className="hist-header">
      <p className="hist-explainer">
        This is the original SigRank board, built from seeded public tokscale numbers and frozen on
        July 31, 2026. It is an archive and is never updated. Today&apos;s{" "}
        <Link href="/board/all">leaderboard</Link> is made of operators who submit their own data.
      </p>
      <p className="hist-fingerprint">
        Source:{" "}
        <a href={`${REPO}/commit/${meta.sourceCommit}`} rel="noopener noreferrer" target="_blank">
          commit {meta.sourceCommit.slice(0, 8)}
        </a>{" "}
        · blob {meta.gitBlob.slice(0, 8)} · {meta.seeded.toLocaleString("en-US")} seeded ·{" "}
        {meta.real} real
      </p>
    </div>
  );
}
