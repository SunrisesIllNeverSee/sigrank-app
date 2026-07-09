"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * MobileNav — the hamburger menu shown below the `md` breakpoint, where the
 * inline nav links don't fit. Wordmark + AccountMenu stay in the top bar
 * (rendered by Nav); this is just the links, collapsed behind a toggle. Closes
 * on outside click, Escape, or selecting a link. Client island (toggle state).
 */
export function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-bg-border bg-bg-elevated text-text-secondary transition-colors hover:text-text-primary"
      >
        {/* hamburger / close glyph */}
        <span className="font-mono text-base leading-none">
          {open ? "✕" : "☰"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Navigation"
          className="absolute left-0 z-50 mt-2 w-44 rounded-md border border-bg-border bg-bg-elevated p-1 shadow-lg"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded px-2.5 py-2 font-sans text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
