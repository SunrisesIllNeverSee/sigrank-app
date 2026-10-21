"use client";

import { useRef, type ReactNode } from "react";
import { useDialog } from "./useDialog";

/**
 * Drawer — left (or right) slide-over panel with a scrim. Mounted only while
 * open (SSR renders nothing). Focus-trapped; Esc, Back and scrim tap close it.
 * Styling lives in mobile-chrome.css (`.m-drawer`, `.m-scrim`).
 */
export function Drawer({
  open,
  onClose,
  label,
  side = "left",
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog (also shown in its header). */
  label: string;
  side?: "left" | "right";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(open, onClose, ref);
  if (!open) return null;
  return (
    <div className="m-layer" data-mlayer="drawer">
      <button type="button" className="m-dim" aria-label={`Close ${label}`} tabIndex={-1} onClick={onClose} />
      <div ref={ref} className={`m-drawer m-drawer-${side}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <div className="m-dhead">
          <span className="m-dtitle">{label}</span>
          <button type="button" className="m-x" aria-label={`Close ${label}`} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="m-dbody">{children}</div>
      </div>
    </div>
  );
}
