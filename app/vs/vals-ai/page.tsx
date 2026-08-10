/**
 * app/vs/vals-ai/page.tsx — "SigRank vs VALS AI" SEO comparison page.
 *
 * Angle: VALS evaluates AI systems. SigRank evaluates AI operators and their
 * workflows. The leaderboard is proof, not the product. The product is the
 * operator-evaluation standard.
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
  title: "SigRank vs VALS AI — Operator Evaluation vs System Evaluation",
  description:
    "VALS evaluates AI systems. SigRank evaluates AI operators and their workflows. Models are benchmarked constantly — the people operating them are not. SigRank is the evaluation platform for AI operators.",
  path: "/vs/vals-ai",
});

const COMPARE_ROWS: { feature: string; vals: string; sigrank: string }[] = [
  {
    feature: "What it evaluates",
    vals: "AI systems (models, agents, pipelines)",
    sigrank: "AI operators (the humans driving AI tools)",
  },
  {
    feature: "Unit of analysis",
    vals: "Test cases, model outputs, system behavior",
    sigrank: "Token cascade — how operators move tokens through sessions",
  },
  {
    feature: "Core metrics",
    vals: "Accuracy, robustness, safety, alignment",
    sigrank: "Yield, SNR, Leverage, Velocity, 10xDEV",
  },
  {
    feature: "Measurement method",
    vals: "Test suites and evaluation harnesses",
    sigrank: "Privacy-preserving token telemetry (signed snapshots)",
  },
  {
    feature: "Benchmark type",
    vals: "Static test cases against fixed prompts",
    sigrank: "Time windows, sessions, task contexts, platform data",
  },
  {
    feature: "Regression tracking",
    vals: "Model version comparisons",
    sigrank: "Operator trend and workflow improvement over time",
  },
  {
    feature: "Leaderboard",
    vals: "Model performance rankings",
    sigrank: "SigRank Index — operator benchmark (the proof, not the product)",
  },
  {
    feature: "Evaluation standard",
    vals: "Academic / institutional benchmarks",
    sigrank: "Signed token-telemetry methodology (RS.xx ruleset)",
  },
  {
    feature: "Privacy model",
    vals: "Varies (test data may be shared)",
    sigrank: "Token counts only — never prompt content leaves the machine",
  },
  {
    feature: "Platform coverage",
    vals: "Model-specific or API-specific",
    sigrank: "Platform-neutral (Claude, Cursor, Copilot, Devin, 15+ tools)",
  },
  {
    feature: "What it answers",
    vals: "Which AI system is better?",
    sigrank: "Who is the better AI operator?",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How is SigRank different from VALS AI?",
    answer:
      "VALS evaluates AI systems — models, agents, pipelines. SigRank evaluates AI operators — the humans who drive AI tools. VALS asks &quot;which system is better?&quot; SigRank asks &quot;who is the better operator?&quot; They are complementary: VALS measures the machine, SigRank measures the person driving it. The SigRank leaderboard is proof of the evaluation standard, not the product itself — the product is the operator-evaluation methodology.",
  },
  {
    question: "Why evaluate AI operators instead of AI systems?",
    answer:
      "Models are benchmarked constantly — LMSYS, VALS, HELM, Open LLM Leaderboard. The people operating them are not. In AI-assisted work, the model does the keystrokes; the operator&apos;s job is to drive it efficiently. Two operators using the same model can get a 10× difference in signal. That variance is in the operator, not the model. SigRank measures it using privacy-preserving token telemetry: Yield (Υ = cache_read × output / input²), Leverage, Velocity, and 10xDEV.",
  },
  {
    question: "Can I use SigRank alongside VALS AI?",
    answer:
      "Yes — they measure different layers. VALS tells you which AI system to deploy. SigRank tells you how effectively your team operates it once deployed. Together they answer &quot;is the system good?&quot; and &quot;are we using it well?&quot; An operator with high Yield on a mid-tier model can outperform one with low Yield on a top-tier model — the operator-evaluation layer is where workflow efficiency lives.",
  },
  {
    question: "What does VALS AI not see that SigRank does?",
    answer:
      "VALS sees system-level behavior — model outputs, accuracy, safety, robustness. It does not see the token cascade: how much input an operator sends, how much context they reuse from cache, how much output they produce per token of input. SigRank reads exactly those four pillars (input, output, cache-read, cache-write) and derives the cascade architecture — Yield, compression ratio, SNR, Leverage, and Velocity. That cascade is where operator efficiency lives, and it is invisible to a system-level evaluator.",
  },
  {
    question: "Is the SigRank leaderboard the product?",
    answer:
      "No. The leaderboard is proof, not the product. The product is the operator-evaluation standard — the methodology, metrics, and signed telemetry that make operator performance measurable and comparable. The leaderboard demonstrates that the standard works: real operators, real cascades, real rankings. The strategic path is personal measurement → benchmark → trend tracking → team evaluation → industry index. The leaderboard is the first step, not the destination.",
  },
];

export default function VsValsAiPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs VALS AI", path: "/vs/vals-ai" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs VALS AI — Operator Evaluation vs System Evaluation",
            description:
              "VALS evaluates AI systems. SigRank evaluates AI operators and their workflows. Models are benchmarked constantly — the people operating them are not.",
            path: "/vs/vals-ai",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs VALS AI"
        title="System Evaluation vs Operator Evaluation"
        subtitle={
          <>
            VALS evaluates <span className="text-gold">AI systems</span>.
            SigRank evaluates <span className="text-gold">AI operators</span>.
            Models are benchmarked constantly — the people operating them are
            not. The leaderboard is proof, not the product.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: different layers
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          VALS AI is a system evaluator. It tests AI models, agents, and
          pipelines against benchmarks — measuring accuracy, robustness, safety,
          and alignment. That is the <strong className="text-text-primary">system
          layer</strong>. SigRank is an operator evaluator. It measures how
          effectively humans drive AI tools — using privacy-preserving token
          telemetry to compute Yield, Leverage, Velocity, and workflow
          signatures. That is the <strong className="text-text-primary">operator
          layer</strong>.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The distinction matters because in AI-assisted work, the model does
          the keystrokes — the operator&apos;s skill is in{" "}
          <em>driving</em> it efficiently. Two operators using the same model
          can produce a 10× difference in signal. VALS can&apos;t see that
          variance because it lives in the operator, not the system. SigRank
          measures exactly that.
        </p>
      </section>

      {/* The framing table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The evaluation primitive
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  VALS-style primitive
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  SigRank equivalent
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Evaluate an AI system", "Evaluate an AI operator / workflow"],
                ["Test cases", "Time windows, sessions, task contexts, platform data"],
                ["Scores", "Yield, SNR, Leverage, Velocity, 10xDEV"],
                ["Leaderboard", "SigRank Index — operator benchmark"],
                ["Regression tracking", "Operator trend and workflow improvement"],
                ["Evaluation standard", "Signed token-telemetry methodology"],
              ].map(([vals, sigrank]) => (
                <tr
                  key={vals}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-secondary">{vals}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">{sigrank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feature comparison */}
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
                  VALS AI
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
                    {r.vals}
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

      {/* The bigger picture */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The leaderboard is proof, not the product
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The product is the <strong className="text-text-primary">operator-evaluation
          standard</strong> — the methodology, metrics, and signed telemetry that
          make human-AI collaboration measurable and comparable. The leaderboard
          demonstrates that the standard works: real operators, real cascades,
          real rankings. But the strategic path is bigger:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-sm text-gold">
            Personal measurement → benchmark → trend tracking → team evaluation → industry index
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That path is more durable than &quot;who is the best AI user?&quot;
          while retaining the viral sharpness of the public board. VALS owns the
          system-evaluation layer. SigRank owns the operator-evaluation layer.
          They don&apos;t compete — they stack.
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
          Evaluate your AI operator performance.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          VALS tells you which system to use. SigRank tells you how well you
          use it. Install the CLI, submit a signed snapshot, and see your Yield,
          class tier, and global rank in under a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Yield
          </a>
          <a
            href="/methodology"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Read the methodology
          </a>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/vs/lmsys-arena"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs LMSYS Arena
          </Link>
          {" · "}
          <Link
            href="/ai-operator-scoring"
            className="text-gold underline underline-offset-2"
          >
            AI Operator Scoring
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
