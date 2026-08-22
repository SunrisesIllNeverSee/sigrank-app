import React from "react";
import Link from "next/link";
import { Draft2ActionTiles } from "@/components/draft/Draft2ActionTiles";

/**
 * Draft2CtaBand — the closing conversion band for the homepage.
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

      <Draft2ActionTiles className="mt-8" shine />

      <p className="mt-7 font-mono text-xs text-text-muted">
        Building against SignalAF?{" "}
        <Link href="/developers" className="text-gold hover:text-text-primary">
          Developer portal
        </Link>{" "}
        ·{" "}
        <Link href="/openapi.json" className="text-gold hover:text-text-primary">
          OpenAPI
        </Link>{" "}
        ·{" "}
        <Link href="/mcp" className="text-gold hover:text-text-primary">
          MCP
        </Link>
      </p>
    </section>
  );
}
