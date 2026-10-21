"use client";

/**
 * components/live/PanelReopenTab.tsx — the obvious "bring it back" handle that
 * sits on the stage edge when a sidebar is collapsed (owner 2026-10-21: "i would
 * like the sidebar collapse to be more noticeable"). The rail-foot toggles stay;
 * this tab is the visible companion on the same side as the closed panel.
 * Rendered inside .mid (position:relative); theme accent via --ac.
 */
export function PanelReopenTab({
  side,
  label,
  controls,
  onOpen,
}: {
  side: "l" | "r";
  label: string;
  /** id of the collapsed panel element, for aria-controls. */
  controls: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`reopen-tab reopen-${side}`}
      aria-expanded={false}
      aria-controls={controls}
      aria-label={`show ${label.toLowerCase()} panel`}
      title={`show ${label.toLowerCase()} panel`}
      onClick={onOpen}
    >
      <span aria-hidden="true">{side === "l" ? "▸" : "◂"}</span>
      <span className="reopen-lbl" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
