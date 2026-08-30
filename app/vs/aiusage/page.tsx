/**
 * app/vs/aiusage/page.tsx — "SigRank vs aiusage" SEO comparison page.
 *
 * Angle: aiusage tracks API calls and token usage across providers. SigRank
 * scores operator skill. Counting calls is accounting; scoring cascades is
 * evaluation.
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
  title: "SigRank vs aiusage",
  description:
    "aiusage tracks API calls and token usage across providers. SigRank scores operator skill. Counting calls is accounting; scoring cascades is evaluation.",
  path: "/vs/aiusage",
});

// Comparison rows — feature-by-feature, aiusage vs SigRank.
const COMPARE_ROWS: { feature: string; aiusage: string; sigrank: string }[] = [
  {
    feature: "What it does",
    aiusage: "Tracks API calls and token usage across providers",
    sigrank: "Scores operator cascade efficiency and ranks globally",
  },
  {
    feature: "Headline metric",
    aiusage: "Total API calls + tokens consumed per provider",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    aiusage: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    aiusage: "No (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    aiusage: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    aiusage: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    aiusage: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    aiusage: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    aiusage: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    aiusage: "Multi-provider API tracking",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    aiusage: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    aiusage: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank an aiusage alternative?",
    answer:
      "They serve different layers. aiusage is a generic AI usage tracker — it counts API calls and token usage across providers. That is accounting: how many calls, how many tokens, how much cost. SigRank is an operator scoring layer: it takes the same token telemetry and computes cascade efficiency (Υ Yield), assigns a class tier, and ranks operators globally. aiusage tells you what you spent; SigRank tells you how efficiently you drove. Counting calls is accounting; scoring cascades is evaluation.",
  },
  {
    question: "What does aiusage not measure that SigRank does?",
    answer:
      "aiusage reports API call counts and token usage per provider. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). aiusage tells you how many calls you made; SigRank tells you whether your cascade is compounding or burning. Call count is volume; yield is efficiency.",
  },
  {
    question: "Why is counting API calls not the same as scoring operators?",
    answer:
      "Counting API calls measures volume, not skill. Two operators can make the same number of calls and burn the same tokens with wildly different outcomes. One reuses cached context efficiently and produces 30K output tokens; the other re-sends the same context every turn and produces 3K. Same call count, ten-fold difference in signal. aiusage sees the same number either way. SigRank sees the 10x difference. Accounting tells you what happened; evaluation tells you how good the operator is.",
  },
  {
    question: "Can I use both aiusage and SigRank?",
    answer:
      "Yes. aiusage is a usage tracker; SigRank is a scoring and ranking tool. Run aiusage for the multi-provider API accounting dashboard. Run `sigrank submit` to get your Yield score, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. Many operators use a usage tracker for day-to-day accounting and SigRank for efficiency scoring and leaderboard submission.",
  },
  {
    question: "Does aiusage have a leaderboard?",
    answer:
      "No. aiusage is a personal usage tracker — it shows you your own API calls and token consumption. It does not rank operators against each other. SigRank is a public leaderboard: it ranks operators globally by cascade yield, with signed snapshots and verified identities. aiusage is for your own accounting; SigRank is for competition. The first is a ledger; the second is a leaderboard.",
  },
];

export default function VsAiusagePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs aiusage", path: "/vs/aiusage" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs aiusage \u2014 Usage Counting vs Operator Scoring",
            description: "aiusage tracks API calls and token usage across providers. SigRank scores operator skill. Counting calls is accounting; scoring cascades is evaluation.",
            path: "/vs/aiusage",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs aiusage"
        title="Counting Calls Is Accounting. Scoring Cascades Is Evaluation."
        subtitle={
          <>
            aiusage tracks API calls and token usage across providers. SigRank
            <span className="text-gold"> scores operator skill</span>. Same
            data, different question. A ledger tells you what you spent; a score
            tells you how well you drove.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: aiusage
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          aiusage is a generic AI usage tracker. It counts API calls and token
          usage across providers — how many calls you made, how many tokens you
          consumed, how much it cost. It does the accounting layer well: clean
          numbers, multi-provider coverage, a dashboard of what you spent. But
          accounting is not evaluation. <em>Counting calls tells you what
          happened; it does not tell you if you are good at this.</em>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> how efficiently are you
          compounding?</strong> The headline metric, Υ Yield = cache_read ×
          output / input², rewards the operator who reuses cached context
          efficiently and penalizes the one who burns fresh input without
          leverage. aiusage is the ledger; SigRank is the scorecard. Both
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
                  aiusage
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
                    {r.aiusage}
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

      {/* Why counting calls isn't scoring */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why counting calls isn&apos;t scoring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          aiusage answers <em>&quot;how many API calls did I make and how many
          tokens did I consume?&quot;</em> That is accounting — useful for
          budgeting, useless for skill evaluation. Two operators can make the
          same number of calls and burn the same tokens with wildly different
          outcomes. One reuses cached context efficiently and produces 30K
          output tokens; the other re-sends the same context every turn and
          produces 3K. Same call count, ten-fold difference in signal. aiusage
          sees the same number either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. aiusage gives you the call count; SigRank tells you
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
          From accounting to evaluation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run aiusage, you have the token counts. SigRank reads
          the same telemetry and adds the scoring layer usage trackers never
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
          Ready to see your yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your aiusage dashboard for the accounting. Add the scoring, the
          leaderboard, and the operator profile that turns those readings into
          a rank. Install SigRank and submit your first signed snapshot in
          under a minute.
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
