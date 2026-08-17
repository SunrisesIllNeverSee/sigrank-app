/**
 * app/vs/roo-code/page.tsx — "SigRank vs Roo Code" SEO comparison page.
 *
 * Angle: Roo Code is a VS Code AI agent (fork of Cline). SigRank is
 * platform-neutral — works with Roo Code, Claude Code, Copilot, Cursor, and
 * 15+ others. Roo Code operates within VS Code; SigRank scores the operator
 * across all tools.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage +
 * comparisonArticle), WaveHero, and a styled comparison table matching the
 * repo's conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs Roo Code — Cross-Tool Token Metrics",
  description:
    "Roo Code is a VS Code AI agent. SigRank is platform-neutral \u2014 works with Roo Code, Claude Code, Copilot, Cursor, and 15+ tools.",
  path: "/vs/roo-code",
});

const COMPARE_ROWS: { feature: string; rooCode: string; sigrank: string }[] = [
  {
    feature: "What it is",
    rooCode: "VS Code AI agent (Cline fork)",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Token usage tracking",
    rooCode: "Limited (agent-scoped)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    rooCode: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    rooCode: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    rooCode: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", rooCode: "No", sigrank: "Yes" },
  {
    feature: "Works across Roo Code + Claude Code + Cursor + 15+",
    rooCode: "No (Roo Code only)",
    sigrank: "Yes",
  },
  { feature: "Score follows you across tools", rooCode: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    rooCode: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    rooCode: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", rooCode: "No", sigrank: "Yes" },
  {
    feature: "Privacy-preserving (token counts only)",
    rooCode: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Roo Code?",
    answer:
      "No — SigRank is not an AI agent or an editor. Roo Code is a VS Code extension that drives AI coding tasks inside your editor; SigRank is the scoring layer that measures how efficiently you drive any AI tool, including Roo Code. You keep using Roo Code (or Claude Code, or Cursor) and run the SigRank CLI alongside it. SigRank reads your token telemetry locally, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. Your agent stays; your efficiency gets measured.",
  },
  {
    question: "Does Roo Code have token usage metrics?",
    answer:
      "Roo Code surfaces some token usage within its own VS Code panel — how many tokens a task consumed, context window pressure. That is agent-scoped and editor-locked: the numbers live inside VS Code and do not leave it. SigRank reads the same underlying token flow but computes the full cascade architecture (Υ Yield, compression ratio, SNR, Leverage, Velocity), assigns a class tier, and lets you compare against every other operator on the board — including ones who never touch Roo Code.",
  },
  {
    question: "Why does platform neutrality matter for token metrics?",
    answer:
      "Because most operators do not use one tool. You might use Roo Code for agentic multi-file tasks inside VS Code, Claude Code for terminal-driven work, and Copilot for inline completions. Roo Code's metrics cover only the Roo Code slice; your actual efficiency is the union across all of them. SigRank is platform-neutral — it reads telemetry from Roo Code, Claude Code, Copilot, Cursor, and 15+ others, scores them on the same cascade axis, and gives you one comparable rank. Your score follows you across tools, not the other way around.",
  },
  {
    question: "Can I use SigRank with Roo Code specifically?",
    answer:
      "Yes. The SigRank CLI reads token telemetry from Roo Code's local logs the same way it reads Claude Code's (ccusage is bundled for Claude Code; additional readers cover other platforms). Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish. Your Roo Code sessions contribute to the same leaderboard rank as your Claude Code or Cursor sessions — unified, not siloed.",
  },
  {
    question:
      "What is the difference between Roo Code and SigRank metrics?",
    answer:
      "Roo Code's metrics answer &quot;how many tokens did this task use?&quot; — a per-task, editor-local view. SigRank's metrics answer &quot;how efficiently does this operator drive AI across all their tools?&quot; — a cascade-level, cross-platform view. Roo Code tells you what you spent in one agent; SigRank tells you your Υ Yield (is signal compounding or burning?), your class tier, and your global rank among all operators regardless of editor. The first is a gauge; the second is a leaderboard.",
  },
];

export default function VsRooCodePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Roo Code", path: "/vs/roo-code" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Roo Code — Cross-Tool Token Metrics",
            description: "Roo Code is a VS Code AI agent. SigRank is platform-neutral — works with Roo Code, Claude Code, Copilot, Cursor, and 15+ tools.",
            path: "/vs/roo-code",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Roo Code"
        title="Cross-Tool Token Metrics, Not Editor Lock-in"
        subtitle={
          <>
            Roo Code is a VS Code AI agent. SigRank is{" "}
            <span className="text-gold">platform-neutral</span> — works with
            Roo Code, Claude Code, Copilot, Cursor, and 15+ others. Your score
            follows you across tools.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Roo Code
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Roo Code is a capable VS Code AI agent — a fork of Cline that drives
          agentic coding tasks inside your editor. It surfaces some token usage
          within its own panel. That is useful when you live entirely inside
          Roo Code. The moment you also use Claude Code for terminal-driven
          work, Copilot for inline completion, or Cursor for refactoring, those
          metrics fragment: each tool reports its own numbers, in its own
          format, locked to its own surface. There is no unified score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from Roo Code, Claude Code,
          Copilot, Cursor, and 15+ other tools, scores them all on the same
          cascade axis (Υ Yield), and gives you one rank that follows you across
          editors. You don&apos;t switch agents to use SigRank — you add it
          alongside whatever you already drive.
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
                  Roo Code
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
                    {r.rooCode}
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

      {/* Editor lock-in */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The editor lock-in problem
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Roo Code&apos;s metrics are real — but they are{" "}
          <em>agent-scoped and editor-locked</em>. The numbers live inside VS
          Code, in Roo Code&apos;s format, visible only in Roo Code&apos;s
          panel. They do not export. They do not compare to anyone outside Roo
          Code. And they vanish the day you try a different tool.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most operators do not live in one agent. A realistic week: Roo Code
          for agentic multi-file tasks inside VS Code, Claude Code for
          terminal-driven work, Copilot for inline completions, maybe a Cursor
          refactoring pass. Roo Code&apos;s metrics cover one slice of that
          week. Your actual efficiency is the union — and SigRank is the only
          layer that scores the union on a single axis.
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
            agent generated them. An operator who reuses context efficiently in
            Roo Code scores the same way as one who does it in Claude Code. The
            cascade is the universal substrate.
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
          agent. Enroll once, submit from any tool, and every signed snapshot
          feeds the same leaderboard rank. Switch from Roo Code to Claude Code
          to Copilot over a month and your Υ trajectory reflects your driving
          across all three — not three disconnected per-agent gauges. That is
          the difference between a metric and a reputation.
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
          Keep Roo Code. Add the score that follows you.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Roo Code drives your tasks. SigRank measures your driving — across
          Roo Code and every other tool you use. Install the CLI, submit a
          signed snapshot, and get a rank that doesn&apos;t reset when you
          switch agents.
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
