import React from "react";
import { CascadeHeader } from "@/components/home/CascadeHeader";
import { RotatingWordmark } from "@/components/home/RotatingWordmark";
import { TerminalWordmark } from "@/components/home/TerminalWordmark";
import { Draft2ActionTiles } from "@/components/draft/Draft2ActionTiles";
import { CopyButton } from "@/components/marketing/CopyButton";

/**
 * NpxButton — the glowing CTA button for the landing page hero.
 * Replaces the old code-block-style npx display with a prominent button
 * that has a pulsing glow animation. Clicking copies "npx sigrank".
 * Landing page only — not used on other pages.
 */
function NpxButton() {
  return (
    <button
      onClick={undefined}
      className="group relative inline-flex items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3.5 font-mono text-base font-bold text-text-primary shadow-lg shadow-gold/20 transition-all duration-300 hover:border-gold hover:bg-gold/20 hover:shadow-gold/40 sm:text-lg"
      style={{
        animation: "npx-glow 2s ease-in-out infinite",
      }}
    >
      <span className="text-gold">$</span>
      <span className="text-text-primary">npx sigrank</span>
      <span className="absolute inset-0 rounded-xl bg-gold/10 blur-md" style={{ animation: "npx-pulse 2s ease-in-out infinite" }} />
      <span className="relative z-10">
        <CopyButton text="npx sigrank" />
      </span>
      <style>{`
        @keyframes npx-glow {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(218, 165, 32, 0.2); }
          50% { box-shadow: 0 0 24px 6px rgba(218, 165, 32, 0.45); }
        }
        @keyframes npx-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </button>
  );
}

/**
 * Draft2Hero — the launch-landing intro block for /draft2 (owner edit 2026-06-21).
 *
 * Order, per owner: intro line (mono, one-line sm+) → "Operator Performance
 * Signature" → the original SIGRANK logo
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
          Introducing the new standard in{" "}
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

        {/* npx CTA — glowing button in the heading (landing page only).
            Replaces the old code-block placement. Pulsing gold glow draws
            the eye to the install command. */}
        <NpxButton />

        <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* body — "We measure…" starts on a new line (owner). text-balance evens the
            line lengths so there's no one-word orphan line (owner 2026-06-24). */}
        <div className="flex max-w-2xl flex-col gap-2 text-center">
          <p className="text-balance font-sans text-lg leading-relaxed text-text-secondary sm:text-xl">
            We measure the{" "}
            <strong className="text-text-primary">
              architecture of users&apos; token cascade
            </strong>{" "}
            to identify patterns, margins, and operator signature — revealing
            whether signal is compounded or tokens burned. Most platforms reward
            volume. SigRank rewards structure.
          </p>
          <p className="text-balance font-sans text-lg font-medium leading-relaxed text-text-primary sm:text-xl">
            Fair warning: the blade cuts both ways.
          </p>
        </div>

        {/* action tiles — Measure (→ /score) · Board · Compare · Info·Wiki (shared
            component). Shine-sweep glint on too (owner 2026-06-22). */}
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
  );
}
