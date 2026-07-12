/**
 * app/blog/token-cascade-vs-raw-token-consumption/page.tsx — "Token Yield vs
 * Token Count: Why Volume Lies About AI Skill".
 *
 * Long-form blog post targeting "token efficiency", "AI token usage", "token
 * yield", and "ccusage alternative". Argues that yield (Υ) — not raw volume —
 * is the metric that measures AI operator skill. Introduces the "tool is the
 * person" thesis: your token cascade IS your skill signature.
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
  title: "Token Yield vs Token Count: Why Volume Lies About AI Skill",
  description:
    "Why token yield (Υ) — not raw token count — measures AI operator skill. Your token cascade is your skill signature. The tool is the person.",
  path: "/blog/token-cascade-vs-raw-token-consumption",
});

/** Inline ScholarlyArticle JSON-LD (follows the researchArticle() pattern). */
function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/token-cascade-vs-raw-token-consumption`;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    headline: "Token Yield vs Token Count: Why Volume Lies About AI Skill",
    description:
      "Why token yield (Υ) — not raw token count — measures AI operator skill. Your token cascade is your skill signature. The tool is the person.",
    url,
    datePublished: "2026-07-07",
    author: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "Token yield versus raw token count as a measure of AI operator skill",
    keywords: [
      "token efficiency",
      "ai token usage",
      "token yield",
      "yield metric",
      "token count",
      "ai operator skill",
      "ccusage alternative",
    ],
  };
}

const faqs = [
  {
    question:
      "What is the difference between token count and token yield?",
    answer:
      "Token count measures how many tokens you consume — it's a billing number. Token yield (Υ = cache_read × output / input²) measures how well those tokens compound. High yield means your cached context is doing work for you. Token count tells you what you spent; yield tells you what you got for it.",
  },
  {
    question: "Why does input² appear in the yield formula?",
    answer:
      "Input is squared in the denominator because fresh input is the expensive resource. Doubling your input while keeping output and cache_read constant quarters your yield. This penalizes operators who flood the model with fresh context instead of reusing cached results.",
  },
  {
    question: "Is high token usage bad?",
    answer:
      "Not necessarily — high token usage with high cache reuse and high output is efficient. High token usage with low cache reuse and low output is tokenmaxxing: burning tokens without compounding signal. Yield distinguishes the two.",
  },
  {
    question: "How does tracking my token usage tell you about my skill?",
    answer:
      "Every token the AI tool burns is a decision you made. High cache reuse means you build on prior context (discipline). Low fresh input means you don't flood the model (restraint). High output per input means you extract work efficiently (leverage). Your token cascade is your skill signature — the tool is the person.",
  },
];

export default function TokenCascadeVsRawTokenConsumptionPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            {
              name: "Token Cascade vs Raw Token Consumption",
              path: "/blog/token-cascade-vs-raw-token-consumption",
            },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Token Efficiency"
        title="Token Yield vs Token Count: Why Volume Lies About AI Skill"
        subtitle={
          <>
            Why{" "}
            <span className="text-gold">token yield (Υ)</span> — not raw token
            count — measures AI operator skill. Your token cascade is your skill
            signature. <span className="text-gold">The tool is the person.</span>
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-07">Published July 7, 2026</time>
        <span aria-hidden="true">·</span>
        <span>7 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          When teams first start tracking AI usage, they reach for the most
          obvious number: <strong className="text-text-primary">how many
          tokens did we burn?</strong> It feels like a productivity signal. It
          isn&apos;t. Two operators can consume the same number of tokens and
          have wildly different efficiency — one compounding signal, the other
          just spending. Raw token count measures volume. It tells you how
          much you spent, not what you bought — and not how skilled you are.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The metric that actually matters is{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            token yield
          </Link>{" "}
          (Υ). It measures the{" "}
          <em>architecture</em> of your token flow, not the volume — and
          that architecture is a direct reflection of your skill as an AI
          operator. This post explains the difference and why volume-based
          tracking misleads.
        </p>
      </section>

      {/* ── What raw token count measures ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What raw token count measures
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Raw token count is the sum of every token that crossed the wire —
          input plus output plus cache-read plus cache-write. It&apos;s a
          billing number. It tells you what you owe the API provider. It does
          not tell you whether those tokens produced anything useful.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Consider two operators who each consumed 2 million tokens in a week.
          Operator A sent 1.8M of those as fresh input, reused almost no cache,
          and got 200K of output. Operator B sent 400K as fresh input, reused
          1.2M from cache, and got 400K of output. By raw token count
          they&apos;re identical. By efficiency they&apos;re opposites.
        </p>
      </section>

      {/* ── What yield measures ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What yield measures
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield (Υ) captures the shape of the cascade — how well your tokens
          compound — in a single number:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>Υ = (cache_read × output) / input²</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The formula rewards three behaviors that define an efficient operator:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Reusing cached context</strong>{" "}
            — cache_read is multiplied, so operators who build on prior turns
            instead of re-explaining score higher.
          </li>
          <li>
            <strong className="text-text-primary">Producing output</strong> —
            output is multiplied, so operators who extract real work from the
            model score higher.
          </li>
          <li>
            <strong className="text-text-primary">Keeping fresh input lean</strong>{" "}
            — input is squared in the denominator, so operators who flood the
            model with fresh context are penalized.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Raw token count rewards none of these. It only rewards spending.
          That&apos;s the core difference:{" "}
          <span className="text-gold">volume measures how much you spent;
          yield measures what you got for it.</span>
        </p>
      </section>

      {/* ── Why input is squared ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why input is squared
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The input² term is the part that surprises people, and it&apos;s the
          part that does the most work. Fresh input is the expensive resource in
          the cascade — it costs compute, it adds noise, and it doesn&apos;t
          compound. Squaring it in the denominator means the penalty for burning
          input grows super-linearly:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            Double your input while keeping output and cache_read constant, and
            your yield{" "}
            <span className="text-gold">drops by a factor of four</span> — not
            two. The formula doesn&apos;t just discourage high input; it makes
            high input the single fastest way to tank your score.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is deliberate. Operators who flood the model with fresh context
          — pasting entire files, repeating instructions, starting every
          session from scratch — are the ones whose cascades burn instead of
          compound. The input² term makes that behavior visible in the number.
        </p>
      </section>

      {/* ── The two operators, scored ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The two operators, scored
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Back to Operator A and Operator B — both at 2M tokens consumed. Here&apos;s
          what yield says about each:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Operator A — the burner
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Input 1.8M, output 200K, cache-read 0. Yield = (0 × 200K) / 1.8M²
            = <span className="text-gold">0</span>. No cache reuse means no
            compounding. Two million tokens, zero efficiency.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Operator B — the compounder
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Input 400K, output 400K, cache-read 1.2M. Yield = (1.2M × 400K) /
            400K² ={" "}
            <span className="text-gold">1,200</span>. Same total tokens, but
            the cascade is compounding: cached context is doing work, output is
            flowing, input is lean.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Same volume. Opposite efficiency. Raw token count can&apos;t tell them
          apart. Yield can. That&apos;s why{" "}
          <Link
            href="/metrics/leverage"
            className="text-gold underline underline-offset-2"
          >
            leverage
          </Link>{" "}
          and yield — not token count — are the metrics that define a skilled
          AI operator.
        </p>
      </section>

      {/* ── When high token usage is fine ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          When high token usage is fine
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          High token usage isn&apos;t inherently bad. An operator who consumes
          5M tokens but reuses 4M from cache, sends 500K as fresh input, and
          produces 500K of output has a high yield — they&apos;re compounding,
          not burning. The volume is high because the work is substantial, not
          because the cascade is wasteful.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The failure mode is high token usage with{" "}
          <em>low cache reuse and low output</em> — burning tokens without
          compounding signal. That&apos;s tokenmaxxing, and yield flags it
          immediately. The number doesn&apos;t care how much you spent; it
          cares whether your spending compounded.
        </p>
      </section>

      {/* ── The tool is the person ── */}
      <section className="flex flex-col gap-4 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The tool is the person
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Here&apos;s the insight that the token-count leaderboards miss:{" "}
          <strong className="text-text-primary">every token the tool burns
          is a decision the person made.</strong> When you reuse cached context,
          that&apos;s your discipline. When you keep input lean, that&apos;s your
          restraint. When you extract high output from low input, that&apos;s
          your leverage. The cascade isn&apos;t the tool&apos;s behavior —
          it&apos;s yours.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The token-count leaderboards (clawdboard, CCgather, TrustMRT) rank{" "}
          <em>tools spending money</em>. They tell you who burned the most tokens
          or spent the most dollars. That&apos;s a leaderboard of hammers, not
          carpenters. Yield ranks the carpenter — because the cascade{" "}
          <em>is</em> the person&apos;s skill signature.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You don&apos;t need a quiz to know if someone is an{" "}
          <Link
            href="/blog/ai-power-user-benchmarking"
            className="text-gold underline underline-offset-2"
          >
            AI power user
          </Link>
          . You need their token cascade.{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            See who ranks →
          </Link>
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Measure your cascade, not your volume
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Stop tracking how many tokens you burn. Start tracking whether
          they&apos;re compounding:
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
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield Cascade Metric
          </Link>
          {" · "}
          <Link
            href="/metrics/leverage"
            className="text-gold underline underline-offset-2"
          >
            Leverage Metric
          </Link>
          {" · "}
          <Link
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Score Calculator
          </Link>
        </p>
      </section>
    </div>
  );
}
