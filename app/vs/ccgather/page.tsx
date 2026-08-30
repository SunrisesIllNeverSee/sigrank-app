/**
 * app/vs/ccgather/page.tsx — "SigRank vs ccgather" SEO comparison page.
 *
 * Angle: ccgather ranks Claude Code users by usage stats. SigRank ranks operators
 * by yield across 15+ platforms. Claude Code only is not the whole field.
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
  title: "SigRank vs ccgather",
  description:
    "ccgather ranks Claude Code users by usage stats. SigRank ranks operators by cascade yield across 15+ platforms. Claude Code only is not the whole field.",
  path: "/vs/ccgather",
});

const COMPARE_ROWS: { feature: string; ccgather: string; sigrank: string }[] = [
  {
    feature: "What it ranks",
    ccgather: "Claude Code usage stats",
    sigrank: "Operator cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Platform coverage",
    ccgather: "Claude Code only",
    sigrank: "Claude Code, Cursor, Copilot, Gemini, 15+ platforms",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    ccgather: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    ccgather: "No (usage stats)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    ccgather: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    ccgather: "Partial (leaderboard profiles)",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccgather: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    ccgather: "No",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    ccgather: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccgather: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a ccgather alternative?",
    answer:
      "They overlap on having a leaderboard but diverge on scope and scoring. ccgather ranks Claude Code users by usage stats — how much you used Claude Code. SigRank ranks operators by cascade yield across 15+ platforms. If you want a Claude Code-only usage leaderboard, ccgather is that. If you want to know who is the most efficient AI operator across every platform, SigRank answers that. You can run both — they read the same Claude Code logs.",
  },
  {
    question: "Why is Claude Code-only not enough?",
    answer:
      "Most operators don't use just one tool. They drive Claude Code for some tasks, Cursor for others, Copilot for others. A Claude Code-only leaderboard misses everyone who isn't on Claude Code and can't compare operators across platforms. SigRank is platform-neutral: it reads telemetry from Claude Code, Cursor, Copilot, Gemini, and 15+ other tools, scores the cascade yield, and ranks every operator on the same scale. One tool is not the whole field.",
  },
  {
    question: "What does ccgather not measure that SigRank does?",
    answer:
      "ccgather reports Claude Code usage stats and ranks by them. SigRank reads the same four token pillars and derives the cascade architecture: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). ccgather tells you who used Claude Code the most; SigRank tells you who is the most efficient operator across every platform.",
  },
  {
    question: "Can I use both ccgather and SigRank?",
    answer:
      "Yes. ccgather gives you the Claude Code usage leaderboard. SigRank gives you the cross-platform yield ranking. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep ccgather for the Claude Code crowd. The two are complementary, not mutually exclusive. The same local logs feed both.",
  },
  {
    question: "Which is better for comparing operators across platforms?",
    answer:
      "SigRank. ccgather can only compare operators who use Claude Code. SigRank compares operators across Claude Code, Cursor, Copilot, Gemini, and 15+ other platforms on the same yield scale. If you want to know who is the best AI operator — not just the best Claude Code user — you need a platform-neutral ranking. ccgather is Claude Code only; SigRank is the whole field.",
  },
];

export default function VsCcgatherPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccgather", path: "/vs/ccgather" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccgather \u2014 Claude Code Leaderboard vs Cross-Platform Ranking",
            description: "ccgather ranks Claude Code users by usage stats. SigRank ranks operators by cascade yield across 15+ platforms. Claude Code only is not the whole field.",
            path: "/vs/ccgather",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs ccgather"
        title="Claude Code Only Isn't the Whole Field."
        subtitle={
          <>
            ccgather ranks Claude Code users by usage stats. SigRank ranks
            operators by <span className="text-gold">cascade yield across 15+
            platforms</span>. One tool is not the whole field.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccgather
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccgather is a leaderboard for Claude Code users. It gathers usage
          stats — how much you used Claude Code — and ranks users by them. It
          does its job: it <em>ranks the Claude Code crowd</em>. But most
          operators don&apos;t use just one tool. They drive Claude Code for
          some tasks, Cursor for others, Copilot for others. A Claude Code-only
          leaderboard misses everyone who isn&apos;t on Claude Code and
          can&apos;t compare operators across platforms.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is platform-neutral. It reads telemetry from Claude Code,
          Cursor, Copilot, Gemini, and 15+ other tools, scores the cascade
          yield, and ranks every operator on the same scale. The headline
          metric, Υ Yield = cache_read × output / input², rewards the operator
          who reuses cached context efficiently — no matter which tool they
          drove. ccgather ranks the Claude Code crowd; SigRank ranks the whole
          field.
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
                  ccgather
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
                    {r.ccgather}
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

      {/* Why one tool isn't the whole field */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why one tool isn&apos;t the whole field
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccgather answers <em>&quot;who used Claude Code the most?&quot;</em>
          {" "}That&apos;s a useful question, but it&apos;s not the whole
          question. Most operators don&apos;t use just one tool. They drive
          Claude Code for some tasks, Cursor for others, Copilot for others. A
          Claude Code-only leaderboard can&apos;t compare an operator who uses
          Cursor 80% of the time with one who uses Claude Code 80% of the time.
          It can&apos;t see the operator who is most efficient across all
          platforms.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , is platform-neutral. It reads the same four token pillars from
          every supported tool and scores the cascade yield on the same scale.
          ccgather ranks the Claude Code crowd; SigRank ranks the whole field.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (both tools read these from Claude Code)
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
          From Claude Code to the whole field
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run ccgather, you have the Claude Code stats. SigRank
          reads the same telemetry and adds the cross-platform scoring layer
          Claude Code-only leaderboards never had:
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
          Keep your Claude Code leaderboard for the ccgather crowd. Add the
          cross-platform yield ranking that Claude Code-only leaderboards cannot
          provide. Install SigRank and submit your first signed snapshot in
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
