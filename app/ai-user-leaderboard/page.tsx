/**
 * app/ai-user-leaderboard/page.tsx — "AI User Leaderboard"
 *
 * Dedicated page targeting the exact query "ai user leaderboard". Google
 * currently returns model leaderboards (LMArena, Artificial Analysis, LiveBench)
 * for this query — no user leaderboard appears on page 1. This page captures
 * that unclaimed SERP by defining what an AI user leaderboard is and embedding
 * the SigRank leaderboard as the answer.
 *
 * SERP evidence: evidence/serp-captures/2026-09-04_ai-user-leaderboard_google.png
 * Gap: zero user leaderboards on page 1 as of 2026-09-04.
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
  title: "AI User Leaderboard — SigRank",
  description:
    "The AI user leaderboard. SigRank ranks AI users (operators) by token-cascade yield, not AI models by benchmark scores. See who is the best AI user — and where you rank.",
  path: "/ai-user-leaderboard",
});

const faqs = [
  {
    question: "Is there an AI user leaderboard?",
    answer:
      "Yes — SigRank is the AI user leaderboard. It ranks AI users (operators) by token-cascade efficiency (Yield = cache_read x output / input squared), not AI models by benchmark scores. LMSYS Chatbot Arena, LiveBench, and Hugging Face rank models. SigRank ranks the humans driving the models.",
  },
  {
    question: "What is an AI user leaderboard?",
    answer:
      "An AI user leaderboard ranks the people who use AI tools, not the AI models themselves. It measures how efficiently an operator drives their AI — how well they reuse context, how much output they generate per unit of input, how they architect their token cascade. This is different from a model leaderboard, which ranks AI models by benchmark scores or preference votes.",
  },
  {
    question: "How is SigRank different from LMSYS Chatbot Arena?",
    answer:
      "LMSYS Chatbot Arena ranks AI models by human preference votes — it asks 'which AI is best?' SigRank ranks AI users by token-cascade efficiency — it asks 'who uses the AI best?' LMSYS holds the operator constant and varies the model. SigRank holds the model constant and varies the operator. They answer different questions.",
  },
  {
    question: "How do I get on the AI user leaderboard?",
    answer:
      "Install the SigRank CLI (npm i -g sigrank), run 'sigrank me' to scan your token telemetry, and submit your signed snapshot. Your Yield score, operator class, and rank appear on the leaderboard at /board/all. The scanner reads token counts only — never prompt content — so your privacy is preserved.",
  },
  {
    question: "Why doesn't Google show a user leaderboard for 'ai user leaderboard'?",
    answer:
      "As of September 2026, searching 'ai user leaderboard' on Google returns model leaderboards (Artificial Analysis, LiveBench, OpenRouter, Scale AI) on page 1 — not user leaderboards. Google interprets the query as 'AI leaderboard for users' rather than 'leaderboard of AI users.' SigRank is the first leaderboard that ranks AI users directly.",
  },
];

export default function AIUserLeaderboardPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AI User Leaderboard — SigRank",
            description:
              "The AI user leaderboard. SigRank ranks AI users (operators) by token-cascade yield, not AI models by benchmark scores.",
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com"}/ai-user-leaderboard`,
            isPartOf: {
              "@type": "WebSite",
              name: "SigRank",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com",
            },
          },
          breadcrumb([
            { name: "AI User Leaderboard", path: "/ai-user-leaderboard" },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Leaderboard"
        terminalText="AI USER LEADERBOARD"
        title="AI User Leaderboard"
        subtitle={
          <>
            The leaderboard that ranks{" "}
            <span className="text-gold">AI users</span>, not AI models.
            SigRank measures who drives their AI best — by token-cascade
            efficiency, not benchmark scores.
          </>
        }
      />

      {/* ── What is an AI user leaderboard ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What is an AI user leaderboard?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An AI user leaderboard ranks the <strong>people who use AI tools</strong>,
          not the AI models themselves. It measures how efficiently an operator
          drives their AI — how well they reuse cached context, how much output
          they generate per unit of fresh input, how they architect the flow of
          tokens through a session. The unit of measurement is the token, not
          the benchmark score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is a different question from what a model leaderboard asks.
          Model leaderboards like LMSYS Chatbot Arena, LiveBench, and Artificial
          Analysis rank <em>which AI model is best</em>. An AI user leaderboard
          ranks <em>who is best at using AI</em>. The first holds the operator
          constant and varies the model. The second holds the model constant and
          varies the operator.
        </p>
      </section>

      {/* ── The gap ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why this page exists
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          As of September 2026, searching &ldquo;ai user leaderboard&rdquo; on
          Google returns model leaderboards on page 1 — Artificial Analysis,
          LiveBench, OpenRouter, Scale AI. Not a single user leaderboard
          appears. Google interprets the query as &ldquo;AI leaderboard for
          users&rdquo; rather than &ldquo;leaderboard of AI users.&rdquo;
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That gap is why this page exists. The demand is real — people want to
          know where they rank as AI users. The existing leaderboards measure
          token volume (who burns the most) or model preference (which AI wins
          votes). Nobody was measuring what actually matters:{" "}
          <strong>how efficiently you drive your AI</strong>. SigRank is the
          first leaderboard to do that.
        </p>
      </section>

      {/* ── How SigRank scores AI users ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank scores AI users
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank scores operators from four on-device token pillars: input,
          output, cache-read, and cache-write. The headline metric is{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Yield = cache_read x output / input^2
          </code>
          . It measures the architecture of your token cascade in one number:
          how much you reuse context, how much output you produce, and how lean
          your fresh input is.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Operators are classified into 8 experience tiers (IGNITER through
          ARCH+) and ranked over 7-day, 30-day, 90-day, and all-time windows.
          The system is platform-neutral: it works across Claude, ChatGPT,
          Gemini, Copilot, Cursor, and 15+ platforms. Snapshots are
          ed25519-signed on-device and verified server-side.
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          See the leaderboard
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The live AI user leaderboard is at{" "}
          <Link
            href="/board/all"
            className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            /board/all
          </Link>
          . Every ranked operator has a profile page with their Yield, class
          tier, archetype, and per-platform breakdowns.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            View the leaderboard →
          </Link>
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            Get your score →
          </Link>
        </div>
      </section>

      {/* ── Why Yield, not volume ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why Yield, not token volume
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Existing AI usage trackers rank by raw token burn — who spent the most
          compute. That rewards waste, not skill. A developer who dumps 10M
          tokens of unfocused input looks &ldquo;productive&rdquo; on a
          volume-based leaderboard. But they burned cache, generated noise, and
          produced less per dollar than someone who used 1M tokens with
          discipline.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield inverts that. It rewards the operator who reuses cached context
          heavily, produces dense output, and keeps fresh input lean. The
          formula{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            cache_read x output / input^2
          </code>{" "}
          means: the more you reuse and the less you re-feed, the higher you
          rank. Volume is spend. Yield is skill.
        </p>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/ai-operator"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              What is an AI Operator?
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The concept behind the leaderboard: an AI operator is the human
              driving the AI, distinct from the model itself.
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
              How operator scores are computed from token telemetry, how
              snapshots are verified, and how the leaderboard is ranked.
            </p>
          </Link>
          <Link
            href="/blog/ai-power-user-benchmarking"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              AI Power User Benchmarking
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              How to benchmark yourself against other AI power users using
              SigRank&apos;s operator classes and yield metrics.
            </p>
          </Link>
          <Link
            href="/vs/lmsys-arena"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              SigRank vs. LMSYS Chatbot Arena
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              LMSYS ranks models by preference votes. SigRank ranks operators
              by token-cascade efficiency. Different questions, different
              answers.
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
