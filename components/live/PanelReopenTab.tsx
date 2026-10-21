"use client";

/**
 * components/live/PanelReopenTab.tsx — the obvious "bring it back" handle that
 * sits on the stage edge when a sidebar is collapsed (owner 2026-10-21: "i would
 * like the sidebar collapse to be more noticeable"). The rail-foot toggles stay;
 * this tab is the visible companion on the same side as the closed panel.
 * Rendered inside .mid (position:relative); theme accent via --ac.
 */
import { useCallback, useEffect, useRef } from "react";

/** Moves focus across a panel collapse/reopen: call `focusAfter(selector)`
 *  in the handler that flips the state; focus lands once the DOM updates. */
export function usePanelFocus(leftOn: boolean, railOn: boolean) {
  const pending = useRef<string | null>(null);
  useEffect(() => {
    const sel = pending.current;
    if (!sel) return;
    pending.current = null;
    document.querySelector<HTMLElement>(sel)?.focus();
  }, [leftOn, railOn]);
  return useCallback((sel: string) => {
    pending.current = sel;
  }, []);
}

export function PanelReopenTab({
  side,
  label,
  controls,
  onOpen,
}: {
  side: "l" | "r";
  label: string;
  /** id of the collapsed panel element, for aria-controls; omit when the panel is unmounted. */
  controls?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`reopen-tab reopen-${side}`}
      aria-expanded={false}
      aria-controls={controls}
      aria-label={`Show ${label} panel`}
      title={`Show ${label} panel`}
      onClick={onOpen}
    >
      <span aria-hidden="true">{side === "l" ? "▸" : "◂"}</span>
      <span className="reopen-lbl" aria-hidden="true">
        PANEL
      </span>
    </button>
  );
}
