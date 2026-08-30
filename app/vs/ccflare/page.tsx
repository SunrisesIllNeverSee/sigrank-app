/**
 * app/vs/ccflare/page.tsx — "SigRank vs ccflare" SEO comparison page.
 *
 * Angle: ccflare visualizes consumption with pretty charts. SigRank scores
 * production. Charts of what you spent ≠ a score for what you produced.
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
  title: "SigRank vs ccflare",
  description:
    "ccflare visualizes Claude Code token consumption with pretty charts. SigRank scores production. Charts of what you spent is not a score for what you produced.",
  path: "/vs/ccflare",
});

// Comparison rows — feature-by-feature, ccflare vs SigRank.
const COMPARE_ROWS: { feature: string; ccflare: string; sigrank: string }[] = [
  {
    feature: "What it does",
    ccflare: "Visual dashboard for Claude Code token consumption",
    sigrank: "Scores operator cascade efficiency and ranks globally",
  },
  {
    feature: "Headline output",
    ccflare: "Charts of token consumption over time",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    ccflare: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    ccflare: "No (consumption charts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    ccflare: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    ccflare: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    ccflare: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccflare: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    ccflare: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    ccflare: "Claude Code only",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    ccflare: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccflare: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a ccflare alternative?",
    answer:
      "They serve different purposes. ccflare is a visual dashboard for Claude Code usage — pretty charts of token consumption over time. It is excellent at visualization: you see your spending as graphs, trends, and heat maps. SigRank is a scoring layer: it takes the same token telemetry and computes cascade efficiency (Υ Yield), assigns a class tier, and ranks operators globally. ccflare visualizes what you spent; SigRank scores what you produced. Charts of consumption is not a score for production.",
  },
  {
    question: "Why is visualizing consumption not the same as scoring production?",
    answer:
      "Consumption charts show you what you spent — input tokens, output tokens, cost over time. They are backward-looking accounting visualizations. A production score tells you how efficiently you converted that spend into signal. Two operators can have identical consumption charts and wildly different yields. One reuses cached context efficiently; the other re-sends it every turn. The charts look the same; the yield is ten-fold different. ccflare shows the chart; SigRank shows the score.",
  },
  {
    question: "What does ccflare not measure that SigRank does?",
    answer:
      "ccflare visualizes token consumption as charts. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). ccflare tells you what your spending looks like; SigRank tells you whether your cascade is compounding or burning. A chart is a visualization; a score is an evaluation.",
  },
  {
    question: "Can I use both ccflare and SigRank?",
    answer:
      "Yes. ccflare is a visualization tool; SigRank is a scoring and ranking tool. Run ccflare for the consumption charts and trend visualizations. Run `sigrank submit` to get your Yield score, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. Many operators use a visualizer for day-to-day awareness and SigRank for efficiency scoring and leaderboard submission.",
  },
  {
    question: "Does ccflare work with tools other than Claude Code?",
    answer:
      "No. ccflare is a Claude Code usage dashboard — it reads Claude Code logs specifically. SigRank is platform-neutral: it works across Claude Code, Cursor, GitHub Copilot, ChatGPT, Gemini, and 15+ other platforms. If you only use Claude Code, ccflare is fine for consumption visualization. If you use multiple tools and want a comparable efficiency score across all of them, SigRank is the answer.",
  },
];

export default function VsCcflarePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccflare", path: "/vs/ccflare" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccflare \u2014 Consumption Charts vs Production Scores",
            description: "ccflare visualizes Claude Code token consumption with pretty charts. SigRank scores production. Charts of what you spent is not a score for what you produced.",
            path: "/vs/ccflare",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs ccflare"
        title="Charts of What You Spent Is Not a Score for What You Produced"
        subtitle={
          <>
            ccflare visualizes consumption with pretty charts. SigRank{" "}
            <span className="text-gold">scores production</span>. A chart is a
            visualization; a score is an evaluation. Both matter. Only one tells
            you if you are winning.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccflare
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccflare is a visual dashboard for Claude Code usage. It renders your
          token consumption as pretty charts — graphs, trends, heat maps of
          what you spent over time. It does the visualization layer well:
          clean, attractive, easy to read. But visualization is not evaluation.
          <em> A chart of what you spent does not tell you if you are good at
          this.</em>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> how efficiently are you
          producing?</strong> The headline metric, Υ Yield = cache_read ×
          output / input², rewards the operator who reuses cached context
          efficiently and penalizes the one who burns fresh input without
          leverage. ccflare is the chart; SigRank is the score. Both matter.
          Only one tells you if you are winning.
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
                  ccflare
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
                    {r.ccflare}
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

      {/* Why charts aren't scores */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why consumption charts aren&apos;t production scores
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccflare answers <em>&quot;what does my token consumption look like
          over time?&quot;</em> That is a visualization, not an evaluation. Two
          operators can have identical consumption charts and wildly different
          yields. One reuses cached context efficiently and produces 30K output
          tokens; the other re-sends the same context every turn and produces
          3K. Same chart, ten-fold difference in signal. ccflare shows the same
          graph either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. ccflare gives you the chart; SigRank tells you
          whether the cascade it describes is{" "}
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
          From charts to scores
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run ccflare, you have the token telemetry. SigRank
          reads the same logs and adds the scoring layer visualizers never had:
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
          Keep your ccflare charts for the consumption visualization. Add the
          scoring, the leaderboard, and the operator profile that turns those
          charts into a rank. Install SigRank and submit your first signed
          snapshot in under a minute.
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
