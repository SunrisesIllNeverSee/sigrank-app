import React from "react";
import dynamic from "next/dynamic";
import { CascadeHeader } from "@/components/home/CascadeHeader";
import { Draft2ActionTiles } from "@/components/draft/Draft2ActionTiles";

// Lazy-load the wordmark components — they're client islands with font
// downloads (Space_Grotesk, Bitter, Archivo_Black) + MutationObserver setup.
// Code-splitting keeps their JS (and the 3 wordmark fonts) in a separate
// chunk that loads after the critical path. SSR is preserved so the <h1>
// (SIGRANK) stays in the initial HTML for SEO.
const RotatingWordmark = dynamic(
  () => import("@/components/home/RotatingWordmark").then((m) => m.RotatingWordmark),
);
const TerminalWordmark = dynamic(
  () => import("@/components/home/TerminalWordmark").then((m) => m.TerminalWordmark),
);

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
          The evaluation platform for{" "}
          <span className="text-gold">AI operators</span>
        </p>
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary sm:text-base">
          Models are benchmarked constantly. The people operating them are not.
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
            SigRank turns privacy-preserving token telemetry into a repeatable
            performance evaluation: your{" "}
            <strong className="text-text-primary">Yield</strong>, workflow
            signature, benchmark, and progress over time. The leaderboard is
            proof, not the product — the product is the{" "}
            <strong className="text-text-primary">operator-evaluation standard</strong>.
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
