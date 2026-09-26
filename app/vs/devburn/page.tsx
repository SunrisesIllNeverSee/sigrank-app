/**
 * app/vs/devburn/page.tsx — "SigRank vs DevBurn" SEO comparison page.
 *
 * Angle: DevBurn is the points-model leaderboard — sessions, turns, and
 * spend composed into a consistency-weighted score, Claude Code only
 * (auto-syncs via a stop hook). It is the friendliest onboarding in the
 * category. SigRank is the efficiency framework: what the sessions produced
 * per token, not just that they happened.
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
  title: "SigRank vs DevBurn — Activity Points vs Operator Evaluation",
  description:
    "DevBurn scores AI coding activity — sessions, turns, and spend with a consistency-rewarding formula, auto-synced via a Claude Code stop hook. SigRank evaluates the operator — Υ Yield, Leverage, SNR, class tiers, signed snapshots.",
  path: "/vs/devburn",
});

const COMPARE_ROWS: { feature: string; devburn: string; sigrank: string }[] = [
  {
    feature: "What the score is",
    devburn: "Points from sessions, turns, and spend — rewards consistency and depth",
    sigrank: "Υ Yield (cache_read × output / input²) — rewards efficiency",
  },
  {
    feature: "What counts toward rank",
    devburn: "Activity volume: sessions, turns, cost, streaks, active days",
    sigrank: "Cascade architecture: cache reuse compounding into output",
  },
  {
    feature: "Sync model",
    devburn: "Automatic — Claude Code stop hook, plus manual npx devburn sync",
    sigrank: "Signed snapshot submit (explicit, verifiable)",
  },
  {
    feature: "Efficiency metrics (Υ, SNR, Leverage, Velocity)",
    devburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Archetypes + class tiers",
    devburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Signed, verifiable submissions",
    devburn: "GitHub login + API ingest",
    sigrank: "ed25519-signed snapshots",
  },
  {
    feature: "MCP server for AI-agent integration",
    devburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Tool coverage",
    devburn: "Claude Code (Codex, Cursor, Gemini planned)",
    sigrank: "15+ platforms today",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    devburn: "Yes — open-source CLI, aggregate stats only",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is DevBurn a SigRank alternative?",
    answer:
      "They score different things on the same telemetry. DevBurn computes a points total from activity — sessions, turns, spend, active days — with a formula that deliberately rewards consistency and depth, and it auto-syncs through a Claude Code stop hook so there is zero friction. It is the friendliest onboarding in the category. SigRank scores a different quantity: Υ Yield measures whether the token cascade compounded into output or burned as repeated input. DevBurn tells you how much AI coding you did; SigRank tells you how well you did it.",
  },
  {
    question: "What is the difference between activity points and yield?",
    answer:
      "Activity points reward showing up and going deep — more sessions, more turns, more days means a higher score, which is a fair measure of engagement. Yield is indifferent to volume: Υ = cache_read × output / input² rises when cached context amplifies into output and falls when fresh input is burned without leverage. An operator with modest activity but high reuse can out-yield a heavy user. One measures how much you practice; the other measures how efficiently the practice converts.",
  },
  {
    question: "Can I use DevBurn and SigRank together?",
    answer:
      "Yes. DevBurn's stop-hook sync makes it the easiest daily pulse — install once and your activity accrues automatically. Add `sigrank submit` when you want the signed efficiency score on the global board. The automatic tracker plus the deliberate score.",
  },
  {
    question: "Which is better for cross-tool evaluation?",
    answer:
      "SigRank — DevBurn currently tracks Claude Code only (Codex, Cursor, and Gemini support are planned). SigRank reads telemetry across 15+ platforms today, so operators who split their work across tools get one composite score instead of a single-tool slice.",
  },
];

export default function VsDevburnPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs DevBurn", path: "/vs/devburn" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs DevBurn — Activity Points vs Operator Evaluation",
            description:
              "DevBurn scores AI coding activity — sessions, turns, spend, streaks via a stop-hook auto-sync. SigRank evaluates the operator — Υ Yield, Leverage, SNR, class tiers.",
            path: "/vs/devburn",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs DevBurn"
        title="Activity Counts Sessions. Yield Counts What They Produced."
        subtitle={
          <>
            DevBurn made the easiest leaderboard to join — a Claude Code stop
            hook syncs automatically, and its points reward consistency and
            depth. SigRank scores{" "}
            <span className="text-gold">the efficiency of every session</span>{" "}
            the points count.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: DevBurn
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a
            href="https://devburn.com"
            target="_blank"
            rel="noopener"
            className="text-gold underline underline-offset-2"
          >
            DevBurn
          </a>{" "}
          is the lowest-friction board in the category: sign in with GitHub,
          run <span className="font-mono text-text-primary">npx devburn
          setup</span>, and a Claude Code stop hook syncs your stats after
          every session — no manual step ever again. Its points formula
          combines sessions, turns, and spend to reward consistency and depth,
          and the open-source CLI shares only aggregate stats: token counts,
          costs, model names. Clean design, honest scope, and the smoothest
          onboarding flow of any board we reviewed.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same telemetry and computes the quantity activity
          points cannot express:{" "}
          <strong className="text-text-primary">
            Υ = cache_read × output / input²
          </strong>
          . Points answer &quot;how much did you do?&quot; — sessions, turns,
          streaks. Yield answers &quot;how efficiently did it compound?&quot;
          Both are worth tracking; they are different leaderboard questions.
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
                  DevBurn
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.devburn}</td>
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
          More sessions is not more skill
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A points model rewards the behavior it counts: sessions, turns,
          active days, streaks. That is a fair way to rank engagement, and
          DevBurn&apos;s stop-hook design means the leaderboard updates itself
          without anyone thinking about it. The ceiling is structural: an
          operator who runs many wasteful sessions can outscore one who runs
          few efficient ones, because the points never look inside the cascade.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank looks inside. Υ Yield reads the four token pillars and
          measures whether cached context compounded into output — Leverage,
          SNR, and Velocity describe the shape around it, archetypes classify
          the operating pattern, class tiers calibrate to scale, and the whole
          snapshot is ed25519-signed so the score is verifiable. Activity is
          the log; yield is the evaluation of the log.
        </p>
      </section>

      {/* Upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From points to yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          DevBurn already collects your stats. SigRank scores them:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Or paste token counts into the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          for an instant Υ Yield and class tier.
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
          Score what the sessions produced
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep the effortless activity tracking. Add the efficiency score that
          says whether the activity compounded.
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
            href="/vs/straude"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Straude
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
