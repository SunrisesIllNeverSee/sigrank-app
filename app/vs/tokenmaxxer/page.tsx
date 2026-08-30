/**
 * app/vs/tokenmaxxer/page.tsx — "SigRank vs tokenmaxxer" SEO comparison page.
 *
 * Angle: tokenmaxxer gamifies token burning with streaks and badges. SigRank
 * measures token efficiency. Maxxing tokens is the opposite of efficient
 * operating.
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
  title: "SigRank vs tokenmaxxer",
  description:
    "tokenmaxxer gamifies token burning with streaks and badges. SigRank measures token efficiency. Maxxing tokens is the opposite of efficient operating.",
  path: "/vs/tokenmaxxer",
});

// Comparison rows — feature-by-feature, tokenmaxxer vs SigRank.
const COMPARE_ROWS: { feature: string; tokenmaxxer: string; sigrank: string }[] = [
  {
    feature: "What it measures",
    tokenmaxxer: "Token burn with gamification (streaks, badges)",
    sigrank: "Cascade efficiency (Υ Yield, Leverage, SNR, Velocity)",
  },
  {
    feature: "Headline metric",
    tokenmaxxer: "Total tokens burned + streak count",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    tokenmaxxer: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    tokenmaxxer: "No (raw counts + badges)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    tokenmaxxer: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    tokenmaxxer: "Gamified board (burn-ranked)",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    tokenmaxxer: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    tokenmaxxer: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    tokenmaxxer: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    tokenmaxxer: "Claude Code focus",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    tokenmaxxer: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    tokenmaxxer: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a tokenmaxxer alternative?",
    answer:
      "They serve opposite goals. tokenmaxxer gamifies token burning — streaks, badges, and a culture of maxxing your token count. SigRank measures token efficiency: Υ = cache_read × output / input². If you want to gamify burning more tokens, tokenmaxxer is that. If you want to know how efficiently you operate AI, SigRank answers that. Maxxing tokens is the opposite of efficient operating.",
  },
  {
    question: "Why is tokenmaxxing the opposite of efficiency?",
    answer:
      "Tokenmaxxing rewards burning more tokens. Efficiency rewards burning fewer tokens for the same or better output. The two are diametrically opposed. An operator who burns 50M tokens to produce 3K output has a high tokenmaxxer score and a terrible yield. An operator who burns 5M tokens to produce 30K output has a low tokenmaxxer score and an excellent yield. Streaks and badges celebrate consumption; yield celebrates compounding. You cannot optimize for both at once.",
  },
  {
    question: "What does tokenmaxxer not measure that SigRank does?",
    answer:
      "tokenmaxxer reports total tokens burned, streaks, and badges. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). tokenmaxxer tells you how much you burned and how many days in a row; SigRank tells you whether your cascade is compounding or burning.",
  },
  {
    question: "Can I use both tokenmaxxer and SigRank?",
    answer:
      "Yes, but they pull in opposite directions. tokenmaxxer incentivizes burning more tokens to maintain streaks and earn badges. SigRank incentivizes burning fewer tokens more efficiently. If you want the gamification layer for motivation, keep tokenmaxxer. If you want the efficiency layer for skill measurement, run `sigrank submit`. The same local logs feed both. Just know that a high tokenmaxxer score and a high SigRank yield are not the same thing — they are often inversely correlated.",
  },
  {
    question: "Which is better for measuring AI operator skill?",
    answer:
      "SigRank. Gamified burn metrics reward consumption, not skill. An operator who re-sends the same context every turn to maintain a streak will have a high tokenmaxxer score and a low yield. An operator who compounds cached context efficiently will have a lower tokenmaxxer score and a higher yield. Yield filters out the noise of pure activity. If you want to measure skill, measure efficiency, not consumption.",
  },
];

export default function VsTokenmaxxerPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs tokenmaxxer", path: "/vs/tokenmaxxer" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs tokenmaxxer \u2014 Tokenmaxxing vs Token Efficiency",
            description: "tokenmaxxer gamifies token burning with streaks and badges. SigRank measures token efficiency. Maxxing tokens is the opposite of efficient operating.",
            path: "/vs/tokenmaxxer",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs tokenmaxxer"
        title="Maxxing Tokens Is the Opposite of Efficiency"
        subtitle={
          <>
            tokenmaxxer gamifies token burning with streaks and badges. SigRank
            measures <span className="text-gold">token efficiency</span>. You
            cannot optimize for burning more and burning less at the same time.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: tokenmaxxer
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          tokenmaxxer is a token tracking tool with gamification built around
          the tokenmaxxing culture. It tracks Claude Code usage and awards
          streaks and badges for burning tokens. The premise is simple and
          fun: <em>burn more tokens, earn more badges, keep your streak
          alive</em>. But that premise inverts the goal of efficient operating.
          Burning more tokens to maintain a streak is the opposite of
          compounding cached context into high-yield output.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> how efficiently are you
          compounding?</strong> The headline metric, Υ Yield = cache_read ×
          output / input², rewards the operator who reuses cached context
          efficiently and penalizes the one who burns fresh input without
          leverage. tokenmaxxer gamifies the fuel gauge; SigRank measures the
          MPG. Both are fun. Only one tells you if you are a good driver.
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
                  tokenmaxxer
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
                    {r.tokenmaxxer}
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

      {/* Why gamifying burn inverts efficiency */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why gamifying burn inverts efficiency
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          tokenmaxxer answers <em>&quot;how many tokens did I burn and how many
          days in a row?&quot;</em> That is a gamified consumption metric. The
          problem is that efficiency rewards burning <em>fewer</em> tokens for
          the same output, while tokenmaxxing rewards burning <em>more</em>.
          The two goals are diametrically opposed. An operator who re-sends
          context every turn to keep a streak alive will have a high tokenmaxxer
          score and a terrible yield. An operator who compounds cached context
          will have a lower tokenmaxxer score and an excellent yield.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh
          input without leverage. tokenmaxxer gives you the burn count and the
          badge collection; SigRank tells you whether the cascade they describe
          is <em>compounding or burning</em>.
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
          From maxxing to measuring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run tokenmaxxer, you have the token counts. SigRank
          reads the same telemetry and adds the efficiency layer gamified burn
          metrics never had:
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
          Keep your tokenmaxxer badges for the gamification crowd. Add the
          efficiency layer that burn metrics cannot provide. Install SigRank
          and submit your first signed snapshot in under a minute.
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
