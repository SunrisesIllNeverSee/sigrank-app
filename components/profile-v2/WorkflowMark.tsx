/**
 * components/profile-v2/WorkflowMark.tsx — distinguishable workflow symbols
 * with readable labels (owner checklist item 12).
 *
 * Three resolved modes + the unresolved review state, matching the board's
 * presentation vocabulary:
 *
 *   hitl    → ◉ OITL  OPERATOR-IN-THE-LOOP — person glyph inside a loop ring
 *   agentic → ⌬ AUTO  AUTOMATED — hexagonal agent body with a bolt (verified
 *             automation only; requires HTTPS evidence)
 *   hybrid  → ◈ HYBRID assessed hybrid — two interlocked half-marks
 *   null    → ◌ REVIEW UNRESOLVED — dashed ring; a review candidate, never
 *             presented as verified automation
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
  // Person-in-loop: head + shoulders centered inside a broken ring.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <circle cx="12" cy="10" r="3" fill="currentColor" stroke="none" />
      <path d="M7.5 17a5 5 0 0 1 9 0" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AutoGlyph() {
  // Agent: hex body + bolt — machine-automated, visually opposite the person.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" />
      <path d="M12.8 6.5 9.5 12.5h2.4L11 17.5l4.3-7h-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HybridGlyph() {
  // Interlocked half-marks: half person / half agent share one diamond.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 2 22 12 12 22 2 12z" />
      <circle cx="9.5" cy="10.5" r="2" fill="currentColor" stroke="none" />
      <path d="M13.2 8.5 11 12.5h1.7L11.6 15.5 15 11.5h-1.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ReviewGlyph() {
  // Unresolved: dashed ring + question mark — honest "under review" state.
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3" />
      <path d="M10 9.5a2 2 0 1 1 3 1.7c-.7.4-1 .9-1 1.8" />
      <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
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
