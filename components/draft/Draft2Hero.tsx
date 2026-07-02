import React from 'react'
import Link from 'next/link'
import { CascadeHeader } from '@/components/home/CascadeHeader'
import { RotatingWordmark } from '@/components/home/RotatingWordmark'
import { TerminalWordmark } from '@/components/home/TerminalWordmark'
import { Draft2ActionTiles } from '@/components/draft/Draft2ActionTiles'

/**
 * Draft2Hero — the launch-landing intro block for /draft2 (owner edit 2026-06-21).
 *
 * Order, per owner: intro line (mono, one-line sm+) → the original SIGRANK logo
 * (RotatingWordmark + § coin) → "powered by MO§ES™" → body → four action tiles
 * (Measure / Board / Compare / Info·Wiki) → "Identifying Burners, Builders, and
 * 10×ers." → SIGNAL AF.
 *
 * The wordmark owns the only <h1> (the SIGRANK reveal); the "Introducing…" line is
 * a lead-in <p>, so the page has exactly one h1. CascadeHeader + RotatingWordmark
 * are reused from the live landing ("like the original") — never forked. Server
 * component: both are client islands rendered as children, never imported into a
 * client file. No props, no data reads.
 */
export function Draft2Hero() {
  return (
    <header className="relative flex min-h-[540px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-bg-border-subtle bg-bg-surface px-6 py-16 text-center">
      <CascadeHeader slowFactor={1.8} />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* intro line (lead-in above the logo) */}
        <p className="font-mono text-base font-bold leading-tight tracking-tight text-text-primary sm:whitespace-nowrap md:text-xl lg:text-2xl">
          Introducing the new standard in{' '}
          <span className="text-gold">AI evaluation &amp; benchmarks</span>
        </p>
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary sm:text-base">
          Operator Performance Signature
        </p>

        {/* the original SIGRANK logo — animated wordmark + § coin.
            Under terminal theme, TerminalWordmark (block-letter art) takes over;
            RotatingWordmark self-gates to null. Both render here; only one shows. */}
        <RotatingWordmark />
        <TerminalWordmark />

        {/* powered by — white + larger (owner 2026-06-22) */}
        <span className="font-mono text-sm uppercase tracking-[0.22em] text-text-primary sm:text-base">
          powered by MO§ES™
        </span>

        {/* privacy badge — the differentiator every launch post leans on, surfaced
            at the brand level so a stranger landing from X/HN sees it first (GTM
            Phase C front-door fix, 2026-07-02). */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5">
          <span className="text-gold">⊙</span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-primary sm:text-sm">
            Token counts only. Never your prompts.
          </span>
        </div>

        <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* body — "We measure…" starts on a new line (owner). text-balance evens the
            line lengths so there's no one-word orphan line (owner 2026-06-24). */}
        <div className="flex max-w-2xl flex-col gap-2 text-center">
          <p className="text-balance font-sans text-lg leading-relaxed text-text-secondary sm:text-xl">
            We measure the{' '}
            <strong className="text-text-primary">architecture of users&apos; token cascade</strong>{' '}
            to identify patterns, margins, and operator signature — revealing whether signal is
            compounded or tokens burned. Most platforms reward volume. SigRank rewards structure.
          </p>
          <p className="text-balance font-sans text-lg font-medium leading-relaxed text-text-primary sm:text-xl">
            Fair warning: the blade cuts both ways.
          </p>
        </div>

        {/* primary CTA — the personal hook (GTM Phase C front-door fix, 2026-07-02).
            A stranger landing from a launch post sees the privacy badge + this CTA
            above the fold → /score gives them an instant cascade preview (no account,
            no save). The action tiles below are secondary navigation. */}
        <Link
          href="/score"
          className="group inline-flex items-center gap-2 rounded-lg border border-gold bg-gold/10 px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.14em] text-gold transition-all duration-200 hover:bg-gold/20 hover:shadow-lg hover:shadow-gold/20 sm:text-base"
        >
          Compute your Υ
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>

        {/* four action tiles — Measure · Board · Compare · Info·Wiki (shared component).
            Shine-sweep glint on too (owner 2026-06-22: add it to the header boxes). */}
        <Draft2ActionTiles className="mt-3" shine />

        {/* taglines — bigger (owner 2026-06-22: increase size of these last two) */}
        <p className="font-mono text-lg font-semibold text-text-secondary sm:text-xl">
          Identifying Burners, Builders, and 10×ers.
        </p>
        <p className="font-mono text-xl font-bold uppercase tracking-[0.18em] text-text-primary sm:text-2xl">
          signal <span className="text-gold">AF</span>
        </p>
      </div>
    </header>
  )
}
