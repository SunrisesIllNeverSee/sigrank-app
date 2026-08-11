/**
 * app/vs/mytokentracker/page.tsx — "SigRank vs mytokentracker" SEO comparison page.
 *
 * Angle: mytokentracker ranks #1 for "AI usage leaderboard" and has 2,300+
 * model pricing. But it ranks by dollars spent. SigRank ranks by efficiency.
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
  title: "SigRank vs mytokentracker \u2014 Efficiency vs Spend",
  description:
    "mytokentracker ranks operators by dollars spent across 2,300+ models. SigRank ranks by Yield efficiency. Spend is a receipt; Yield is a result.",
  path: "/vs/mytokentracker",
});

// Comparison rows — feature-by-feature, mytokentracker vs SigRank.
const COMPARE_ROWS: {
  feature: string;
  mytokentracker: string;
  sigrank: string;
}[] = [
  {
    feature: "Reads Claude Code token logs",
    mytokentracker: "Yes",
    sigrank: "Yes (bundles ccusage)",
  },
  {
    feature:
      "Token pillar breakdown (input / output / cache-read / cache-write)",
    mytokentracker: "Yes",
    sigrank: "Yes",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    mytokentracker: "No (ranks by spend)",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    mytokentracker: "Partial (raw counts + cost)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    mytokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Build archetype (10 types)",
    mytokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    mytokentracker: "Yes (spend-ranked)",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    mytokentracker: "Partial (profile pages)",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    mytokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    mytokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Model pricing database",
    mytokentracker: "2,300+ models",
    sigrank: "Cost-aware (per-model rates)",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    mytokentracker: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a mytokentracker alternative?",
    answer:
      "They overlap on data but diverge on the ranking axis. mytokentracker aggregates token usage across 2,300+ models and ranks operators by dollars spent. SigRank takes the same token telemetry and ranks by Yield efficiency: Υ = cache_read × output / input². If you want a spend report, mytokentracker is excellent. If you want to know whether that spend was worth it, SigRank is the answer. You can run both, they read the same logs.",
  },
  {
    question: "What does mytokentracker not measure that SigRank does?",
    answer:
      "mytokentracker reports dollars spent and ranks by that single number. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). mytokentracker tells you what you paid; SigRank tells you what you got for it. Spend is a receipt; Yield is a result.",
  },
  {
    question: "Can I use both mytokentracker and SigRank?",
    answer:
      "Yes, and they complement each other. mytokentracker gives you the cost layer: per-model pricing, spend totals, budget tracking across 2,300+ models. SigRank gives you the efficiency layer that spend rankings cannot. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep mytokentracker for the budget view. The same local logs feed both.",
  },
  {
    question: "Which is better for optimizing AI coding spend?",
    answer:
      "Both, for different reasons. mytokentracker tells you how much you spent and on which model. SigRank tells you whether that spend produced signal or noise. An operator who spends $200 efficiently (high Yield, high compression) is getting more value than one who spends $50 inefficiently (low Yield, re-sent context). Use mytokentracker to track the budget; use SigRank to track whether the budget is being spent well.",
  },
  {
    question: "mytokentracker has 2,300+ model prices. Does SigRank track cost?",
    answer:
      "SigRank is cost-aware but cost is not the ranking axis. The cascade metrics (Υ Yield, Leverage, compression ratio) are computed from token pillars, not dollar amounts, so they are comparable across operators regardless of which model they drove or what they paid. Spend varies by provider and pricing tier; efficiency is a property of the operator. SigRank ranks the driver, not the gas bill.",
  },
];

export default function VsMytokentrackerPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs mytokentracker", path: "/vs/mytokentracker" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs mytokentracker — Efficiency vs Spend",
            description: "mytokentracker ranks operators by dollars spent across 2,300+ models. SigRank ranks by Yield efficiency. Spend is a receipt; Yield is a result.",
            path: "/vs/mytokentracker",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs mytokentracker"
        title="Dollars Spent vs Dollars Worth It"
        subtitle={
          <>
            mytokentracker ranks #1 for &quot;AI usage leaderboard&quot; and
            tracks 2,300+ model prices. But it ranks by{" "}
            <span className="text-gold">dollars spent</span>. SigRank ranks by
            Yield efficiency. A receipt tells you what you paid; a result tells
            you whether it was worth it.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: mytokentracker
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          mytokentracker aggregates token usage across 2,300+ models, applies
          per-model pricing, and ranks operators by total dollars spent. It
          does the cost-accounting layer well: wide model coverage, accurate
          pricing, clean spend reports. But it ranks by the wrong axis.{" "}
          <em>Spend is a measure of consumption, not skill.</em> An operator
          who spends $500 re-sending the same context will outrank one who
          spends $50 compounding cached context into high-yield output. Higher
          spend, lower skill, higher rank.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same four token pillars and asks a different
          question: <strong className="text-text-primary">did that spend
          produce signal or noise?</strong> The headline metric, Υ Yield =
          cache_read × output / input², rewards the operator who reuses cached
          context efficiently and penalizes the one who burns fresh input
          without leverage. mytokentracker prints the receipt; SigRank grades
          the result. Both matter. Only one tells you whether the money was
          well spent.
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
                  mytokentracker
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
                    {r.mytokentracker}
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
          Why dollars spent aren&apos;t enough
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          mytokentracker answers <em>&quot;how much did I spend?&quot;</em>{" "}
          That is a budget question, not a skill question. Two operators can
          spend the same $100 and get wildly different outcomes. One reuses
          cached context efficiently and produces 30K output tokens; the other
          re-sends the same context every turn and produces 3K. Same spend,
          ten-fold difference in signal. On a spend leaderboard, they tie. On a
          Yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh
          input without leverage. mytokentracker multiplies tokens by price;
          SigRank tells you whether the cascade they describe is{" "}
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
          From spend to Yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run mytokentracker, you have the logs. SigRank reads
          the same telemetry and adds the efficiency layer spend rankings never
          had:
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
          Keep mytokentracker for the budget view. Add the efficiency layer
          that spend rankings cannot provide. Install SigRank and submit your
          first signed snapshot in under a minute.
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
            href="/vs/tokscale"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Tokscale
          </Link>
          {" · "}
          <Link
            href="/vs/costhawk"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs CostHawk
          </Link>
        </p>
      </section>
    </div>
  );
}
