/**
 * app/ai-evaluation/page.tsx — "AI Evaluation — Measuring the Operator, Not
 * Just the Model"
 *
 * Topic hub for the AI-evaluation category. Frames AI evaluation as four
 * layers (model, output, safety, operator), positions SigRank as the
 * operator layer, and links into /ai-benchmarking, /methodology, the LMSYS
 * comparison, and the yield-cascade metric page.
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
  title: "AI Evaluation — Measuring the Operator, Not Just the Model",
  description:
    "AI evaluation has four layers: model, output, safety, and operator. SigRank covers the operator layer — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots. The missing piece of AI evaluation.",
  path: "/ai-evaluation",
});

const RELATED = [
  {
    href: "/ai-benchmarking",
    title: "AI Benchmarking — Beyond Model Leaderboards",
    desc: "Model benchmarks rank models. Operator benchmarks rank the operators driving them. The complement to model-only benchmarking that AI evaluation has been missing.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology for the operator layer of AI evaluation.",
  },
  {
    href: "/vs/lmsys-arena",
    title: "SigRank vs. LMSYS Chatbot Arena",
    desc: "LMSYS Arena is a model evaluation. SigRank is an operator evaluation. Different layers of the same stack — and why both matter for complete AI evaluation.",
  },
  {
    href: "/metrics/yield-cascade",
    title: "Yield (Υ) — Token Cascade Efficiency",
    desc: "The headline operator-evaluation metric: Υ = cache_read × output / input². The single number that captures how efficiently an operator drives the AI.",
  },
];

export default function AIEvaluationPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "AI Evaluation", path: "/ai-evaluation" }]),
          definedTerm(
            "AI Evaluation",
            "AI evaluation is the systematic measurement and comparison of AI system performance across four layers: model (which model is best), output (is the output correct), safety (is the system safe), and operator (who uses the AI best). SigRank covers the operator layer — measuring the operators driving the AI via privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²).",
            "/ai-evaluation",
          ),
          faqPage([
            {
              question: "What is AI evaluation?",
              answer:
                "AI evaluation is the systematic measurement and comparison of AI system performance. It spans four layers: model evaluation (which model is best, e.g. MMLU, LMSYS Arena), output evaluation (is the output correct, e.g. human review, LLM-as-judge), safety evaluation (is the system safe, e.g. red-teaming, alignment benchmarks), and operator evaluation (who uses the AI best). The first three are well-served. The operator layer — measuring the operators driving the AI — is the missing piece, and the one SigRank covers.",
            },
            {
              question: "What is the difference between model evaluation and operator evaluation?",
              answer:
                'Model evaluation asks "which AI is best?" and ranks models using test suites or preference votes. Operator evaluation asks "who is best at using the AI?" and ranks operators using real token telemetry from live sessions. Model evaluation holds the model as the variable and the operator as a constant. Operator evaluation inverts that: the model is a constant (you pick one and drive it), and the operator is the variable. They are complements, not competitors — both layers matter for complete AI evaluation.',
            },
            {
              question: "How does SigRank evaluate AI operators?",
              answer:
                "SigRank captures four token pillars (input, output, cache-read, cache-write) on-device from real AI coding sessions across 15+ platforms, computes the yield metric Υ = cache_read × output / input², and ranks operators by the architecture of their token cascade. Operators are classified into tiers and scored over 7-day, 30-day, 90-day, and all-time windows. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read — only token counts.",
            },
            {
              question: "Can you evaluate AI operators without reading prompts?",
              answer:
                "Yes. SigRank is privacy-preserving by design: it captures token counts only, never prompt content. The four pillars (input, output, cache-read, cache-write) are sufficient to compute Yield and classify cascade architecture. Reading the actual prompts is unnecessary and undesirable — it would compromise operator privacy and introduce content bias. Token counts are the minimal sufficient statistic for operator evaluation, and they are cryptographically signed so the data is verifiable without being readable.",
            },
            {
              question: "Is operator evaluation a replacement for model evaluation?",
              answer:
                "No — it is a complement. Model evaluation (MMLU, LMSYS Arena, HumanEval) answers \"which model should I choose?\" Operator evaluation answers \"am I using the model I chose well?\" Both questions matter. A great model driven poorly still produces poor results; a weaker model driven well can outperform it. Complete AI evaluation needs all four layers. SigRank fills the operator-layer gap that model-only evaluation leaves.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="EVALUATE"
        title="AI Evaluation — Measuring the Operator, Not Just the Model"
        subtitle={
          <>
            AI evaluation has four layers: model, output, safety, and
            operator. The first three are well-served. The{" "}
            <span className="text-gold">operator layer</span> — measuring the
            operators driving the AI — is the missing piece. SigRank covers it
            with privacy-preserving token telemetry and the Yield metric.
          </>
        }
      />

      {/* ── The four layers of AI evaluation ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The four layers of AI evaluation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI evaluation is not one thing. It is a stack of four distinct
          questions, each requiring different tools and different data. Most
          AI evaluation conversation focuses on the first three. The fourth
          — the operator layer — has been invisible until now.
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">1. Model evaluation.</strong>{" "}
            Which model is best? Answered by benchmarks like MMLU, HumanEval,
            SWE-bench, and preference rankings like LMSYS Chatbot Arena. The
            most mature layer — and the most saturated.
          </li>
          <li>
            <strong className="text-text-primary">2. Output evaluation.</strong>{" "}
            Is the output correct? Answered by human review, LLM-as-judge,
            test suites, and rubric scoring. Essential for quality assurance,
            but downstream of the operator — it measures the result, not the
            driving.
          </li>
          <li>
            <strong className="text-text-primary">3. Safety evaluation.</strong>{" "}
            Is the system safe? Answered by red-teaming, alignment benchmarks,
            and adversarial testing. A compliance and risk layer — necessary,
            regulated, and orthogonal to who is operating the AI.
          </li>
          <li>
            <strong className="text-text-primary">4. Operator evaluation.</strong>{" "}
            Who is best at using the AI? Answered by SigRank. Real token
            telemetry from live sessions, the Yield metric, and cohort-relative
            ranking. The layer that determines whether the model you chose is
            actually being driven well.
          </li>
        </ul>
      </section>

      {/* ── Why the operator layer is missing ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the operator layer is missing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Model evaluation holds the model as the variable and the operator as
          a constant. In practice the opposite is true: you pick a model and
          drive it, so the model is a constant and the operator is the
          variable. Two operators on the same model produce wildly different
          results — but model benchmarks average that difference away. The
          operator layer has been missing because there was no
          privacy-preserving way to measure it. Reading prompts is invasive;
          counting tokens is not.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank closes the gap. Four token pillars — input, output,
          cache-read, cache-write — are captured on-device from real coding
          sessions. The yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures whether signal is compounding or tokens are burning.
          Snapshots are ed25519-signed and verified server-side. No prompt
          content is ever read — only token counts. It is operator evaluation
          built on real telemetry, real science, and real privacy.
        </p>
      </section>

      {/* ── SigRank's role ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          SigRank&apos;s role in the stack
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank does not replace model, output, or safety evaluation. It
          sits beside them as the operator layer — the fourth and previously
          unmeasured layer of the AI evaluation stack. A team that runs MMLU
          for model selection, human review for output quality, and
          red-teaming for safety still has a blind spot: are the developers
          actually driving the chosen model well? That is the question SigRank
          answers, with continuous, cohort-relative, governed operator
          evaluation.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The foundation is a published conservation law for language under
          compression (DOI: 10.5281/zenodo.20029607), with an empirical record
          and a public transformation harness. The data is
          privacy-preserving — token counts only, never prompt content — and
          cryptographically signed. Operator evaluation is finally measurable
          without being invasive.
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
              What is AI evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The systematic measurement and comparison of AI system
              performance across four layers: model, output, safety, and
              operator. The first three are well-served. SigRank covers the
              operator layer — the missing piece.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Model evaluation vs. operator evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Model evaluation asks &ldquo;which AI is best?&rdquo; and ranks
              models. Operator evaluation asks &ldquo;who uses the AI best?&rdquo;
              and ranks operators. They are complements — both layers matter for
              complete AI evaluation.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank evaluate operators?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Four token pillars captured on-device from real sessions. Yield
              (Υ = cache_read × output / input²) measures cascade
              architecture. Operators are ranked, tiered, and scored over
              multiple time windows. Snapshots are ed25519-signed. No prompt
              content is ever read.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Can you evaluate without reading prompts?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yes. Token counts are the minimal sufficient statistic for
              operator evaluation. SigRank captures input, output, cache-read,
              and cache-write counts only — never prompt content. The data is
              verifiable via ed25519 signatures without being readable.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is operator evaluation a replacement for model evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No — it is a complement. Model evaluation helps you choose a
              model. Operator evaluation helps you measure whether you are
              driving the model you chose well. Complete AI evaluation needs
              all four layers.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
