/**
 * app/alternatives/ai-coding-benchmark-platforms/page.tsx —
 * "Best AI Coding Benchmark Platforms (2026)"
 *
 * SEO listicle targeting "ai coding benchmark platforms", "ai coding
 * benchmarks", "code generation benchmarks". Distinct from
 * /alternatives/ai-benchmarking-tools (which is broader): this page focuses on
 * platforms that run code-generation benchmarks specifically, and argues that
 * SigRank benchmarks operators (operators driving AI) while the others benchmark
 * models on coding tasks — a different unit of measurement.
 *
 * RSC (no "use client"). Uses withOG, JsonLd (breadcrumb + faqPage +
 * ItemList), WaveHero, and Tailwind theme tokens matching the repo convention.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, alternativesItemList } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Best AI Coding Benchmark Platforms (2026)",
  description:
    "The 6 best AI coding benchmark platforms in 2026. SigRank, LMSYS Chatbot Arena, BigCode Leaderboard, HumanEval, SWE-bench, and LiveCodeBench — which benchmarks operators, not just models.",
  path: "/alternatives/ai-coding-benchmark-platforms",
});

type Tool = {
  name: string;
  measures: string;
  pros: string[];
  cons: string[];
  pricing: string;
  bestFor: string;
  featured?: boolean;
};

const TOOLS: Tool[] = [
  {
    name: "SigRank",
    measures:
      "Operator-level token-cascade efficiency — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier. The only platform that benchmarks the operator driving the AI, not the model on coding tasks.",
    pros: [
      "Benchmarks operators, not models — a different unit of measurement entirely",
      "Platform-neutral: works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms",
      "Privacy-preserving: on-device scanning, token counts only, ed25519-signed submissions",
      "Live benchmarking with 7d/30d/90d/all-time windows and head-to-head operator comparison",
      "Class tiers from IGNITER to ARCH+ — you see exactly where your coding cascade ranks",
    ],
    cons: [
      "Newer ecosystem — benchmark sample still growing",
      "Requires a CLI install and enrollment to submit",
    ],
    pricing: "Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "Operators who want to be benchmarked on real coding-session efficiency, not synthetic tasks",
    featured: true,
  },
  {
    name: "LMSYS Chatbot Arena",
    measures:
      "Crowd-sourced model benchmarking via pairwise human preference votes, including a coding category. Ranks which LLM humans prefer in coding chats, not how efficiently any operator uses one.",
    pros: [
      "Dedicated coding category — directly relevant to code generation",
      "Blind pairwise comparison reduces brand bias",
      "Elo-style ranking is well-understood and frequently updated",
    ],
    cons: [
      "Benchmarks models, not operators — blind to the operator driving the AI",
      "Preference votes, not efficiency metrics — no yield, leverage, or cascade scoring",
      "No operator identity, no per-user telemetry, no real-session benchmarking",
    ],
    pricing: "Free (open leaderboard)",
    bestFor: "Benchmarking which model humans prefer for coding tasks",
  },
  {
    name: "BigCode Leaderboard",
    measures:
      "Code-generation model benchmark leaderboard — ranks LLMs on BigCode's own coding evals and HumanEval-style tasks. Measures model code quality on synthetic tasks, not operator skill.",
    pros: [
      "Focused on code generation — directly relevant to AI coding workflows",
      "Transparent benchmark methodology with reproducible eval sets",
      "Ranks open and closed models side-by-side on coding tasks",
    ],
    cons: [
      "Benchmarks models, not operators — blind to the operator driving the AI",
      "Synthetic benchmark tasks — not real-world coding sessions",
      "No token-cascade metrics, no operator identity, no live operator benchmarking",
    ],
    pricing: "Free (open leaderboard)",
    bestFor: "Benchmarking which code-generation model scores best on synthetic tasks",
  },
  {
    name: "HumanEval",
    measures:
      "Classic code-generation benchmark — tests whether an LLM can complete Python functions from docstrings. Measures model pass@1 rate on synthetic coding problems, not operator efficiency.",
    pros: [
      "Widely adopted standard — most code models report HumanEval scores",
      "Simple, reproducible task format (function + docstring → implementation)",
      "Pass@1 and pass@10 metrics are well-understood",
    ],
    cons: [
      "Benchmarks models, not operators — no operator in the loop",
      "Synthetic tasks — completing a function from a docstring is not real coding",
      "Saturated — top models now score 90%+, making it a weak differentiator",
    ],
    pricing: "Free (open-source benchmark)",
    bestFor: "Comparing model pass@1 rates on basic code completion",
  },
  {
    name: "SWE-bench",
    measures:
      "Software engineering benchmark — tests whether an LLM can resolve real GitHub issues end-to-end. Measures model capability on real-world SWE tasks, not operator efficiency.",
    pros: [
      "Real-world tasks — resolves actual GitHub issues, not synthetic problems",
      "End-to-end evaluation — tests the full SWE workflow, not just code completion",
      "Rigorous methodology with verified test patches",
    ],
    cons: [
      "Benchmarks models, not operators — blind to the operator driving the AI",
      "Expensive to run — requires full repo checkout and test execution",
      "No token-cascade metrics, no operator identity, no per-session efficiency",
    ],
    pricing: "Free (open-source benchmark)",
    bestFor: "Benchmarking which model can resolve real GitHub issues end-to-end",
  },
  {
    name: "LiveCodeBench",
    measures:
      "Contamination-aware code benchmark — tests models on coding problems released after their training cutoff. Measures model coding ability without data contamination, not operator efficiency.",
    pros: [
      "Contamination-aware — avoids benchmark leakage by using post-cutoff problems",
      "Live-updated with new problems as they are released",
      "Covers multiple coding competition platforms (LeetCode, AtCoder, Codeforces)",
    ],
    cons: [
      "Benchmarks models, not operators — no operator in the loop",
      "Competition-style problems — not representative of real coding sessions",
      "No token-cascade metrics, no operator identity, no real-session data",
    ],
    pricing: "Free (open-source benchmark)",
    bestFor: "Benchmarking model coding ability without training-data contamination",
  },
];

const FAQS = [
  {
    question: "What are AI coding benchmark platforms?",
    answer:
      "AI coding benchmark platforms run standardized tests to measure coding performance. Most (HumanEval, SWE-bench, LiveCodeBench, BigCode, LMSYS) benchmark models — they test whether an LLM can complete functions, resolve GitHub issues, or win coding competitions. SigRank is the only platform that benchmarks operators — the operators driving AI in real coding sessions — using token-cascade efficiency (Υ Yield: cache_read × output / input²).",
  },
  {
    question: "How is operator benchmarking different from model benchmarking?",
    answer:
      "Model benchmarking asks 'can this LLM write code?' — it tests the model on synthetic or real tasks and reports pass@1, Elo, or resolution rate. Operator benchmarking asks 'can this person use AI to write code efficiently?' — it measures the operator's cascade architecture across real sessions. A great operator with a mid-tier model can outperform a poor operator with the best model. SigRank benchmarks the operator; the others benchmark the model.",
  },
  {
    question: "Which platform is best for benchmarking AI coding?",
    answer:
      "It depends on what you're benchmarking. For model code-completion ability, HumanEval is the standard. For real-world SWE tasks, SWE-bench. For contamination-free coding, LiveCodeBench. For crowd-sourced model preference, LMSYS. For open model code quality, BigCode. But for benchmarking operators — the operators driving AI — SigRank is the only platform that scores real-session cascade efficiency and ranks you on a live leaderboard.",
  },
  {
    question: "Do these platforms measure operator performance?",
    answer:
      "No — with one exception. HumanEval, SWE-bench, LiveCodeBench, BigCode, and LMSYS all measure model performance on coding tasks. No operator is in the loop; they test the LLM directly. SigRank is the only platform that measures operator performance — specifically, how efficiently an operator drives AI across real coding sessions, scored by Υ Yield (cache_read × output / input²) and ranked on a live leaderboard.",
  },
  {
    question: "Are AI coding benchmark platforms free?",
    answer:
      "Yes. SigRank, HumanEval, SWE-bench, LiveCodeBench, BigCode Leaderboard, and LMSYS Chatbot Arena are all free and open-source. The difference is that only SigRank benchmarks operators — the rest benchmark models and are free to use but cannot measure or rank your performance as an operator driving AI.",
  },
];

export default function AICodingBenchmarkPlatformsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "AI Coding Benchmark Platforms",
              path: "/alternatives/ai-coding-benchmark-platforms",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/ai-coding-benchmark-platforms",
            "Best AI Coding Benchmark Platforms (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best AI Coding Benchmark Platforms (2026)"
        subtitle={
          <>
            Six benchmark platforms. Five benchmark{" "}
            <span className="text-gold">models</span>. Only one benchmarks the{" "}
            <span className="text-gold">operator</span>.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most AI coding benchmark platforms benchmark <em>models</em>. HumanEval
          tests whether an LLM can complete Python functions. SWE-bench tests
          whether a model can resolve real GitHub issues. LiveCodeBench tests
          coding ability without training contamination. BigCode ranks models
          on code generation. LMSYS ranks which model humans prefer in coding
          chats. None of these benchmark <strong className="text-text-primary">operators</strong> —
          the operators who actually drive AI in real coding sessions.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the only platform that benchmarks operators on
          token-cascade efficiency with the Υ Yield metric (
          <span className="font-mono text-gold">cache_read × output / input²</span>).
          It measures a different unit — the operator, not the model. The five
          model-benchmarking platforms below are excellent at what they do, but
          they answer a different question: "can this model code?" not "can
          this operator use AI to code efficiently?"
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          At-a-glance comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Platform
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Benchmarks
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Benchmarks operators?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Pricing
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr
                  key={t.name}
                  className={`border-b border-bg-border-subtle last:border-b-0 ${t.featured ? "bg-gold/5" : ""}`}
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {t.featured ? (
                      <span className="text-gold">{t.name}</span>
                    ) : (
                      t.name
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {t.measures.split("—")[0].trim()}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? (
                      <span className="text-gold">Yes — the only one</span>
                    ) : (
                      "No — benchmarks models"
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.pricing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 6 platforms, in detail
        </h2>
        <div className="flex flex-col gap-5">
          {TOOLS.map((t, i) => (
            <article
              key={t.name}
              className={`flex flex-col gap-4 rounded-lg border p-6 ${
                t.featured
                  ? "border-gold/40 bg-gold/5"
                  : "border-bg-border bg-bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-mono text-lg font-bold text-text-primary">
                  {t.featured ? (
                    <span className="text-gold">{t.name}</span>
                  ) : (
                    t.name
                  )}
                </h3>
                {t.featured && (
                  <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                    editor&apos;s pick
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    What it measures
                  </span>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                    {t.measures}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pros
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.pros.map((p) => (
                        <li
                          key={p}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-gold">+</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Cons
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.cons.map((c) => (
                        <li
                          key={c}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-text-muted">−</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pricing
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.pricing}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Best for
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.bestFor}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The verdict
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you want to know whether a model can complete Python functions,
          HumanEval will tell you. If you want real-world SWE resolution,
          SWE-bench. If you want contamination-free coding, LiveCodeBench. If
          you want crowd-sourced model preference, LMSYS. If you want open
          model code quality, BigCode. But if you want to know whether{" "}
          <strong className="text-text-primary">you</strong> are using AI to
          code efficiently — whether your cascade is compounding or burning —
          SigRank is the only platform that benchmarks operators on real
          coding-session efficiency.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Install the CLI, submit a snapshot, and see your class tier on the
          live benchmark:{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            npm install -g sigrank
          </code>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-mono text-sm font-bold text-text-primary">
                {f.question}
              </dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ai-benchmarking-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Benchmarking Tools
          </Link>
          {" · "}
          <Link
            href="/alternatives/ai-coding-efficiency-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Efficiency Tools
          </Link>
          {" · "}
          <Link
            href="/vs/lmsys-arena"
            className="text-gold underline underline-offset-2"
          >
            vs LMSYS Arena
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-benchmark-ai-coding-workflow"
            className="text-gold underline underline-offset-2"
          >
            How to Benchmark Your AI Coding Workflow
          </Link>
        </p>
      </section>
    </div>
  );
}
