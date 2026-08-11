/**
 * app/vs/tokscale/page.tsx — "SigRank vs Tokscale" SEO comparison page.
 *
 * Angle: Tokscale has the biggest board (1,797 users, 40+ tools) but ranks by
 * volume. SigRank ranks by Yield efficiency. Volume is noise; Yield is signal.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's table conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs Tokscale \u2014 Yield vs Volume Leaderboard",
  description:
    "Tokscale ranks by total tokens burned across 40+ tools. SigRank ranks by Yield efficiency. Volume is noise; Yield is signal.",
  path: "/vs/tokscale",
});

// Comparison rows — feature-by-feature, Tokscale vs SigRank.
const COMPARE_ROWS: { feature: string; tokscale: string; sigrank: string }[] = [
  {
    feature: "Reads Claude Code token logs",
    tokscale: "Yes",
    sigrank: "Yes (bundles ccusage)",
  },
  {
    feature:
      "Token pillar breakdown (input / output / cache-read / cache-write)",
    tokscale: "Yes",
    sigrank: "Yes",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    tokscale: "No (ranks by volume)",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    tokscale: "Partial (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    tokscale: "No",
    sigrank: "Yes",
  },
  {
    feature: "Build archetype (10 types)",
    tokscale: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    tokscale: "Yes (1,797 users, volume-ranked)",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    tokscale: "Partial (profile pages)",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    tokscale: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    tokscale: "No",
    sigrank: "Yes",
  },
  {
    feature: "Tool coverage",
    tokscale: "40+ tools",
    sigrank: "15+ platforms (Claude, Cursor, Copilot, Gemini)",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    tokscale: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a Tokscale alternative?",
    answer:
      "They overlap on data collection but diverge on the question they answer. Tokscale aggregates token usage across 40+ tools and ranks operators by total volume burned. SigRank takes the same token telemetry and ranks by Yield efficiency: Υ = cache_read × output / input². If you want the biggest board by headcount, Tokscale wins. If you want to know who is actually efficient, SigRank is the answer. You can run both, they read the same logs.",
  },
  {
    question: "What does Tokscale not measure that SigRank does?",
    answer:
      "Tokscale reports total tokens burned and ranks by that single number. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). Tokscale tells you who burned the most; SigRank tells you who got the most signal per token spent. Volume rewards the operator who never stops typing; Yield rewards the one who compounds.",
  },
  {
    question: "Can I use both Tokscale and SigRank?",
    answer:
      "Yes, and many operators do. Tokscale gives you the widest tool coverage and the largest community board. SigRank gives you the efficiency layer that volume rankings cannot. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep your Tokscale profile for the volume crowd. The two are complementary, not mutually exclusive. The same local logs feed both.",
  },
  {
    question: "Which is better for finding the most skilled AI operators?",
    answer:
      "SigRank. Volume leaderboards conflate activity with skill. An operator who burns 50M tokens re-sending the same context every turn will outrank one who burns 5M tokens but compounds cached context into high-yield output. Yield filters out that noise: it rewards the operator whose cascade is compounding, not the one whose burn rate is highest. If you want to find the best drivers, look at lap times, not fuel consumption.",
  },
  {
    question: "Tokscale has 1,797 users and 40+ tools. Why is SigRank's board smaller?",
    answer:
      "Because SigRank measures a harder thing. Counting tokens is easy and scales to anyone with a log file. Computing a signed, cascade-scored, class-tiered snapshot requires the four pillars to be present and the operator to enroll an ed25519 identity. The SigRank board is smaller by design: every entry is a verified, scored, comparable signal, not a raw volume counter. Bigger is not better when bigger means noisier.",
  },
];

export default function VsTokscalePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Tokscale", path: "/vs/tokscale" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Tokscale — Yield vs Volume Leaderboard",
            description: "Tokscale ranks by total tokens burned across 40+ tools. SigRank ranks by Yield efficiency. Volume is noise; Yield is signal.",
            path: "/vs/tokscale",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Tokscale"
        title="Volume Is Noise. Yield Is Signal."
        subtitle={
          <>
            Tokscale has the biggest board (1,797 users, 40+ tools) and ranks
            by total tokens burned. SigRank ranks by{" "}
            <span className="text-gold">Υ Yield efficiency</span>. Same data,
            different question. Volume tells you who typed the most; Yield
            tells you who drove the best.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Tokscale
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokscale aggregates token usage across 40+ AI tools and publishes a
          community leaderboard ranked by total volume. It does the
          aggregation layer well: wide coverage, big board, active community.
          But it ranks by the wrong axis. <em>Volume is a measure of
          activity, not skill.</em> An operator who re-sends the same context
          every turn and burns 50M input tokens will outrank one who compounds
          cached context and burns 5M. Same tool, ten times the waste, higher
          rank.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same four token pillars and asks a different
          question: <strong className="text-text-primary">is the cascade
          compounding or burning?</strong> The headline metric, Υ Yield =
          cache_read × output / input², rewards the operator who reuses cached
          context efficiently and penalizes the one who burns fresh input
          without leverage. Tokscale counts the fuel; SigRank measures the lap
          time. Both matter. Only one tells you who is winning.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Feature comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Tokscale
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  SigRank
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr
                  key={r.feature}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.feature}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {r.tokscale}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why the cascade matters */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why raw token counts aren&apos;t enough
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokscale answers <em>&quot;who burned the most tokens?&quot;</em>{" "}
          That is a popularity contest, not a skill ranking. Two operators can
          spend the same 50K input tokens and get wildly different outcomes.
          One reuses cached context efficiently and produces 30K output tokens;
          the other re-sends the same context every turn and produces 3K. Same
          spend, ten-fold difference in signal. On a volume leaderboard, they
          tie. On a Yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh
          input without leverage. Tokscale gives you the four integers and sums
          them; SigRank tells you whether the cascade they describe is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (both tools read these)
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Input</strong>: tokens you
              send to the model
            </li>
            <li>
              <strong className="text-text-primary">Output</strong>: tokens the
              model generates back
            </li>
            <li>
              <strong className="text-text-primary">Cache-read</strong>: cached
              tokens reused from prior context
            </li>
            <li>
              <strong className="text-text-primary">Cache-write</strong>: new
              tokens written to cache for future reuse
            </li>
          </ul>
        </div>
      </section>

      {/* The upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From volume to Yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run Tokscale, you have the logs. SigRank reads the
          same telemetry and adds the scoring layer volume rankings never had:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to inspect before you submit? Run{" "}
          <span className="font-mono text-text-primary">
            sigrank me --dry-run
          </span>{" "}
          to see your scored payload locally, or paste your token counts into
          the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          to compute your Υ Yield, class tier, and compression ratio instantly,
          no account, no submission, just the numbers.
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Frequently asked questions
        </h2>
        <dl className="flex flex-col gap-5">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1.5">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Ready to see your Yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your Tokscale profile for the volume crowd. Add the efficiency
          layer that volume rankings cannot provide. Install SigRank and
          submit your first signed snapshot in under a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/token-tracking-tools"
            className="text-gold underline underline-offset-2"
          >
            Token Tracking Tools
          </Link>
          {" · "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" · "}
          <Link
            href="/vs/ccusage"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs ccusage
          </Link>
          {" · "}
          <Link
            href="/vs/tokenrank"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs TokenRank
          </Link>
        </p>
      </section>
    </div>
  );
}
