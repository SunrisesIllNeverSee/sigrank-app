import React from "react";
import { Draft2ActionTiles } from "@/components/draft/Draft2ActionTiles";

/**
 * Draft2CtaBand — the closing conversion band for /draft2.
 *
 * A single high-contrast call-to-action after the value + trust case has been
 * made: the canonical closing micro-line ("Four integers in, full ledger out")
 * over the two primary actions. Server component, static copy, native tokens.
 */
export function Draft2CtaBand() {
  return (
    <section className="box-glow my-16 overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface px-6 py-14 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        ⊙ Get on the board
      </div>
      <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        Four integers in, full ledger out.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
        Architecture is the only variable that matters. Run the local agent or
        just paste your numbers — see your Υ Yield, your class, and your
        projected rank in under a minute.
      </p>

      {/* same four action tiles as the hero, with the premium shine-sweep glint
          (owner 2026-06-22: "flash fade" on the CTA boxes). */}
      <Draft2ActionTiles className="mt-8" shine />
    </section>
  );
}
