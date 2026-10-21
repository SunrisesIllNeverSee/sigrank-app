"use client";

/**
 * components/profile-v2/RailDialog.tsx — generic in-window popup for profile
 * right-rail modules (owner direction: the heat map and honors detail "pop up
 * inside the window" on click rather than occupying the stage body).
 *
 * Renders a compact trigger (passed as `trigger`, phrasing-safe content) plus
 * a native <dialog> carrying the full module (`children`, rendered server-
 * side — standard RSC composition). Native dialog gives Esc/backdrop close
 * and focus containment for free (focus moves into the dialog on open and
 * returns to the trigger on close).
 *
 * owner 2026-10-21: also drives the board sidebar popups (top movers,
 * operator inspector) and the profile rail panels, so it takes optional
 * `lazy` (mount children only while open — keeps live widgets out of the
 * DOM until wanted), `onOpenChange`, `hint` and a `className` modifier.
 */

import { useRef, useState, type ReactNode } from "react";
import "./rail-dialog.css";

interface RailDialogProps {
  title: string;
  subtitle?: string;
  /** Compact preview rendered inside the rail (spans/inline content only —
   *  it sits inside a <button>). */
  trigger: ReactNode;
  /** Full detail shown inside the dialog. A function receives `close` so
   *  content can dismiss the popup after an action (e.g. picking a row). */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Extra class on the dialog card (e.g. wide for the heatmap). */
  wide?: boolean;
  /** Mount `children` only while the dialog is open (client-only content). */
  lazy?: boolean;
  /** Notified on open/close — e.g. to pause an auto-rotating preview. */
  onOpenChange?: (open: boolean) => void;
  /** Trigger hint text; defaults to "EXPAND ▸". */
  hint?: string;
  /** Extra modifier class on the dialog (e.g. "prl-dialog--movers"). */
  dialogClass?: string;
}

export function RailDialog({ title, subtitle, trigger, children, wide, lazy, onOpenChange, hint = "EXPAND ▸", dialogClass }: RailDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  const [isOpen, setIsOpen] = useState(false);
  const open = () => {
    setIsOpen(true);
    onOpenChange?.(true);
    if (ref.current && !ref.current.open) ref.current.showModal();
  };

  return (
    <>
      {/* role=button (not <button>) — the trigger hosts block content
          (the scaled heatmap grid), which is invalid inside a button. */}
      <div
        role="button"
        tabIndex={0}
        className="prl-open"
        onClick={open}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
        aria-haspopup="dialog"
        aria-label={`${title} — ${hint.replace(/\s*[▸↗]\s*$/, "").toLowerCase()}`}
      >
        {trigger}
        <span className="prl-open-hint" aria-hidden="true">{hint}</span>
      </div>
      <dialog
        ref={ref}
        className={`prl-dialog${wide ? " prl-dialog--wide" : ""}${dialogClass ? " " + dialogClass : ""}`}
        aria-label={title}
        onClose={() => { setIsOpen(false); onOpenChange?.(false); }}
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
          {lazy && !isOpen ? null : typeof children === "function" ? children(close) : children}
        </div>
      </dialog>
    </>
  );
}
