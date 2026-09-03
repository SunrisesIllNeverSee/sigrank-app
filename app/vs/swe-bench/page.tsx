/**
 * app/vs/swe-bench/page.tsx — "SigRank vs SWE-bench" SEO page.
 *
 * Angle: SWE-bench evaluates AI MODELS on real software engineering tasks
 * (GitHub issue → patch resolution). SigRank evaluates OPERATORS by token
 * cascade efficiency. SWE-bench asks "can the model fix the bug?" SigRank
 * asks "how efficiently did the operator drive the model to fix the bug?"
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
  title: "SigRank vs SWE-bench \u2014 Model Benchmark vs Operator Benchmark",
  description:
    "SWE-bench evaluates AI models on real software engineering tasks. SigRank evaluates operators by token cascade efficiency. SWE-bench asks can the model fix the bug. SigRank asks how efficiently did you drive it.",
  path: "/vs/swe-bench",
});

const COMPARE_ROWS: { feature: string; swebench: string; sigrank: string }[] = [
  {
    feature: "What gets evaluated",
    swebench: "AI models (GPT-4, Claude, Gemini\u2026)",
    sigrank: "AI operators (the humans driving)",
  },
  {
    feature: "Evaluation signal",
    swebench: "Pass/fail on GitHub issue resolution",
    sigrank: "Token cascade efficiency (\u03A5 Yield)",
  },
  {
    feature: "Task scope",
    swebench: "Software engineering (patch correctness)",
    sigrank: "Any AI workflow (coding, writing, analysis)",
  },
  {
    feature: "Scores the model or the operator",
    swebench: "The model",
    sigrank: "The operator",
  },
  {
    feature: "Measurement source",
    swebench: "Automated test suite execution",
    sigrank: "On-device token telemetry (ed25519-signed)",
  },
  {
    feature: "Privacy-preserving (no prompt content)",
    swebench: "N/A (public repo issues)",
    sigrank: "Yes (token counts only)",
  },
  {
    feature: "Reproducible from your own logs",
    swebench: "No (fixed benchmark dataset)",
    sigrank: "Yes (on-device scanner)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    swebench: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    swebench: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (15+ AI tools)",
    swebench: "Models only",
    sigrank: "Yes",
  },
  {
    feature: "Published science (Conservation Law, DOI)",
    swebench: "SWE-bench paper (ICLR)",
    sigrank: "Yes (DOI: 10.5281/zenodo.20029607)",
  },
  { feature: "MCP server for agent integration", swebench: "No", sigrank: "Yes" },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What is the difference between SWE-bench and SigRank?",
    answer:
      "SWE-bench evaluates AI MODELS on real software engineering tasks \u2014 given a GitHub issue, can the model produce a patch that passes the test suite? SigRank evaluates OPERATORS \u2014 the humans driving the AI \u2014 by measuring token cascade efficiency (\u03A5 = cache_read \u00D7 output / input\u00B2) from on-device, signed telemetry. SWE-bench answers &quot;can the model fix the bug?&quot;; SigRank answers &quot;how efficiently did the operator drive the model to fix the bug?&quot; They measure different layers of the human-AI stack.",
  },
  {
    question: "Is SigRank an alternative to SWE-bench?",
    answer:
      "They are complementary, not replacements. SWE-bench is the gold standard for model-level coding capability \u2014 it tells you which model can resolve real issues. SigRank is the standard for operator-level efficiency \u2014 it tells you how well the human used the model. You pick the model with SWE-bench; you measure your driving skill with SigRank. If you want a benchmark that ranks the human side of AI-assisted coding, SigRank is the one that does that.",
  },
  {
    question: "Why rank operators instead of models?",
    answer:
      "Because the model is a constant across operators, but the outcome is not. Give ten operators the same Claude model and the same SWE-bench task and you get ten different token cascades \u2014 different input sizes, different cache reuse, different output. The model didn't change; the driving did. SWE-bench controls for the operator to isolate the model. SigRank controls for the model to isolate the operator. Both are valid; only SigRank answers &quot;how well did I drive?&quot;",
  },
  {
    question: "Does SWE-bench's pass/fail signal make it more rigorous than SigRank?",
    answer:
      "SWE-bench's pass/fail is rigorous for its question \u2014 did the patch work? But it says nothing about the process. Two operators can both pass the same SWE-bench task, one with 500 tokens and high cache reuse, the other with 50,000 tokens and zero cache reuse. SWE-bench scores them identically. SigRank scores them differently \u2014 because the driving was different. Process efficiency is a separate axis from outcome correctness, and both matter.",
  },
  {
    question: "Can SigRank work alongside SWE-bench?",
    answer:
      "Yes. SWE-bench tells you which model to use for software engineering tasks. SigRank tells you how efficiently you drove that model while solving them. An operator who passes SWE-bench tasks with high \u03A5 Yield is demonstrably more efficient than one who passes with low \u03A5 Yield. Together they answer both &quot;did it work?&quot; and &quot;how efficiently did you make it work?&quot;",
  },
];

export default function VsSweBenchPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs SWE-bench", path: "/vs/swe-bench" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs SWE-bench \u2014 Model Benchmark vs Operator Benchmark",
            description: "SWE-bench evaluates AI models on real software engineering tasks. SigRank evaluates operators by token cascade efficiency. SWE-bench asks can the model fix the bug. SigRank asks how efficiently did you drive it.",
            path: "/vs/swe-bench",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs SWE-bench"
        title="Model Benchmark vs Operator Benchmark"
        subtitle={
          <>
            SWE-bench asks <span className="text-gold">can the model fix the bug?</span>{" "}
            SigRank asks{" "}
            <span className="text-gold">how efficiently did you drive it?</span>{" "}
            Different layers of the human-AI stack.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: SWE-bench
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SWE-bench is the gold standard for one question:{" "}
          <em>which AI model can solve real software engineering tasks?</em>{" "}
          It takes GitHub issues from popular Python repos, asks the model to
          produce a patch, and checks whether the patch passes the existing test
          suite. That is a model-capability benchmark, and SWE-bench does it
          well.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank solves a different problem:{" "}
          <strong className="text-text-primary">
            how efficiently did the operator drive the model?
          </strong>{" "}
          Two operators can both pass the same SWE-bench task — one with
          500 tokens and high cache reuse, the other with 50,000 tokens and
          zero cache reuse. SWE-bench scores them identically. SigRank scores
          them differently, because the driving was different. The benchmark
          that was missing was the one that scores the human in the human-AI
          loop.
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
                  SWE-bench
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.swebench}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Outcome vs process */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Outcome vs process
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SWE-bench measures outcome: did the patch pass the tests? That is a
          binary signal — correct or not. It says nothing about the
          process. An operator who solves a SWE-bench task with 500 tokens of
          fresh input and 90% cache reuse is scored identically to one who
          brute-forces it with 50,000 tokens and zero cache reuse. Both pass;
          both get 1.0. The efficiency gap is invisible.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures process: the cascade metric{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{" "}
          rewards operators who reuse context, compress input, and convert
          tokens into output efficiently. The first operator scores{" "}
          <span className="font-mono text-gold">Υ ≈ 18,000+</span>;
          the second scores{" "}
          <span className="font-mono text-gold">Υ ≈ 200</span>. Same
          outcome, very different driving. Both signals matter — SWE-bench
          tells you the model can do it; SigRank tells you how efficiently the
          operator made it happen.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Same task, same model, different drivers
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            Ten operators, all on Claude, all solving the same SWE-bench issue.
            Seven pass; three fail. SWE-bench ranks the model identically for
            all ten. Among the seven who pass, SigRank reveals a 100×
            spread in Υ Yield — because one reused cached context from
            prior turns, one re-sent the entire codebase every turn, and one
            wrote a single tight prompt. SWE-bench says &quot;the model can do
            it.&quot; SigRank says &quot;here&apos;s who did it efficiently.&quot;
          </p>
        </div>
      </section>

      {/* Complementary, not competing */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Complementary, not competing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SWE-bench and SigRank sit at different layers of the evaluation stack.
          SWE-bench evaluates the model&apos;s capability ceiling — can it
          resolve real issues? SigRank evaluates the operator&apos;s driving
          efficiency — how well did the human extract value from the model?
          A team that uses SWE-bench to pick the right model and SigRank to
          measure operator efficiency gets both signals: capable model +
          efficient operators.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s scoring is grounded in published science — the
          Conservation Law of Commitment (DOI:{" "}
          <a
            href="https://doi.org/10.5281/zenodo.20029607"
            className="text-gold underline underline-offset-2"
          >
            10.5281/zenodo.20029607
          </a>
          ) — with a governance framework (MO§ES™, patent
          pending) enforcing submission integrity.
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
          You know the model can do it. Now measure the driving.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SWE-bench told you the model can fix the bug. SigRank tells you how
          efficiently you drove it there. Install the CLI, submit a signed
          snapshot, and see where you rank among operators — not models.
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
            See the operator leaderboard
          </Link>
        </div>
      </section>

      {/* Cross-links */}
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
            href="/ai-benchmarking"
            className="text-gold underline underline-offset-2"
          >
            AI Benchmarking
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
        </p>
      </section>
    </div>
  );
}
