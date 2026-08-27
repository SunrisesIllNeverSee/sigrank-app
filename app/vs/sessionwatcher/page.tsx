/**
 * app/vs/sessionwatcher/page.tsx — "SigRank vs sessionwatcher" SEO comparison page.
 *
 * Angle: sessionwatcher watches individual coding sessions. SigRank scores
 * operators. Watching one session ≠ ranking every operator.
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
  title: "SigRank vs sessionwatcher \u2014 Session Watching vs Operator Ranking",
  description:
    "sessionwatcher monitors individual Claude Code sessions for token usage. SigRank scores and ranks operators globally. Watching one session is not ranking every operator.",
  path: "/vs/sessionwatcher",
});

// Comparison rows — feature-by-feature, sessionwatcher vs SigRank.
const COMPARE_ROWS: { feature: string; sessionwatcher: string; sigrank: string }[] = [
  {
    feature: "What it does",
    sessionwatcher: "Monitors individual Claude Code sessions",
    sigrank: "Scores operators and ranks them globally",
  },
  {
    feature: "Scope",
    sessionwatcher: "Per-session token usage monitoring",
    sigrank: "Operator-level cascade efficiency across all sessions",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    sessionwatcher: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    sessionwatcher: "No (session-level counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    sessionwatcher: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    sessionwatcher: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    sessionwatcher: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    sessionwatcher: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    sessionwatcher: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    sessionwatcher: "Claude Code only",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    sessionwatcher: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    sessionwatcher: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a sessionwatcher alternative?",
    answer:
      "They operate at different scopes. sessionwatcher monitors individual Claude Code sessions for token usage — it watches one session at a time. SigRank scores operators across all their sessions and ranks them globally. sessionwatcher is a per-session monitor; SigRank is an operator-level scoring and ranking system. Watching one session is not the same as ranking every operator. You can run both — sessionwatcher for session-level awareness, SigRank for operator-level evaluation.",
  },
  {
    question: "Why is watching sessions not the same as ranking operators?",
    answer:
      "Watching a session tells you what happened in that one session — how many tokens were burned, what the breakdown was. Ranking an operator tells you how efficiently they compound across all their sessions, where they stand globally, and whether their cascade is compounding or burning. A session is a single lap; an operator is a driver across a season. sessionwatcher watches the lap; SigRank ranks the driver. Both matter. Only one tells you who is winning.",
  },
  {
    question: "What does sessionwatcher not measure that SigRank does?",
    answer:
      "sessionwatcher reports per-session token usage. SigRank derives the cascade architecture across an operator's entire body of work: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). sessionwatcher tells you what happened in one session; SigRank tells you whether the operator's cascade is compounding or burning across all of them.",
  },
  {
    question: "Can I use both sessionwatcher and SigRank?",
    answer:
      "Yes. sessionwatcher is a session-level monitor; SigRank is an operator-level scoring and ranking tool. Run sessionwatcher for per-session token usage awareness while you work. Run `sigrank submit` to get your Yield score, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. sessionwatcher is for watching sessions; SigRank is for ranking operators.",
  },
  {
    question: "Does sessionwatcher work with tools other than Claude Code?",
    answer:
      "No. sessionwatcher is a Claude Code session monitor — it reads Claude Code session logs specifically. SigRank is platform-neutral: it works across Claude Code, Cursor, GitHub Copilot, ChatGPT, Gemini, and 15+ other platforms. If you only use Claude Code, sessionwatcher is fine for session-level monitoring. If you use multiple tools and want a comparable operator-level score across all of them, SigRank is the answer.",
  },
];

export default function VsSessionwatcherPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs sessionwatcher", path: "/vs/sessionwatcher" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs sessionwatcher \u2014 Session Watching vs Operator Ranking",
            description: "sessionwatcher monitors individual Claude Code sessions for token usage. SigRank scores and ranks operators globally. Watching one session is not ranking every operator.",
            path: "/vs/sessionwatcher",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs sessionwatcher"
        title="Watching One Session Is Not Ranking Every Operator"
        subtitle={
          <>
            sessionwatcher monitors individual sessions. SigRank{" "}
            <span className="text-gold">scores and ranks operators</span>{" "}
            globally. A session is a single lap; an operator is a driver across
            a season.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: sessionwatcher
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          sessionwatcher is a session watcher for Claude Code. It monitors
          individual coding sessions for token usage — what you burned in this
          session, what the breakdown was. It does the per-session monitoring
          layer well: you see what happened in each session as it happens. But
          a session is a single lap, not a season. <em>Watching one session
          tells you what happened there; it does not tell you how good the
          operator is across all their work.</em>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes token telemetry across all of an operator&apos;s
          sessions and asks a different question:{" "}
          <strong className="text-text-primary">how efficiently does this
          operator compound?</strong> The headline metric, Υ Yield = cache_read
          × output / input², rewards the operator who reuses cached context
          efficiently and penalizes the one who burns fresh input without
          leverage. sessionwatcher watches the lap; SigRank ranks the driver.
          Both matter. Only one tells you who is winning.
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
                  sessionwatcher
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
                    {r.sessionwatcher}
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

      {/* Why watching sessions isn't ranking operators */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why watching sessions isn&apos;t ranking operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          sessionwatcher answers <em>&quot;what happened in this
          session?&quot;</em> That is per-session monitoring, not operator
          evaluation. Two operators can have identical session reports and
          wildly different efficiency. One reuses cached context efficiently
          and produces 30K output tokens; the other re-sends the same context
          every turn and produces 3K. Same session, ten-fold difference in
          signal. sessionwatcher sees the same report either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. sessionwatcher gives you the session report; SigRank
          tells you whether the operator&apos;s cascade is{" "}
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
          From session watching to operator ranking
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run sessionwatcher, you have the session telemetry.
          SigRank reads the same logs and adds the operator-level scoring layer
          session monitors never had:
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
          Ready to see your cascade?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your sessionwatcher for per-session awareness. Add the scoring,
          the leaderboard, and the operator profile that turns those sessions
          into a rank. Install SigRank and submit your first signed snapshot
          in under a minute.
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
