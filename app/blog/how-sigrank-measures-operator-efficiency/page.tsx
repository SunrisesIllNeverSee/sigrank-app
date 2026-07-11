/**
 * app/blog/how-sigrank-measures-operator-efficiency/page.tsx — "How SigRank
 * Measures Operator Efficiency".
 *
 * Long-form blog post targeting "what is AI operator efficiency", "how to
 * measure AI usage", and "AI operator metrics". Explains the yield metric
 * (Υ = cache_read × output / input²) and the four token pillars that feed it.
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
  title: "How SigRank Measures Operator Efficiency",
  description:
    "The yield metric (Υ = cache_read × output / input²) measures how well AI operators convert tokens into useful output. Here's how it works and why it matters.",
  path: "/blog/how-sigrank-measures-operator-efficiency",
});

/** Inline ScholarlyArticle JSON-LD (follows the researchArticle() pattern). */
function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/how-sigrank-measures-operator-efficiency`;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    headline: "How SigRank Measures Operator Efficiency",
    description:
      "The yield metric (Υ = cache_read × output / input²) measures how well AI operators convert tokens into useful output. How it works and why it matters.",
    url,
    datePublished: "2026-07-07",
    author: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "AI operator efficiency measurement and the yield cascade metric",
    keywords: [
      "what is ai operator efficiency",
      "how to measure ai usage",
      "ai operator metrics",
      "token cascade efficiency",
      "yield metric",
    ],
  };
}

const faqs = [
  {
    question: "How does SigRank measure AI operator efficiency?",
    answer:
      "SigRank uses the Yield metric (Υ = cache_read × output / input²) to measure token cascade efficiency — how well an operator converts fresh input into output, amplified by cached context reuse.",
  },
  {
    question: "What metrics does SigRank track?",
    answer:
      "SigRank tracks four token pillars (input, output, cacheCreate, cacheRead) and derives Yield (Υ), Leverage (Cr/I), Velocity (O/I), and 10xDEV (log₁₀(leverage)). Operators are classified into tiers from Burner to 10xer.",
  },
  {
    question: "Why is yield better than raw token count?",
    answer:
      "Raw token count measures volume, not efficiency. An operator who sends a million tokens with no cache reuse scores low on yield. Yield measures the architecture of the cascade — how well you compound signal, not how much you burn.",
  },
];

export default function HowSigrankMeasuresOperatorEfficiencyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            {
              name: "How SigRank Measures Operator Efficiency",
              path: "/blog/how-sigrank-measures-operator-efficiency",
            },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Operator Metrics"
        title="How SigRank Measures Operator Efficiency"
        subtitle={
          <>
            The yield metric{" "}
            <span className="text-gold">
              (Υ = cache_read × output / input²)
            </span>{" "}
            measures how well AI operators convert tokens into useful output.
            Here&apos;s how it works and why it matters.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-07">Published July 7, 2026</time>
        <span aria-hidden="true">·</span>
        <span>8 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          When you use an AI coding tool, you send tokens in and the model sends
          tokens back. That exchange — the{" "}
          <strong className="text-text-primary">token cascade</strong> — is the
          atomic unit of AI-assisted work. But &ldquo;I used a lot of
          tokens&rdquo; tells you nothing about whether you used them{" "}
          <em>well</em>. A developer who burns a million tokens re-explaining
          context the model already has is not efficient — they&apos;re just
          spending.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures operator efficiency with a single derived metric
          called{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            yield (Υ)
          </Link>
          . It captures, in one number, how well an operator converts fresh
          input into useful output — amplified by the reuse of cached context.
          This post breaks down exactly what yield measures, where the numbers
          come from, and why it beats raw token count as a measure of skill.
        </p>
      </section>

      {/* ── The four token pillars ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The four token pillars
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every SigRank measurement starts with four integers read from your
          local AI tool logs — no prompt content, just counts. These are the
          pillars every derived metric is built from:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Input</strong> — fresh tokens
            you send to the model. This is the expensive resource: every input
            token costs compute and adds noise.
          </li>
          <li>
            <strong className="text-text-primary">Output</strong> — tokens the
            model generates back. This is the useful product: code, answers,
            explanations.
          </li>
          <li>
            <strong className="text-text-primary">Cache-create</strong> — new
            tokens written to the prompt cache for future reuse. An investment
            in later efficiency.
          </li>
          <li>
            <strong className="text-text-primary">Cache-read</strong> — cached
            tokens reused from prior context. The cheapest, highest-leverage
            tokens in the cascade: work the model already has and doesn&apos;t
            need to be told again.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          From these four integers, SigRank derives the metrics that actually
          describe how well you drive the cascade.
        </p>
      </section>

      {/* ── The yield formula ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The yield formula
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield is the headline efficiency metric. The formula is deliberately
          simple:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>Υ = (cache_read × output) / input²</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Three things happen in this formula, and each is intentional:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Cache-read is multiplied
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Reusing cached context is the cheapest way to get work out of the
            model. Multiplying by cache_read{" "}
            <span className="text-gold">rewards operators who build on prior
            turns</span> instead of starting from scratch every time.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Output is multiplied
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Producing more useful output per turn is the point. Multiplying by
            output{" "}
            <span className="text-gold">rewards operators who extract real
            work</span> from the model, not just conversation.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Input is squared in the denominator
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Fresh input is the expensive resource. Squaring it in the
            denominator means{" "}
            <span className="text-gold">doubling your input quarters your
            yield</span> — all else equal. This penalizes operators who flood
            the model with fresh context instead of reusing cached results.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The result is a single number that rises when you reuse context and
          produce output, and falls when you burn fresh input. High yield means
          your cascade is compounding signal. Low yield means tokens are being
          burned.
        </p>
      </section>

      {/* ── The derived metrics ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The derived metrics
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield is the headline, but SigRank derives three companion metrics
          that each isolate one dimension of the cascade. Together they tell you
          <em> where</em> your efficiency is won or lost:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Leverage</strong> ={" "}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              cache_read / input
            </code>
            . How much cached context amplifies each input token. A leverage of
            10 means every input token is backed by ten cached tokens. This is
            the metric that replaces &ldquo;hours&rdquo; in the AI era: it
            measures how much mileage you get from each token you spend.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Velocity</strong> ={" "}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              output / input
            </code>
            . How much output you get per unit of input. High velocity means
            your prompts are tight and the model is producing; low velocity
            means you&apos;re spending a lot to get a little.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">10xDEV</strong> ={" "}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              log₁₀(leverage)
            </code>
            . A logarithmic scale that turns leverage into a readable tier
            number. A 10xDEV of 1 means leverage 10; a 10xDEV of 2 means
            leverage 100. It&apos;s the headline number for classifying
            operators.
          </p>
        </div>
      </section>

      {/* ── Operator tiers ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Operator tiers — from Burner to 10xer
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank doesn&apos;t just give you a number — it classifies you into a
          tier that describes the shape of your cascade. The tiers run from
          Burner (low efficiency, high burn) to 10xer (the AI power user
          archetype: high cache reuse, high output per input, disciplined token
          architecture):
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Burner</strong> — low yield,
            high input, little cache reuse. Tokens are being burned, not
            compounded.
          </li>
          <li>
            <strong className="text-text-primary">Builder</strong> — moderate
            yield, building cache depth. The middle of the distribution; most
            operators start here.
          </li>
          <li>
            <strong className="text-text-primary">10xer</strong> — high yield,
            high leverage, high velocity. The operator whose cascade compounds:
            every input token is amplified by cached context and converted into
            output.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You can see your tier instantly at{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score
          </Link>
          , and compare it against the field on the{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            leaderboard
          </Link>
          .
        </p>
      </section>

      {/* ── Why yield beats raw token count ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why yield beats raw token count
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Raw token count is the metric people reach for first, and it&apos;s
          the one that misleads most. An operator who sends a million tokens
          with no cache reuse and little output looks &ldquo;productive&rdquo;
          by volume — but their cascade is burning, not building. Yield exposes
          the difference.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield measures the{" "}
          <strong className="text-text-primary">architecture</strong> of your
          cascade, not the volume. It rewards the three behaviors that actually
          define a skilled AI operator: reusing cached context, producing
          output, and keeping fresh input lean. Token count rewards none of
          these — it just rewards spending. That&apos;s why yield is the
          headline metric and token count is, at best, a diagnostic input.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The full methodology — including the scoring ruleset, tier
          boundaries, and how snapshots are verified — is on the{" "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            methodology page
          </Link>
          .
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          See your yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The fastest way to measure your own operator efficiency is one
          command:
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
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
          {" · "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            Leaderboard
          </Link>
        </p>
      </section>
    </div>
  );
}
