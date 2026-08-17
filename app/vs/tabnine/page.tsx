/**
 * app/vs/tabnine/page.tsx — "SigRank vs Tabnine" SEO comparison page.
 *
 * Angle: Tabnine is an AI code completion tool (one of the earliest). SigRank
 * is platform-neutral — works with Tabnine, Claude Code, Copilot, Cursor, and
 * 15+ others. Tabnine completes your code; SigRank scores how efficiently you
 * drive any AI tool.
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
  title: "SigRank vs Tabnine — Cross-Tool Token Metrics",
  description:
    "Tabnine is an AI code completion tool. SigRank is platform-neutral \u2014 works with Tabnine, Claude Code, Copilot, Cursor, and 15+ tools.",
  path: "/vs/tabnine",
});

const COMPARE_ROWS: { feature: string; tabnine: string; sigrank: string }[] = [
  {
    feature: "What it is",
    tabnine: "AI code completion tool",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Token usage tracking",
    tabnine: "No (completion-focused)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    tabnine: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    tabnine: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    tabnine: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", tabnine: "No", sigrank: "Yes" },
  {
    feature: "Works across Tabnine + Claude Code + Cursor + 15+",
    tabnine: "No (Tabnine only)",
    sigrank: "Yes",
  },
  { feature: "Score follows you across tools", tabnine: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    tabnine: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    tabnine: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", tabnine: "No", sigrank: "Yes" },
  {
    feature: "Privacy-preserving (token counts only)",
    tabnine: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Tabnine?",
    answer:
      "No — SigRank is not a code completion tool. Tabnine predicts and completes your code inline; SigRank is the scoring layer that measures how efficiently you drive any AI tool, including Tabnine. You keep using Tabnine (or Claude Code, or Copilot) and run the SigRank CLI alongside it. SigRank reads your token telemetry locally, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. Your completion tool stays; your efficiency gets measured.",
  },
  {
    question: "Does Tabnine have token usage metrics?",
    answer:
      "Tabnine is focused on code completion quality, not token telemetry. It does not surface input, output, cache-read, or cache-write counts in a way you can export or compare. SigRank reads the underlying token flow from whatever AI tool you drive — Tabnine included — and computes the full cascade architecture (Υ Yield, compression ratio, SNR, Leverage, Velocity), assigns a class tier, and lets you compare against every other operator on the board, including ones who never touch Tabnine.",
  },
  {
    question: "Why does platform neutrality matter?",
    answer:
      "Because most operators do not use one tool. You might use Tabnine for inline completions, Claude Code for agentic tasks, and Cursor for refactoring. Tabnine's scope covers only the completion slice; your actual efficiency is the union across all of them. SigRank is platform-neutral — it reads telemetry from Tabnine, Claude Code, Copilot, Cursor, ChatGPT, Gemini, and 15+ others, scores them on the same cascade axis, and gives you one comparable rank. Your score follows you across tools, not the other way around.",
  },
  {
    question: "Can I use SigRank with Tabnine specifically?",
    answer:
      "Yes. The SigRank CLI reads token telemetry from Tabnine's local logs the same way it reads Claude Code's (ccusage is bundled for Claude Code; additional readers cover other platforms). Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish. Your Tabnine sessions contribute to the same leaderboard rank as your Claude Code or Copilot sessions — unified, not siloed.",
  },
  {
    question:
      "What is the difference between Tabnine and SigRank metrics?",
    answer:
      "Tabnine is a completion tool — it predicts the next line of code. It does not produce operator-level efficiency metrics. SigRank's metrics answer &quot;how efficiently does this operator drive AI across all their tools?&quot; — a cascade-level, cross-platform view. Tabnine completes your code; SigRank tells you your Υ Yield (is signal compounding or burning?), your class tier, and your global rank among all operators regardless of completion tool. The first is a tool; the second is a leaderboard.",
  },
];

export default function VsTabninePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Tabnine", path: "/vs/tabnine" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Tabnine — Cross-Tool Token Metrics",
            description: "Tabnine is an AI code completion tool. SigRank is platform-neutral — works with Tabnine, Claude Code, Copilot, Cursor, and 15+ tools.",
            path: "/vs/tabnine",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Tabnine"
        title="Operator Scoring, Not Code Completion"
        subtitle={
          <>
            Tabnine completes your code. SigRank is{" "}
            <span className="text-gold">platform-neutral</span> — scores how
            efficiently you drive Tabnine, Claude Code, Copilot, Cursor, and 15+
            others. Your score follows you across tools.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Tabnine
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">No, SigRank does not replace Tabnine.</strong>{" "}
          Tabnine is one of the earliest AI code completion tools — it predicts
          and completes your code inline. That is a tool, not a metric. Tabnine
          does not track token usage, does not compute cascade efficiency, and
          does not score the operator behind the keyboard. It completes code;
          it does not measure how efficiently you drive AI.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from Tabnine, Claude Code,
          Copilot, Cursor, and 15+ other tools, scores them all on the same
          cascade axis (Υ Yield), and gives you one rank that follows you across
          tools. You don&apos;t switch completion tools to use SigRank — you add
          it alongside whatever you already drive.
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
                  Tabnine
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
                    {r.tabnine}
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

      {/* Completion is not measurement */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Completion is not measurement
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tabnine&apos;s job is to predict the next token, line, or block of
          code and insert it for you. It does that well. But completion is a
          feature, not a metric. Tabnine does not surface input, output,
          cache-read, or cache-write counts. It does not compute a cascade
          efficiency score. It does not assign you a class tier or rank you
          against other operators. The moment you want to know{" "}
          <em>how efficiently you are driving AI</em> — not just whether the
          completion was accepted — Tabnine has nothing to say.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most operators do not use one tool. A realistic week: Tabnine for
          inline completions, Claude Code for agentic multi-file tasks, Cursor
          for refactoring, maybe a ChatGPT draft. Tabnine covers only the
          completion slice. Your actual efficiency is the union — and SigRank
          is the only layer that scores the union on a single axis.
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
            completion tool generated them. An operator who reuses context
            efficiently in Tabnine scores the same way as one who does it in
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
          completion tool. Enroll once, submit from any tool, and every signed
          snapshot feeds the same leaderboard rank. Switch from Tabnine to
          Claude Code to Copilot over a month and your Υ trajectory reflects
          your driving across all three — not three disconnected per-tool
          gauges. That is the difference between a metric and a reputation.
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
          Keep Tabnine. Add the score that follows you.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tabnine completes your code. SigRank measures your driving — across
          Tabnine and every other tool you use. Install the CLI, submit a signed
          snapshot, and get a rank that doesn&apos;t reset when you switch
          tools.
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
