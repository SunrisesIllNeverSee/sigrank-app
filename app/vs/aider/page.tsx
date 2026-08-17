/**
 * app/vs/aider/page.tsx — "SigRank vs aider" SEO comparison page.
 *
 * Angle: aider is a terminal-based AI coding agent that pairs with you on
 * code. SigRank is platform-neutral — works with aider, Claude Code, Copilot,
 * and 15+ others. aider has a /usage command showing token costs; SigRank
 * scores the cascade efficiency (Υ Yield) across all your tools.
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
  title: "SigRank vs aider — Cross-Tool Token Metrics",
  description:
    "aider is a terminal AI coding agent with a /usage command. SigRank is platform-neutral — works with aider, Claude Code, Copilot, and 15+ tools.",
  path: "/vs/aider",
});

const COMPARE_ROWS: { feature: string; aider: string; sigrank: string }[] = [
  {
    feature: "What it is",
    aider: "Terminal-based AI coding agent",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Token tracking",
    aider: "Yes (/usage command, cost-focused)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    aider: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    aider: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    aider: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", aider: "No", sigrank: "Yes" },
  {
    feature: "Works across aider + Claude Code + Cursor + 15+",
    aider: "No (aider only)",
    sigrank: "Yes",
  },
  { feature: "Score follows you across tools", aider: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    aider: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    aider: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", aider: "No", sigrank: "Yes" },
  {
    feature: "Privacy-preserving (token counts only)",
    aider: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace aider?",
    answer:
      "No — SigRank is not a coding agent. aider is the terminal tool that pairs with you on code; SigRank is the scoring layer that measures how efficiently you drive any AI tool, including aider. You keep using aider (or Claude Code, or Copilot) and run the SigRank CLI alongside it. SigRank reads your token telemetry locally, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. Your agent stays; your efficiency gets measured.",
  },
  {
    question: "Does aider have token usage metrics already?",
    answer:
      "Yes — aider ships a /usage command that shows token counts and dollar costs per session. That is agent-scoped and agent-locked: the numbers describe what aider spent, in aider's terms, visible only inside aider. SigRank reads the same underlying token flow but computes the full cascade architecture (Υ Yield, compression ratio, SNR, Leverage, Velocity), assigns a class tier, and lets you compare against every other operator on the board — including ones who never touch aider.",
  },
  {
    question: "Why does platform neutrality matter for token metrics?",
    answer:
      "Because most operators do not use one tool. You might use aider for terminal-driven edits, Claude Code for agentic tasks, and Copilot for inline completions. aider's /usage covers only the aider slice; your actual efficiency is the union across all of them. SigRank is platform-neutral — it reads telemetry from aider, Claude Code, Copilot, Cursor, ChatGPT, Gemini, and 15+ others, scores them on the same cascade axis, and gives you one comparable rank. Your score follows you across tools, not the other way around.",
  },
  {
    question: "Can I use SigRank with aider specifically?",
    answer:
      "Yes. The SigRank CLI reads token telemetry from aider's local logs the same way it reads Claude Code's (ccusage is bundled for Claude Code; additional readers cover other platforms). Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish. Your aider sessions contribute to the same leaderboard rank as your Claude Code or Copilot sessions — unified, not siloed.",
  },
  {
    question:
      "What is the difference between aider /usage and SigRank metrics?",
    answer:
      "aider's /usage answers &quot;how many tokens did this session cost?&quot; — a per-session, agent-local view denominated in dollars. SigRank's metrics answer &quot;how efficiently does this operator drive AI across all their tools?&quot; — a cascade-level, cross-platform view. aider tells you what you spent in one agent; SigRank tells you your Υ Yield (is signal compounding or burning?), your class tier, and your global rank among all operators regardless of agent. The first is a receipt; the second is a leaderboard.",
  },
];

export default function VsAiderPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs aider", path: "/vs/aider" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs aider — Cross-Tool Token Metrics",
            description: "aider is a terminal AI coding agent with a /usage command. SigRank is platform-neutral — works with aider, Claude Code, Copilot, and 15+ tools.",
            path: "/vs/aider",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs aider"
        title="Cross-Tool Token Metrics, Not Agent Lock-in"
        subtitle={
          <>
            aider is a terminal AI coding agent with a /usage command. SigRank
            is <span className="text-gold">platform-neutral</span> — works with
            aider, Claude Code, Copilot, and 15+ others. Your score follows you
            across tools.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: aider
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Verdict: SigRank does not
          replace aider — it scores the operator driving it.</strong> aider is a
          superb terminal-based AI coding agent, and its /usage command gives
          you honest token counts and dollar costs per session. That is useful
          when you live entirely inside aider. The moment you also use Claude
          Code for agentic work, Copilot for inline completion, or Cursor for
          refactoring, those metrics fragment: each tool reports its own
          numbers, in its own format, locked to its own surface. There is no
          unified score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from aider, Claude Code,
          Copilot, and 15+ other tools, scores them all on the same cascade axis
          (Υ Yield), and gives you one rank that follows you across agents. You
          don&apos;t switch agents to use SigRank — you add it alongside
          whatever you already drive.
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
                  aider
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
                    {r.aider}
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

      {/* Agent lock-in */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The agent lock-in problem
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          aider&apos;s /usage is real — but it is{" "}
          <em>agent-scoped and agent-locked</em>. The numbers live inside aider,
          in aider&apos;s format, visible only at the terminal where aider ran.
          They do not export. They do not compare to anyone outside aider. And
          they vanish the day you try a different tool.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most operators do not live in one agent. A realistic week: aider for
          terminal-driven edits, Claude Code for agentic multi-file tasks,
          Copilot for inline completions, maybe a Cursor refactor. aider&apos;s
          /usage covers one slice of that week. Your actual efficiency is the
          union — and SigRank is the only layer that scores the union on a
          single axis.
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
            aider scores the same way as one who does it in Claude Code. The
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
          feeds the same leaderboard rank. Switch from aider to Claude Code to
          Copilot over a month and your Υ trajectory reflects your driving
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
          Keep aider. Add the score that follows you.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          aider measures your sessions. SigRank measures your driving — across
          aider and every other tool you use. Install the CLI, submit a signed
          snapshot, and get a rank that doesn&apos;t reset when you switch
          agents.
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
