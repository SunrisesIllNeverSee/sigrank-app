/**
 * app/vs/straude/page.tsx — "SigRank vs Straude" SEO comparison page.
 *
 * Angle: Straude is "Strava for AI coding" — pace, streaks, practice history.
 * It measures whether you showed up. SigRank measures how well you drove
 * when you did. Consistency tracking vs operator evaluation.
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
  title: "SigRank vs Straude — Practice History vs Operator Evaluation",
  description:
    "Straude is the Strava for AI coding — daily pace, streaks, and practice history from local agent logs. SigRank evaluates the operator behind the sessions — Υ Yield, Leverage, SNR, class tiers. Showing up vs driving well.",
  path: "/vs/straude",
});

const COMPARE_ROWS: { feature: string; straude: string; sigrank: string }[] = [
  {
    feature: "What it measures",
    straude: "Pace, streaks, practice history — the training log",
    sigrank: "Cascade yield (Υ) — how efficiently each session compounds",
  },
  {
    feature: "The metaphor",
    straude: "Strava — the activity feed for AI coding",
    sigrank: "The power meter — watts per kilogram, not miles logged",
  },
  {
    feature: "Efficiency metrics (Υ, SNR, Leverage, Velocity)",
    straude: "No — daily spend, volume, sessions, streaks",
    sigrank: "Yes",
  },
  {
    feature: "Archetypes + class tiers",
    straude: "No",
    sigrank: "Yes",
  },
  {
    feature: "Public profiles",
    straude: "Yes (shareable practice profiles)",
    sigrank: "Yes (scored operator profiles + compare)",
  },
  {
    feature: "Signed, verifiable submissions",
    straude: "Aggregate totals via open-source CLI",
    sigrank: "ed25519-signed snapshots",
  },
  {
    feature: "MCP server for AI-agent integration",
    straude: "No",
    sigrank: "Yes",
  },
  {
    feature: "Tool coverage",
    straude: "Claude Code, Codex, Gemini CLI, Qwen, Grok Build CLI (ccusage)",
    sigrank: "15+ platforms",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    straude: "Yes — prompts and code stay local",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is Straude a SigRank alternative?",
    answer:
      "They measure different axes of the same practice. Straude is the training log: it tracks whether you coded with AI today, your pace, your streaks, your history — the Strava model applied to token telemetry. It is privacy-first, ccusage-based, and genuinely well-positioned for the consistency question. SigRank is the evaluation layer: for each session, how efficiently did the token cascade compound? Straude answers 'did you train?'; SigRank answers 'how well did you drive?' The best answer is both.",
  },
  {
    question: "Why compare a practice tracker to an evaluation system?",
    answer:
      "Because they sit on the same telemetry and solve adjacent problems. Straude's streaks and pace metrics tell you about your practice consistency — genuinely useful, and the reason the Strava model works for fitness. But a streak measures showing up, not driving well. SigRank's Υ Yield (cache_read × output / input²) measures the quality of each session's cascade: whether cached context compounded into output or fresh input burned without leverage. Consistency gets you on the road; efficiency tells you how fast you are going.",
  },
  {
    question: "Can I use Straude and SigRank together?",
    answer:
      "Yes — and they complement each other well. Straude keeps your practice honest: streaks, daily pace, and the history that proves you are doing the work. SigRank scores the work itself: Υ Yield, Leverage, SNR, Velocity, your archetype, your class tier, and your rank against the field. The training log plus the power meter.",
  },
  {
    question: "Which is better for proving operator skill?",
    answer:
      "SigRank — streaks prove dedication, not efficiency. An operator can hold a 30-day streak while re-sending context wastefully every session; the streak looks identical either way. Υ Yield distinguishes the compounding cascade from the burning one. Straude is the better practice companion; SigRank is the better evidence of skill.",
  },
];

export default function VsStraudePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Straude", path: "/vs/straude" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Straude — Practice History vs Operator Evaluation",
            description:
              "Straude tracks pace, streaks, and practice history — the Strava model for AI coding. SigRank evaluates the operator behind the sessions — Υ Yield, Leverage, SNR, class tiers.",
            path: "/vs/straude",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Straude"
        title="The Training Log vs the Power Meter"
        subtitle={
          <>
            Straude tracks whether you showed up — pace, streaks, practice
            history. SigRank measures{" "}
            <span className="text-gold">how well you drove</span> when you did.
            Miles logged vs watts per kilogram.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Straude
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a
            href="https://straude.com"
            target="_blank"
            rel="noopener"
            className="text-gold underline underline-offset-2"
          >
            Straude
          </a>{" "}
          is a privacy-first activity tracker for AI-assisted coding — the
          Strava model applied to token telemetry. Its bundled ccusage release
          turns local agent logs (Claude Code, Codex, Gemini CLI, Qwen, Grok
          Build CLI) into a training log: daily spend, token volume, models
          used, session counts, streaks, and shareable public profiles.
          Prompts, conversations, and code never leave your machine. It is a
          clean take on the consistency question — and the practice-history
          framing is genuinely good.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the same four token pillars and asks the harder
          question:
          <strong className="text-text-primary">
            {" "}did the cascade compound?
          </strong>{" "}
          Υ Yield = cache_read × output / input² separates the session that
          built on cached context from the one that re-sent it. Straude keeps
          the streak alive; SigRank tells you whether the streak was worth
          keeping.
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
                  Straude
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.straude}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The distinction */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Consistency is not efficiency
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Straude&apos;s insight is that AI-assisted coding is a practice — and
          practices deserve logs, streaks, and pace. Correct. What a practice
          log cannot capture is session quality: two operators can both
          maintain a 30-day streak while one compounds cached context into
          high-yield output and the other burns fresh input every turn. The
          streaks look identical. The cascades are opposites.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s metric stack reads the shape Straude&apos;s log
          records: Υ Yield for the compounding question, Leverage for how much
          cache amplifies input, Velocity for throughput, SNR for signal
          density — plus the archetype that describes your operating pattern
          and the class tier that calibrates it to scale. In fitness terms:
          Straude is the activity feed, SigRank is the power meter and the
          VO2 max.
        </p>
      </section>

      {/* Upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From practice to evaluation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If Straude already tracks your sessions, adding the evaluation layer
          is one install:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Or paste your token counts into the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          for an instant Υ Yield, class tier, and compression ratio.
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
          Score the sessions you are already logging
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep the streak. Add the number that says whether it is compounding.
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
            href="/vs/tokenmaxxing"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs tokenmaxxing.sh
          </Link>
          {" · "}
          <Link
            href="/vs/ccrank"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs ccrank
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
