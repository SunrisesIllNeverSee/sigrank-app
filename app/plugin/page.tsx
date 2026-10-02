import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "SigRank | SignalAF Plugin",
  description: "Performative stats and benchmarks for AI users, not models. Explore and interpret the SignalAF AI Operator Leaderboard in ChatGPT and Codex.",
  path: "/plugin",
});

export default function PluginPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">AI Operator Leaderboard</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        SigRank | SignalAF
      </h1>
      <p className="mt-4 font-sans text-lg text-text-secondary">
        Performative stats and benchmarks for AI users, not models.
      </p>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">What the plugin does</h2>
        <p>
          Explore the live 7-day, 30-day, 90-day and all-time boards, read public operator profiles,
          compare operating structures, and understand field statistics. The plugin helps explain
          relationships among fresh input, generated output, context construction and reuse.
          A linked SignalAF account can request its own existing profile.
        </p>
        <p>
          Tokenpull measures → SigRank evaluates → SignalAF publishes. The plugin interprets those
          results; it does not scan local logs, enroll an operator, or submit a measurement. Metrics
          describe observable AI operating structure, not intelligence, productivity or work quality.
          Archetypes describe operating patterns, not personality.
        </p>
      </section>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">Boards and data</h2>
        <p>
          The Total / All board ranks claimed operators. The broader By platform / All view and
          general field breakdown can include unclaimed public rows. An unclaimed row is not
          automatically a historical seed. The plugin names the selected window, view, population,
          available operating ratios and provenance so those scopes stay distinct.
        </p>
        <Link className="text-gold underline underline-offset-4" href="/board/30d">
          Open the 30-day board
        </Link>
      </section>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">Beta support</h2>
        <p>
          The beta troubleshooter can help draft a short reproducible bug report. It sends a report
          to SignalAF support only after you approve the displayed contents. Do not include
          passwords, private logs or conversation transcripts.
        </p>
        <div className="flex flex-wrap gap-5">
          <Link className="text-gold underline underline-offset-4" href="/contact">Report an issue</Link>
          <Link className="text-gold underline underline-offset-4" href="/privacy">Privacy policy</Link>
          <Link className="text-gold underline underline-offset-4" href="/terms">Terms</Link>
        </div>
      </section>
    </main>
  );
}
