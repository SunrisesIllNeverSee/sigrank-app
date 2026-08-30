/**
 * app/confirmation-hacking-ai-evaluation/page.tsx — "Confirmation Hacking in
 * AI Evaluation"
 *
 * Defines confirmation hacking as designing evaluations that confirm what you
 * already believe. SigRank avoids it with content-free telemetry. Links into
 * /methodology, /science, /ai-evaluation, /ai-evaluation-frameworks.
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
  title: "Confirmation Hacking in AI Evaluation",
  description:
    "Confirmation hacking is designing evaluations that confirm what you already believe. SigRank avoids it with content-free telemetry — token counts only, the Yield metric, and ed25519-signed snapshots. No prompt content, no bias.",
  path: "/confirmation-hacking-ai-evaluation",
});

const RELATED = [
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The content-free methodology that avoids confirmation hacking.",
  },
  {
    href: "/science",
    title: "The Conservation Law of Commitment",
    desc: "The academic foundation: a published conservation law for language under compression, with Zenodo DOIs and an empirical record. The theory behind content-free evaluation.",
  },
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. SigRank covers the operator layer with content-free telemetry.",
  },
  {
    href: "/ai-evaluation-frameworks",
    title: "AI Evaluation Frameworks — From Models to Operators",
    desc: "NIST AI RMF, OpenAI Evals, DeepEval, Braintrust, SigRank. How the frameworks compare — and why content-free telemetry matters for avoiding bias.",
  },
];

export default function ConfirmationHackingAIEvaluationPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            {
              name: "Confirmation Hacking in AI Evaluation",
              path: "/confirmation-hacking-ai-evaluation",
            },
          ]),
          definedTerm(
            "Confirmation Hacking",
            "Confirmation hacking is the practice of designing AI evaluations that confirm what you already believe, rather than evaluations that test what you actually need to know. It occurs when the evaluator controls both the test cases and the grading rubric, allowing unconscious or conscious bias to shape the results. SigRank avoids confirmation hacking through content-free telemetry: it measures operators via token counts only (input, output, cache-read, cache-write) and computes the Yield metric (Υ = cache_read × output / input²) from signed data. No prompt content is read, so there is no content to bias the evaluation toward a preferred conclusion.",
            "/confirmation-hacking-ai-evaluation",
          ),
          faqPage([
            {
              question: "What is confirmation hacking in AI evaluation?",
              answer:
                "Confirmation hacking is the practice of designing AI evaluations that confirm what you already believe, rather than evaluations that test what you actually need to know. It happens when the evaluator controls both the test cases and the grading rubric — selecting cases that favor a preferred outcome, writing rubrics that score that outcome highly, and discarding cases that produce inconvenient results. The evaluation appears rigorous but is rigged toward a predetermined conclusion. It is the evaluation equivalent of p-hacking in statistics.",
            },
            {
              question: "How does SigRank avoid confirmation hacking?",
              answer:
                "SigRank uses content-free telemetry. It measures operators via token counts only — input, output, cache-read, cache-write — and computes the Yield metric (Υ = cache_read × output / input²) from those counts. No prompt content is ever read, so there is no content to bias the evaluation toward a preferred conclusion. The metric is fixed and public; the data is ed25519-signed and verified server-side, so it cannot be altered after the fact. The evaluation is determined by the operator's actual token cascade, not by a rubric the evaluator wrote.",
            },
            {
              question: "Why is content-free telemetry important for avoiding bias?",
              answer:
                "When an evaluation reads prompt content, the evaluator can bias the result by choosing which content to reward. A rubric that scores 'detailed' responses highly will favor operators who write verbose prompts; a rubric that scores 'concise' responses highly will favor the opposite. Either way, the rubric encodes the evaluator's prior beliefs. Content-free telemetry removes this leverage entirely. Token counts are token counts — they do not encode opinions about what the operator should have said. The Yield metric is a mathematical function of four numbers, not a judgment about content quality.",
            },
            {
              question: "Can content-free evaluation still be gamed?",
              answer:
                "It can be optimized for, but not gamed in the confirmation-hacking sense. An operator can improve their Yield by reusing cache, trimming input, and producing substantive output — but that is genuine improvement, not gaming. The metric is fixed and public, and the data is ed25519-signed, so an operator cannot retroactively alter their token counts. The only way to raise Yield is to actually change how you drive the AI. That is the point: content-free telemetry makes the evaluation a measure of real behavior, not a measure of how well you match the evaluator's rubric.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Bias & Integrity"
        terminalText="HACKING"
        title="Confirmation Hacking in AI Evaluation"
        subtitle={
          <>
            Confirmation hacking is designing evaluations that confirm what
            you already believe. SigRank avoids it with{" "}
            <span className="text-gold">content-free telemetry</span> — token
            counts only, no prompt content, no rubric to rig.
          </>
        }
      />

      {/* ── What is confirmation hacking ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What is confirmation hacking?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Confirmation hacking is the practice of designing AI evaluations
          that confirm what you already believe, rather than evaluations that
          test what you actually need to know. It happens when the evaluator
          controls both the test cases and the grading rubric. You select
          cases that favor a preferred outcome, write rubrics that score that
          outcome highly, and discard cases that produce inconvenient results.
          The evaluation appears rigorous but is rigged toward a
          predetermined conclusion. It is the evaluation equivalent of
          p-hacking in statistics.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In AI evaluation, confirmation hacking is especially easy because
          the evaluator often writes the rubric that grades the output. A
          rubric that rewards &ldquo;thoroughness&rdquo; will favor verbose
          outputs; a rubric that rewards &ldquo;precision&rdquo; will favor
          terse ones. Either way, the rubric encodes the evaluator&apos;s
          prior. The evaluation measures how well the output matches the
          rubric, not how well the operator actually performed.
        </p>
      </section>

      {/* ── How content-free telemetry avoids it ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How content-free telemetry avoids it
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank removes the evaluator&apos;s leverage entirely. It measures
          operators via token counts only — input, output, cache-read,
          cache-write — and computes the yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          from those counts. No prompt content is ever read, so there is no
          content to bias the evaluation toward a preferred conclusion. The
          metric is a fixed mathematical function of four numbers, not a
          judgment about content quality. There is no rubric to rig.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The data is also tamper-resistant. Snapshots are ed25519-signed
          on-device and verified server-side, so an operator cannot
          retroactively alter their token counts. The evaluation is determined
          by the operator&apos;s actual token cascade — the real flow of
          tokens through a real session — not by a test case the evaluator
          chose or a rubric the evaluator wrote.
        </p>
      </section>

      {/* ── Optimizing vs gaming ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Optimizing is not gaming
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An operator can improve their Yield by reusing cache, trimming fresh
          input, and producing substantive output. That is genuine
          improvement — the operator is actually driving the AI more
          efficiently. Content-free telemetry makes the evaluation a measure
          of real behavior, not a measure of how well the output matches the
          evaluator&apos;s rubric. The only way to raise Yield is to change
          how you drive the AI. That is the point: the evaluation cannot be
          hacked toward a preferred conclusion because there is no content to
          bias and no rubric to rig.
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
              What is confirmation hacking in AI evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Designing evaluations that confirm what you already believe
              rather than testing what you need to know. The evaluator controls
              the test cases and the rubric, rigging the result toward a
              predetermined conclusion. The evaluation equivalent of
              p-hacking.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank avoid confirmation hacking?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Content-free telemetry. Token counts only — input, output,
              cache-read, cache-write. The Yield metric is a fixed function of
              four numbers. No prompt content is read, so there is no content
              to bias. ed25519 signatures prevent retroactive alteration.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is content-free telemetry important?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              When evaluation reads prompt content, the evaluator can bias the
              result by choosing which content to reward. Content-free
              telemetry removes that leverage. Token counts do not encode
              opinions about what the operator should have said.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Can content-free evaluation be gamed?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It can be optimized for — but that is genuine improvement, not
              gaming. The metric is fixed and public; the data is signed. The
              only way to raise Yield is to actually change how you drive the
              AI. No rubric to rig, no content to bias.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
