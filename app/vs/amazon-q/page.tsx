/**
 * app/vs/amazon-q/page.tsx — "SigRank vs Amazon Q Developer" SEO comparison page.
 *
 * Angle: Amazon Q Developer is AWS's AI coding assistant (formerly CodeWhisperer).
 * SigRank is platform-neutral — works with Amazon Q, Claude Code, Copilot,
 * Cursor, and 15+ others. Amazon Q is AWS-optimized; SigRank scores the
 * operator across all tools and clouds.
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
  title: "SigRank vs Amazon Q Developer — Cross-Tool Token Metrics",
  description:
    "Amazon Q Developer is AWS's AI coding assistant. SigRank is platform-neutral \u2014 works with Amazon Q, Claude Code, Copilot, Cursor, and 15+ tools.",
  path: "/vs/amazon-q",
});

const COMPARE_ROWS: {
  feature: string;
  amazonQ: string;
  sigrank: string;
}[] = [
  {
    feature: "What it is",
    amazonQ: "AWS AI coding assistant (formerly CodeWhisperer)",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Token usage tracking",
    amazonQ: "Limited (AWS-console-scoped)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    amazonQ: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    amazonQ: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    amazonQ: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", amazonQ: "No", sigrank: "Yes" },
  {
    feature: "Works across Amazon Q + Claude Code + Cursor + 15+",
    amazonQ: "No (Amazon Q only)",
    sigrank: "Yes",
  },
  { feature: "Score follows you across tools", amazonQ: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    amazonQ: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    amazonQ: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", amazonQ: "No", sigrank: "Yes" },
  {
    feature: "Privacy-preserving (token counts only)",
    amazonQ: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Amazon Q Developer?",
    answer:
      "No — SigRank is not a coding assistant. Amazon Q Developer (formerly CodeWhisperer) is AWS's AI coding assistant, optimized for AWS workflows and cloud-native development; SigRank is the scoring layer that measures how efficiently you drive any AI tool, including Amazon Q. You keep using Amazon Q (or Claude Code, or Copilot) and run the SigRank CLI alongside it. SigRank reads your token telemetry locally, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. Your assistant stays; your efficiency gets measured.",
  },
  {
    question: "Does Amazon Q have usage metrics?",
    answer:
      "Amazon Q Developer surfaces some usage information in the AWS console — how many suggestions were accepted, reference tracking, and billing-relevant usage. That is AWS-console-scoped and AWS-locked: the numbers live inside your AWS account and do not leave it. SigRank reads the same underlying token flow but computes the full cascade architecture (Υ Yield, compression ratio, SNR, Leverage, Velocity), assigns a class tier, and lets you compare against every other operator on the board — including ones who never touch AWS.",
  },
  {
    question: "Why does platform neutrality matter?",
    answer:
      "Because most operators do not use one tool or one cloud. You might use Amazon Q for AWS-native work, Claude Code for agentic tasks, and Cursor for refactoring. Amazon Q's metrics cover only the AWS slice; your actual efficiency is the union across all of them. SigRank is platform-neutral — it reads telemetry from Amazon Q, Claude Code, Copilot, Cursor, ChatGPT, Gemini, and 15+ others, scores them on the same cascade axis, and gives you one comparable rank. Your score follows you across tools and clouds, not the other way around.",
  },
  {
    question: "Can I use SigRank with Amazon Q specifically?",
    answer:
      "Yes. The SigRank CLI reads token telemetry from Amazon Q Developer's local logs the same way it reads Claude Code's (ccusage is bundled for Claude Code; additional readers cover other platforms). Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish. Your Amazon Q sessions contribute to the same leaderboard rank as your Claude Code or Copilot sessions — unified, not siloed.",
  },
  {
    question:
      "What is the difference between Amazon Q and SigRank metrics?",
    answer:
      "Amazon Q's metrics answer &quot;how many suggestions did I accept in AWS?&quot; — a per-session, console-local view tied to your AWS account. SigRank's metrics answer &quot;how efficiently does this operator drive AI across all their tools?&quot; — a cascade-level, cross-platform view. Amazon Q tells you what you did in one assistant; SigRank tells you your Υ Yield (is signal compounding or burning?), your class tier, and your global rank among all operators regardless of tool or cloud. The first is a gauge; the second is a leaderboard.",
  },
];

export default function VsAmazonQPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Amazon Q Developer", path: "/vs/amazon-q" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Amazon Q Developer — Cross-Tool Token Metrics",
            description: "Amazon Q Developer is AWS's AI coding assistant. SigRank is platform-neutral — works with Amazon Q, Claude Code, Copilot, Cursor, and 15+ tools.",
            path: "/vs/amazon-q",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Amazon Q Developer"
        title="Operator Scoring Across All Tools and Clouds"
        subtitle={
          <>
            Amazon Q Developer is AWS-optimized. SigRank is{" "}
            <span className="text-gold">platform-neutral</span> — scores how
            efficiently you drive Amazon Q, Claude Code, Copilot, Cursor, and 15+
            others. Your score follows you across tools and clouds.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Amazon Q Developer
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">No, SigRank does not replace Amazon Q Developer.</strong>{" "}
          Amazon Q Developer (formerly CodeWhisperer) is AWS's AI coding
          assistant — optimized for AWS workflows, cloud-native patterns, and
          the AWS console. That is a tool, not a metric. Amazon Q surfaces some
          usage data inside your AWS account, but it does not compute cascade
          efficiency, does not assign a class tier, and does not rank you
          against operators who use other tools. It assists within AWS; it does
          not measure how efficiently you drive AI.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from Amazon Q, Claude Code,
          Copilot, Cursor, and 15+ other tools, scores them all on the same
          cascade axis (Υ Yield), and gives you one rank that follows you across
          tools and clouds. You don&apos;t switch assistants to use SigRank —
          you add it alongside whatever you already drive.
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
                  Amazon Q
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
                    {r.amazonQ}
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

      {/* AWS lock-in */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The AWS lock-in problem
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Amazon Q Developer&apos;s usage metrics are real — but they are{" "}
          <em>AWS-console-scoped and AWS-locked</em>. The numbers live inside
          your AWS account, in AWS&apos;s format, visible only in the AWS
          console. They do not export cleanly. They do not compare to anyone
          outside AWS. And they vanish the day you try a different tool or
          cloud.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most operators do not live in one assistant or one cloud. A realistic
          week: Amazon Q for AWS-native work, Claude Code for agentic
          multi-file tasks, Cursor for refactoring, maybe a Copilot inline
          completion. Amazon Q&apos;s metrics cover one slice of that week. Your
          actual efficiency is the union — and SigRank is the only layer that
          scores the union on a single axis.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The cascade is tool-agnostic
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <span className="font-mono text-gold">
              Υ = cache_read × output / input²
            </span>{" "}
            is computed from four token integers that every AI tool produces —
            input, output, cache-read, cache-write. The math does not care which
            assistant or cloud generated them. An operator who reuses context
            efficiently in Amazon Q scores the same way as one who does it in
            Claude Code. The cascade is the universal substrate.
          </p>
        </div>
      </section>

      {/* Your score follows you */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Your score follows you, not the tool
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s operator identity is tied to <em>you</em>, not to your
          assistant or your cloud. Enroll once, submit from any tool, and every
          signed snapshot feeds the same leaderboard rank. Switch from Amazon Q
          to Claude Code to Copilot over a month and your Υ trajectory reflects
          your driving across all three — not three disconnected per-tool
          gaages. That is the difference between a metric and a reputation.
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
          Keep Amazon Q. Add the score that follows you.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Amazon Q assists your AWS workflow. SigRank measures your driving —
          across Amazon Q and every other tool you use. Install the CLI, submit
          a signed snapshot, and get a rank that doesn&apos;t reset when you
          switch tools or clouds.
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
            See the leaderboard
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ai-coding-efficiency-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Efficiency Tools
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            Measure AI Coding Efficiency
          </Link>
          {" · "}
          <Link
            href="/vs/cursor"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Cursor
          </Link>
        </p>
      </section>
    </div>
  );
}
