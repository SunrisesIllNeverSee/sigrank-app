/**
 * app/blog/ai-power-user-benchmarking/page.tsx — "AI Power User Benchmarking
 * with SigRank".
 *
 * Long-form blog post targeting "AI power user", "benchmark AI usage", and
 * "compare AI users". Explains how to benchmark yourself against other AI
 * power users using SigRank's operator classes and yield metrics.
 *
 * JSON-LD: ScholarlyArticle (inline, following lib/jsonld.ts pattern) +
 * BreadcrumbList + FAQPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "AI Power User Benchmarking with SigRank",
  description:
    "How to benchmark yourself against other AI power users. SigRank's operator classes and yield metrics tell you if you're a power user — and how to become one.",
  path: "/blog/ai-power-user-benchmarking",
});

/** Inline ScholarlyArticle JSON-LD (follows the researchArticle() pattern). */
function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/ai-power-user-benchmarking`;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    headline: "AI Power User Benchmarking with SigRank",
    description:
      "How to benchmark yourself against other AI power users. SigRank's operator classes and yield metrics tell you if you're a power user — and how to become one.",
    url,
    datePublished: "2026-07-07",
    author: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "Benchmarking AI power users with operator classes and yield metrics",
    keywords: [
      "ai power user",
      "benchmark ai usage",
      "compare ai users",
      "operator class",
      "yield metric",
    ],
  };
}

const faqs = [
  {
    question: "How do I know if I'm an AI power user?",
    answer:
      "SigRank classifies operators into tiers (Burner, Builder, 10xer). A 10xer is the AI power user archetype: high cache reuse, high output per input, disciplined token architecture. Check your class at /score.",
  },
  {
    question: "How do I benchmark my AI usage against others?",
    answer:
      "Install sigrank (npm i -g sigrank), run `sigrank me` or paste your ccusage JSON at /score, then compare your Υ Yield, class tier, and rank against other operators on the /board/all leaderboard.",
  },
  {
    question: "What separates a power user from a regular AI user?",
    answer:
      "Power users don't just ask better questions — they rewire processes around AI. They reuse cached context heavily (high leverage), produce more output per input (high velocity), and keep fresh input lean. SigRank's yield metric captures all three in a single number.",
  },
];

export default function AiPowerUserBenchmarkingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            {
              name: "AI Power User Benchmarking",
              path: "/blog/ai-power-user-benchmarking",
            },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Power Users"
        title="AI Power User Benchmarking with SigRank"
        subtitle={
          <>
            How to benchmark yourself against other{" "}
            <span className="text-gold">AI power users</span>. SigRank&apos;s
            operator classes and yield metrics tell you if you&apos;re a power
            user — and how to become one.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-07">Published July 7, 2026</time>
        <span aria-hidden="true">·</span>
        <span>9 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Everyone who uses AI coding tools regularly eventually wonders the
          same thing: <strong className="text-text-primary">am I actually
          good at this, or am I just using it a lot?</strong> There&apos;s a
          difference. Some developers burn through tokens re-explaining context
          and pasting files the model already read. Others build cascades that
          compound — lean input, heavy cache reuse, high output. The first
          group uses AI a lot. The second group uses AI{" "}
          <em>well</em>. That second group is what we call AI power users.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank gives you a way to know which group you&apos;re in — and a
          way to benchmark yourself against the field. This post walks through
          what an AI power user looks like in token-cascade terms, how to check
          your own class, and how to compare yourself against other operators.
        </p>
      </section>

      {/* ── What is an AI power user ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What is an AI power user
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A power user isn&apos;t someone who uses AI the most — it&apos;s
          someone who rewires their process around it. The difference shows up
          in three places in the token cascade:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            High cache reuse (leverage)
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Power users don&apos;t re-explain context. They work within long
            sessions that build a rich cache, so every input token is backed by
            many cached tokens.{" "}
            <Link
              href="/metrics/leverage"
              className="text-gold underline underline-offset-2"
            >
              Leverage
            </Link>{" "}
            (cache_read / input) is high.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            High output per input (velocity)
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Power users ask for larger units of work and let the agent complete
            a full pass before reviewing. They get more output per token of
            input. Velocity (output / input) is high.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Lean fresh input
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Power users reference files by path instead of pasting contents.
            They write tight prompts. They let the model ask for clarification
            rather than front-loading everything. Fresh input stays low — and
            since input is squared in the yield formula, this is the lever that
            moves the score the most.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            yield metric (Υ)
          </Link>{" "}
          captures all three in a single number. That&apos;s why yield — not
          token count — is the number that tells you if you&apos;re a power
          user.
        </p>
      </section>

      {/* ── Operator classes ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Operator classes — where do you land?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank classifies every operator into a tier based on their yield
          and cascade shape. The tiers describe the architecture of your token
          flow, not how much you spent:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Burner</strong> — low yield,
            high input, little cache reuse. Uses AI a lot; uses it poorly.
            Tokens burn, signal doesn&apos;t compound.
          </li>
          <li>
            <strong className="text-text-primary">Builder</strong> — moderate
            yield, building cache depth. The middle of the distribution. Most
            serious operators land here after a few weeks of tracking.
          </li>
          <li>
            <strong className="text-text-primary">10xer</strong> — high yield,
            high leverage, high velocity. The AI power user archetype:
            disciplined token architecture, heavy cache reuse, lean input.
            This is the tier power users aim for.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You can see your tier instantly — no account, no install — by pasting
          your token stats at{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score
          </Link>
          .
        </p>
      </section>

      {/* ── How to benchmark ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to benchmark yourself against the field
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Knowing your own yield is step one. Benchmarking is where context
          comes from — your number in isolation is just a number. Here&apos;s
          the full flow:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>{`# 1. Install the CLI
