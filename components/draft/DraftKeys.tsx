"use client";

/**
 * components/draft/DraftKeys.tsx — DRAFT pages only.
 *
 * A lightweight on-page "reference key" overlay so the owner can point at a
 * section by a plain number (per page) instead of a hyphenated key.
 *
 * <DraftKeysProvider> wraps the page, holds the show/hide state, and renders a
 * floating toggle (default ON). <Sec n={3} label="Hero"> wraps each section and
 * stamps a small corner badge with its number when keys are shown. Server
 * components are passed in as children, so this client wrapper never imports
 * them — RSC-safe. Draft-only: touches no live page.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

const ShowKeys = createContext(true);

export function DraftKeysProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(true);
  return (
    <ShowKeys.Provider value={show}>
      {children}
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        className="fixed bottom-4 left-4 z-[60] rounded-full border border-gold/40 bg-bg-base/90 px-3 py-1.5 font-mono text-[11px] text-gold shadow-lg backdrop-blur transition-colors hover:bg-bg-elevated"
      >
        {show ? "⊟ hide #keys" : "⊞ show #keys"}
      </button>
    </ShowKeys.Provider>
  );
}

export function Sec({
  n,
  label,
  children,
}: {
  n: number;
  label?: string;
  children: ReactNode;
}) {
  const show = useContext(ShowKeys);
  return (
    <div className="relative scroll-mt-24">
      {show && (
        <span
          aria-hidden
          className="pointer-events-none absolute -left-1.5 -top-3 z-40 flex items-center gap-1 rounded-md border border-gold/50 bg-bg-base/95 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-gold shadow"
        >
          {n}
          {label && (
            <span className="font-normal text-text-dim">· {label}</span>
          )}
        </span>
      )}
      {children}
    </div>
  );
}
