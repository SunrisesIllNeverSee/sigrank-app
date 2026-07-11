/**
 * app/blog/why-yield-beats-tokenmaxxing/page.tsx — "Why Yield Beats
 * Tokenmaxxing".
 *
 * Long-form blog post targeting "tokenmaxxing", "AI efficiency", and "reduce
 * token burn". Argues that yield (Υ) — not raw token count — defines a top AI
 * operator, and explains how to stop tokenmaxxing.
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
  title: "Why Yield Beats Tokenmaxxing",
  description:
    "Tokenmaxxing is the practice of maximizing raw token count. Yield (Υ) proves it wrong — efficiency, not volume, defines a top AI operator.",
  path: "/blog/why-yield-beats-tokenmaxxing",
});

/** Inline ScholarlyArticle JSON-LD (follows the researchArticle() pattern). */
function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/why-yield-beats-tokenmaxxing`;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    headline: "Why Yield Beats Tokenmaxxing",
    description:
      "Tokenmaxxing is the practice of maximizing raw token count. Yield (Υ) proves it wrong — efficiency, not volume, defines a top AI operator.",
    url,
    datePublished: "2026-07-07",
    author: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "Tokenmaxxing versus yield-based operator efficiency",
    keywords: [
      "tokenmaxxing",
      "ai efficiency",
      "reduce token burn",
      "yield metric",
      "token cascade efficiency",
    ],
  };
}

const faqs = [
  {
    question: "What is tokenmaxxing?",
    answer:
      "Tokenmaxxing is the practice of maximizing raw token count as a proxy for AI productivity. It's misleading because volume doesn't equal value — an operator who sends a million tokens with no cache reuse and little output is burning, not building.",
  },
  {
    question: "Why does yield beat token count?",
    answer:
      "Yield (Υ = cache_read × output / input²) measures the architecture of your token cascade, not the volume. It rewards cache reuse, output production, and input economy. Token count rewards none of these — it just rewards spending.",
  },
  {
    question: "How do I stop tokenmaxxing?",
    answer:
      "Stop starting from scratch. Reuse prompts, templates, and workflows. Build on cached results instead of sending fresh context every time. SigRank's self_improve tool diagnoses your cascade and shows you exactly where you're leaking efficiency.",
  },
];

export default function WhyYieldBeatsTokenmaxxingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            {
              name: "Why Yield Beats Tokenmaxxing",
              path: "/blog/why-yield-beats-tokenmaxxing",
            },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · AI Efficiency"
        title="Why Yield Beats Tokenmaxxing"
        subtitle={
          <>
            <span className="text-gold">Tokenmaxxing</span> is the practice of
            maximizing raw token count. Yield (Υ) proves it wrong — efficiency,
            not volume, defines a top AI operator.
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
          There&apos;s a trap that catches almost everyone who starts tracking
          their AI usage. You see the token counter climb — 500K, 1M, 2M — and
          it feels like productivity. More tokens means more work, right? Wrong.
          More tokens means more <em>spending</em>. Whether that spending
          produced anything depends entirely on the{" "}
          <strong className="text-text-primary">architecture</strong> of your
          cascade, not the volume.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The practice of maximizing raw token count as a proxy for
          productivity has a name:{" "}
          <span className="text-gold">tokenmaxxing</span>. And the metric that
          exposes it is{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            yield (Υ)
          </Link>
          . This post explains why tokenmaxxing misleads, why yield beats it,
          and how to stop doing it.
        </p>
      </section>

      {/* ── What is tokenmaxxing ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What is tokenmaxxing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokenmaxxing is the AI-era equivalent of measuring a developer by
          lines of code. It treats token count as a productivity signal: the
          more tokens you consume, the more &ldquo;work&rdquo; you must be
          doing. The logic is intuitive and wrong, for the same reason LOC was
          wrong — it measures the wrong unit.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An operator who sends a million tokens with no cache reuse and little
          output is not productive. They&apos;re burning. They&apos;re
          re-explaining context the model already has, pasting files it already
          read, and starting every session from scratch. The token counter says
          &ldquo;1M&rdquo; and looks impressive. The cascade says{" "}
          <em>nothing is compounding</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">The tokenmaxxing
            mindset:</strong> &ldquo;I used 3M tokens this week, I must be
            cranking.&rdquo; The yield mindset: &ldquo;I used 3M tokens this
            week — did they compound, or did I just spend?&rdquo;
          </p>
        </div>
      </section>

      {/* ── Why yield beats token count ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why yield beats token count
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield (Υ) measures the architecture of your cascade, not the volume.
          The formula —{" "}
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
            (cache_read × output) / input²
          </code>{" "}
          — rewards exactly the three behaviors that define a skilled operator:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Cache reuse</strong> —
            cache_read is multiplied. Operators who build on prior turns score
            higher.
          </li>
          <li>
            <strong className="text-text-primary">Output production</strong> —
            output is multiplied. Operators who extract real work score higher.
          </li>
          <li>
            <strong className="text-text-primary">Input economy</strong> —
            input is squared in the denominator. Operators who keep fresh input
            lean score higher; operators who flood the model are penalized
            hard.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token count rewards none of these. It only goes up. An operator who
          tokenmaxxes — high input, low cache reuse, low output — sees their
          token count climb and their yield crater. The two metrics diverge
          exactly where it matters: token count can&apos;t tell burning from
          building; yield can.
        </p>
      </section>

      {/* ── The signal yield captures ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The signal yield captures that token count can&apos;t
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield captures something token count structurally cannot: whether
          your signal is <em>compounding</em>. A compounding cascade is one
          where each turn builds on the last — cached context accumulates,
          input stays lean, and output flows. A burning cascade is one where
          each turn starts over — fresh input floods in, cache never builds,
          and output is thin.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Two operators can have identical token counts and opposite cascades.
          Yield tells them apart because it measures the{" "}
          <em>shape</em> of the flow, not the size. That&apos;s why it&apos;s
          the headline metric on the{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            leaderboard
          </Link>{" "}
          and the number you get at{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score
          </Link>
          .
        </p>
      </section>

      {/* ── How to stop tokenmaxxing ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to stop tokenmaxxing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The fix is structural, not motivational. You don&apos;t stop
          tokenmaxxing by &ldquo;trying to be more efficient&rdquo; — you stop
          it by changing the architecture of your cascade. Three concrete
          moves:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            1. Stop starting from scratch
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Every time you start a fresh session and re-paste context the model
            already had, you burn input and reset your cache. Work within long
            sessions per feature so the cache builds and cache-read compounds.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            2. Reuse prompts, templates, and workflows
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Reusable prompt structures mean the model recognizes the pattern and
            leans on cached context instead of needing fresh explanation. Build
            a library of templates; reference files by path instead of pasting
            contents.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            3. Diagnose with self_improve
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            SigRank&apos;s <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">self_improve</code>{" "}
            tool reads your cascade and shows you exactly where you&apos;re
            leaking efficiency — which pillar is weak, which behavior is
            burning tokens. You can&apos;t fix what you can&apos;t see.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The operators at the top of the leaderboard didn&apos;t get there by
          burning more tokens. They got there by burning{" "}
          <em>fewer</em> — and compounding the rest. Yield is the number that
          proves it.
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Find out if you&apos;re tokenmaxxing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          One command tells you whether your tokens are compounding or burning:
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
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Score Calculator
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
