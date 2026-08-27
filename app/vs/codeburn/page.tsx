/**
 * app/vs/codeburn/page.tsx — "SigRank vs codeburn" SEO comparison page.
 *
 * Angle: codeburn tracks AI coding cost across tools. SigRank scores efficiency.
 * Cost is the input; yield is the output. Cost tracking is accounting; efficiency
 * scoring is evaluation.
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
  title: "SigRank vs codeburn \u2014 Cost Tracking vs Efficiency Scoring",
  description:
    "codeburn tracks AI coding cost across tools. SigRank scores efficiency. Cost tracking is accounting; efficiency scoring is evaluation. Cost is the input; yield is the output.",
  path: "/vs/codeburn",
});

const COMPARE_ROWS: { feature: string; codeburn: string; sigrank: string }[] = [
  {
    feature: "What it tracks",
    codeburn: "AI coding cost across tools (dollars)",
    sigrank: "Operator cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    codeburn: "No (cost only)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    codeburn: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", codeburn: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    codeburn: "Multi-tool cost tracking",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    codeburn: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a codeburn alternative?",
    answer:
      "They overlap on reading AI coding telemetry but diverge on what they do with it. codeburn tracks cost — how many dollars you've burned across your AI coding tools. SigRank scores yield — how efficiently you're converting those dollars into signal. If you want a cross-tool cost dashboard, codeburn is that. If you want to know whether your spend is producing efficient output, SigRank answers that. You can run both — they read the same logs.",
  },
  {
    question: "Why is cost tracking not enough?",
    answer:
      "Cost tracking tells you what you paid, not what you got. Two operators can spend the same $100 across tools and get wildly different outcomes. One reuses cached context efficiently and produces 60K output tokens; the other re-sends the same context every turn and produces 6K. Same cost, ten-fold difference in signal. On a cost tracker, they look identical. On a yield leaderboard, the gap is obvious. Cost is the input; yield is the output.",
  },
  {
    question: "What does codeburn not measure that SigRank does?",
    answer:
      "codeburn reports dollars spent across AI coding tools. SigRank reads the same token telemetry and derives the cascade architecture: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). codeburn tells you what you paid; SigRank tells you whether the cascade it funded is compounding or burning.",
  },
  {
    question: "Can I use both codeburn and SigRank?",
    answer:
      "Yes. codeburn gives you the cross-tool cost dashboard for budget tracking. SigRank gives you the efficiency layer that cost tracking cannot provide. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep codeburn for the budget view. The two are complementary, not mutually exclusive. The same local logs feed both.",
  },
  {
    question: "Which is better for improving my AI coding efficiency?",
    answer:
      "SigRank. Cost tracking can tell you when you're burning too much, but it can't tell you why. Yield tracks the root cause: an operator whose Υ is low is burning fresh input without compounding cached context. Fix the cascade and the cost drops automatically. codeburn shows the symptom; SigRank shows the disease.",
  },
];

export default function VsCodeburnPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs codeburn", path: "/vs/codeburn" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs codeburn \u2014 Cost Tracking vs Efficiency Scoring",
            description: "codeburn tracks AI coding cost across tools. SigRank scores efficiency. Cost tracking is accounting; efficiency scoring is evaluation. Cost is the input; yield is the output.",
            path: "/vs/codeburn",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs codeburn"
        title="Cost Is the Input. Yield Is the Output."
        subtitle={
          <>
            codeburn tracks AI coding cost across tools. SigRank scores
            <span className="text-gold"> how efficiently you produce</span>.
            Cost tracking is accounting; efficiency scoring is evaluation.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: codeburn
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          codeburn is an AI coding cost tracker. It reads your token logs across
          tools and shows how much you&apos;re spending — dollars burned, cost
          per session, spend over time. It does its job well: it <em>accounts
          for the cost</em>. But cost is the input, not the output. Two operators
          can spend the same $100 and get wildly different results. codeburn
          can&apos;t tell them apart.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the same token telemetry and asks a different question:
          <strong className="text-text-primary"> is the cascade compounding or
          burning?</strong> The headline metric, Υ Yield = cache_read × output /
          input², rewards the operator who reuses cached context efficiently and
          penalizes the one who burns fresh input without leverage. codeburn
          counts the cost; SigRank measures the yield. Both matter. Only one
          tells you whether you&apos;re winning.
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
                  codeburn
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
                    {r.codeburn}
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

      {/* Why cost isn't yield */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why cost tracking isn&apos;t efficiency scoring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          codeburn answers <em>&quot;how much did I spend?&quot;</em> That&apos;s
          accounting, not evaluation. Two operators can spend the same $100
          across tools and get wildly different outcomes. One reuses cached
          context efficiently and produces 60K output tokens; the other re-sends
          the same context every turn and produces 6K. Same cost, ten-fold
          difference in signal. On a cost tracker, they look identical. On a
          yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. codeburn gives you the bill; SigRank tells you
          whether the cascade it funded is <em>compounding or burning</em>.
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
          From cost to yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run codeburn, you have the token counts. SigRank reads
          the same telemetry and adds the scoring layer cost tracking never had:
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
          Ready to see your yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your cost tracker for the budget. Add the efficiency layer that
          cost tracking cannot provide. Install SigRank and submit your first
          signed snapshot in under a minute.
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
