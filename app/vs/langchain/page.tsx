/**
 * app/vs/langchain/page.tsx — "SigRank vs LangChain" SEO comparison page.
 *
 * Angle: LangChain is an LLM application framework (chains, agents, RAG).
 * SigRank measures the human operator's efficiency driving AI tools. Different
 * layers entirely — framework vs operator measurement.
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
  title: "SigRank vs LangChain \u2014 Framework vs Operator Measurement",
  description:
    "LangChain builds AI apps with chains, agents, and RAG. SigRank ranks the humans driving AI tools. Different layers entirely — framework vs operator measurement.",
  path: "/vs/langchain",
});

const COMPARE_ROWS: { feature: string; langchain: string; sigrank: string }[] = [
  {
    feature: "What it is",
    langchain: "LLM application framework (chains, agents, RAG)",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Builds LLM-powered applications",
    langchain: "Yes",
    sigrank: "No (measures operators, not apps)",
  },
  {
    feature: "Measures human operator token efficiency",
    langchain: "No",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    langchain: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    langchain: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER → TRANSMITTER)",
    langchain: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", langchain: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    langchain: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    langchain: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", langchain: "No", sigrank: "Yes" },
  {
    feature: "Works across Cursor + Claude Code + Copilot + 15+",
    langchain: "N/A (framework)",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    langchain: "N/A",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace LangChain?",
    answer:
      "No — they operate at completely different layers. LangChain is an LLM application framework: it gives developers the primitives to build AI apps — chains, agents, RAG pipelines, tool-calling, memory. SigRank is an operator scoring layer: it measures how efficiently a human drives AI tools and ranks them on a leaderboard. LangChain is for building AI software; SigRank is for measuring the humans who use AI software. You can build an app with LangChain and still score the operator who drives it with SigRank.",
  },
  {
    question: "Does LangChain measure token efficiency?",
    answer:
      "LangChain provides tracing and callback hooks that can log token usage within an application — useful for debugging your chain or agent. That is application-level observability, not operator-level scoring. LangChain tells you how many tokens a specific chain call consumed; SigRank tells you how efficiently the human operator driving the tool compounds signal across an entire session. The first is a debug log; the second is a leaderboard rank. Different questions, different layers.",
  },
  {
    question: "Why is operator measurement different from framework tracing?",
    answer:
      "Framework tracing answers &quot;what did this LLM call cost?&quot; — a per-call, application-scoped view. Operator measurement answers &quot;how efficiently does this human drive AI across all their tools?&quot; — a cascade-level, cross-platform view. LangChain sees one app&apos;s calls; SigRank sees the operator&apos;s entire token cascade across Claude Code, Cursor, Copilot, and 15+ others, computes the Υ Yield (cache_read × output / input²), and ranks them globally. The framework measures the app; SigRank measures the person.",
  },
  {
    question: "Can I use SigRank alongside LangChain?",
    answer:
      "Yes — they are complementary, not competitive. Build your AI application with LangChain (chains, agents, RAG). Then score the operator who drives it — or any other AI tool — with SigRank. The SigRank CLI reads token telemetry locally, computes the cascade metrics, signs a snapshot with ed25519, and publishes it to the leaderboard. Your LangChain app keeps running; the operator who drives it gets a measured rank. Run `sigrank enroll` to create your operator identity, then `sigrank submit` to score and publish.",
  },
  {
    question: "What is the difference between an AI framework and an operator leaderboard?",
    answer:
      "A framework (LangChain) is a set of software primitives — abstractions, libraries, runtimes — that developers use to build AI applications. A leaderboard (SigRank) is a ranking surface that measures and compares human operators on a canonical efficiency metric. The first is a tool for building software; the second is a measurement system for ranking people. LangChain is the layer where AI apps are constructed; SigRank is the layer where the humans driving those apps (and every other AI tool) are scored. Framework vs operator measurement — different layers entirely.",
  },
];

export default function VsLangChainPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs LangChain", path: "/vs/langchain" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs LangChain — Framework vs Operator Measurement",
            description: "LangChain builds AI apps with chains, agents, and RAG. SigRank ranks the humans driving AI tools. Different layers entirely — framework vs operator measurement.",
            path: "/vs/langchain",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs LangChain"
        title="Framework vs Operator Measurement"
        subtitle={
          <>
            LangChain builds AI apps with chains, agents, and RAG. SigRank{" "}
            <span className="text-gold">ranks the humans</span> driving AI tools.
            Different layers entirely — framework vs operator measurement.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: LangChain
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          LangChain is the dominant LLM application framework — the library
          developers use to build AI apps. Chains, agents, RAG pipelines,
          tool-calling, memory, retrieval: LangChain provides the primitives that
          turn a raw model API into a working application. It is excellent at what
          it does, which is <em>building AI software</em>. What it does not do is
          measure the human operator who drives that software.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank operates at a different layer entirely. It is not a framework
          — it does not help you build apps. It is a{" "}
          <strong className="text-text-primary">measurement layer</strong> that
          reads token telemetry from any AI tool an operator drives, computes the
          cascade efficiency (Υ Yield), and ranks them on a global leaderboard.
          LangChain is the layer where AI apps are constructed; SigRank is the
          layer where the humans driving those apps are scored.
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
                  LangChain
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
                    {r.langchain}
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

      {/* Different layers */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Framework layer vs operator layer
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          LangChain&apos;s tracing and callback hooks can log token usage within
          an application — useful for debugging a chain or agent. That is{" "}
          <em>application-level observability</em>: &quot;what did this LLM call
          cost?&quot; It is scoped to one app, one call, one trace. SigRank
          answers a different question: &quot;how efficiently does this human
          operator drive AI across all their tools?&quot; That is{" "}
          <em>operator-level measurement</em>: cascade-scoped, cross-platform,
          leaderboard-ranked.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The distinction matters because the two layers do not overlap. LangChain
          sees the app; SigRank sees the person. An operator might drive a
          LangChain-built agent, a Claude Code session, and a Cursor refactoring
          in the same week. LangChain traces the first; SigRank scores the union
          of all three on a single cascade axis. The framework measures the
          software; SigRank measures the human.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The cascade is operator-scoped, not app-scoped
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <span className="font-mono text-gold">
              Υ = cache_read × output / input²
            </span>{" "}
            is computed from four token integers that every AI tool produces —
            input, output, cache-read, cache-write. The math does not care which
            framework generated them. An operator who reuses context efficiently
            in a LangChain agent scores the same way as one who does it in Claude
            Code. The cascade is the universal substrate — and it is measured at
            the operator layer, not the framework layer.
          </p>
        </div>
      </section>

      {/* Complementary, not competitive */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Complementary, not competitive
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank does not compete with LangChain because they solve different
          problems. Build your AI application with LangChain — chains, agents, RAG,
          tool-calling. Then score the operator who drives it — or any other AI
          tool — with SigRank. The CLI reads token telemetry locally, computes
          the cascade metrics, signs a snapshot with ed25519, and publishes it to
          the leaderboard. Your LangChain app keeps running; the operator who
          drives it gets a measured, verifiable rank.
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
          Build with LangChain. Score the operator with SigRank.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          LangChain is the framework where AI apps are built. SigRank is the
          layer where the humans driving those apps are scored. Install the CLI,
          submit a signed snapshot, and get a rank that measures the operator,
          not the app.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <Link
            href="/hall"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the Hall of Signal
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
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
