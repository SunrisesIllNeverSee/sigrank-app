/**
 * components/profile-v2/WorkflowMark.tsx — distinguishable workflow symbols
 * with readable labels (owner checklist item 12).
 *
 * Three resolved modes + the unresolved review state, matching the board's
 * presentation vocabulary. Custom inline-SVG loop/head motifs independent of hex medallions (no emoji/icon font):
 *
 *   hitl    → OITL  OPERATOR-IN-THE-LOOP — operator checkpoint loop
 *             ring (arrowhead marks the human completing the circuit)
 *   agentic → AUTO  AUTOMATED — robot head in continuous cycle + circuit
 *             nodes (verified automation only; requires HTTPS evidence)
 *   hybrid  → HYBRID — dual human/machine continuous loop: person half / bolt half
 *   null    → REVIEW UNRESOLVED — dashed question loop; a review
 *             candidate, never presented as verified automation
 *
 * Pure render — safe for server components. The glyph is drawn inline so it
 * matches the pixel-type aesthetic without an icon font.
 */

import type { ReactElement } from "react";
import type { WorkflowMode } from "@/lib/board/workflow-mode";

interface WorkflowMarkProps {
  mode: WorkflowMode | null;
  /** "tag" = hero/sidebar chip (glyph + short label);
   *  "full" = larger mark with glyph + short + full label (rail module). */
  size?: "tag" | "full" | "icon";
}

function OitlGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6a9.4 9.4 0 1 0 9.4 9.4" strokeDasharray="7 2.5" />
      <path d="M17 2.8 21.2 3.4l-.4 4.1" />
      <path d="M3 12h3M18 12h3" strokeWidth="2.6" />
      <circle cx="12" cy="9" r="2.3" fill="currentColor" stroke="none" />
      <path d="M7.7 16.7a4.8 4.8 0 0 1 8.6 0" />
    </svg>
  );
}

function AutoGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1.9a10.1 10.1 0 1 1-8.8 5.2" />
      <path d="M2.6 4.1v4h4" />
      <rect x="6.5" y="7.8" width="11" height="9.4" rx="2.5" />
      <path d="M12 5.4v2.4M8 20h8" />
      <circle cx="9.5" cy="12.1" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.1" r="1" fill="currentColor" stroke="none" />
      <path d="M10 15h4" />
    </svg>
  );
}

function HybridGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6a9.4 9.4 0 1 0 9.4 9.4" strokeDasharray="7 2.5" />
      <path d="M17.3 3.3 21.4 3.4l-.7 4.1M12 3v18" strokeDasharray="2 2" />
      <circle cx="8.5" cy="10" r="1.8" fill="currentColor" stroke="none" />
      <path d="M5.2 15.4c.8-2.8 5.6-2.8 6.4 0" />
      <rect x="13.6" y="9" width="6.2" height="6.5" rx="1.3" />
      <path d="M16.7 7.6V9" />
      <circle cx="15.4" cy="12" r=".65" fill="currentColor" stroke="none" />
      <circle cx="18.1" cy="12" r=".65" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ReviewGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeDasharray="2.6 3" />
      <path d="M9 9a3 3 0 1 1 4.8 2.4c-1.7 1.2-1.8 1.8-1.8 2.5" />
      <circle cx="12" cy="17.4" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

const MARKS: Record<string, { glyph: () => ReactElement; short: string; full: string; cls: string }> = {
  hitl: { glyph: OitlGlyph, short: "OITL", full: "OPERATOR-IN-THE-LOOP", cls: "wfm--oitl" },
  agentic: { glyph: AutoGlyph, short: "AUTO", full: "AUTOMATED", cls: "wfm--auto" },
  hybrid: { glyph: HybridGlyph, short: "HYBRID", full: "HYBRID", cls: "wfm--hybrid" },
  review: { glyph: ReviewGlyph, short: "REVIEW", full: "UNRESOLVED · REVIEW", cls: "wfm--review" },
};

export function WorkflowMark({ mode, size = "tag" }: WorkflowMarkProps) {
  const m = MARKS[mode ?? "review"];
  const Glyph = m.glyph;
  if (size === "icon") return <span className={`wfm wfm--icon ${m.cls}`} title={m.full}
    aria-label={m.full} style={{display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 4}}>
    <Glyph />
  </span>;
  if (size === "full") {
    return (
      <span className={`wfm wfm--full ${m.cls}`}>
        <span className="wfm-glyph"><Glyph /></span>
        <span className="wfm-txt">
          <b>{m.short}</b>
          <i>{m.full}</i>
        </span>
      </span>
    );
  }
  return (
    <span className={`wfm ${m.cls}`} title={m.full}>
      <span className="wfm-glyph"><Glyph /></span>
      {m.short}
    </span>
  );
}
