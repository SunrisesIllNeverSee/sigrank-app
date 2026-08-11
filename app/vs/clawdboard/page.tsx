/**
 * app/vs/clawdboard/page.tsx — "SigRank vs clawdboard" SEO comparison page.
 *
 * Angle: clawdboard has clean UI, streak gamification, "cooking" project
 * labels. Ranks by cost + tokens + streaks + active days. SigRank ranks by
 * cascade efficiency.
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
  title: "SigRank vs clawdboard \u2014 Cascade vs Streaks",
  description:
    "clawdboard ranks by cost, tokens, streaks, and active days. SigRank ranks by cascade efficiency. Streaks measure consistency; Yield measures skill.",
  path: "/vs/clawdboard",
});

// Comparison rows — feature-by-feature, clawdboard vs SigRank.
const COMPARE_ROWS: { feature: string; clawdboard: string; sigrank: string }[] = [
  {
    feature: "Reads Claude Code token logs",
    clawdboard: "Yes",
    sigrank: "Yes (bundles ccusage)",
  },
  {
    feature:
      "Token pillar breakdown (input / output / cache-read / cache-write)",
    clawdboard: "Yes",
    sigrank: "Yes",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    clawdboard: "No (ranks by cost + tokens + streaks)",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    clawdboard: "Partial (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    clawdboard: "No",
    sigrank: "Yes",
  },
  {
    feature: "Build archetype (10 types)",
    clawdboard: "No (\"cooking\" project labels)",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    clawdboard: "Yes (activity-ranked)",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    clawdboard: "Partial (profile pages)",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    clawdboard: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    clawdboard: "No",
    sigrank: "Yes",
  },
  {
    feature: "Streak / gamification tracking",
    clawdboard: "Yes",
    sigrank: "No (ranks skill, not attendance)",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    clawdboard: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a clawdboard alternative?",
    answer:
      "They overlap on data but diverge on the ranking axis. clawdboard aggregates token usage, adds streak gamification and \"cooking\" project labels, and ranks by a blend of cost, tokens, streaks, and active days. SigRank takes the same token telemetry and ranks by cascade efficiency: Υ = cache_read × output / input². If you want a habit tracker for AI coding, clawdboard is fun. If you want to know who is actually skilled, SigRank is the answer. You can run both, they read the same logs.",
  },
  {
    question: "What does clawdboard not measure that SigRank does?",
    answer:
      "clawdboard reports cost, token totals, streaks, and active days, then blends them into a composite rank. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). clawdboard rewards showing up; SigRank rewards driving well. Streaks measure consistency; Yield measures skill.",
  },
  {
    question: "Can I use both clawdboard and SigRank?",
    answer:
      "Yes, and they serve different purposes. clawdboard gives you the habit layer: streaks, active days, project labels, a clean UI that keeps you coming back. SigRank gives you the efficiency layer that streak counts cannot. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep clawdboard for the motivation loop. The same local logs feed both.",
  },
  {
    question: "Which is better for measuring AI coding skill?",
    answer:
      "SigRank. Streaks and active days measure attendance, not ability. An operator who shows up every day and re-sends the same context will have a perfect streak and a low Yield. An operator who shows up twice a week but compounds cached context into high-yield output will have a modest streak and a high Yield. If you want to find the best drivers, look at lap times, not how many days they showed up to the track.",
  },
  {
    question: "clawdboard has \"cooking\" project labels. Does SigRank track projects?",
    answer:
      "SigRank tracks build archetypes, not project nicknames. The 10 build archetypes (e.g. Greenfield, Refactor, Debug Cascade, Migration) classify the kind of work the operator is doing, derived from the cascade signature rather than a self-applied label. This makes archetypes comparable across operators: a Debug Cascade run on one machine means the same thing as a Debug Cascade run on another. \"Cooking\" labels are fun but not comparable.",
  },
];

export default function VsClawdboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs clawdboard", path: "/vs/clawdboard" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs clawdboard — Cascade vs Streaks",
            description: "clawdboard ranks by cost, tokens, streaks, and active days. SigRank ranks by cascade efficiency. Streaks measure consistency; Yield measures skill.",
            path: "/vs/clawdboard",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs clawdboard"
        title="Streaks Measure Consistency. Yield Measures Skill."
        subtitle={
          <>
            clawdboard has a clean UI, streak gamification, and &quot;cooking&quot;
            project labels. It ranks by cost, tokens, streaks, and active days.
            SigRank ranks by{" "}
            <span className="text-gold">cascade efficiency</span>. Showing up
            every day is good. Driving well is better.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: clawdboard
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          clawdboard aggregates token usage, layers on streak gamification and
          &quot;cooking&quot; project labels, and ranks operators by a blend of
          cost, tokens, streaks, and active days. It does the engagement layer
          well: clean UI, habit-forming streaks, a sense of progress. But it
          ranks by the wrong axis. <em>Streaks measure attendance, not
          ability.</em> An operator who shows up daily and re-sends the same
          context will have a perfect streak and a low signal-to-noise ratio.
          Higher streak, lower skill, higher rank.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same four token pillars and asks a different
          question: <strong className="text-text-primary">is the cascade
          compounding or burning?</strong> The headline metric, Υ Yield =
          cache_read × output / input², rewards the operator who reuses cached
          context efficiently and penalizes the one who burns fresh input
          without leverage. clawdboard counts the days; SigRank grades the
          driving. Both matter. Only one tells you who is skilled.
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
                  clawdboard
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
                    {r.clawdboard}
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
          Why streaks and active days aren&apos;t enough
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          clawdboard answers <em>&quot;how consistent am I?&quot;</em> That is
          a habit question, not a skill question. Two operators can have the
          same 30-day streak and get wildly different outcomes. One reuses
          cached context efficiently and produces 30K output tokens per
          session; the other re-sends the same context every turn and produces
          3K. Same streak, ten-fold difference in signal. On a streak
          leaderboard, they tie. On a Yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh
          input without leverage. clawdboard counts the days you showed up;
          SigRank tells you whether the cascade you ran was{" "}
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
          From streaks to Yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run clawdboard, you have the logs. SigRank reads the
          same telemetry and adds the efficiency layer streak rankings never
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
          Keep clawdboard for the streak loop. Add the efficiency layer that
          streak counts cannot provide. Install SigRank and submit your first
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
            href="/vs/wakatime"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs WakaTime
          </Link>
        </p>
      </section>
    </div>
  );
}
