/**
 * app/ai-coding-metrics/page.tsx — "AI Coding Metrics — The Complete Guide"
 *
 * Topic hub for the AI-coding-metrics category. Surveys every SigRank
 * metric, how they relate, which to prioritize, and links out to the
 * individual metric pages and the efficiency-measurement guide.
 *
 * JSON-LD: breadcrumb() + faqPage().
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'AI Coding Metrics — The Complete Guide',
  description:
    'The complete guide to AI coding metrics: yield, compression ratio, SNR, cache hit rate, leverage, and velocity. What each reveals about your cascade.',
  path: '/ai-coding-metrics',
})

const METRICS = [
  {
    href: '/metrics/yield-cascade',
    name: 'Yield (Υ)',
    formula: 'cache_read × output / input²',
    desc: 'The headline metric. Measures the architecture of the cascade — whether signal is compounding or tokens are burning. The single number that captures operator efficiency.',
    priority: 'Start here',
  },
  {
    href: '/metrics/compression-ratio',
    name: 'Compression Ratio',
    formula: 'output / input',
    desc: 'How much you get back per token you put in. A blunt but useful ratio — high compression means the model is doing more with your input than parroting it.',
    priority: 'Pair with yield',
  },
  {
    href: '/metrics/signal-to-noise-ratio',
    name: 'Signal-to-Noise Ratio (SNR)',
    formula: 'signal tokens / total tokens',
    desc: 'The density of useful output in your cascade. High SNR means most of what flows through is signal, not boilerplate or repetition.',
    priority: 'Quality lens',
  },
  {
    href: '/metrics/cache-hit-rate',
    name: 'Cache Hit Rate',
    formula: 'cache_read / (cache_read + cache_write)',
    desc: 'How well you reuse cached context. A high hit rate means you are reading from cache — free tokens — rather than writing new context you may never reuse.',
    priority: 'Efficiency lens',
  },
  {
    href: '/metrics/leverage',
    name: 'Leverage',
    formula: 'cache_read / input',
    desc: 'How much cached context amplifies your fresh input. High leverage means a small input is riding on a large cached foundation — the compounding effect.',
    priority: 'Compounding lens',
  },
  {
    href: '/metrics/velocity',
    name: 'Velocity',
    formula: 'output / session_time',
    desc: 'Tokens produced per unit of wall-clock time. The throughput metric — useful, but it measures speed, not efficiency. A fast operator burning tokens is still burning tokens.',
    priority: 'Secondary',
  },
]

export default function AICodingMetricsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'AI Coding Metrics', path: '/ai-coding-metrics' },
          ]),
          faqPage([
            {
              question: 'What are AI coding metrics?',
              answer:
                'AI coding metrics quantify how efficiently an operator drives AI coding tools. SigRank defines six core metrics from four token pillars: yield (Υ), compression ratio, signal-to-noise ratio, cache hit rate, leverage, and velocity. Each measures a different facet of the token cascade — the flow of tokens through an AI coding session.',
            },
            {
              question: 'Which AI coding metric should I prioritize?',
              answer:
                'Start with yield (Υ = cache_read × output / input²). It is the headline metric because it captures the architecture of the entire cascade in one number — whether signal is compounding or tokens are burning. Then add compression ratio and cache hit rate to understand why your yield is what it is.',
            },
            {
              question: 'How do the SigRank metrics relate to each other?',
              answer:
                'Yield is the composite: it multiplies cache reuse (cache_read) by output and divides by the square of input. Compression ratio is output over input — the return per spend. Cache hit rate and leverage both describe how well you reuse cached context. SNR measures output quality. Velocity measures throughput. Yield is the synthesis; the others are the diagnostic lenses that explain it.',
            },
            {
              question: 'What is the difference between yield and velocity?',
              answer:
                'Velocity measures tokens per unit time — how fast you produce output. Yield measures token-cascade efficiency — how well you compound signal. A fast operator who burns fresh input without reusing cache can have high velocity but low yield. Yield rewards the architecture of the cascade; velocity rewards the clock. SigRank ranks by yield, not velocity.',
            },
            {
              question: 'How do I measure my AI coding metrics?',
              answer:
                'Install the SigRank CLI (npm install -g sigrank), enroll, and submit a snapshot. The on-device scanner reads your four token pillars locally and computes all six metrics. No message content is ever read — only token counts.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="METRICS"
        title="AI Coding Metrics — The Complete Guide"
        subtitle={
          <>
            Six metrics, four token pillars, one cascade. The complete map of
            how SigRank measures{' '}
            <span className="text-gold">AI coding efficiency</span> — and
            which number to look at first.
          </>
        }
      />

      {/* ── Overview ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The full metric set
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank defines six core metrics, all derived from the four token
          pillars (input, output, cache-read, cache-write). They are not six
          independent numbers — they are six lenses on the same cascade. Yield
          is the synthesis; the other five are the diagnostic views that
          explain why your yield is what it is.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Read them together. A high yield with a low cache hit rate means
          you are efficient despite poor cache reuse — probably because your
          output is very high relative to input. A high yield with a high
          cache hit rate means you are compounding: reusing cached context to
          amplify a small fresh input into large output. The latter is the
          sustainable pattern. The metrics tell you which one you are.
        </p>
      </section>

      {/* ── Metric cards ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The six metrics
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METRICS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
                  {m.name}
                </h3>
                <span className="font-mono text-xs text-text-muted">
                  {m.priority}
                </span>
              </div>
              <code className="mt-2 block rounded bg-bg-elevated px-2 py-1 font-mono text-xs text-gold">
                {m.formula}
              </code>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                {m.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How they relate ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How they relate
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Yield</strong> is the
          composite. It multiplies cache reuse (cache_read) by output and
          divides by the square of input. That means yield rises when you
          reuse cache, when you produce more output, and when you send less
          fresh input — all at once. It is the one number that rewards the
          full compounding architecture.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Compression ratio</strong> is
          the output-over-input slice of yield — it ignores cache entirely.
          It tells you whether the model is doing more with your input than
          echoing it, but it cannot see whether you are compounding.
          <strong className="text-text-primary"> Cache hit rate</strong> and{' '}
          <strong className="text-text-primary">leverage</strong> are the
          cache slices — they tell you how well you reuse context but say
          nothing about output.{' '}
          <strong className="text-text-primary">SNR</strong> is the quality
          lens on output. <strong className="text-text-primary">Velocity</strong>{' '}
          is the time lens — orthogonal to efficiency, useful for throughput
          comparisons but not for ranking.
        </p>
      </section>

      {/* ── Which to prioritize ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Which to prioritize
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Start with yield. It is the headline metric and the one the
          leaderboard ranks by. If your yield is low, open the diagnostic
          lenses: check compression ratio to see if your output is too thin
          relative to input, check cache hit rate to see if you are failing
          to reuse context, check leverage to see if your cached foundation is
          too small. SNR tells you whether the output you do produce is dense
          with signal. Velocity is a secondary metric — track it for
          throughput, but do not optimize for it at the expense of yield.
        </p>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Go deeper
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              How to Measure AI Coding Efficiency
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The step-by-step guide to computing all six metrics from your
              token telemetry and reading the results.
            </p>
          </Link>
          <Link
            href="/methodology"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              The SigRank Index — Methodology
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The canonical methodology page: how the metrics are computed,
              how snapshots are verified, and how the leaderboard is ranked.
            </p>
          </Link>
          <Link
            href="/metrics/yield-cascade"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              Yield (Υ)
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              The headline metric. Measures cascade architecture — whether
              signal is compounding or tokens are burning.
            </p>
          </Link>
          <Link
            href="/tools/yield-calculator"
            className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
          >
            <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
              Yield Calculator
            </h3>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
              Enter your four token pillars and compute Υ Yield, compression
              ratio, cache hit rate, and class tier instantly.
            </p>
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are AI coding metrics?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Six metrics derived from four token pillars: yield,
              compression ratio, signal-to-noise ratio, cache hit rate,
              leverage, and velocity. Each measures a different facet of the
              token cascade — the flow of tokens through an AI coding session.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Which metric should I prioritize?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Start with yield (Υ). It captures the architecture of the entire
              cascade in one number. Then use compression ratio and cache hit
              rate as diagnostic lenses to understand why your yield is what
              it is.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do the metrics relate?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yield is the composite — it multiplies cache reuse by output and
              divides by input squared. Compression ratio is the
              output-over-input slice. Cache hit rate and leverage are the
              cache slices. SNR is the quality lens. Velocity is the time
              lens. Yield is the synthesis; the rest are diagnostics.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Yield vs. velocity — what is the difference?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Velocity is tokens per unit time — how fast you produce output.
              Yield is token-cascade efficiency — how well you compound
              signal. A fast operator burning tokens can have high velocity
              but low yield. SigRank ranks by yield, not velocity.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I measure my metrics?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Install the SigRank CLI (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">npm install -g sigrank</code>),
              enroll, and submit a snapshot. The on-device scanner reads your
              four token pillars and computes all six metrics. No message
              content is ever read.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
