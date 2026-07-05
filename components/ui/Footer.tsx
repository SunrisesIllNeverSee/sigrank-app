import React from 'react'
import Link from 'next/link'

// ITEM 3 (owner 2026-06-22): general footer nav cleared — "clear out the nav in the footer, I'm
// going to redo it later." The general nav stays deferred to that redesign. The LEGAL links
// (About/Privacy/Terms) in the legal row below are added separately (2026-06-25, launch/compliance)
// so the Privacy/Terms sections on /about are discoverable site-wide — not part of the cleared nav.
const FOOTER_LINKS: { href: string; label: string }[] = []

/**
 * Site footer chrome. Server component.
 *
 * One footer, one bar (owner 2026-06-21: "we seem to have two"). The previous
 * version stacked two bordered rows that each re-stated the brand + a competing
 * tagline, so it read as two footers. Merged into a single bar: brand + nav on top,
 * one thin legal/privacy line below — no duplicate SIGRANK, no competing taglines.
 */
export function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-bg-border bg-bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
        {/* Brand + nav */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base text-accent">◈</span>
            <span className="font-mono text-sm font-bold tracking-widest text-accent">
              SIGRANK
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Run the local agent — the CLI is always one line away, site-wide
                (owner 2026-06-24). */}
            <code className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-text-secondary">
              <span className="text-text-muted">$ </span>
              <span className="text-gold">npx sigrank</span>
            </code>
            {FOOTER_LINKS.length > 0 && (
              <ul className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                {FOOTER_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Legal links (2026-06-25, launch/compliance — Privacy/Terms discoverability)
            + one legal/privacy line: powered-by · copyright · counts-not-content stance
            (owner 2026-06-19, ccusage "stays local" spirit). */}
        <div className="flex flex-col gap-2 border-t border-bg-border pt-4">
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted"
          >
            <Link href="/about" className="transition-colors hover:text-text-primary">
              About
            </Link>
            <Link href="/about#privacy" className="transition-colors hover:text-text-primary">
              Privacy
            </Link>
            <Link href="/about#terms" className="transition-colors hover:text-text-primary">
              Terms
            </Link>
          </nav>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[11px] text-text-secondary">
              powered by <span className="font-bold text-gold">MO§ES™</span> · © 2026 Ello Cello LLC
            </span>
            <span className="font-sans text-[11px] leading-snug text-text-muted">
              Token counts only — never prompt content. Your sessions stay on your machine.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
