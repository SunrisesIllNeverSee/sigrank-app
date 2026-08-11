/**
 * app/vs/tokentracker/page.tsx — "SigRank vs Token Tracker" SEO comparison page.
 *
 * Angle: Token Tracker (tokentracker.cc) has the widest tool coverage (29 tools)
 * with desktop widgets and native apps. But it tracks volume, not efficiency.
 * SigRank measures cascade efficiency. Tracking tokens vs measuring skill.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs Token Tracker \u2014 Efficiency vs Tracking",
  description:
    "Token Tracker monitors 29 AI coding tools with desktop widgets. SigRank measures cascade efficiency with Yield. Tracking tokens vs measuring skill.",
  path: "/vs/tokentracker",
});

const COMPARE_ROWS: { feature: string; tokentracker: string; sigrank: string }[] = [
  {
    feature: "What it measures",
    tokentracker: "Token counts and cost across 29 tools",
    sigrank: "Token cascade efficiency (Yield, Leverage, SNR, Velocity)",
  },
  {
    feature: "Headline metric",
    tokentracker: "Total tokens consumed + dollars spent",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "What it tells you",
    tokentracker: "How much you spent across all your tools",
    sigrank: "How efficiently you use AI: are tokens compounding?",
  },
  {
    feature: "Tool coverage",
    tokentracker: "29 AI coding tools (widest coverage)",
    sigrank: "19+ AI coding agents with dedicated adapters",
  },
  {
    feature: "Cascade efficiency score (Yield)",
    tokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    tokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Build archetype (10 types)",
    tokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    tokentracker: "Opt-in leaderboard (by volume)",
    sigrank: "Yes: ranked by Yield efficiency",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    tokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    tokentracker: "No",
    sigrank: "Yes",
  },
  {
    feature: "Desktop widgets + native apps",
    tokentracker: "Yes (macOS, Windows, desktop pet)",
    sigrank: "No (CLI + web)",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    tokentracker: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a Token Tracker alternative?",
    answer:
      "They serve different purposes. Token Tracker is the widest token monitoring tool: 29 AI coding tools, desktop widgets, native macOS and Windows apps, even a desktop pet. It excels at showing you what you spent across every tool you use. SigRank is the efficiency layer: it reads the same token logs and computes whether those tokens were well spent. If you want monitoring across many tools, Token Tracker is excellent. If you want to know whether you are actually good at using AI, SigRank answers that.",
  },
  {
    question: "What does Token Tracker not measure that SigRank does?",
    answer:
      "Token Tracker reports raw token counts and cost per tool. SigRank derives the cascade architecture from those counts: Yield (cache_read times output divided by input squared), compression ratio, SNR, Leverage, and Velocity. Token Tracker tells you how much you spent across 29 tools. SigRank tells you whether your token cascade is compounding signal or burning tokens. The same 50K input tokens can produce 30K output with high cache reuse or 3K output with zero reuse. Token Tracker sees the same number either way. SigRank sees the 10x difference.",
  },
  {
    question: "Can I use both Token Tracker and SigRank?",
    answer:
      "Yes. Token Tracker is a monitoring tool; SigRank is a measurement and ranking tool. Run Token Tracker for the desktop widgets and multi-tool cost overview. Run `npx sigrank` to get your Yield score, build archetype, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. Many operators use a tracker for day-to-day monitoring and SigRank for efficiency scoring and leaderboard submission.",
  },
  {
    question: "Which is better for multi-tool workflows?",
    answer:
      "Token Tracker has wider tool coverage today (29 tools vs 19+). If you use many different AI coding agents and want a unified cost dashboard, Token Tracker is the better monitoring tool. If you want to know how efficiently you use those tools and where you rank against other operators, SigRank is the only one that answers that. The widest coverage does not help if the metric is volume instead of efficiency.",
  },
  {
    question: "Does Token Tracker have a leaderboard?",
    answer:
      "Token Tracker has an opt-in leaderboard, but it ranks by token volume: who burned the most tokens. SigRank ranks by Yield efficiency: who compounded their tokens the best. A volume leaderboard rewards spending more. A yield leaderboard rewards spending better. The operator who burns 10M tokens to produce 1K output tops a volume leaderboard. The operator who uses 100K tokens to produce the same 1K output tops a yield leaderboard. Which one measures skill?",
  },
];

export default function VsTokentrackerPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Token Tracker", path: "/vs/tokentracker" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Token Tracker \u2014 Efficiency vs Tracking",
            description:
              "Token Tracker monitors 29 AI coding tools with desktop widgets. SigRank measures cascade efficiency with Yield. Tracking tokens vs measuring skill.",
            path: "/vs/tokentracker",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs Token Tracker"
        title="Tracking Tokens vs Measuring Skill"
        subtitle={
          <>
            Token Tracker has the widest tool coverage (29 tools) with desktop
            widgets and native apps. SigRank measures{" "}
            <span className="text-gold">cascade efficiency</span>. Tracking
            what you spent is useful. Knowing whether it was worth it is better.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Token Tracker
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token Tracker (tokentracker.cc) is a comprehensive token monitoring
          tool. It covers 29 AI coding tools, offers desktop widgets, native
          macOS and Windows apps, and even a desktop pet. For seeing what you
          spent across every tool you use, it is excellent. But it tracks{" "}
          <em>volume</em>: how many tokens you burned and how much you spent.
          SigRank tracks <strong className="text-text-primary">efficiency</strong>:
          how well those tokens were used.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The analogy: Token Tracker is the fuel gauge on your dashboard. It
          tells you how much fuel you have burned. SigRank is the MPG readout
          that tells you whether you are driving efficiently. Both matter. Only
          one tells you if you are a good driver.
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
                  Token Tracker
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
                    {r.tokentracker}
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
          Why tracking tokens is not enough
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token Tracker answers <em>&quot;how much did I spend across my
          tools?&quot;</em> That is useful for budgeting. But it does not tell
          you if you are <em>good</em> at using AI. Two operators can spend the
          same 50K input tokens and get wildly different outcomes. One reuses
          cached context efficiently and produces 30K output tokens. The other
          re-sends the same context every turn and produces 3K. Same spend, ten-fold
          difference in signal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            \u03A5 = cache_read \u00D7 output / input\u00B2
          </span>, measures exactly that gap. It rewards the operator who
          compounds cached context into output and penalizes the one who burns
          fresh input without leverage. Token Tracker gives you the four
          integers. SigRank tells you whether the cascade they describe is{" "}
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

      {/* The try-it path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          See your efficiency score
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already use Token Tracker, you have the raw token counts.
          SigRank reads the same logs and adds the efficiency layer:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank          # read your logs, show your cascade
npx sigrank me       # see your yield, archetype, and class tier
npx sigrank submit   # sign + publish to leaderboard`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to inspect before you submit? Run{" "}
          <span className="font-mono text-text-primary">
            sigrank me --dry-run
          </span>{" "}
          to see your scored payload locally, or paste your token counts into
          the{" "}
          <a href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </a>{" "}
          for an instant read.
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
          Keep your Token Tracker widgets. Add the scoring, the leaderboard,
          and the operator profile that turns those readings into a rank.
          Install SigRank and submit your first signed snapshot in under a
          minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your \u03A5 Yield
          </a>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
        </div>
      </section>

      {/* Cross-links */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/vs/ccusage"
            className="text-gold underline underline-offset-2"
          >
            vs ccusage
          </Link>
          {" \u00B7 "}
          <Link
            href="/vs/tokscale"
            className="text-gold underline underline-offset-2"
          >
            vs Tokscale
          </Link>
          {" \u00B7 "}
          <Link
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
          </Link>
          {" \u00B7 "}
          <Link
            href="/platforms"
            className="text-gold underline underline-offset-2"
          >
            Supported Platforms
          </Link>
        </p>
      </section>
    </div>
  );
}