npm i -g sigrank

# 2. Record your cascade
sigrank me

# 3. Submit your signed snapshot
sigrank submit

# 4. Check the leaderboard
sigrank board --window 30d`}</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Or, if you already have your token stats from ccusage or another
          tool, skip the CLI and paste them at{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score
          </Link>{" "}
          to get your yield and class instantly. Then head to the{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            leaderboard
          </Link>{" "}
          to compare:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Υ Yield</strong> — your
            headline efficiency number versus the field.
          </li>
          <li>
            <strong className="text-text-primary">Class tier</strong> — Burner,
            Builder, or 10xer. Are you in the power-user tier?
          </li>
          <li>
            <strong className="text-text-primary">Global rank</strong> — where
            you stand among all ranked operators.
          </li>
          <li>
            <strong className="text-text-primary">Pillar ratios of the top
            decile</strong> — the gap between your leverage, velocity, and cache
            hit rate and the best operators. This is your roadmap.
          </li>
        </ul>
      </section>

      {/* ── What separates power users ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What separates a power user from a regular AI user
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          It&apos;s not prompt engineering. Regular users can write great
          prompts and still have burning cascades — because they start every
          session fresh, paste context the model already has, and never let
          the cache build. Power users do something structurally different:
          they <em>rewire their process</em> around AI.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That rewiring shows up as three habits that yield measures directly:
        </p>
        <ol className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-gold">They reuse cached context
            heavily.</strong> Long sessions per feature; the cache builds and
            cache-read compounds. High leverage.
          </li>
          <li>
            <strong className="text-gold">They produce more output per
            input.</strong> They ask for whole modules, not snippets, and let
            the agent finish before reviewing. High velocity.
          </li>
          <li>
            <strong className="text-gold">They keep fresh input lean.</strong>{" "}
            Reference files by path; write tight prompts; let the model ask
            questions. Low input — and since input is squared, this is the
            biggest lever.
          </li>
        </ol>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Regular users do the opposite: fresh sessions, pasted context, small
          asks, verbose prompts. Same tool, opposite cascade. Yield is the
          number that tells them apart. For more on the common questions around
          this, see the{" "}
          <Link href="/faq" className="text-gold underline underline-offset-2">
            FAQ
          </Link>
          .
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Are you a power user?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Find out your class tier and yield in one command:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>npx sigrank</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Already have token stats?{" "}
          <Link
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Score your yield instantly →
          </Link>
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3 border-t border-bg-border-subtle pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="text-base text-text-secondary">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            Leaderboard
          </Link>
          {" · "}
          <Link
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Score Calculator
          </Link>
          {" · "}
          <Link href="/faq" className="text-gold underline underline-offset-2">
            FAQ
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield Cascade Metric
          </Link>
        </p>
      </section>
    </div>
  );
}
