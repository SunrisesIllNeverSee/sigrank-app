/**
 * components/profile-v2/WorkflowMark.tsx — distinguishable workflow symbols
 * with readable labels (owner checklist item 12).
 *
 * Three resolved modes + the unresolved review state, matching the board's
 * presentation vocabulary. Custom inline-SVG marks keyed to the hexagon
 * medallion language (no emoji/icon font):
 *
 *   hitl    → OITL  OPERATOR-IN-THE-LOOP — operator bust closing the loop
 *             ring (arrowhead marks the human completing the circuit)
 *   agentic → AUTO  AUTOMATED — hexagonal chassis + bolt core + circuit
 *             nodes (verified automation only; requires HTTPS evidence)
 *   hybrid  → HYBRID — hexagon split down the seam: person half / bolt half
 *   null    → REVIEW UNRESOLVED — dashed hexagon + scan tick; a review
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
  size?: "tag" | "full";
}

function OitlGlyph() {
  // Person-in-loop: operator bust with the loop closing around them —
  // arrowhead marks the human completing the circuit.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.4a8.6 8.6 0 1 0 8.6 8.6" />
      <path d="M17.4 3.2 20.6 3.6l-.4 3.2" />
      <circle cx="12" cy="10.4" r="2.7" fill="currentColor" stroke="none" />
      <path d="M7.6 17.4a4.9 4.9 0 0 1 8.8 0" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AutoGlyph() {
  // Agent: hexagonal chassis + bolt core + circuit nodes — machine-built.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <path d="M12 2.6 20.2 7.4v9.2L12 21.4 3.8 16.6V7.4z" />
      <path d="M12.9 6.8 9.7 12.4h2.3l-.9 4.8 4.2-6.6h-2.4l1.4-3.8z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="2.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="20.2" cy="7.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="20.2" cy="16.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="21.4" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.8" cy="16.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.8" cy="7.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HybridGlyph() {
  // Split hexagon — left half person (operator arc), right half bolt (agent).
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <path d="M12 2.6 20.2 7.4v9.2L12 21.4 3.8 16.6V7.4z" />
      <path d="M12 2.6v18.8" strokeDasharray="2.2 2.4" opacity="0.7" />
      <circle cx="8.4" cy="10" r="1.9" fill="currentColor" stroke="none" />
      <path d="M5.2 15.6a3.5 3.5 0 0 1 6.4 0" fill="currentColor" stroke="none" />
      <path d="M16.6 7.2 14.1 12h1.7l-.7 3.6 3.2-5h-1.8l1.2-3.4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ReviewGlyph() {
  // Unresolved: dashed hexagon + scan beam — a candidate under review,
  // never presented as verified automation.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6 20.2 7.4v9.2L12 21.4 3.8 16.6V7.4z" strokeDasharray="3.4 3" />
      <path d="M8 13.6l2.6 2.6L16.4 10" opacity="0.9" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
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
