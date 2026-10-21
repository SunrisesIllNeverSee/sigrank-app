"use client";

import { useRef, type ReactNode } from "react";
import { useDialog } from "./useDialog";

/**
 * Sheet — bottom sheet with a grabber, scrim and a max height of 86dvh
 * (content scrolls inside). Mounted only while open. Focus-trapped; Esc, Back
 * and scrim tap close it. `full` makes it a full-height sheet.
 */
export function Sheet({
  open,
  onClose,
  label,
  full = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(open, onClose, ref);
  if (!open) return null;
  return (
    <div className="m-layer" data-mlayer="sheet">
      <button type="button" className="m-dim" aria-label={`Close ${label}`} tabIndex={-1} onClick={onClose} />
      <div ref={ref} className={`m-sheet${full ? " m-sheet-full" : ""}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <div className="m-grab" aria-hidden="true" />
        <div className="m-dhead">
          <span className="m-dtitle">{label}</span>
          <button type="button" className="m-x" aria-label={`Close ${label}`} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="m-sbody">{children}</div>
      </div>
    </div>
  );
}
