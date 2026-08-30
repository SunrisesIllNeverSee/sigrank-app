/**
 * app/evaluating-ai/page.tsx — "Evaluating AI — The Operator Layer Is the
 * Missing Piece"
 *
 * Uses the car/driver analogy: evaluating AI without evaluating the operator
 * is like evaluating a car without evaluating the driver. Links into
 * /ai-evaluation, /ai-benchmarking, /methodology, and the blog post.
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
  title: "Evaluating AI — The Operator Layer Is the Missing Piece",
  description:
    "Evaluating AI without evaluating the operator is like evaluating a car without evaluating the driver. SigRank fills the gap — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots.",
  path: "/evaluating-ai",
});

const RELATED = [
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. The operator layer is the missing piece of evaluating AI.",
  },
  {
    href: "/ai-benchmarking",
    title: "AI Benchmarking — Beyond Model Leaderboards",
    desc: "Model benchmarks rank models. Operator benchmarks rank the humans driving them. The complement that evaluating AI has been missing.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology for the operator layer.",
  },
  {
    href: "/blog/the-human-in-the-loop-is-unmeasured",
    title: "The Human in the Loop Is Unmeasured",
    desc: "The blog post that frames the problem: AI evaluation measures everything except the person driving the AI. The operator layer is the blind spot.",
  },
];

export default function EvaluatingAIPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Evaluating AI", path: "/evaluating-ai" }]),
          definedTerm(
            "Evaluating AI",
            "Evaluating AI is the systematic measurement and comparison of AI system performance. It has four layers: model (which model is best), output (is the output correct), safety (is the system safe), and operator (who uses the AI best). Evaluating AI without evaluating the operator is like evaluating a car without evaluating the driver — you measure the machine but miss the variable that determines real-world performance. SigRank fills the operator layer with privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²).",
            "/evaluating-ai",
          ),
          faqPage([
            {
              question: "What does evaluating AI mean?",
              answer:
                "Evaluating AI means systematically measuring and comparing AI system performance. It spans four layers: model evaluation (which model is best), output evaluation (is the output correct), safety evaluation (is the system safe), and operator evaluation (who uses the AI best). Most AI evaluation conversation covers the first three. The operator layer — measuring the humans driving the AI — is the missing piece, and the one SigRank covers.",
            },
            {
              question: "Why is the operator layer the missing piece?",
              answer:
                "Because in practice the model is a constant and the operator is the variable. You pick a model and deploy it; the question that remains is whether your team is driving it well. Two operators on the same model produce wildly different results. Model evaluation holds the operator as a constant and averages that difference away. The operator layer has been missing because there was no privacy-preserving way to measure it — reading prompts is invasive, but counting tokens is not. SigRank closes the gap.",
            },
            {
              question: "How does SigRank fill the gap?",
              answer:
                "SigRank captures four token pillars (input, output, cache-read, cache-write) on-device from real coding sessions, computes the yield metric Υ = cache_read × output / input², and ranks operators cohort-relative. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read — only token counts. It is operator evaluation built on real telemetry, real science, and real privacy — the missing piece of evaluating AI.",
            },
            {
              question: "Is evaluating the operator a replacement for evaluating the model?",
              answer:
                "No — it is a complement. Evaluating the model tells you which AI to choose. Evaluating the operator tells you whether you are using the AI you chose well. Both matter. A great model driven poorly still produces poor results; a weaker model driven well can outperform it. Complete AI evaluation needs all four layers — and the operator layer is the one most teams are missing.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Evaluating AI"
        terminalText="EVALUATE"
        title="Evaluating AI — The Operator Layer Is the Missing Piece"
        subtitle={
          <>
            Evaluating AI without evaluating the operator is like evaluating a
            car without evaluating the driver. You measure the machine but
            miss the <span className="text-gold">variable</span> that
            determines real-world performance. SigRank fills the gap.
          </>
        }
      />

      {/* ── The car and the driver ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The car and the driver
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Evaluating AI without evaluating the operator is like evaluating a
          car without evaluating the driver. You can measure the engine&apos;s
          horsepower, the transmission&apos;s gear ratios, and the
          chassis&apos;s aerodynamics — and still have no idea who will win the
          race. The car is a constant; the driver is the variable. The same is
          true of AI. You can benchmark the model on MMLU, score the output
          with LLM-as-judge, and red-team the safety — and still not know
          whether your developers are driving the model well.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Model evaluation holds the model as the variable and the operator as
          a constant. In practice the opposite is true: you pick a model and
          drive it, so the model is a constant and the operator is the
          variable. Two operators on the same model produce wildly different
          results — token efficiency, output quality, cost per task. Model
          benchmarks average that difference away. The operator layer is where
          real-world performance is actually won or lost, and it is the layer
          that evaluating AI has been missing.
        </p>
      </section>

      {/* ── Why the gap existed ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the gap existed
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The operator layer has been missing for a simple reason: there was
          no privacy-preserving way to measure it. Measuring the operator
          means measuring their real workflow — the prompts they send, the
          context they build, the sessions they run. Reading prompts is
          invasive and introduces content bias. So the operator layer was left
          unmeasured, and AI evaluation focused on the layers that could be
          measured without invading privacy: the model (synthetic tests), the
          output (scoring the result), and the safety (adversarial testing).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank solves the privacy problem. Four token pillars — input,
          output, cache-read, cache-write — are the minimal sufficient
          statistic for operator evaluation, and they can be captured without
          reading a single prompt. The yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures whether signal is compounding or tokens are burning.
          Snapshots are ed25519-signed and verified server-side, so the data
          is trustworthy without being readable. The gap is closed — not by
          reading prompts, but by counting tokens.
        </p>
      </section>

      {/* ── The complete picture ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The complete picture
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Complete AI evaluation is a four-layer stack. Model evaluation tells
          you which AI to choose. Output evaluation tells you whether the
          result is good. Safety evaluation tells you whether the system is
          safe. Operator evaluation tells you whether your team is driving the
          AI well. Each layer answers a different question and needs different
          data. The operator layer is the missing piece — and with SigRank, it
          is no longer missing.
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
              What does evaluating AI mean?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Systematically measuring and comparing AI system performance
              across four layers: model, output, safety, operator. The
              operator layer is the missing piece.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is the operator layer missing?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The model is a constant and the operator is the variable. Model
              evaluation averages operator difference away. The layer was
              missing because reading prompts is invasive — but counting
              tokens is not. SigRank closes the gap.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank fill the gap?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Four token pillars captured on-device. Yield
              (Υ = cache_read × output / input²) measures cascade
              architecture. ed25519-signed snapshots, cohort-relative ranking.
              No prompt content ever read.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is operator evaluation a replacement for model evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No — it is a complement. Model evaluation tells you which AI to
              choose. Operator evaluation tells you whether you are using it
              well. Complete AI evaluation needs all four layers.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
