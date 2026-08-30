/**
 * app/ai-evaluator/page.tsx — "AI Evaluator — What SigRank Does Differently"
 *
 * Defines an AI evaluator as a system that assesses AI performance, and
 * positions SigRank as an AI evaluator for the operator layer. Links into
 * /ai-evaluation, /methodology, /score, /board/all.
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
  title: "AI Evaluator — What SigRank Does Differently",
  description:
    "An AI evaluator assesses AI performance. SigRank is an AI evaluator for the operator layer — privacy-preserving token telemetry, the Yield metric, ed25519-signed snapshots, and cohort-relative ranking. Five capabilities that set it apart.",
  path: "/ai-evaluator",
});

const RELATED = [
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. SigRank is the AI evaluator for the operator layer.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology behind the SigRank evaluator.",
  },
  {
    href: "/score",
    title: "Score Your AI Coding Sessions",
    desc: "Paste your token counts and get an instant Yield score. Try the SigRank evaluator on your own sessions — no signup required.",
  },
  {
    href: "/board/all",
    title: "The SigRank Leaderboard",
    desc: "See the ranked operators the SigRank evaluator has scored. The public board of AI operator performance, updated continuously.",
  },
];

export default function AIEvaluatorPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "AI Evaluator", path: "/ai-evaluator" }]),
          definedTerm(
            "AI Evaluator",
            "An AI evaluator is a system that assesses AI performance. Most AI evaluators assess models (MMLU, LMSYS Arena), outputs (LLM-as-judge), or safety (red-teaming frameworks). SigRank is an AI evaluator for the operator layer — it assesses the humans driving the AI via privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²). Five capabilities set it apart: content-free telemetry, the Yield metric, cohort-relative ranking, ed25519-signed provenance, and continuous scoring.",
            "/ai-evaluator",
          ),
          faqPage([
            {
              question: "What is an AI evaluator?",
              answer:
                "An AI evaluator is a system that assesses AI performance. Most AI evaluators fall into three categories: model evaluators (MMLU, LMSYS Arena) that rank models, output evaluators (LLM-as-judge, human review) that assess output quality, and safety evaluators (red-teaming frameworks) that test for harm. SigRank is a fourth kind — an operator evaluator that assesses the humans driving the AI. It is a new category of AI evaluator, not a competitor to the existing three.",
            },
            {
              question: "What makes SigRank a different kind of AI evaluator?",
              answer:
                "Every other AI evaluator measures the model, the output, or the safety of the system. SigRank measures the operator — the human driving the AI. It captures four token pillars (input, output, cache-read, cache-write) on-device from real sessions, computes Yield (Υ = cache_read × output / input²), and ranks operators cohort-relative. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read. It is the only AI evaluator that answers \"who is best at using the AI?\"",
            },
            {
              question: "What are SigRank's five evaluator capabilities?",
              answer:
                "First, content-free telemetry: token counts only, never prompt content. Second, the Yield metric (Υ = cache_read × output / input²) that captures cascade architecture in a single number. Third, cohort-relative ranking: operators are ranked against the live field, not against a static threshold. Fourth, ed25519-signed provenance: snapshots are cryptographically signed and verified server-side. Fifth, continuous scoring: operators are scored over 7-day, 30-day, 90-day, and all-time windows, not on a one-off test.",
            },
            {
              question: "How do I get evaluated by SigRank?",
              answer:
                "Install the SigRank CLI or MCP server, run a coding session, and submit your ed25519-signed token snapshot. The snapshot is verified server-side and your operator score is computed from the four token pillars. You appear on the public leaderboard with a codename (your real identity is never shown). You can also paste token counts into the /score page for an instant Yield score without submitting. No prompt content is ever read or stored — only token counts.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Evaluator"
        terminalText="EVALUATOR"
        title="AI Evaluator — What SigRank Does Differently"
        subtitle={
          <>
            An AI evaluator assesses AI performance. Most evaluate models,
            outputs, or safety. SigRank is an AI evaluator for the{" "}
            <span className="text-gold">operator layer</span> — the only one
            that answers &ldquo;who is best at using the AI?&rdquo;
          </>
        }
      />

      {/* ── What is an AI evaluator ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What is an AI evaluator?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An AI evaluator is a system that assesses AI performance. The
          category includes model evaluators (MMLU, LMSYS Chatbot Arena) that
          rank models on test suites or preference votes, output evaluators
          (LLM-as-judge, human review platforms) that assess whether the
          output is correct, and safety evaluators (red-teaming frameworks,
          alignment benchmarks) that test for harm. Each evaluates a different
          layer of the AI stack.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is a fourth kind of AI evaluator — an operator evaluator. It
          assesses the humans driving the AI, not the AI itself. The question
          it answers — &ldquo;who is best at using the AI?&rdquo; — has had no
          evaluator until now, because there was no privacy-preserving way to
          measure it. Token counts make it possible; reading prompts does not.
        </p>
      </section>

      {/* ── Five capabilities ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Five capabilities that set SigRank apart
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              1. Content-free telemetry.
            </strong>{" "}
            SigRank captures four token pillars — input, output, cache-read,
            cache-write — and nothing else. No prompt content is ever read or
            stored. Token counts are the minimal sufficient statistic for
            operator evaluation, and they make the evaluator
            privacy-preserving by design.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">2. The Yield metric.</strong>{" "}
            <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
              Υ = cache_read × output / input²
            </code>{" "}
            captures cascade architecture in a single number — whether signal
            is compounding or tokens are burning. It blends all four pillars
            and penalizes fresh input quadratically, reflecting the real cost
            asymmetry of the cascade.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              3. Cohort-relative ranking.
            </strong>{" "}
            Operators are ranked against the live field, not against a static
            threshold. Your score reflects where you sit relative to other
            operators right now. The field shifts as the population grows, so
            the ranking stays meaningful.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              4. ed25519-signed provenance.
            </strong>{" "}
            Every snapshot is cryptographically signed on-device and verified
            server-side. The data is trustworthy without being readable — you
            can prove the token counts came from a real session without
            revealing what was in the session.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">5. Continuous scoring.</strong>{" "}
            Operators are scored over 7-day, 30-day, 90-day, and all-time
            windows, not on a one-off test. You see your trend, not just a
            snapshot. Improvement is visible; regression is visible. The
            evaluator runs on every session, in the background.
          </li>
        </ul>
      </section>

      {/* ── How to get evaluated ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to get evaluated
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Install the SigRank CLI or MCP server, run a coding session, and
          submit your ed25519-signed token snapshot. The snapshot is verified
          server-side and your operator score is computed from the four token
          pillars. You appear on the public leaderboard with a codename — your
          real identity is never shown. You can also paste token counts into
          the /score page for an instant Yield score without submitting. No
          prompt content is ever read or stored.
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
              What is an AI evaluator?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              A system that assesses AI performance. Model evaluators rank
              models, output evaluators assess quality, safety evaluators test
              for harm. SigRank is an operator evaluator — a new category.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What makes SigRank different?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It measures the operator, not the model. Four token pillars, the
              Yield metric, cohort-relative ranking, ed25519-signed snapshots.
              The only AI evaluator that answers &ldquo;who is best at using
              the AI?&rdquo;
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are SigRank&apos;s five capabilities?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Content-free telemetry, the Yield metric, cohort-relative
              ranking, ed25519-signed provenance, and continuous scoring over
              multiple time windows.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I get evaluated?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Install the CLI or MCP server, run a session, submit your signed
              snapshot. Or paste token counts into /score for an instant Yield
              score. No prompt content is ever read.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
