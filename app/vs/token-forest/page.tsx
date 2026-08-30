/**
 * app/vs/token-forest/page.tsx — "SigRank vs token-forest" SEO comparison page.
 *
 * Angle: token-forest tracks token growth with a forest metaphor. SigRank
 * measures cascade yield. Counting trees ≠ measuring the forest's yield.
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
  title: "SigRank vs token-forest",
  description:
    "token-forest tracks AI token usage with a forest/growth metaphor. SigRank measures cascade yield. Counting trees is not measuring the forest's yield.",
  path: "/vs/token-forest",
});

// Comparison rows — feature-by-feature, token-forest vs SigRank.
const COMPARE_ROWS: { feature: string; tokenforest: string; sigrank: string }[] = [
  {
    feature: "What it does",
    tokenforest: "Tracks AI token usage with a forest/growth metaphor",
    sigrank: "Scores operator cascade efficiency and ranks globally",
  },
  {
    feature: "Headline metric",
    tokenforest: "Token count visualized as tree/forest growth",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    tokenforest: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    tokenforest: "No (growth metaphor)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    tokenforest: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    tokenforest: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    tokenforest: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    tokenforest: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    tokenforest: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    tokenforest: "Limited tool coverage",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    tokenforest: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    tokenforest: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a token-forest alternative?",
    answer:
      "They serve different layers. token-forest is a token tracking tool with a forest/growth metaphor — it visualizes your AI token usage as trees growing in a forest. It is a creative, engaging way to see your token consumption over time. SigRank is a scoring layer: it takes the same token telemetry and computes cascade efficiency (Υ Yield), assigns a class tier, and ranks operators globally. token-forest counts the trees; SigRank measures the forest's yield. Counting trees is not measuring yield.",
  },
  {
    question: "Why is counting trees not measuring the forest's yield?",
    answer:
      "Counting trees measures how many tokens you consumed — the size of your forest. Measuring yield measures how efficiently those tokens compounded into signal — the harvest per acre. Two operators can grow forests of the same size and have wildly different yields. One reuses cached context efficiently and produces 30K output tokens; the other re-sends the same context every turn and produces 3K. Same forest, ten-fold difference in yield. token-forest sees the same tree count either way.",
  },
  {
    question: "What does token-forest not measure that SigRank does?",
    answer:
      "token-forest visualizes token usage as forest growth. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). token-forest tells you how big your forest is; SigRank tells you whether your cascade is compounding or burning. Tree count is volume; yield is efficiency.",
  },
  {
    question: "Can I use both token-forest and SigRank?",
    answer:
      "Yes. token-forest is a tracking and visualization tool; SigRank is a scoring and ranking tool. Run token-forest for the forest metaphor and growth visualization. Run `sigrank submit` to get your Yield score, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. Many operators use a tracker for day-to-day awareness and SigRank for efficiency scoring and leaderboard submission.",
  },
  {
    question: "Does token-forest have a leaderboard?",
    answer:
      "No. token-forest is a personal token tracking tool — it shows you your own token usage visualized as forest growth. It does not rank operators against each other. SigRank is a public leaderboard: it ranks operators globally by cascade yield, with signed snapshots and verified identities. token-forest is for your own tracking; SigRank is for competition. The first is a garden journal; the second is a leaderboard.",
  },
];

export default function VsTokenForestPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs token-forest", path: "/vs/token-forest" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs token-forest \u2014 Token Counting vs Cascade Yield",
            description: "token-forest tracks AI token usage with a forest/growth metaphor. SigRank measures cascade yield. Counting trees is not measuring the forest's yield.",
            path: "/vs/token-forest",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs token-forest"
        title="Counting Trees Is Not Measuring the Forest's Yield"
        subtitle={
          <>
            token-forest tracks token growth with a forest metaphor. SigRank
            measures <span className="text-gold">cascade yield</span>. A forest
            is bigger than its tree count. Yield is what the forest produces.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: token-forest
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          token-forest is a token tracking tool with a forest and growth
          metaphor. It visualizes your AI token usage as trees growing in a
          forest — a creative, engaging way to see your consumption over time.
          The metaphor is appealing: <em>your tokens are trees, your usage is
          a forest</em>. But counting trees measures how many tokens you
          consumed, not how efficiently they compounded into signal. A bigger
          forest is not a better harvest.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> what is the forest&apos;s
          yield?</strong> The headline metric, Υ Yield = cache_read × output /
          input², rewards the operator who reuses cached context efficiently
          and penalizes the one who burns fresh input without leverage.
          token-forest counts the trees; SigRank measures the harvest. Both
          matter. Only one tells you if you are winning.
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
                  token-forest
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
                    {r.tokenforest}
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

      {/* Why counting trees isn't measuring yield */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why counting trees isn&apos;t measuring yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          token-forest answers <em>&quot;how many tokens did I consume,
          visualized as forest growth?&quot;</em> That is a creative counting
          metric, not an efficiency metric. Two operators can grow forests of
          the same size and have wildly different yields. One reuses cached
          context efficiently and produces 30K output tokens; the other
          re-sends the same context every turn and produces 3K. Same forest,
          ten-fold difference in yield. token-forest sees the same tree count
          either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. token-forest gives you the tree count; SigRank tells
          you whether the cascade it describes is{" "}
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
          From tree count to yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run token-forest, you have the token counts. SigRank
          reads the same telemetry and adds the scoring layer growth metaphors
          never had:
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
          Keep your token-forest visualization for the growth metaphor. Add
          the scoring, the leaderboard, and the operator profile that turns
          that tree count into a rank. Install SigRank and submit your first
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
