import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "Upsilon | Private AI Token-Efficiency Measurement",
  description:
    "Measure AI operator token-processing patterns privately with four integer telemetry fields. Upsilon is SignalAF's measurement engine; SigRank is its public proof surface.",
  path: "/upsilon",
});

const PILLARS = [
  ["I", "Input", "Fresh input tokens"],
  ["O", "Output", "Output tokens"],
  ["W", "Cache creation", "Tokens written to context cache"],
  ["R", "Cache read", "Tokens reused from context cache"],
] as const;

export default function UpsilonPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 py-2">
      <WaveHero
        eyebrow="UPSILON · MEASUREMENT ENGINE"
        terminalText="Υ"
        title="The EKG for AI processing"
        subtitle="Baseline your company's systems intelligence with Upsilon—a privacy-preserving diagnostic of observable AI operator token-processing patterns."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        {PILLARS.map(([symbol, name, description]) => (
          <article key={symbol} className="rounded-xl border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm text-gold">{symbol}</p>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">{name}</h2>
            <p className="mt-2 text-sm text-text-secondary">{description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Yield</p>
        <p className="mt-3 overflow-x-auto font-mono text-xl text-text-primary">
          Υ = (cache_read × output) / input²
        </p>
        <p className="mt-4 text-sm leading-6 text-text-secondary">
          Upsilon calculates the portable five-metric core from numeric telemetry. It does not require prompt text, response text, source code, or repository contents.
        </p>
      </section>

      <section className="rounded-xl border border-bg-border p-6">
        <h2 className="text-xl font-semibold text-text-primary">One architecture, four distinct roles</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          SignalAF is the umbrella brand. MO§ES™ supplies constitutional governance and methodology. Upsilon is the product and measurement engine. SigRank is the public leaderboard and proof surface.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/standard" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-black">
            Read the portable specification
          </Link>
          <Link href="/board/all" className="rounded-md border border-bg-border px-4 py-2 text-sm text-text-primary">
            View SigRank
          </Link>
        </div>
      </section>

      <p className="text-xs leading-5 text-text-muted">
        Measurement boundary: Upsilon describes observable token-processing patterns. It does not, by itself, establish cognition, work quality, employee productivity, or business outcomes.
      </p>
    </div>
  );
}
