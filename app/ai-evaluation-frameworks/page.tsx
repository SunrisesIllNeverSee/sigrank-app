/**
 * app/ai-evaluation-frameworks/page.tsx — "AI Evaluation Frameworks — From
 * Models to Operators"
 *
 * Surveys AI evaluation frameworks (NIST AI RMF, OpenAI Evals, DeepEval,
 * Braintrust, SigRank) and positions SigRank as the framework for the
 * operator layer. Links into /methodology, /science, /standard, /ai-evaluation.
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
  title: "AI Evaluation Frameworks — From Models to Operators",
  description:
    "AI evaluation frameworks compared: NIST AI RMF, OpenAI Evals, DeepEval, Braintrust, and SigRank. SigRank is the framework for the operator layer — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots.",
  path: "/ai-evaluation-frameworks",
});

const RELATED = [
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology for the SigRank operator evaluation framework.",
  },
  {
    href: "/science",
    title: "The Conservation Law of Commitment",
    desc: "The academic foundation: a published conservation law for language under compression, with Zenodo DOIs and an empirical record. The theory SigRank is built on.",
  },
  {
    href: "/standard",
    title: "The SigRank Standard",
    desc: "The open operator-evaluation standard: token telemetry, the Yield metric, ed25519-signed snapshots, and cohort-relative ranking. A governed framework, not a proprietary black box.",
  },
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. SigRank covers the operator layer that other frameworks miss.",
  },
];

export default function AIEvaluationFrameworksPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            {
              name: "AI Evaluation Frameworks",
              path: "/ai-evaluation-frameworks",
            },
          ]),
          definedTerm(
            "AI Evaluation Frameworks",
            "AI evaluation frameworks are structured methodologies for measuring and comparing AI system performance. Examples include NIST AI RMF (a risk management framework), OpenAI Evals (a model evaluation harness), DeepEval (an LLM output testing framework), Braintrust (an evaluation platform), and SigRank (the operator evaluation framework). SigRank is the framework for the operator layer — it measures the operators driving the AI via privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²).",
            "/ai-evaluation-frameworks",
          ),
          faqPage([
            {
              question: "What are AI evaluation frameworks?",
              answer:
                "AI evaluation frameworks are structured methodologies for measuring and comparing AI system performance. They range from governance frameworks (NIST AI RMF) to model evaluation harnesses (OpenAI Evals) to output testing frameworks (DeepEval) to evaluation platforms (Braintrust). Each framework targets a different layer of the AI evaluation stack: model, output, safety, or operator. SigRank is the framework for the operator layer — the layer that measures who is best at using the AI.",
            },
            {
              question: "How does SigRank differ from other AI evaluation frameworks?",
              answer:
                "Other frameworks measure the model, the output, or the safety of the system. SigRank measures the operator — the operator driving the AI. It captures four token pillars (input, output, cache-read, cache-write) on-device from real sessions, computes Yield (Υ = cache_read × output / input²), and ranks operators cohort-relative. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read. It is a new category of framework, not a competitor to model or output evaluation frameworks.",
            },
            {
              question: "What is the NIST AI RMF?",
              answer:
                "The NIST AI Risk Management Framework (AI RMF) is a voluntary, rights-preserving framework for managing risks in AI systems. It organizes AI risk management into four functions: Govern, Map, Measure, and Manage. It is a governance and process framework, not a measurement tool — it tells you what to evaluate and how to govern evaluation, but it does not itself measure operator performance. SigRank provides the governed, auditable operator evaluation that a NIST AI RMF \"Measure\" function requires.",
            },
            {
              question: "How do I choose an AI evaluation framework?",
              answer:
                "Match the framework to the layer you need. For governance and risk management, use NIST AI RMF. For model evaluation, use OpenAI Evals or MMLU. For output testing, use DeepEval or LLM-as-judge. For operator evaluation — measuring whether your team drives the AI well — use SigRank. Most organizations need frameworks from multiple layers. The mistake is assuming one framework covers all four; it does not, because each layer requires different data and answers a different question.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Frameworks"
        terminalText="FRAMEWORK"
        title="AI Evaluation Frameworks — From Models to Operators"
        subtitle={
          <>
            AI evaluation frameworks target different layers of the stack:
            governance, model, output, safety. SigRank is the framework for
            the <span className="text-gold">operator layer</span> — the
            layer that measures who is best at using the AI.
          </>
        }
      />

      {/* ── The landscape of frameworks ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The landscape of AI evaluation frameworks
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI evaluation frameworks are not interchangeable. Each targets a
          specific layer of the evaluation stack and answers a different
          question. Choosing the wrong framework for the layer you need is a
          common and expensive mistake — a model evaluation framework cannot
          tell you whether your operators are driving the AI well.
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">NIST AI RMF.</strong> A
            governance and risk management framework. Organizes AI risk into
            Govern, Map, Measure, and Manage functions. Tells you what to
            evaluate and how to govern it — but does not itself measure
            operator performance.
          </li>
          <li>
            <strong className="text-text-primary">OpenAI Evals.</strong> A
            model evaluation harness. Runs models against test suites and
            reports scores. Answers: which model performs best on these tasks?
          </li>
          <li>
            <strong className="text-text-primary">DeepEval.</strong> An LLM
            output testing framework. Scores outputs against rubrics using
            LLM-as-judge and metrics. Answers: is this output correct?
          </li>
          <li>
            <strong className="text-text-primary">Braintrust.</strong> An
            evaluation platform for LLM applications. Combines offline evals,
            prompt playground, and observability. Answers: is my LLM
            application working?
          </li>
          <li>
            <strong className="text-text-primary">SigRank.</strong> The
            operator evaluation framework. Measures the operators driving the AI
            via real token telemetry. Answers: who is best at using the AI?
          </li>
        </ul>
      </section>

      {/* ── SigRank as the operator framework ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          SigRank — the operator evaluation framework
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the framework for the operator layer. Four token pillars —
          input, output, cache-read, cache-write — are captured on-device from
          real coding sessions across 15+ platforms. The yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures whether signal is compounding or tokens are burning.
          Operators are ranked cohort-relative, classified into tiers, and
          scored over 7-day, 30-day, 90-day, and all-time windows.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The framework is governed, not ad hoc. Snapshots are ed25519-signed
          and verified server-side, providing cryptographic provenance. No
          prompt content is ever read — only token counts — so the framework
          is privacy-preserving by design. The foundation is a published
          conservation law for language under compression
          (DOI: 10.5281/zenodo.20029607), with an empirical record and a
          public transformation harness. It is an open standard, not a
          proprietary black box.
        </p>
      </section>

      {/* ── How the frameworks fit together ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How the frameworks fit together
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The frameworks are complements, not competitors. NIST AI RMF
          provides the governance structure that tells you to evaluate
          operators. OpenAI Evals and MMLU tell you which model to deploy.
          DeepEval and Braintrust tell you whether the output is good. SigRank
          tells you whether the operators driving the deployed model are driving
          it well. A mature organization runs frameworks from multiple layers
          — the operator layer is the one most organizations are missing.
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
              What are AI evaluation frameworks?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Structured methodologies for measuring AI system performance.
              NIST AI RMF for governance, OpenAI Evals for models, DeepEval
              for output, SigRank for operators. Each targets a different
              layer.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank differ from other frameworks?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Other frameworks measure the model, output, or safety. SigRank
              measures the operator — the operator driving the AI. Four token
              pillars, the Yield metric, ed25519-signed snapshots. A new
              category of framework.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the NIST AI RMF?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              A governance and risk management framework with Govern, Map,
              Measure, and Manage functions. It tells you what to evaluate but
              does not itself measure operator performance. SigRank provides
              the governed operator evaluation a NIST &ldquo;Measure&rdquo;
              function requires.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I choose an AI evaluation framework?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Match the framework to the layer. NIST AI RMF for governance,
              OpenAI Evals for models, DeepEval for output, SigRank for
              operators. Most organizations need frameworks from multiple
              layers.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
