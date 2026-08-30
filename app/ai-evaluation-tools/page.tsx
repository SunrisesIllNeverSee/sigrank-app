/**
 * app/ai-evaluation-tools/page.tsx — "AI Evaluation Tools — The Complete
 * Landscape"
 *
 * Maps the AI evaluation tools landscape into four categories (model, output,
 * safety, operator) and positions SigRank as the only operator evaluation
 * tool. Links into /alternatives, /vs, /ai-evaluation, and /tools.
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
  title: "AI Evaluation Tools — The Complete Landscape",
  description:
    "AI evaluation tools fall into four categories: model, output, safety, and operator. SigRank is the only operator evaluation tool — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots.",
  path: "/ai-evaluation-tools",
});

const RELATED = [
  {
    href: "/alternatives",
    title: "AI Evaluation Tools — Alternatives",
    desc: "The full landscape of AI evaluation and measurement tools, category by category — and where SigRank fits as the operator layer.",
  },
  {
    href: "/vs",
    title: "SigRank vs. The Field",
    desc: "Head-to-head comparisons between SigRank and the leading AI evaluation tools — LMSYS Arena, Braintrust, Langfuse, and more.",
  },
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. SigRank covers the operator layer that the other tools miss.",
  },
  {
    href: "/tools",
    title: "SigRank Tools",
    desc: "The operator-evaluation tools: yield calculator, cascade comparator, operator-class checker, and token-waste calculator.",
  },
];

export default function AIEvaluationToolsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "AI Evaluation Tools", path: "/ai-evaluation-tools" },
          ]),
          definedTerm(
            "AI Evaluation Tools",
            "AI evaluation tools are software systems that measure and compare AI system performance. They fall into four categories: model evaluation tools (MMLU, LMSYS Arena, SWE-bench), output evaluation tools (LLM-as-judge, rubric scorers, human review platforms), safety evaluation tools (red-teaming frameworks, alignment benchmarks), and operator evaluation tools. SigRank is the only operator evaluation tool — it measures the humans driving the AI via privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²).",
            "/ai-evaluation-tools",
          ),
          faqPage([
            {
              question: "What are AI evaluation tools?",
              answer:
                "AI evaluation tools are software systems that measure and compare AI system performance. They fall into four categories: model evaluation tools (which model is best), output evaluation tools (is the output correct), safety evaluation tools (is the system safe), and operator evaluation tools (who uses the AI best). Most AI evaluation tools address the first three categories. SigRank is the only tool that addresses the operator layer — measuring the humans driving the AI via privacy-preserving token telemetry.",
            },
            {
              question: "What are the categories of AI evaluation tools?",
              answer:
                "Four categories. Model evaluation tools (MMLU, HumanEval, SWE-bench, LMSYS Chatbot Arena) rank models. Output evaluation tools (LLM-as-judge, rubric scorers, human review platforms) assess output quality. Safety evaluation tools (red-teaming frameworks, alignment benchmarks) test for harm. Operator evaluation tools (SigRank) measure who is best at using the AI. The first three are well-served; the operator category is new and SigRank is its only member.",
            },
            {
              question: "How do I choose AI evaluation tools?",
              answer:
                "Match the tool to the layer you need to evaluate. If you are choosing a model, use model evaluation tools (MMLU, LMSYS Arena). If you are checking output quality, use output evaluation tools (LLM-as-judge, human review). If you are testing safety, use safety evaluation tools (red-teaming). If you are measuring whether your developers are driving the AI well, use SigRank — the operator evaluation tool. Most teams need tools from multiple categories; complete AI evaluation is a stack, not a single tool.",
            },
            {
              question: "What makes SigRank different from other AI evaluation tools?",
              answer:
                "Every other AI evaluation tool measures the model, the output, or the safety of the system. SigRank is the only tool that measures the operator — the human driving the AI. It captures four token pillars (input, output, cache-read, cache-write) on-device from real sessions, computes Yield (Υ = cache_read × output / input²), and ranks operators cohort-relative. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read — only token counts. It is a new category, not a competitor to existing tools.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Tools Landscape"
        terminalText="TOOLS"
        title="AI Evaluation Tools — The Complete Landscape"
        subtitle={
          <>
            AI evaluation tools fall into four categories: model, output,
            safety, and operator. The first three are crowded. The{" "}
            <span className="text-gold">operator category</span> has one
            tool — SigRank — and it is the layer that determines whether the
            AI you chose is actually being driven well.
          </>
        }
      />

      {/* ── The four categories ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The four categories of AI evaluation tools
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI evaluation is not a single tool category. It is a stack of four
          distinct questions, each served by different tools. Knowing which
          category a tool belongs to is the first step in choosing the right
          one — most teams need tools from more than one.
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">
              Model evaluation tools.
            </strong>{" "}
            MMLU, HumanEval, SWE-bench, LMSYS Chatbot Arena. Rank models on
            test suites or preference votes. Answer: which model is best?
          </li>
          <li>
            <strong className="text-text-primary">
              Output evaluation tools.
            </strong>{" "}
            LLM-as-judge, rubric scorers, human review platforms, automated
            test harnesses. Assess whether the output is correct. Answer: is
            the result good?
          </li>
          <li>
            <strong className="text-text-primary">
              Safety evaluation tools.
            </strong>{" "}
            Red-teaming frameworks, alignment benchmarks, adversarial test
            suites. Test for harm and policy violations. Answer: is the system
            safe?
          </li>
          <li>
            <strong className="text-text-primary">
              Operator evaluation tools.
            </strong>{" "}
            SigRank. Measure who is best at using the AI via real token
            telemetry. Answer: are the developers driving the model well?
          </li>
        </ul>
      </section>

      {/* ── Why the operator category is empty (except SigRank) ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the operator category has one tool
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The operator category has been empty for a simple reason: measuring
          the human driving the AI requires access to real session telemetry,
          and reading prompts is invasive. Model evaluation tools avoid this
          by running synthetic tests in a controlled harness. Output
          evaluation tools avoid it by scoring the result after the fact.
          Neither approach touches the operator&apos;s actual workflow.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank solves the privacy problem by capturing token counts only —
          never prompt content. Four pillars (input, output, cache-read,
          cache-write) are sufficient to compute the yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          and classify cascade architecture. Snapshots are ed25519-signed and
          verified server-side, so the data is trustworthy without being
          readable. That is what makes operator evaluation tools possible —
          and SigRank is the first and only one.
        </p>
      </section>

      {/* ── How to choose ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to choose AI evaluation tools
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Start with the question you are trying to answer. If you are
          selecting a model, use model evaluation tools. If you are assuring
          output quality, use output evaluation tools. If you are managing
          safety and compliance, use safety evaluation tools. If you are
          measuring whether your team is using the AI well — the question most
          engineering leaders cannot answer today — use SigRank.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Complete AI evaluation is a stack, not a single tool. A mature team
          runs model benchmarks for selection, output evaluation for quality,
          safety evaluation for risk, and SigRank for operator performance.
          The four categories are complements. The mistake is assuming one
          tool can cover all four layers — it cannot, because each layer
          requires different data and answers a different question.
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
              What are AI evaluation tools?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Software systems that measure and compare AI system performance
              across four categories: model, output, safety, and operator.
              SigRank is the only operator evaluation tool.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are the categories of AI evaluation tools?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Model (MMLU, LMSYS Arena), output (LLM-as-judge, human review),
              safety (red-teaming, alignment benchmarks), and operator
              (SigRank). The first three are well-served; the operator
              category is new.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I choose AI evaluation tools?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Match the tool to the layer. Model tools for selection, output
              tools for quality, safety tools for risk, SigRank for operator
              performance. Complete AI evaluation is a stack — most teams need
              tools from multiple categories.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What makes SigRank different?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It is the only tool that measures the operator — the human
              driving the AI. Four token pillars, the Yield metric,
              ed25519-signed snapshots, and no prompt content ever read. A new
              category, not a competitor to existing tools.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
