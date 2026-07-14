/**
 * app/vs/langfuse/page.tsx — "SigRank vs Langfuse" SEO comparison page.
 *
 * Angle: Langfuse is an LLM observability/tracing platform (logs, metrics,
 * evaluation). SigRank is an operator leaderboard with scoring. Observability
 * vs competition — Langfuse traces LLM calls for debugging; SigRank scores the
 * operator's token efficiency for ranking.
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
  title: "SigRank vs Langfuse \u2014 Observability vs Competition",
  description:
    "Langfuse traces LLM calls for debugging and evaluation. SigRank scores the operator's token efficiency for ranking. Observability vs competition.",
  path: "/vs/langfuse",
});

const COMPARE_ROWS: { feature: string; langfuse: string; sigrank: string }[] = [
  {
    feature: "What it is",
    langfuse: "LLM observability & tracing platform",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Traces LLM calls (logs, spans, generations)",
    langfuse: "Yes",
    sigrank: "No (token counts only)",
  },
  {
    feature: "Scores operator token efficiency",
    langfuse: "No (traces, not scores)",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    langfuse: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    langfuse: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER → TRANSMITTER)",
    langfuse: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", langfuse: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    langfuse: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    langfuse: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", langfuse: "No", sigrank: "Yes" },
  {
    feature: "Works across Cursor + Claude Code + Copilot + 15+",
    langfuse: "Yes (via SDK integrations)",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    langfuse: "Partial (logs may contain content)",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Langfuse?",
    answer:
      "No — they solve different problems. Langfuse is an LLM observability platform: it traces LLM calls — logs, spans, generations, prompts, completions — so you can debug, monitor, and evaluate your AI application. SigRank is an operator leaderboard: it scores how efficiently a human drives AI tools and ranks them globally. Langfuse is for understanding your app&apos;s LLM usage; SigRank is for ranking the operator behind it. Observability vs competition — different goals, different layers.",
  },
  {
    question: "Does Langfuse measure operator token efficiency?",
    answer:
      "Langfuse traces LLM calls and can aggregate token usage metrics — input tokens, output tokens, cost per call. That is application-level observability: it tells you what your app spent and where. It does not compute the cascade efficiency (Υ Yield = cache_read × output / input²), does not assign a class tier, and does not rank operators on a leaderboard. Langfuse answers &quot;what happened in this LLM call?&quot; SigRank answers &quot;how efficiently does this operator drive AI?&quot; Tracing vs scoring — different questions.",
  },
  {
    question: "Why is a leaderboard different from observability?",
    answer:
      "Observability (Langfuse) is inward-facing: it helps a team understand and improve their own application&apos;s LLM usage. The data stays private, scoped to one project, used for debugging and evaluation. A leaderboard (SigRank) is outward-facing: it ranks operators against each other on a canonical, public metric. The score is signed, server-verified, and comparable across operators, tools, and platforms. Observability tells you what your app did; a leaderboard tells you how you compare to everyone else. The first is a debug tool; the second is a competition.",
  },
  {
    question: "Can I use SigRank alongside Langfuse?",
    answer:
      "Yes — they are complementary. Use Langfuse to trace and debug your application&apos;s LLM calls. Use SigRank to score the human operator who drives your AI tools — including the app Langfuse is observing. The SigRank CLI reads token telemetry locally (token counts only, never prompt content), computes the cascade metrics, signs a snapshot with ed25519, and publishes it to the leaderboard. Langfuse sees the app&apos;s calls; SigRank scores the operator behind them. Run `sigrank enroll` then `sigrank submit` to get your rank.",
  },
  {
    question: "What is the difference between LLM tracing and operator scoring?",
    answer:
      "LLM tracing (Langfuse) records what happened inside individual LLM calls — the prompt, the completion, the latency, the token count, the model used. It is a per-call, application-scoped debug log. Operator scoring (SigRank) aggregates the token telemetry across an operator&apos;s entire session — across tools, across platforms — and computes a single cascade efficiency score (Υ Yield) that is comparable globally. Tracing answers &quot;what did this call do?&quot; Scoring answers &quot;how efficiently does this person drive AI?&quot; The first is observability; the second is competition.",
  },
];

export default function VsLangfusePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Langfuse", path: "/vs/langfuse" },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Langfuse"
        title="Observability vs Competition"
        subtitle={
          <>
            Langfuse traces LLM calls for debugging and evaluation. SigRank{" "}
            <span className="text-gold">scores the operator</span>&apos;s token
            efficiency for ranking. Observability vs competition.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Langfuse
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Langfuse is an open-source LLM observability platform — it traces LLM
          calls so you can debug, monitor, and evaluate your AI application. Logs,
          spans, generations, prompt management, evaluation pipelines, cost
          analytics: Langfuse gives you a dashboard into what your app&apos;s LLM
          calls are doing. It is excellent at what it does, which is{" "}
          <em>observability</em>. What it does not do is score the human operator
          or rank them against anyone.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is a different thing entirely: an{" "}
          <strong className="text-text-primary">operator leaderboard</strong>. It
          reads token telemetry from any AI tool an operator drives, computes the
          cascade efficiency (Υ Yield), and ranks them globally. Langfuse tells
          you what your app did; SigRank tells you how you compare to every other
          operator. Observability vs competition — different goals, different
          layers.
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
                  Langfuse
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
                    {r.langfuse}
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

      {/* Inward-facing vs outward-facing */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Inward-facing vs outward-facing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Observability is inward-facing. Langfuse helps a team understand and
          improve their own application&apos;s LLM usage: which prompts are
          expensive, which chains are slow, which generations failed evaluation.
          The data stays private, scoped to one project, used for debugging. It
          answers &quot;what is my app doing?&quot;
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A leaderboard is outward-facing. SigRank ranks operators against each
          other on a canonical, public metric. The score —{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{" "}
          — is signed with ed25519, server-verified, and comparable across
          operators, tools, and platforms. It answers &quot;how do I compare to
          everyone else?&quot; The first is a debug tool; the second is a
          competition. You can run both — they do not overlap.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Tracing vs scoring
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            Langfuse traces individual LLM calls — the prompt, the completion, the
            latency, the token count. It is a per-call, application-scoped log.
            SigRank aggregates token telemetry across an operator&apos;s entire
            session — across tools, across platforms — and computes a single
            cascade efficiency score that is comparable globally. Tracing tells
            you what happened; scoring tells you how good the operator is.
          </p>
        </div>
      </section>

      {/* Privacy */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Token counts only — never content
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Langfuse&apos;s traces can include full prompt and completion content —
          that is the point of observability, you need to see what the model
          received and returned. SigRank is privacy-preserving by design: it
          reads only the four token integers (input, output, cache-read,
          cache-write) and never touches prompt content. Your sessions stay on
          your machine; only the signed token counts leave it. That makes SigRank
          safe to run in any environment, including ones where logging content is
          a compliance risk.
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
          Trace with Langfuse. Compete on SigRank.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Langfuse shows you what your app&apos;s LLM calls did. SigRank scores
          the operator behind them and ranks them globally. Install the CLI,
          submit a signed snapshot, and get a rank that measures the operator,
          not the trace.
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
