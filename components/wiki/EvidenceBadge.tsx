/**
 * components/wiki/EvidenceBadge.tsx — visual badge for the evidence maturity level.
 *
 * Renders a compact pill showing the evidence level label + rank. The color
 * follows the evidence-ladder color token. Server component — no client interactivity.
 */

import React from "react";
import { evidenceLevelById } from "@/lib/wiki/evidence-ladder";

interface Props {
  /** The evidence level ID (hypothesized | observed | tested | verified | canonical). */
  level: string;
  /** Optional: show the numeric rank (0-4) alongside the label. Default true. */
  showRank?: boolean;
}

export function EvidenceBadge({ level, showRank = true }: Props) {
  const ev = evidenceLevelById(level);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-bg-border bg-bg-surface px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide"
      title={ev.description}
    >
      {showRank && (
        <span className="tabular-nums text-text-dim">{ev.rank}</span>
      )}
      <span className={ev.color}>{ev.label}</span>
    </span>
  );
}
