/**
 * app/ai-operator/page.tsx — "What Is an AI Operator?"
 *
 * Dedicated page targeting the exact query "ai operator". Google currently
 * returns products named "Operator" (OpenAI Operator, operator.io, operator.xyz)
 * and career advice — no page defines "AI operator" as a concept. This page
 * captures that definitional SERP.
 *
 * SERP evidence: evidence/serp-captures/2026-09-04_ai-operator_google.png
 * Gap: zero conceptual definition pages on page 1 as of 2026-09-04.
 * Search volume: 320/mo, KD 35 (OpenSEO).
 *
 * JSON-LD: WebPage + FAQPage + BreadcrumbList.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "What Is an AI Operator? — SigRank",
  description:
    "An AI operator is the human who drives an AI tool — distinct from the AI model itself. SigRank ranks AI operators by token-cascade efficiency, not AI models by benchmark scores.",
  path: "/ai-operator",
});

const faqs = [
  {
    question: "What is an AI operator?",
    answer:
      "An AI operator is the human who drives an AI tool. They are the person who writes prompts, manages context, routes tasks, and turns AI output into shipped work. The AI operator is distinct from the AI model: the model generates text, the operator directs it. The same model in the hands of two operators produces different results — the operator is the variable.",
  },
  {
    question: "What is the difference between an AI operator and an AI model?",
    answer:
      "An AI model is the system that generates responses (Claude, GPT, Gemini). An AI operator is the human who drives it — who writes prompts, manages context, decides what to ask, and turns output into work. Model benchmarks rank models (which AI is best?). Operator scoring ranks operators (who uses the AI best?). The model is the engine; the operator is the driver.",
  },
  {
    question: "How do you measure AI operator performance?",
    answer:
      "SigRank measures AI operator performance using token-cascade efficiency. The headline metric is Yield (U = cache_read x output / input^2), computed from four token pillars: input, output, cache-read, and cache-write. High Yield means the operator reuses context heavily, produces dense output, and keeps fresh input lean. The scanner reads token counts only — never prompt content — so operator scoring is privacy-preserving.",
  },
  {
    question: "Is an AI operator the same as an AI agent?",
    answer:
      "No. An AI agent is an autonomous system that acts on its own (like OpenAI's Operator product). An AI operator is the human who drives AI tools — including agents. The distinction matters: an AI agent is software, an AI operator is a person. SigRank ranks human operators, not autonomous agents.",
  },
  {
    question: "How do I become a better AI operator?",
    answer:
      "The three levers are context reuse, output density, and input discipline. Reuse cached context instead of re-feeding the same information. Produce dense, actionable output per turn. Keep fresh input lean — don't dump tokens you don't need. SigRank's Yield metric measures all three. Check your score at /score and compare your operator class and archetype against the leaderboard at /board/all.",
  },
];

export default function AIOperatorPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "What Is an AI Operator? — SigRank",
            description:
              "An AI operator is the human who drives an AI tool — distinct from the AI model itself. SigRank ranks AI operators by token-cascade efficiency.",
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com"}/ai-operator`,
            isPartOf: {
              "@type": "WebSite",
              name: "SigRank",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com",
            },
          },
          breadcrumb([
            { name: "AI Operator", path: "/ai-operator" },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Definition"
        terminalText="AI OPERATOR"
        title="What Is an AI Operator?"
        subtitle={
          <>
            An AI operator is the{" "}
            <span className="text-gold">human who drives an AI tool</span> —
            distinct from the AI model itself. The model generates text. The
            operator directs it. SigRank ranks operators, not models.
          </>
        }
      />

      {/* ── Definition ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The definition
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An <strong>AI operator</strong> is the person who drives an AI tool.
          They write the prompts. They manage the context window. They decide
          what to ask, when to push, when to pull back, and how to turn AI
          output into shipped work. The AI operator is the human in the loop —
          not a bystander, not a passenger, but the driver.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is distinct from the AI model. The model is the system that
          generates responses — Claude, GPT, Gemini, Copilot. The operator is
          the person who directs it. The same model in the hands of two
          operators produces different results. The model is the engine. The
          operator is the driver. And right now, nobody is measuring the driver.
        </p>
      </section>

      {/* ── Why the distinction matters ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the distinction matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The AI industry benchmarks models constantly. LMSYS Chatbot Arena
          ranks them by preference votes. Artificial Analysis ranks them by
          composite scores. LiveBench ranks them by test suites. Every
          leaderboard asks the same question:{" "}
          <em>which AI is best?</em>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          But that is only half the equation. A great model in the hands of a
          poor operator produces mediocre work. A good model in the hands of a
          great operator produces exceptional work. The operator is the
          variable that nobody is measuring — because measuring humans is
          harder than measuring models. You need privacy-preserving telemetry,
          a scoring system that rewards skill not volume, and a leaderboard
          that ranks the driver, not the engine.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That is what SigRank is. The first leaderboard for AI operators.
        </p>
      </section>

      {/* ── Operator vs model vs agent ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          AI operator vs. AI model vs. AI agent
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="py-2 pr-4 text-left font-mono text-xs font-bold text-text-primary">
                  Term
                </th>
                <th className="py-2 pr-4 text-left font-mono text-xs font-bold text-text-primary">
                  What it is
                </th>
                <th className="py-2 text-left font-mono text-xs font-bold text-text-primary">
                  Who ranks it
                </th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm text-text-secondary">
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-semibold text-text-primary">
                  AI model
                </td>
                <td className="py-2 pr-4">
                  The system that generates responses (Claude, GPT, Gemini)
                </td>
                <td className="py-2">
                  LMSYS, Artificial Analysis, LiveBench
                </td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-semibold text-text-primary">
                  AI agent
                </td>
                <td className="py-2 pr-4">
                  An autonomous system that acts on its own (OpenAI Operator,
                  Devin)
                </td>
                <td className="py-2">Product benchmarks</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold text-gold">
                  AI operator
                </td>
                <td className="py-2 pr-4">
                  The human who drives the AI tool — writes prompts, manages
                  context, turns output into work
                </td>
                <td className="py-2 text-gold">SigRank</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── How SigRank measures operators ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank measures AI operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank scores operators from four on-device token pillars: input,
          output, cache-read, and cache-write. The headline metric is{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Yield = cache_read x output / input^2
          </code>
          . It measures the architecture of your token cascade in one number.
          High Yield means you reuse context heavily, produce dense output, and
          keep fresh input lean. Low Yield means you burn tokens without
          compounding signal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The scanner reads token counts only — four integers per session. It
          never reads prompt content. Only ed25519-signed numeric scores leave
          your device. This is what makes a global operator leaderboard
          possible: you cannot publish a ranking built on prompt content, but
          you can publish one built on four signed integers.
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          See where you rank
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            Get your operator score →
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            View the leaderboard →
          </Link>
          <Link
            href="/ai-operator-scoring"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            Operator scoring deep dive →
          </Link>
        </div>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/ai-user-leaderboard"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              AI User Leaderboard
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The leaderboard that ranks AI users (operators), not AI models.
              See who is the best AI user — and where you rank.
            </p>
          </Link>
          <Link
            href="/operator-performance"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              Operator Performance
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              Why the operator is the variable. How SigRank scores operators
              and the class tiers from IGNITER to ARCH+.
            </p>
          </Link>
          <Link
            href="/methodology"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              Methodology
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The canonical methodology: how operator scores are computed,
              how snapshots are verified, and how the leaderboard is ranked.
            </p>
          </Link>
          <Link
            href="/science"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              The Conservation Law of Commitment
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The academic foundation: a published conservation law for
              language under compression, with Zenodo DOIs and an empirical
              record.
            </p>
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
