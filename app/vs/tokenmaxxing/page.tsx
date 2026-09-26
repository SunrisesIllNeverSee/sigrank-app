/**
 * app/vs/tokenmaxxing/page.tsx — "SigRank vs tokenmaxxing.sh" SEO page.
 *
 * Angle: tokenmaxxing.sh (851-labs) is the minimalist take — a spend/tokens
 * leaderboard, nothing else. That restraint is the point: it ranks what it
 * says it ranks. SigRank adds the efficiency layer on top of the same
 * telemetry.
 *
 * NOTE: tokenmaxxing.sh ≠ tokenmaxxer. /vs/tokenmaxxer covers the gamified
 * streaks/badges product. This page covers the 851-labs minimalist board.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage +
 * comparisonArticle), WaveHero, and a styled comparison table.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs tokenmaxxing.sh — Spend Board vs Efficiency Score",
  description:
    "tokenmaxxing.sh is the minimalist spend leaderboard — a clean ccusage-based board ranking who spent and burned the most. SigRank scores whether the spend compounded. The honest counter vs the efficiency layer.",
  path: "/vs/tokenmaxxing",
});

const COMPARE_ROWS: { feature: string; other: string; sigrank: string }[] = [
  {
    feature: "What it ranks",
    other: "Spend ($) or tokens — pick your board",
    sigrank: "Cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Philosophy",
    other: "Minimalist — one clean board, no extra machinery",
    sigrank: "Framework — a defined metric stack around one score",
  },
  {
    feature: "Efficiency metrics (Υ, SNR, Leverage, Velocity)",
    other: "No — volume and spend only",
    sigrank: "Yes",
  },
  {
    feature: "Archetypes + class tiers",
    other: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles",
    other: "Leaderboard rows",
    sigrank: "Full profiles + head-to-head compare",
  },
  {
    feature: "Signed, verifiable submissions",
    other: "Server-side ingest",
    sigrank: "ed25519-signed snapshots",
  },
  {
    feature: "MCP server for AI-agent integration",
    other: "No",
    sigrank: "Yes",
  },
  {
    feature: "Data source",
    other: "ccusage logs via @851-labs/tokenmaxxing CLI",
    sigrank: "Four token pillars, 15+ platforms",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    other: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is tokenmaxxing.sh a SigRank alternative?",
    answer:
      "It is a different take on the same data. tokenmaxxing.sh is deliberately minimalist — a clean leaderboard that ranks spend or tokens and nothing else. That restraint is its appeal: it ranks exactly what it says it ranks, with no scoring machinery in between. SigRank asks the follow-up question: did the spend compound into signal? If you want the simplest possible 'who burned the most' board, tokenmaxxing.sh is a good one. If you want to know who is efficient, that is the layer SigRank adds.",
  },
  {
    question: "What does 'tokenmaxxing' mean?",
    answer:
      "Tokenmaxxing is the practice of maximizing AI token usage — the trend that turned API spend into a competitive leaderboard category. tokenmaxxing.sh (by 851-labs) is one minimalist implementation: an npm CLI that syncs your ccusage totals to a public spend/tokens board. Note that it is a different product from tokenmaxxer, the gamified streaks-and-badges tracker — two similarly-named tools in the same category. SigRank sits beside both as the efficiency layer: the same telemetry, but scored for yield instead of ranked by volume.",
  },
  {
    question: "Is ranking by spend the same as ranking by skill?",
    answer:
      "No — and tokenmaxxing.sh does not claim it is. A spend board is honest about what it measures: who consumed the most. The gap appears when two operators spend the same and get different results. One reuses cached context and produces high output per input; the other re-sends context every turn. On a spend board they tie. On SigRank's Υ-ranked board the difference is the whole point. Spend measures participation; yield measures how well the spend was driven.",
  },
  {
    question: "Can I use tokenmaxxing.sh and SigRank together?",
    answer:
      "Yes — the same local ccusage data feeds both. Keep your tokenmaxxing.sh entry for the spend board, and run `sigrank submit` to add your signed efficiency score to the SigRank leaderboard. Minimalist on one side, measured on the other.",
  },
];

export default function VsTokenmaxxingPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs tokenmaxxing.sh", path: "/vs/tokenmaxxing" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs tokenmaxxing.sh — Spend Board vs Efficiency Score",
            description:
              "tokenmaxxing.sh is the minimalist spend leaderboard. SigRank scores whether the spend compounded. The honest counter vs the efficiency layer.",
            path: "/vs/tokenmaxxing",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs tokenmaxxing.sh"
        title="The Cleanest Board vs the Scored One"
        subtitle={
          <>
            tokenmaxxing.sh does one thing well: a minimalist leaderboard of
            who spent and burned the most. SigRank asks the next question —{" "}
            <span className="text-gold">did it compound?</span>
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: tokenmaxxing.sh
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a
            href="https://tokenmaxxing.sh"
            target="_blank"
            rel="noopener"
            className="text-gold underline underline-offset-2"
          >
            tokenmaxxing.sh
          </a>{" "}
          (by 851-labs) is the minimalist entry in the token-board category:
          install the CLI, sync your ccusage totals, appear on a public board
          ranked by spend or tokens across 7-day, 30-day, and all-time windows.
          No badges, no profiles, no extra machinery — just a clean table of
          who consumed the most. There is a real appeal in that simplicity.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the same telemetry and scores it. The headline metric,
          <strong className="text-text-primary">
            {" "}Υ = cache_read × output / input²
          </strong>
          , separates the operator whose spend compounds from the one whose
          spend just accumulates. tokenmaxxing.sh is the honest counter;
          SigRank is the evaluation layer on top of it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Not to be confused with{" "}
          <Link
            href="/vs/tokenmaxxer"
            className="text-gold underline underline-offset-2"
          >
            tokenmaxxer
          </Link>
          , a different (gamified) product in the same category.
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
                  tokenmaxxing.sh
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.other}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why minimalism isn't the whole story */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Where minimalism ends
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A spend board answers <em>&quot;who consumed the most?&quot;</em>{" "}
          accurately and without pretension — which is more than most
          leaderboards can say. What it cannot tell you is whether the
          consumption was good. Two operators with identical spend can sit
          ten-fold apart in output-per-input. The counter cannot see the gap
          because the counter only counts.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s Υ Yield makes the gap visible: cache reuse and output
          amplify the score while fresh input penalizes it quadratically. The
          operator who compounds cached context outranks the one who re-sends
          it every turn — same spend, different skill. tokenmaxxing.sh gives
          you the ledger; SigRank tells you what the ledger means.
        </p>
      </section>

      {/* Upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From spend to yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If your usage is already syncing, SigRank reads the same telemetry
          and adds the scoring layer:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Or skip the CLI and paste your token counts into the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          — Υ Yield, class tier, and compression ratio instantly.
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
          See what the spend became
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep the minimalist board for the spend contest. Add the efficiency
          score that turns the same numbers into a ranking worth defending.
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
            href="/vs/tokenmaxxer"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs tokenmaxxer
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
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            The Yield Metric
          </Link>
        </p>
      </section>
    </div>
  );
}
