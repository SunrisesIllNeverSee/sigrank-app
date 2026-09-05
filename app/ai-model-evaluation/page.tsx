/**
 * app/ai-model-evaluation/page.tsx — "AI Model Evaluation vs Operator
 * Evaluation"
 *
 * Frames model evaluation as necessary but not sufficient. SigRank is the
 * complementary operator layer. Links into /ai-benchmarking, /vs/lmsys-arena,
 * /methodology, /ai-evaluation.
 *
 * JSON-LD: breadcrumb() + definedTerm() + faqPage().
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "AI Model Evaluation vs Operator Evaluation",
  description:
    "AI model evaluation is necessary but not sufficient. SigRank is the complementary operator layer — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots. Model vs operator evaluation.",
  path: "/ai-model-evaluation",
});

const RELATED = [
  {
    href: "/ai-benchmarking",
    title: "AI Benchmarking — Beyond Model Leaderboards",
    desc: "Model benchmarks rank models. Operator benchmarks rank the operators driving them. The complement to model-only benchmarking.",
  },
  {
    href: "/vs/lmsys-arena",
    title: "SigRank vs. LMSYS Chatbot Arena",
    desc: "LMSYS Arena is a model evaluation. SigRank is an operator evaluation. Different questions, different answers — and why both matter.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology for the operator layer.",
  },
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. Model evaluation is one layer; SigRank covers the operator layer.",
  },
];

export default function AIModelEvaluationPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "AI Model Evaluation", path: "/ai-model-evaluation" },
          ]),
          definedTerm(
            "AI Model Evaluation",
            "AI model evaluation is the measurement and comparison of AI model performance using test suites (MMLU, HumanEval, SWE-bench) or preference votes (LMSYS Chatbot Arena). It answers \"which model is best?\" and is necessary but not sufficient for complete AI evaluation, because it holds the operator as a constant and averages away the operator-level difference that determines real-world performance. SigRank is the complementary operator layer — it measures who is best at using the model via privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²).",
            "/ai-model-evaluation",
          ),
          faqPage([
            {
              question: "What is AI model evaluation?",
              answer:
                "AI model evaluation is the measurement and comparison of AI model performance. It uses test suites (MMLU for knowledge, HumanEval for code generation, SWE-bench for software engineering) or preference votes (LMSYS Chatbot Arena for human-preference rankings). Model evaluation answers \"which model is best?\" — a question you answer at selection time and revisit when new models ship. It is the most mature layer of AI evaluation and the one most organizations already do.",
            },
            {
              question: "What is the difference between model evaluation and operator evaluation?",
              answer:
                'Model evaluation asks "which AI is best?" and ranks models using test suites or preference votes. Operator evaluation asks "who is best at using the AI?" and ranks operators using real token telemetry from live sessions. Model evaluation holds the model as the variable and the operator as a constant. Operator evaluation inverts that: the model is a constant (you pick one and drive it), and the operator is the variable. They are complements, not competitors — both layers matter for complete AI evaluation.',
            },
            {
              question: "Why do you need both model and operator evaluation?",
              answer:
                "Because model evaluation is necessary but not sufficient. It tells you which model to choose, but not whether you are driving it well. Two operators on the same model produce wildly different results — token efficiency, output quality, cost per task. Model evaluation averages that difference away. A great model driven poorly still produces poor results; a weaker model driven well can outperform it. You need model evaluation to choose the model and operator evaluation to measure whether you are using it well. Complete AI evaluation needs both.",
            },
            {
              question: "How does SigRank complement model evaluation?",
              answer:
                "SigRank measures the operator — the operator driving the model that model evaluation helped you choose. It captures four token pillars (input, output, cache-read, cache-write) on-device from real sessions, computes Yield (Υ = cache_read × output / input²), and ranks operators cohort-relative. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read. SigRank does not replace MMLU or LMSYS Arena; it sits beside them as the operator layer — the layer that model evaluation cannot see.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Model vs Operator"
        terminalText="MODEL"
        title="AI Model Evaluation vs Operator Evaluation"
        subtitle={
          <>
            Model evaluation is necessary but not sufficient. It tells you
            which model to choose, but not whether you are driving it well.
            SigRank is the{" "}
            <span className="text-gold">complementary operator layer</span> —
            the layer model evaluation cannot see.
          </>
        }
      />

      {/* ── What model evaluation does ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What model evaluation does
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI model evaluation measures and compares model performance. MMLU
          tests knowledge across domains. HumanEval tests code generation.
          SWE-bench tests software engineering on real GitHub issues. LMSYS
          Chatbot Arena ranks models by human preference in head-to-head
          comparisons. These tools answer &ldquo;which model is best?&rdquo; —
          a question you answer at selection time and revisit when new models
          ship. Model evaluation is the most mature layer of AI evaluation and
          the one most organizations already do.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          It is necessary. You need to know which model to deploy. But it is
          not sufficient. Model evaluation holds the model as the variable and
          the operator as a constant — and in practice the opposite is true.
          You pick a model and drive it; the model is a constant and the
          operator is the variable. Model evaluation cannot see the
          operator-level difference that determines real-world performance.
        </p>
      </section>

      {/* ── What model evaluation misses ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What model evaluation misses
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Two operators on the same model produce wildly different results.
          One reuses cached context efficiently, sends minimal fresh input,
          and gets substantial output back — a high-yield cascade. The other
          sends large fresh inputs, reuses nothing, and gets little back — a
          token-burning cascade. Model evaluation averages that difference
          away because it holds the operator as a constant. The result is a
          blind spot: you know which model is best, but not who is best at
          using it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A great model driven poorly still produces poor results. A weaker
          model driven well can outperform it. The operator is the variable
          that model evaluation cannot see — and it is the variable that
          determines whether the model you chose is actually working for you.
        </p>
      </section>

      {/* ── How SigRank complements ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank complements model evaluation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures the operator — the operator driving the model that
          model evaluation helped you choose. Four token pillars — input,
          output, cache-read, cache-write — are captured on-device from real
          sessions. The yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures whether signal is compounding or tokens are burning.
          Operators are ranked cohort-relative and scored over multiple time
          windows. Snapshots are ed25519-signed and verified server-side. No
          prompt content is ever read.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank does not replace MMLU or LMSYS Arena. It sits beside them as
          the operator layer. Model evaluation tells you which model to
          deploy. SigRank tells you whether your team is driving it well.
          Complete AI evaluation needs both — and the operator layer is the
          one most teams are missing.
        </p>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore the category
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RELATED.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
            >
              <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
                {r.title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
                {r.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is AI model evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The measurement and comparison of model performance using test
              suites (MMLU, HumanEval, SWE-bench) or preference votes (LMSYS
              Arena). Answers &ldquo;which model is best?&rdquo; — necessary
              but not sufficient.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Model evaluation vs. operator evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Model evaluation ranks models; operator evaluation ranks the
              operators driving them. Model evaluation holds the operator as a
              constant; operator evaluation treats the operator as the
              variable. Complements, not competitors.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why do you need both?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Model evaluation tells you which model to choose. Operator
              evaluation tells you whether you are driving it well. A great
              model driven poorly still produces poor results. Complete AI
              evaluation needs both layers.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank complement model evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It measures the operator driving the model. Four token pillars,
              the Yield metric, cohort-relative ranking, ed25519-signed
              snapshots. It sits beside MMLU and LMSYS Arena as the operator
              layer they cannot see.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
