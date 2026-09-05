/**
 * app/vs/ai-productivity-dashboards/page.tsx — "SigRank vs AI Productivity
 * Dashboards" SEO page.
 *
 * Angle: AI productivity dashboards (Vercel AI SDK dashboard, OpenAI usage
 * dashboard, Anthropic console) show usage metrics — tokens consumed, cost
 * incurred, requests made. They are observability/reporting tools. SigRank is
 * a competitive leaderboard that scores OPERATORS by token cascade efficiency
 * (Υ Yield) and ranks them against each other. Dashboards show what you spent;
 * SigRank scores how well you spent it.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs AI Productivity Dashboards \u2014 Dashboards vs Competition",
  description:
    "AI productivity dashboards show what you spent. SigRank scores how well you spent it. Dashboards report usage; SigRank ranks operators by cascade efficiency. Dashboards vs competition.",
  path: "/vs/ai-productivity-dashboards",
});

const COMPARE_ROWS: {
  feature: string;
  dashboards: string;
  sigrank: string;
}[] = [
  {
    feature: "What it measures",
    dashboards: "Usage \u2014 tokens consumed, cost incurred, requests made",
    sigrank: "Efficiency \u2014 token cascade efficiency (\u03a5 Yield)",
  },
  {
    feature: "Ranking / competition",
    dashboards: "No \u2014 reporting only, no leaderboard",
    sigrank: "Yes \u2014 competitive operator leaderboard",
  },
  {
    feature: "Operator profiles",
    dashboards: "No \u2014 account-level usage, no operator identity",
    sigrank: "Yes \u2014 per-operator profiles + head-to-head compare",
  },
  {
    feature: "Privacy-preserving (no prompt content)",
    dashboards: "Partial \u2014 some read content for analytics",
    sigrank: "Yes \u2014 token counts only, ed25519-signed",
  },
  {
    feature: "Platform-neutral (15+ AI tools)",
    dashboards: "No \u2014 locked to one provider\u2019s dashboard",
    sigrank: "Yes \u2014 any tool, any model, any provider",
  },
  {
    feature: "Class tiers (IGNITER to ARCH+)",
    dashboards: "No",
    sigrank: "Yes",
  },
  {
    feature: "Published science (Conservation Law, DOI)",
    dashboards: "No \u2014 internal usage analytics",
    sigrank: "Yes (DOI: 10.5281/zenodo.20029607)",
  },
  {
    feature: "MCP server for agent integration",
    dashboards: "No",
    sigrank: "Yes",
  },
  {
    feature: "Reproducible from your own logs",
    dashboards: "Partial \u2014 depends on provider\u2019s export",
    sigrank: "Yes \u2014 on-device scanner, signed snapshots",
  },
  {
    feature: "Scores the operator, not the account",
    dashboards: "No \u2014 aggregates account spend",
    sigrank: "Yes \u2014 ranks the operator driving the AI",
  },
  {
    feature: "Cross-provider comparison",
    dashboards: "No \u2014 one dashboard per vendor",
    sigrank: "Yes \u2014 operators compared across all platforms",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question:
      "What is the difference between AI productivity dashboards and SigRank?",
    answer:
      "AI productivity dashboards \u2014 like the Vercel AI SDK dashboard, OpenAI usage dashboard, and Anthropic console \u2014 are observability tools. They show what you spent: tokens consumed, cost incurred, requests made, latency. They report usage. SigRank is a competitive leaderboard. It scores OPERATORS by token cascade efficiency (\u03a5 = cache_read \u00d7 output / input\u00b2) and ranks them against each other. Dashboards show what you spent; SigRank scores how well you spent it. One is a mirror, the other is a scoreboard.",
  },
  {
    question: "Is SigRank a dashboard alternative?",
    answer:
      "No \u2014 SigRank is not a dashboard replacement. Dashboards are excellent at what they do: showing you your spend, your request volume, your error rates. You should keep using them. SigRank answers a question dashboards cannot: &quot;given what I spent, how efficiently did I drive?&quot; A dashboard tells you the bill; SigRank tells you whether you drove well enough to climb the leaderboard. They are complementary \u2014 the dashboard reports, SigRank ranks.",
  },
  {
    question: "Why competition instead of just monitoring?",
    answer:
      "Because monitoring without a benchmark is a treadmill. You can watch your token spend drop 20% and feel good \u2014 until you learn that operators on the same task achieve 3\u00d7 your \u03a5 Yield with half the input. A dashboard has no reference point; it only shows you yourself. SigRank gives you the field: where you rank, who is ahead, what cascade shape they use, and what class tier you qualify for. Competition creates the signal that pure monitoring cannot \u2014 it tells you whether your numbers are good or merely yours.",
  },
  {
    question: "Can dashboards and SigRank work together?",
    answer:
      "Yes, and they should. Dashboards give you the raw usage data \u2014 tokens in, tokens out, cost per request. SigRank takes the same token integers and computes \u03a5 Yield, assigns a class tier, and places you on the leaderboard. The dashboard is the sensor; SigRank is the scoreboard. Many operators run their provider dashboard for day-to-day spend tracking and submit a signed snapshot to SigRank when they want to see where they rank. No conflict \u2014 just two different questions answered by the same token counts.",
  },
  {
    question: "What makes SigRank different from just tracking token usage?",
    answer:
      "Tracking token usage gives you a number. SigRank gives you a score and a rank. A dashboard says &quot;you used 1.2M tokens this week.&quot; SigRank says &quot;your \u03a5 Yield is 47.3, you qualify for the BUILDER class, you rank 142nd, and the operator at rank 12 achieves 8\u00d7 your cache reuse on similar input.&quot; The difference is a reference frame. Usage tracking is absolute and isolated; SigRank is relative and competitive. The cascade metric \u03a5 = cache_read \u00d7 output / input\u00b2 turns four token integers into a single efficiency score that is comparable across operators, models, and platforms \u2014 something no single-provider dashboard can do.",
  },
];

export default function VsAiProductivityDashboardsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            {
              name: "SigRank vs AI Productivity Dashboards",
              path: "/vs/ai-productivity-dashboards",
            },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title:
              "SigRank vs AI Productivity Dashboards — Dashboards vs Competition",
            description:
              "AI productivity dashboards show what you spent. SigRank scores how well you spent it. Dashboards report usage; SigRank ranks operators by cascade efficiency.",
            path: "/vs/ai-productivity-dashboards",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs AI Productivity Dashboards"
        title="Dashboards vs Competition"
        subtitle={
          <>
            AI productivity dashboards show{" "}
            <span className="text-gold">what you spent</span>. SigRank scores{" "}
            <span className="text-gold">how well you spent it</span>. Dashboards
            report usage; SigRank ranks operators.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: AI productivity dashboards
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The Vercel AI SDK dashboard, OpenAI usage dashboard, and Anthropic
          console are observability tools. They show tokens consumed, cost
          incurred, requests made, latency p95. They answer{" "}
          <em>what did I spend?</em> — and they answer it well. If you want to
          watch your bill, a dashboard is the right tool.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank answers a different question:{" "}
          <strong className="text-text-primary">
            given what I spent, how well did I drive?
          </strong>{" "}
          It scores operators by token cascade efficiency (Υ Yield) and ranks
          them against each other on a competitive leaderboard. A dashboard is a
          mirror — it shows you yourself. SigRank is a scoreboard — it shows you
          the field. Dashboards show what you spent; SigRank scores how well you
          spent it.
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
                  AI Productivity Dashboards
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
                    {r.dashboards}
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

      {/* Mirror vs scoreboard */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          A mirror, not a scoreboard
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A dashboard is a mirror. It reflects your own usage back at you —
          tokens in, tokens out, dollars spent. It has no reference point beyond
          your own history. You can watch your spend drop 20% and feel good,
          until you learn that operators on the same task achieve 3× your Υ
          Yield with half the input. The mirror never told you that, because the
          mirror has no field.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is a scoreboard. It takes the same four token integers your
          dashboard already tracks — input, output, cache-read, cache-write —
          and computes{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          . Then it places that score on a leaderboard next to every other
          operator who submitted a signed snapshot. The cascade metric is
          model-agnostic and platform-neutral, so an operator on Claude can be
          compared to an operator on GPT on the efficiency axis. No
          single-provider dashboard can do that — they are locked to one
          vendor&apos;s view.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Same spend, different scores
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            Two operators, both billed 1.2M tokens this week. The dashboard
            shows identical usage for both. But one reused cached context (high
            cache_read, low input) and converted efficiently (high output) — Υ
            ≈ 180. The other re-sent everything every turn (low cache_read,
            high input) and produced less — Υ ≈ 12. Same spend. Same dashboard
            number. Wildly different driving. Only SigRank distinguishes them.
          </p>
        </div>
      </section>

      {/* Science section */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Grounded in published science
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Dashboards are internal analytics — useful, but not peer-reviewed and
          not portable across providers. SigRank&apos;s scoring is grounded in
          published science — the Conservation Law of Commitment (DOI:{" "}
          <a
            href="https://doi.org/10.5281/zenodo.20029607"
            className="text-gold underline underline-offset-2"
          >
            10.5281/zenodo.20029607
          </a>
          ) — with a governance framework (MO§ES™, patent pending) enforcing
          submission integrity. Every score is reproducible from your own logs;
          every snapshot is ed25519-signed. No dashboard offers that.
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
          Your dashboard shows what you spent. SigRank shows how well you spent
          it.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your dashboard for spend tracking. Add SigRank for the
          leaderboard. Install the CLI, submit a signed snapshot, and see where
          you rank among operators — not just what you owe.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the operator leaderboard
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/vs/lmsys-arena"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs LMSYS Arena
          </Link>
          {" · "}
          <Link
            href="/vs/langfuse"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Langfuse
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
        </p>
      </section>
    </div>
  );
}
