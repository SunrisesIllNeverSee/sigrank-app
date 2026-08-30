/**
 * app/ai-model-safety-evaluation-benchmark-continuous-testing/page.tsx — "AI
 * Model Safety Evaluation, Benchmarks, and Continuous Testing"
 *
 * Covers safety evaluation via benchmarks and continuous testing, and how
 * SigRank extends continuous testing to operators. Links into /ai-evaluation,
 * /ai-model-evaluation, /methodology, /ai-compliance-standards.
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
  title:
    "AI Model Safety Evaluation, Benchmarks, and Continuous Testing",
  description:
    "AI model safety evaluation uses benchmarks and continuous testing. SigRank extends continuous testing to operators — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots. Safety is not just a model property.",
  path: "/ai-model-safety-evaluation-benchmark-continuous-testing",
});

const RELATED = [
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. Safety evaluation is one layer; SigRank covers the operator layer.",
  },
  {
    href: "/ai-model-evaluation",
    title: "AI Model Evaluation vs Operator Evaluation",
    desc: "Model evaluation is necessary but not sufficient. SigRank is the complementary operator layer — the layer model evaluation cannot see.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The continuous-testing methodology for operators.",
  },
  {
    href: "/ai-compliance-standards",
    title: "AI Compliance Standards and Operator Evaluation",
    desc: "NIST AI RMF and the EU AI Act require auditable evaluation. SigRank provides governed operator evaluation with cryptographic provenance.",
  },
];

export default function AIModelSafetyEvaluationBenchmarkContinuousTestingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            {
              name: "AI Model Safety Evaluation, Benchmarks, and Continuous Testing",
              path: "/ai-model-safety-evaluation-benchmark-continuous-testing",
            },
          ]),
          definedTerm(
            "AI Model Safety Evaluation",
            "AI model safety evaluation is the measurement and testing of AI model safety properties using benchmarks (alignment benchmarks, adversarial test suites) and continuous testing (ongoing evaluation in production). Safety is not just a model property — it is also an operator property, because the operator determines the context and workflow that shape the model's behavior. SigRank extends continuous testing to operators via privacy-preserving token telemetry (input, output, cache-read, cache-write) and the Yield metric (Υ = cache_read × output / input²). Snapshots are ed25519-signed and verified server-side. No prompt content is ever read.",
            "/ai-model-safety-evaluation-benchmark-continuous-testing",
          ),
          faqPage([
            {
              question: "What is AI model safety evaluation?",
              answer:
                "AI model safety evaluation is the measurement and testing of AI model safety properties. It uses two approaches: benchmarks (alignment benchmarks, adversarial test suites, red-teaming frameworks) that test the model in a controlled harness, and continuous testing (ongoing evaluation in production) that monitors the model's behavior on real traffic. Safety evaluation answers: is the system safe? It is a necessary layer of AI evaluation, but it is not sufficient — it measures the model, not the operator driving it.",
            },
            {
              question: "Why is safety not just a model property?",
              answer:
                "Because the operator determines the context and workflow that shape the model's behavior. A safe model driven carelessly can produce unsafe outcomes — the operator sets the context, frames the prompts, and decides how to use the output. Two operators on the same model produce different behaviors because they drive the model differently. Safety evaluation that only tests the model misses the operator layer — the layer where safe models are actually made safe or unsafe in practice. Complete safety evaluation needs both the model layer and the operator layer.",
            },
            {
              question: "How does SigRank extend continuous testing to operators?",
              answer:
                "SigRank applies the principle of continuous testing to the operator layer. Instead of testing the model once in a harness, it measures the operator continuously across every real session. Four token pillars (input, output, cache-read, cache-write) are captured on-device. The yield metric Υ = cache_read × output / input² measures cascade architecture. Operators are scored over 7-day, 30-day, 90-day, and all-time windows, so trends are visible — improvement and regression both show up. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read.",
            },
            {
              question: "How do benchmarks and continuous testing fit together?",
              answer:
                "Benchmarks and continuous testing are complements, not alternatives. Benchmarks test the model in a controlled harness at a point in time — they tell you the model can be safe under test conditions. Continuous testing monitors behavior on real traffic over time — it tells you the model is safe in practice. SigRank extends continuous testing to the operator: instead of monitoring only the model, you monitor the human driving it. A safety evaluation program that runs benchmarks on the model, continuous testing on production traffic, and SigRank on operators covers all three dimensions — model, system, and operator.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Safety & Testing"
        terminalText="SAFETY"
        title="AI Model Safety Evaluation, Benchmarks, and Continuous Testing"
        subtitle={
          <>
            Safety evaluation uses benchmarks and continuous testing. But
            safety is not just a model property — it is also an operator
            property. SigRank extends{" "}
            <span className="text-gold">continuous testing</span> to the
            humans driving the AI.
          </>
        }
      />

      {/* ── Safety evaluation today ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Safety evaluation today: benchmarks and continuous testing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI model safety evaluation uses two approaches. Benchmarks —
          alignment benchmarks, adversarial test suites, red-teaming
          frameworks — test the model in a controlled harness at a point in
          time. They tell you the model can be safe under test conditions.
          Continuous testing monitors the model&apos;s behavior on real
          production traffic over time. It tells you the model is safe in
          practice. Both are necessary: benchmarks catch issues before
          deployment, and continuous testing catches issues that emerge in
          production.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Both approaches share a blind spot: they measure the model, not the
          operator. Safety evaluation assumes the model is the variable and
          the operator is a constant. In practice the opposite is true — the
          operator determines the context and workflow that shape the
          model&apos;s behavior. A safe model driven carelessly can produce
          unsafe outcomes.
        </p>
      </section>

      {/* ── Safety is not just a model property ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Safety is not just a model property
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The operator sets the context, frames the prompts, and decides how
          to use the output. Two operators on the same model produce different
          behaviors because they drive the model differently. One operator
          maintains stable, well-structured context and reuses cached prefixes
          — a disciplined cascade. Another sends chaotic, re-ordered context
          that breaks the cache and forces fresh processing every turn — an
          undisciplined cascade. The model is the same; the behavior is not.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Safety evaluation that only tests the model misses this layer.
          Complete safety evaluation needs both the model layer (is the model
          safe under test?) and the operator layer (is the operator driving
          the model safely?). The operator layer is where safe models are
          actually made safe or unsafe in practice.
        </p>
      </section>

      {/* ── SigRank extends continuous testing ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank extends continuous testing to operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank applies the principle of continuous testing to the operator
          layer. Instead of testing the model once in a harness, it measures
          the operator continuously across every real session. Four token
          pillars — input, output, cache-read, cache-write — are captured
          on-device. The yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures cascade architecture. Operators are scored over 7-day,
          30-day, 90-day, and all-time windows, so trends are visible —
          improvement and regression both show up.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Snapshots are ed25519-signed and verified server-side, providing
          cryptographic provenance for compliance. No prompt content is ever
          read — only token counts — so the continuous testing is
          privacy-preserving by design. A safety evaluation program that runs
          benchmarks on the model, continuous testing on production traffic,
          and SigRank on operators covers all three dimensions: model, system,
          and operator.
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
              What is AI model safety evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The measurement and testing of AI model safety properties using
              benchmarks (alignment benchmarks, adversarial test suites) and
              continuous testing (ongoing evaluation in production). Necessary
              but not sufficient — it measures the model, not the operator.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is safety not just a model property?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The operator determines the context and workflow that shape the
              model&apos;s behavior. A safe model driven carelessly can
              produce unsafe outcomes. Two operators on the same model produce
              different behaviors. Complete safety evaluation needs both the
              model and operator layers.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank extend continuous testing to operators?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It measures the operator continuously across every real session.
              Four token pillars, the Yield metric, scoring over multiple time
              windows. ed25519-signed snapshots, no prompt content ever read.
              Trends are visible — improvement and regression both show up.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do benchmarks and continuous testing fit together?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Complements, not alternatives. Benchmarks test the model in a
              harness; continuous testing monitors real traffic. SigRank
              extends continuous testing to the operator. A program that runs
              all three covers model, system, and operator.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
