/**
 * app/vs/sourcegraph-cody/page.tsx — "SigRank vs Sourcegraph Cody" SEO comparison page.
 *
 * Angle: Sourcegraph Cody is a code-aware AI assistant that understands your
 * entire codebase. SigRank is platform-neutral — works with Cody, Claude Code,
 * Copilot, Cursor, and 15+ others. Cody brings codebase context to AI; SigRank
 * scores the operator across all tools.
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
  title: "SigRank vs Sourcegraph Cody",
  description:
    "Sourcegraph Cody is a code-aware AI assistant. SigRank is platform-neutral \u2014 works with Cody, Claude Code, Copilot, Cursor, and 15+ tools.",
  path: "/vs/sourcegraph-cody",
});

const COMPARE_ROWS: { feature: string; cody: string; sigrank: string }[] = [
  {
    feature: "What it is",
    cody: "Code-aware AI assistant (codebase context)",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Token usage tracking",
    cody: "Limited (extension-scoped)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    cody: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    cody: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    cody: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", cody: "No", sigrank: "Yes" },
  {
    feature: "Works across Cody + Claude Code + Cursor + 15+",
    cody: "No (Cody only)",
    sigrank: "Yes",
  },
  { feature: "Score follows you across tools", cody: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    cody: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    cody: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", cody: "No", sigrank: "Yes" },
  {
    feature: "Privacy-preserving (token counts only)",
    cody: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Sourcegraph Cody?",
    answer:
      "No — SigRank is not a code-aware assistant. Sourcegraph Cody understands your entire codebase and brings that context to AI-generated answers; SigRank is the scoring layer that measures how efficiently you drive any AI tool, including Cody. You keep using Cody (or Claude Code, or Copilot) and run the SigRank CLI alongside it. SigRank reads your token telemetry locally, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. Your assistant stays; your efficiency gets measured.",
  },
  {
    question: "Does Cody have token usage metrics?",
    answer:
      "Cody surfaces some token and context information inside its extension UI — how much context was pulled in, how many tokens a request consumed. That is extension-scoped and extension-locked: the numbers live inside Cody and do not leave it. SigRank reads the same underlying token flow but computes the full cascade architecture (Υ Yield, compression ratio, SNR, Leverage, Velocity), assigns a class tier, and lets you compare against every other operator on the board — including ones who never touch Cody.",
  },
  {
    question: "Why does platform neutrality matter?",
    answer:
      "Because most operators do not use one tool. You might use Cody for codebase-aware questions, Claude Code for agentic tasks, and Cursor for refactoring. Cody's metrics cover only the Cody slice; your actual efficiency is the union across all of them. SigRank is platform-neutral — it reads telemetry from Cody, Claude Code, Copilot, Cursor, ChatGPT, Gemini, and 15+ others, scores them on the same cascade axis, and gives you one comparable rank. Your score follows you across tools, not the other way around.",
  },
  {
    question: "Can I use SigRank with Cody specifically?",
    answer:
      "Yes. The SigRank CLI reads token telemetry from Cody's local logs the same way it reads Claude Code's (ccusage is bundled for Claude Code; additional readers cover other platforms). Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish. Your Cody sessions contribute to the same leaderboard rank as your Claude Code or Copilot sessions — unified, not siloed.",
  },
  {
    question:
      "What is the difference between Cody and SigRank metrics?",
    answer:
      "Cody's metrics answer &quot;how much codebase context did this request pull in?&quot; — a per-request, extension-local view. SigRank's metrics answer &quot;how efficiently does this operator drive AI across all their tools?&quot; — a cascade-level, cross-platform view. Cody tells you what context you used in one assistant; SigRank tells you your Υ Yield (is signal compounding or burning?), your class tier, and your global rank among all operators regardless of assistant. The first is a gauge; the second is a leaderboard.",
  },
];

export default function VsSourcegraphCodyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Sourcegraph Cody", path: "/vs/sourcegraph-cody" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Sourcegraph Cody",
            description: "Sourcegraph Cody is a code-aware AI assistant. SigRank is platform-neutral — works with Cody, Claude Code, Copilot, Cursor, and 15+ tools.",
            path: "/vs/sourcegraph-cody",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Sourcegraph Cody"
        title="Operator Scoring, Not Codebase Context"
        subtitle={
          <>
            Sourcegraph Cody brings codebase context to AI. SigRank is{" "}
            <span className="text-gold">platform-neutral</span> — scores how
            efficiently you drive Cody, Claude Code, Copilot, Cursor, and 15+
            others. Your score follows you across tools.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Sourcegraph Cody
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">No, SigRank does not replace Sourcegraph Cody.</strong>{" "}
          Cody is a code-aware AI assistant — it indexes your entire codebase
          and brings that context to AI-generated answers and completions. That
          is a tool, not a metric. Cody surfaces some token and context
          information inside its extension, but it does not compute cascade
          efficiency, does not assign a class tier, and does not rank you
          against operators who use other tools. It brings context to AI; it
          does not measure how efficiently you drive AI.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from Cody, Claude Code,
          Copilot, Cursor, and 15+ other tools, scores them all on the same
          cascade axis (Υ Yield), and gives you one rank that follows you across
          tools. You don&apos;t switch assistants to use SigRank — you add it
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
                  Cody
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
                    {r.cody}
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

      {/* Context is not measurement */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Context is not measurement
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cody&apos;s job is to understand your entire codebase and bring that
          context to AI-generated answers. It does that well. But codebase
          context is a feature, not a metric. Cody surfaces some token and
          context information inside its extension UI, but those numbers are{" "}
          <em>extension-scoped and extension-locked</em> — they live inside Cody
          and do not leave it. The moment you want to know{" "}
          <em>how efficiently you are driving AI</em> — not just how much
          context was pulled in — Cody has nothing to say.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most operators do not use one tool. A realistic week: Cody for
          codebase-aware questions, Claude Code for agentic multi-file tasks,
          Cursor for refactoring, maybe a Copilot inline completion. Cody covers
          only the codebase-context slice. Your actual efficiency is the union —
          and SigRank is the only layer that scores the union on a single axis.
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
            assistant generated them. An operator who reuses context efficiently
            in Cody scores the same way as one who does it in Claude Code. The
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
          assistant. Enroll once, submit from any tool, and every signed
          snapshot feeds the same leaderboard rank. Switch from Cody to Claude
          Code to Copilot over a month and your Υ trajectory reflects your
          driving across all three — not three disconnected per-tool gauges.
          That is the difference between a metric and a reputation.
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
          Keep Cody. Add the score that follows you.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cody brings codebase context to AI. SigRank measures your driving —
          across Cody and every other tool you use. Install the CLI, submit a
          signed snapshot, and get a rank that doesn&apos;t reset when you
          switch tools.
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
