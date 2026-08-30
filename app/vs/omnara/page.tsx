/**
 * app/vs/omnara/page.tsx — "SigRank vs omnara" SEO comparison page.
 *
 * Angle: omnara monitors AI agents. SigRank scores AI operators. Monitoring
 * infrastructure ≠ evaluating the human at the wheel.
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
  title: "SigRank vs omnara",
  description:
    "omnara monitors AI agents with broad observability. SigRank scores AI operators. Monitoring infrastructure is not evaluating the human at the wheel.",
  path: "/vs/omnara",
});

// Comparison rows — feature-by-feature, omnara vs SigRank.
const COMPARE_ROWS: { feature: string; omnara: string; sigrank: string }[] = [
  {
    feature: "What it is",
    omnara: "AI monitoring and observability platform",
    sigrank: "Operator scoring and ranking system",
  },
  {
    feature: "What it evaluates",
    omnara: "AI agent behavior and infrastructure",
    sigrank: "The human operator driving the AI",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    omnara: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    omnara: "No (agent metrics)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    omnara: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    omnara: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    omnara: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    omnara: "Partial (monitoring integration)",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    omnara: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    omnara: "Broad AI agent coverage",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    omnara: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    omnara: "Partial (may log agent behavior)",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank an omnara alternative?",
    answer:
      "They evaluate different things. omnara is an AI monitoring platform — it monitors AI agents with broad observability and infrastructure monitoring. SigRank is an operator scoring system — it evaluates the human at the wheel, not the agent they are driving. omnara tells you what your agents are doing; SigRank tells you how efficiently you are driving them. Monitoring infrastructure is not evaluating the operator. You can run both — they solve different problems.",
  },
  {
    question: "Why is monitoring agents not the same as scoring operators?",
    answer:
      "Monitoring agents tells you what the AI is doing — is it running, is it healthy, what calls is it making. Scoring operators tells you how efficiently the human is driving the AI — are they compounding cached context or burning fresh input? The agent is the car; the operator is the driver. omnara monitors the car; SigRank scores the driver. A healthy car does not mean a skilled driver. Monitoring infrastructure is not evaluating the human at the wheel.",
  },
  {
    question: "What does omnara not measure that SigRank does?",
    answer:
      "omnara monitors AI agent behavior and infrastructure. SigRank derives the cascade architecture from the operator's token telemetry: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). omnara tells you what your agents are doing; SigRank tells you whether the operator behind them is compounding or burning.",
  },
  {
    question: "Can I use both omnara and SigRank?",
    answer:
      "Yes, and they are complementary. Use omnara to monitor your AI agents and infrastructure health. Use SigRank to score the human operator who drives those agents. The SigRank CLI reads token telemetry locally (token counts only, never agent behavior logs), computes the cascade metrics, signs a snapshot with ed25519, and publishes it to the leaderboard. omnara sees the agents; SigRank scores the operator behind them. Run `sigrank enroll` then `sigrank submit` to get your rank.",
  },
  {
    question: "What is the difference between agent monitoring and operator scoring?",
    answer:
      "Agent monitoring (omnara) records what AI agents are doing — their state, their calls, their health, their behavior. It is infrastructure-level observability. Operator scoring (SigRank) aggregates the token telemetry across an operator's entire body of work — across tools, across platforms — and computes a single cascade efficiency score (Υ Yield) that is comparable globally. Monitoring answers 'what are my agents doing?' Scoring answers 'how efficiently does this person drive AI?' The first is observability; the second is competition.",
  },
];

export default function VsOmnaraPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs omnara", path: "/vs/omnara" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs omnara \u2014 Agent Monitoring vs Operator Scoring",
            description: "omnara monitors AI agents with broad observability. SigRank scores AI operators. Monitoring infrastructure is not evaluating the human at the wheel.",
            path: "/vs/omnara",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs omnara"
        title="Monitoring Infrastructure Is Not Evaluating the Operator"
        subtitle={
          <>
            omnara monitors AI agents. SigRank{" "}
            <span className="text-gold">scores AI operators</span>. The agent
            is the car; the operator is the driver. A healthy car does not mean
            a skilled driver.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: omnara
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          omnara is an AI monitoring platform — it provides broad observability
          for AI agents. It monitors what your agents are doing: their state,
          their calls, their health, their behavior. It is excellent at what it
          does, which is <em>infrastructure monitoring</em>. What it does not do
          is score the human operator who drives those agents or rank them
          against anyone.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is a different thing entirely: an{" "}
          <strong className="text-text-primary">operator scoring system</strong>.
          It reads token telemetry from any AI tool an operator drives, computes
          the cascade efficiency (Υ Yield), and ranks them globally. omnara
          monitors the agents; SigRank scores the operator behind them. The
          agent is the car; the operator is the driver. Both matter. Only one
          tells you who is winning.
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
                  omnara
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
                    {r.omnara}
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

      {/* Why monitoring agents isn't scoring operators */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why monitoring agents isn&apos;t scoring operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          omnara answers <em>&quot;what are my AI agents doing?&quot;</em> That
          is infrastructure monitoring, not operator evaluation. Two operators
          can drive healthy agents with identical monitoring dashboards and
          have wildly different efficiency. One reuses cached context
          efficiently and produces 30K output tokens; the other re-sends the
          same context every turn and produces 3K. Same agent health, ten-fold
          difference in signal. omnara sees the same dashboard either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. omnara gives you the agent dashboard; SigRank tells
          you whether the operator behind it is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (SigRank reads these)
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
          From monitoring to scoring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run omnara for agent monitoring, you have the
          infrastructure observability. SigRank adds the operator scoring layer
          that monitoring platforms never had:
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
          Monitor with omnara. Compete on SigRank.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          omnara shows you what your AI agents are doing. SigRank scores the
          operator behind them and ranks them globally. Install the CLI, submit
          a signed snapshot, and get a rank that measures the operator, not the
          infrastructure.
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
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
          </Link>
          {" \u00B7 "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" \u00B7 "}
          <Link
            href="/wiki/local-agent"
            className="text-gold underline underline-offset-2"
          >
            The Local Agent (MCP)
          </Link>
        </p>
      </section>
    </div>
  );
}
