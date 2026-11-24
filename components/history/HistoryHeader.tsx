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
      <nav aria-label="Original articles" className="hist-explainer">
        Original articles:{" "}
        <Link href="/blog/volume-isnt-yield" prefetch={false}>Volume Isn&apos;t Yield</Link>
        {" · "}
        <Link href="/blog/the-tool-is-the-person" prefetch={false}>The Tool Is the Person</Link>
        {" · "}
        <Link href="/blog/why-yield-beats-tokenmaxxing" prefetch={false}>Tokenmaxxing, Measured</Link>
        {" · "}
        <Link href="/blog/sigrank-dashboards" prefetch={false}>Interactive Dashboards</Link>
        . Each article retains its own analysis date and comparison population.
      </nav>
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
