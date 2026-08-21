import React from "react";
import dynamic from "next/dynamic";
import { CascadeHeader } from "@/components/home/CascadeHeader";
import { Draft2ActionTiles } from "@/components/draft/Draft2ActionTiles";

const RotatingWordmark = dynamic(
  () => import("@/components/home/RotatingWordmark").then((m) => m.RotatingWordmark),
);
const TerminalWordmark = dynamic(
  () => import("@/components/home/TerminalWordmark").then((m) => m.TerminalWordmark),
);

/**
 * Homepage hero. The visible lead-in owns the canonical server-rendered H1 so
 * crawlers and no-JavaScript clients receive the page topic in raw HTML.
 * Animated wordmarks are decorative brand treatments below it.
 */
export function Draft2Hero() {
  return (
    <header className="relative flex min-h-[540px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-bg-border-subtle bg-bg-surface px-6 py-16 text-center">
      <CascadeHeader slowFactor={1.8} />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <h1 className="font-mono text-base font-bold leading-tight tracking-tight text-text-primary sm:whitespace-nowrap md:text-xl lg:text-2xl">
          The evaluation platform for{" "}
          <span className="text-gold">AI operators</span>
        </h1>
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary sm:text-base">
          Models are benchmarked constantly. The people operating them are not.
        </p>

        <RotatingWordmark />
        <TerminalWordmark />

        <span className="font-mono text-sm uppercase tracking-[0.22em] text-text-primary sm:text-base">
          powered by MO§ES™
        </span>

        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5">
          <span className="text-gold">⊙</span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-text-primary sm:text-sm">
            Token counts only. Never your prompts.
          </span>
        </div>

        <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <div className="flex max-w-2xl flex-col gap-2 text-center">
          <p className="text-balance font-sans text-lg leading-relaxed text-text-secondary sm:text-xl">
            SigRank is an AI operator benchmark measuring token cascade
            efficiency, not AI models. It turns privacy-preserving token
            telemetry into a repeatable performance evaluation: your{" "}
            <strong className="text-text-primary">Yield</strong>, workflow
            signature, benchmark, and progress over time. The leaderboard is
            proof, not the product. The product is the{" "}
            <strong className="text-text-primary">operator-evaluation standard</strong>.
          </p>
          <p className="text-balance font-sans text-lg font-medium leading-relaxed text-text-primary sm:text-xl">
            Fair warning: the blade cuts both ways.
          </p>
        </div>

        <Draft2ActionTiles className="mt-3" shine />

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
