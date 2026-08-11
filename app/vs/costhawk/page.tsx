/**
 * app/vs/costhawk/page.tsx — "SigRank vs CostHawk" SEO comparison page.
 *
 * Angle: CostHawk (costhawk.ai) has an anonymized AI tools leaderboard with
 * privacy-first positioning. Tracks Claude Code, Codex, Cursor. Ranks by total
 * token consumption. SigRank ranks by Yield efficiency. Consumption counts.
 * Efficiency matters.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs CostHawk \u2014 Yield vs Consumption",
  description:
    "CostHawk has an anonymized AI tools leaderboard ranked by total token consumption. SigRank ranks by Yield efficiency. Consumption counts. Efficiency matters.",
  path: "/vs/costhawk",
});

const COMPARE_ROWS: { feature: string; costhawk: string; sigrank: string }[] = [
  {
    feature: "What it measures",
    costhawk: "Total token consumption across AI tools",
    sigrank: "Token cascade efficiency (Yield, Leverage, SNR, Velocity)",
  },
  {
    feature: "Headline metric",
    costhawk: "Total tokens consumed",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "What it tells you",
    costhawk: "How much you consumed: volume only",
    sigrank: "How efficiently you use AI: are tokens compounding?",
  },
  {
    feature: "Leaderboard ranking",
    costhawk: "By total token consumption (anonymized)",
    sigrank: "By Yield efficiency (signed, verifiable)",
  },
  {
    feature: "Tools tracked",
    costhawk: "Claude Code, Codex, Cursor",
    sigrank: "19+ AI coding agents with dedicated adapters",
  },
  {
    feature: "Cascade efficiency score (Yield)",
    costhawk: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    costhawk: "No",
    sigrank: "Yes",
  },
  {
    feature: "Build archetype (10 types)",
    costhawk: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    costhawk: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    costhawk: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    costhawk: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    costhawk: "Yes (anonymized)",
    sigrank: "Yes (token counts only, never prompt content)",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a CostHawk alternative?",
    answer:
      "They overlap on privacy positioning but measure different things. CostHawk has an anonymized AI tools leaderboard that ranks by total token consumption. SigRank ranks by Yield efficiency. CostHawk tells you who consumed the most tokens. SigRank tells you who used tokens the best. If you want a privacy-first consumption leaderboard, CostHawk does that. If you want a privacy-first efficiency leaderboard, SigRank is the only one.",
  },
  {
    question: "What does CostHawk not measure that SigRank does?",
    answer:
      "CostHawk reports total token consumption. SigRank derives the cascade architecture from token counts: Yield (cache_read times output divided by input squared), compression ratio, SNR, Leverage, and Velocity. CostHawk sees the total. SigRank sees the structure. Two operators can consume the same total tokens with wildly different efficiency. One reuses cache and produces high output. The other burns fresh input and produces little. CostHawk ranks them the same. SigRank ranks them 10x apart.",
  },
  {
    question: "Can I use both CostHawk and SigRank?",
    answer:
      "Yes. CostHawk is a consumption leaderboard; SigRank is an efficiency leaderboard. They read from similar local session logs and do not conflict. Use CostHawk for anonymized consumption tracking across Claude Code, Codex, and Cursor. Use SigRank for efficiency scoring, build archetype classification, class tier assignment, and leaderboard ranking by Yield. Many operators use a consumption tracker for cost monitoring and SigRank for skill measurement.",
  },
  {
    question: "Which is better for privacy-conscious operators?",
    answer:
      "Both are privacy-preserving. CostHawk anonymizes its leaderboard. SigRank uses ed25519-signed submissions with token counts only: no prompts, no code, no transcripts. The difference is what they do with the privacy guarantee. CostHawk uses it to rank consumption anonymously. SigRank uses it to rank efficiency verifiably. Privacy without measurement is just anonymity. Privacy with efficiency measurement is a verifiable skill ranking.",
  },
  {
    question: "Why does CostHawk only track three tools?",
    answer:
      "CostHawk currently tracks Claude Code, Codex, and Cursor. SigRank supports 19+ AI coding agents with dedicated adapters, including Claude Code, Codex CLI, Gemini CLI, Copilot CLI, Amp, Qwen Code, Goose, OpenCode, Kilo CLI, Hermes Agent, Devin, OMP, Pi, OpenClaw, Droid, and Codebuff. If you use tools beyond the big three, SigRank has wider coverage. See /platforms for the full list.",
  },
];

export default function VsCosthawkPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs CostHawk", path: "/vs/costhawk" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs CostHawk \u2014 Yield vs Consumption",
            description:
              "CostHawk has an anonymized AI tools leaderboard ranked by total token consumption. SigRank ranks by Yield efficiency. Consumption counts. Efficiency matters.",
            path: "/vs/costhawk",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs CostHawk"
        title="Consumption Counts. Efficiency Matters."
        subtitle={
          <>
            CostHawk has a privacy-first anonymized leaderboard ranked by total
            token consumption. SigRank ranks by{" "}
            <span className="text-gold">Yield efficiency</span>. Both are
            privacy-preserving. Only one measures skill.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: CostHawk
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          CostHawk (costhawk.ai) is a privacy-first AI tools leaderboard. It
          tracks Claude Code, Codex, and Cursor, anonymizes operator data, and
          ranks by total token consumption. For seeing how much you consumed
          compared to others in a privacy-respecting way, it does the job. But
          it ranks by <em>volume</em>: who burned the most tokens. SigRank
          ranks by <strong className="text-text-primary">efficiency</strong>:
          who compounded their tokens the best.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The analogy: CostHawk is the odometer. It tells you how far you
          drove. SigRank is the MPG readout. It tells you how efficiently you
          drove. Both are privacy-preserving. Only one tells you if you are a
          good driver.
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
                  CostHawk
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
                    {r.costhawk}
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
          Why consumption is not efficiency
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          CostHawk answers <em>&quot;how much did I consume compared to
          others?&quot;</em> That is useful for benchmarking spend. But it does
          not tell you if you are <em>good</em> at using AI. Two operators can
          consume the same total tokens and get wildly different outcomes. One
          reuses cached context efficiently and produces 30K output tokens. The
          other re-sends the same context every turn and produces 3K. Same
          consumption, ten-fold difference in signal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            \u03A5 = cache_read \u00D7 output / input\u00B2
          </span>, measures exactly that gap. It rewards the operator who
          compounds cached context into output and penalizes the one who burns
          fresh input without leverage. CostHawk gives you the total. SigRank
          tells you whether the cascade that produced that total is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (SigRank reads these)
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
          If you already use CostHawk, you have the raw token counts. SigRank
          reads the same logs and adds the efficiency layer:
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
          Keep your CostHawk consumption tracking. Add the scoring, the
          leaderboard, and the operator profile that turns those readings into
          a rank. Install SigRank and submit your first signed snapshot in
          under a minute.
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
            href="/vs/clawdboard"
            className="text-gold underline underline-offset-2"
          >
            vs clawdboard
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
