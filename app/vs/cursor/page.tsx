/**
 * app/vs/cursor/page.tsx — "SigRank vs Cursor" SEO comparison page.
 *
 * Angle: Cursor is an AI code editor with built-in metrics. SigRank is
 * platform-neutral — works with Cursor, Claude Code, Copilot, and 15+ others.
 * Your score follows you across tools.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs Cursor — Cross-Tool Token Metrics",
  description:
    "Cursor is an AI editor with built-in metrics. SigRank is platform-neutral \u2014 works with Cursor, Claude Code, Copilot, and 15+ tools.",
  path: "/vs/cursor",
});

const COMPARE_ROWS: { feature: string; cursor: string; sigrank: string }[] = [
  {
    feature: "What it is",
    cursor: "AI code editor",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Built-in token metrics",
    cursor: "Yes (editor-scoped)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    cursor: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    cursor: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER → TRANSMITTER)",
    cursor: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", cursor: "No", sigrank: "Yes" },
  {
    feature: "Works across Cursor + Claude Code + Copilot + 15+",
    cursor: "No (Cursor only)",
    sigrank: "Yes",
  },
  { feature: "Score follows you across tools", cursor: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    cursor: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    cursor: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", cursor: "No", sigrank: "Yes" },
  {
    feature: "Privacy-preserving (token counts only)",
    cursor: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Cursor?",
    answer:
      "No — SigRank is not an editor. Cursor is where you write code; SigRank is the scoring layer that measures how efficiently you drive any AI tool, including Cursor. You keep using Cursor (or Claude Code, or Copilot) and run the SigRank CLI alongside it. SigRank reads your token telemetry locally, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. Your editor stays; your efficiency gets measured.",
  },
  {
    question: "Does Cursor have token usage metrics already?",
    answer:
      "Cursor shows some token usage within its own UI — how many tokens a request consumed, context window usage. That is editor-scoped and editor-locked: the numbers live inside Cursor and do not leave it. SigRank reads the same underlying token flow but computes the full cascade architecture (Υ Yield, compression ratio, SNR, Leverage, Velocity), assigns a class tier, and lets you compare against every other operator on the board — including ones who never touch Cursor.",
  },
  {
    question: "Why does platform neutrality matter for token metrics?",
    answer:
      "Because most operators do not use one tool. You might use Cursor for refactoring, Claude Code for agentic tasks, and Copilot for inline completions. Cursor's metrics cover only the Cursor slice; your actual efficiency is the union across all of them. SigRank is platform-neutral — it reads telemetry from Cursor, Claude Code, Copilot, ChatGPT, Gemini, and 15+ others, scores them on the same cascade axis, and gives you one comparable rank. Your score follows you across tools, not the other way around.",
  },
  {
    question: "Can I use SigRank with Cursor specifically?",
    answer:
      "Yes. The SigRank CLI reads token telemetry from Cursor's local logs the same way it reads Claude Code's (ccusage is bundled for Claude Code; additional readers cover other platforms). Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish. Your Cursor sessions contribute to the same leaderboard rank as your Claude Code or Copilot sessions — unified, not siloed.",
  },
  {
    question:
      "What is the difference between Cursor AI metrics and SigRank metrics?",
    answer:
      "Cursor's metrics answer &quot;how many tokens did this request use?&quot; — a per-request, editor-local view. SigRank's metrics answer &quot;how efficiently does this operator drive AI across all their tools?&quot; — a cascade-level, cross-platform view. Cursor tells you what you spent in one editor; SigRank tells you your Υ Yield (is signal compounding or burning?), your class tier, and your global rank among all operators regardless of editor. The first is a gauge; the second is a leaderboard.",
  },
];

export default function VsCursorPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Cursor", path: "/vs/cursor" },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Cursor"
        title="Cross-Tool Token Metrics, Not Editor Lock-in"
        subtitle={
          <>
            Cursor is an AI editor with built-in metrics. SigRank is{" "}
            <span className="text-gold">platform-neutral</span> — works with
            Cursor, Claude Code, Copilot, and 15+ others. Your score follows you
            across tools.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Cursor
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cursor is an excellent AI code editor — and it ships some token usage
          metrics inside its own UI. That is useful when you live entirely
          inside Cursor. The moment you also use Claude Code for agentic work,
          Copilot for inline completion, or Gemini for a quick draft, those
          metrics fragment: each tool reports its own numbers, in its own
          format, locked to its own surface. There is no unified score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from Cursor, Claude Code,
          Copilot, and 15+ other tools, scores them all on the same cascade axis
          (Υ Yield), and gives you one rank that follows you across editors. You
          don&apos;t switch editors to use SigRank — you add it alongside
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
                  Cursor
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
                    {r.cursor}
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
          Cursor&apos;s metrics are real — but they are{" "}
          <em>editor-scoped and editor-locked</em>. The numbers live inside
          Cursor, in Cursor&apos;s format, visible only in Cursor&apos;s UI.
          They do not export. They do not compare to anyone outside Cursor. And
          they vanish the day you try a different tool.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most operators do not live in one editor. A realistic week: Cursor for
          refactoring, Claude Code for agentic multi-file tasks, Copilot for
          inline completions, maybe a ChatGPT draft. Cursor&apos;s metrics cover
          one slice of that week. Your actual efficiency is the union — and
          SigRank is the only layer that scores the union on a single axis.
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
            editor generated them. An operator who reuses context efficiently in
            Cursor scores the same way as one who does it in Claude Code. The
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
          editor. Enroll once, submit from any tool, and every signed snapshot
          feeds the same leaderboard rank. Switch from Cursor to Claude Code to
          Copilot over a month and your Υ trajectory reflects your driving
          across all three — not three disconnected per-editor gauges. That is
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
          Keep Cursor. Add the score that follows you.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cursor measures your requests. SigRank measures your driving — across
          Cursor and every other tool you use. Install the CLI, submit a signed
          snapshot, and get a rank that doesn&apos;t reset when you switch
          editors.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <a
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </a>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics Tools
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
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            Measure AI Coding Efficiency
          </Link>
        </p>
      </section>
    </div>
  );
}
