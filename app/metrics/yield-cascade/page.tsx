/**
 * app/metrics/yield-cascade/page.tsx — "Yield (Υ) — Token Cascade Efficiency"
 *
 * The headline SigRank metric. This page defines yield, explains the formula,
 * walks through example calculations, and maps yield ranges to class tiers.
 *
 * JSON-LD: breadcrumb + definedTerm + faqPage.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Yield (Υ) — Token Cascade Efficiency',
  description:
    'Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2 \u2014 the headline SigRank metric. Learn what cascade yield measures, how to improve it, and class tier mapping.',
  path: '/metrics/yield-cascade',
})

export default function YieldCascadePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Metrics', path: '/metrics' },
            { name: 'Yield Cascade', path: '/metrics/yield-cascade' },
          ]),
          definedTerm(
            'Yield (Υ) — Token Cascade Efficiency',
            'Yield (Υ) = (cache_read × output) / input². The headline SigRank metric measuring how efficiently an AI operator converts fresh input tokens into useful output, amplified by cached context reuse. High yield means signal is compounding; low yield means tokens are burned.',
            '/metrics/yield-cascade',
          ),
          faqPage([
            {
              question: 'What is the yield metric in AI coding?',
              answer:
                'Yield (Υ) = (cache_read × output) / input² is the headline SigRank metric. It measures token cascade efficiency — how well an AI operator converts fresh input into output, amplified by cached context. High yield means signal is compounding; low yield means tokens are burned.',
            },
            {
              question: 'Why is yield the headline SigRank metric?',
              answer:
                'Yield captures all four token pillars in a single number. It rewards cache reuse (cache_read), output production (output), and input economy (input² in the denominator). Volume alone is noise — an operator who sends a million tokens with no cache reuse and little output scores low. Yield measures the architecture of the cascade, not raw spend.',
            },
            {
              question: 'What is a good yield score?',
              answer:
                'Yield ranges map to class tiers: IGNITER (low yield, just starting), SEEKER (improving), BUILDER (efficient cascade), and TRANSMITTER (top decile, signal compounding). The exact thresholds are calibrated from the live leaderboard. The median operator sits well below the top decile — the gap between median and TRANSMITTER is where most improvement lives.',
            },
            {
              question: 'How do I improve my yield?',
              answer:
                'Three levers: (1) increase cache_read by keeping context stable and reusing cached prefixes, (2) increase output by asking for substantive deliverables rather than yes/no answers, and (3) decrease input by trimming redundant context and avoiding verbose re-explanations. The input² term means cutting input has a squared effect — small input reductions produce large yield gains.',
            },
            {
              question: 'Does yield depend on the AI model I use?',
              answer:
                'No. SigRank scores the operator, not the model. Yield is computed from four token counts (input, output, cache_read, cache_write) that every platform reports. The same operator on Claude, ChatGPT, Gemini, or Cursor produces comparable yield scores because the metric measures how you drive the AI, not which AI you drive.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Headline Metric"
        terminalText="YIELD"
        title="Yield (Υ) — Token Cascade Efficiency"
        subtitle={
          <>
            The headline SigRank metric. Measures whether your token cascade is{' '}
            <span className="text-gold">compounding signal</span> or burning tokens.
          </>
        }
      />

      {/* ── The formula ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The yield formula
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <p className="text-center font-mono text-2xl text-gold">
            Υ = (cache_read × output) / input²
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield combines all four token pillars into a single number.{' '}
          <strong className="text-text-primary">cache_read</strong> rewards context
          reuse — the cached tokens you carry forward from prior turns.{' '}
          <strong className="text-text-primary">output</strong> rewards productive
          generation — the tokens the model gives back.{' '}
          <strong className="text-text-primary">input²</strong> penalizes fresh
          input — and the square means the penalty is non-linear. Double your input
          and you quarter your yield, all else equal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The four token pillars are:{' '}
          <strong className="text-text-primary">input</strong> (tokens you send),{' '}
          <strong className="text-text-primary">output</strong> (tokens the model
          generates), <strong className="text-text-primary">cache_read</strong>{' '}
          (cached tokens reused from prior context), and{' '}
          <strong className="text-text-primary">cache_write</strong> (new tokens
          written to cache). Yield uses three of the four — cache_write is captured
          indirectly through future cache_read.
        </p>
      </section>

      {/* ── What it measures ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What yield measures
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield measures the <strong className="text-text-primary">architecture</strong>{' '}
          of your token cascade — whether signal is compounding or tokens are being
          burned. An operator who sends 10,000 fresh input tokens, reuses 50,000 from
          cache, and gets back 8,000 output tokens is running an efficient cascade.
          An operator who sends 50,000 fresh tokens, reuses nothing, and gets back
          2,000 output tokens is burning tokens.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Volume is noise; yield is signal. Raw token counts tell you how much you
          spent. Yield tells you how much you got for what you spent — and whether
          your context strategy is working.
        </p>
      </section>

      {/* ── Why it's the headline metric ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why it&rsquo;s the headline metric
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield is the single number that captures the full cascade. Other metrics
          isolate one dimension — compression ratio measures output per input, cache
          hit rate measures context reuse, leverage measures cached amplification.
          Yield blends all of them. An operator can have a high compression ratio
          but low yield (if they never reuse cache). An operator can have a high cache
          hit rate but low yield (if they produce little output). Yield is the only
          metric that rewards getting <em>all three</em> dimensions right
          simultaneously.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The input² denominator is the key design choice. It makes yield sensitive
          to input economy in a way that linear ratios are not. This reflects a real
          asymmetry: fresh input tokens are the most expensive part of the cascade
          (they cost full price and must be processed from scratch), so the metric
          penalizes waste there disproportionately.
        </p>
      </section>

      {/* ── High vs low yield ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What high and low yield means
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            High yield
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Your cascade is compounding. You reuse cached context efficiently, send
            minimal fresh input, and the model produces substantial output. You&rsquo;re
            building on prior turns rather than re-explaining from scratch. This is
            the signature of a <strong className="text-text-primary">TRANSMITTER</strong> —
            an operator whose signal accumulates across a session.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
            Low yield
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Your cascade is burning tokens. You send large fresh inputs, reuse little
            or no cache, and get back relatively little output. Each turn starts from
            scratch. This is the signature of an{' '}
            <strong className="text-text-primary">IGNITER</strong> — an operator who
            hasn&rsquo;t yet built the context discipline that makes signal compound.
          </p>
        </div>
      </section>

      {/* ── Example calculations ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Example calculations
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            Example A — Efficient cascade
          </p>
          <p className="mt-2 font-mono text-sm text-text-secondary">
            input = 2,000 · cache_read = 40,000 · output = 6,000
          </p>
          <p className="mt-1 font-mono text-sm text-gold">
            Υ = (40,000 × 6,000) / 2,000² = 240,000,000 / 4,000,000 = 60
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            High cache reuse, moderate output, low fresh input. Signal is compounding.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            Example B — Token burn
          </p>
          <p className="mt-2 font-mono text-sm text-text-secondary">
            input = 30,000 · cache_read = 0 · output = 3,000
          </p>
          <p className="mt-1 font-mono text-sm text-gold">
            Υ = (0 × 3,000) / 30,000² = 0 / 900,000,000 = 0
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            No cache reuse kills yield — the cache_read term zeroes the numerator
            regardless of output. Every turn starts from scratch.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            Example C — Input-heavy
          </p>
          <p className="mt-2 font-mono text-sm text-text-secondary">
            input = 20,000 · cache_read = 30,000 · output = 10,000
          </p>
          <p className="mt-1 font-mono text-sm text-gold">
            Υ = (30,000 × 10,000) / 20,000² = 300,000,000 / 400,000,000 = 0.75
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Good cache reuse and output, but the large fresh input crushes yield via
            the squared denominator. Trimming input from 20k to 5k would raise yield
            to 12 — a 16× improvement from a 4× input reduction.
          </p>
        </div>
      </section>

      {/* ── Class tier mapping ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Class tier mapping
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield ranges map to SigRank class tiers, from lowest to highest:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">IGNITER</strong> — Low yield. Just
            starting out; context discipline not yet developed. Every turn is a fresh
            start.
          </li>
          <li>
            <strong className="text-text-primary">SEEKER</strong> — Improving yield.
            Beginning to reuse cache and trim input, but output is still modest.
          </li>
          <li>
            <strong className="text-text-primary">BUILDER</strong> — Efficient
            cascade. Consistent cache reuse, economical input, substantial output.
            Signal is compounding.
          </li>
          <li>
            <strong className="text-text-primary">TRANSMITTER</strong> — Top decile.
            The cascade is a flywheel: minimal fresh input, heavy cache reuse, high
            output. Signal compounds across the entire session.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Exact yield thresholds are calibrated from the live leaderboard and shift as
          the operator population grows. The tier you land in reflects your cascade
          architecture relative to the current field.
        </p>
      </section>

      {/* ── How to improve ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to improve your yield
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">1. Maximize cache reuse.</strong> Keep your
            context stable across turns. Don&rsquo;t restart sessions unnecessarily.
            Prompt caching rewards continuity — the longer your cached prefix, the
            more cache_read accumulates and the higher your numerator climbs.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">2. Trim fresh input aggressively.</strong>{' '}
            The input² denominator means every token you cut from fresh input has a
            squared effect on yield. Remove redundant context, avoid re-pasting code
            that&rsquo;s already in cache, and use file references instead of inline
            blocks when possible.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">3. Ask for substantive output.</strong>{' '}
            Request deliverables — code, analysis, explanations — rather than yes/no
            confirmations. More output tokens means a higher numerator. A turn that
            produces 5,000 output tokens contributes far more to yield than one that
            produces 50.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">4. Use structured prefixes.</strong> Stable,
            structured context at the top of your prompt (project conventions, file
            layout, coding standards) gets cached and reused. Chaotic, re-ordered
            context breaks the cache and forces fresh processing every turn.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">5. Build on prior turns.</strong> Reference
            earlier output instead of re-explaining. &ldquo;Refactor the function you
            just wrote&rdquo; leverages cache; &ldquo;here is a function, refactor
            it&rdquo; burns fresh input. Conversation continuity is yield
            continuity.
          </li>
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the yield metric in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yield (Υ) = (cache_read × output) / input² is the headline SigRank
              metric. It measures token cascade efficiency — how well an AI operator
              converts fresh input into output, amplified by cached context. High
              yield means signal is compounding; low yield means tokens are burned.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is yield the headline SigRank metric?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yield captures all four token pillars in a single number. It rewards
              cache reuse, output production, and input economy simultaneously. Volume
              alone is noise — yield measures the architecture of the cascade, not raw
              spend.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is a good yield score?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yield ranges map to class tiers: IGNITER (low), SEEKER (improving),
              BUILDER (efficient), and TRANSMITTER (top decile). Thresholds are
              calibrated from the live leaderboard. The gap between median and
              TRANSMITTER is where most improvement lives.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I improve my yield?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Three levers: increase cache_read (stable context, structured prefixes),
              increase output (ask for substantive deliverables), and decrease input
              (trim redundant context). The input² term means cutting input has a
              squared effect — small reductions produce large yield gains.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Does yield depend on the AI model I use?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No. SigRank scores the operator, not the model. Yield is computed from
              four token counts that every platform reports. The same operator on
              Claude, ChatGPT, Gemini, or Cursor produces comparable yield scores
              because the metric measures how you drive the AI, not which AI you
              drive.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related metrics:{' '}
          <Link href="/metrics/compression-ratio" className="text-gold underline underline-offset-2">
            Compression Ratio
          </Link>
          {' · '}
          <Link href="/metrics/cache-hit-rate" className="text-gold underline underline-offset-2">
            Cache Hit Rate
          </Link>
          {' · '}
          <Link href="/metrics/leverage" className="text-gold underline underline-offset-2">
            Leverage
          </Link>
          {' · '}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            Methodology
          </Link>
        </p>
      </section>
    </div>
  )
}
