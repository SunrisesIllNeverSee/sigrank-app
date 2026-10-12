"use client";

/**
 * components/profile-v2/RailDialog.tsx — generic in-window popup for profile
 * right-rail modules (owner direction: the heat map and honors detail "pop up
 * inside the window" on click rather than occupying the stage body).
 *
 * Renders a compact trigger (passed as `trigger`, phrasing-safe content) plus
 * a native <dialog> carrying the full module (`children`, rendered server-
 * side — standard RSC composition). Native dialog gives Esc/backdrop close
 * and focus containment for free.
 */

import { useRef, type ReactNode } from "react";

interface RailDialogProps {
  title: string;
  subtitle?: string;
  /** Compact preview rendered inside the rail (spans/inline content only —
   *  it sits inside a <button>). */
  trigger: ReactNode;
  /** Full detail shown inside the dialog. */
  children: ReactNode;
  /** Extra class on the dialog card (e.g. wide for the heatmap). */
  wide?: boolean;
}

export function RailDialog({ title, subtitle, trigger, children, wide }: RailDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        className="prl-open"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
      >
        {trigger}
        <span className="prl-open-hint" aria-hidden="true">EXPAND ▸</span>
      </button>
      <dialog
        ref={ref}
        className={`prl-dialog${wide ? " prl-dialog--wide" : ""}`}
        onClick={(e) => { if (e.target === ref.current) close(); }}
      >
        <div className="prl-dialog-card">
          <div className="prl-dialog-head">
            <div className="prl-dialog-titles">
              <strong>{title}</strong>
              {subtitle && <span>{subtitle}</span>}
            </div>
            <button type="button" className="prl-dialog-x" onClick={close} aria-label={`Close ${title.toLowerCase()}`}>✕</button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
