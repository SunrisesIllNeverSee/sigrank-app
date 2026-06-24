'use client'

/**
 * components/draft/WikiSignBar.tsx — DRAFT (About-wiki hub) only.
 *
 * The hub's sign bar: brand on the left, a primary "Get ranked" CTA, and a
 * "Sign in" login dropdown carrying Contact + Submit/get-ranked. Login itself is
 * a stub until auth is wired (TODO(auth)). Client component (dropdown state).
 * Draft-only — touches no live chrome.
 */

import { useState } from 'react'
import Link from 'next/link'

export function WikiSignBar() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-bg-border bg-bg-surface px-4 py-2.5">
      <Link
        href="/wiki"
        className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-accent"
      >
        <span className="text-gold">◧</span> SIGRANK
      </Link>

      <div className="flex items-center gap-2">
        {/* primary conversion CTA — always one click to sign up */}
        <Link
          href="/wiki"
          className="rounded-md bg-gold px-3 py-1.5 font-mono text-xs font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Get ranked →
        </Link>

        {/* login dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-1 rounded-md border border-bg-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Sign in <span className="text-text-dim">{open ? '▴' : '▾'}</span>
          </button>

          {open && (
            <>
              {/* click-away backdrop */}
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1.5 flex w-56 flex-col overflow-hidden rounded-md border border-bg-border bg-bg-base shadow-xl"
              >
                <Link
                  href="/wiki"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 font-mono text-xs font-semibold text-text-primary transition-colors hover:bg-bg-elevated"
                >
                  ◈ Submit now — get ranked
                </Link>
                <a
                  href="mailto:hello@signalaf.com?subject=SigRank"
                  role="menuitem"
                  className="border-t border-bg-border-subtle px-3 py-2.5 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                >
                  ✉ Contact
                </a>
                {/* TODO(auth): real login once Supabase auth is wired. */}
                <span
                  role="menuitem"
                  aria-disabled
                  className="cursor-not-allowed border-t border-bg-border-subtle px-3 py-2.5 font-mono text-xs text-text-dim"
                >
                  ⊙ Log in — coming soon
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
