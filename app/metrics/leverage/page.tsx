/**
 * app/metrics/leverage/page.tsx — "Leverage — Cached Context Amplification"
 *
 * Defines leverage: how much cached context amplifies your fresh input. High
 * leverage means you're building on prior context; low leverage means you're
 * re-explaining from scratch each time.
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
  title: 'Leverage — Cached Context Amplification',
  description:
    'Leverage = cache_read / input measures how much cached context amplifies your fresh input in AI coding. Learn what token leverage means, why high leverage matters, and how to increase it.',
  path: '/metrics/leverage',
})

export default function LeveragePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Metrics', path: '/metrics' },
            { name: 'Leverage', path: '/metrics/leverage' },
          ]),
          definedTerm(
            'Leverage — Cached Context Amplification',
            'Leverage = cache_read / input. The ratio of cached context reused to fresh input sent. High leverage means your cached context amplifies your input many times over — you are building on prior context efficiently. Low leverage means you are re-explaining from scratch each turn with little cached foundation.',
            '/metrics/leverage',
          ),
          faqPage([
            {
              question: 'What is leverage in AI coding?',
              answer:
                'Leverage = cache_read / input. It measures how much cached context amplifies your fresh input. A leverage of 20 means you are reusing 20 tokens from cache for every 1 token of fresh input you send. High leverage means you are building on prior context; low leverage means you are re-explaining from scratch each turn.',
            },
            {
              question: 'What is a good leverage score?',
              answer:
                'Leverage scales with session length — longer sessions naturally accumulate more cache_read. A leverage of 10-20 is typical for a focused mid-session turn. The key is the trend: leverage should increase as a session progresses (cache accumulates) and drop sharply if you restart or switch topics (cache resets). Track leverage per turn, not just as a session average.',
            },
            {
              question: 'How is leverage different from cache hit rate?',
              answer:
                'Cache hit rate = cache_read / (cache_read + cache_write) measures the fraction of cache operations that are reads. Leverage = cache_read / input measures how much cached context you reuse relative to fresh input. Cache hit rate is about cache efficiency (are your cache writes paying off?); leverage is about input efficiency (is your cached context amplifying your input?). Both matter — they measure different aspects of context reuse.',
            },
            {
              question: 'How do I increase my leverage?',
              answer:
                'Increase cache_read by maintaining stable context and conversation continuity. Decrease input by trimming fresh tokens — reference prior context instead of re-pasting it. The highest-leverage move is keeping a long, stable cached prefix that you build on with minimal fresh input each turn. Session continuity is leverage continuity.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Amplification Metric"
        terminalText="LEVERAGE"
        title="Leverage — Cached Context Amplification"
        subtitle={
          <>
            How much your cached context{' '}
            <span className="text-gold">amplifies</span> your fresh input. High
            leverage means you&rsquo;re building on a foundation, not starting over.
          </>
        }
      />

      {/* ── The formula ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The formula
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <p className="text-center font-mono text-2xl text-gold">
            Leverage = cache_read / input
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Leverage is the ratio of <strong className="text-text-primary">cached
          context reused</strong> to <strong className="text-text-primary">fresh
          input sent</strong>. A leverage of 20 means you&rsquo;re reusing 20 tokens
          from cache for every 1 token of fresh input. A leverage of 0.5 means
          you&rsquo;re sending 2 tokens of fresh input for every 1 token of cached
          context — you&rsquo;re spending more on fresh input than you&rsquo;re
          reusing from cache.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The name is deliberate: leverage measures how much your{' '}
          <em>prior investment</em> in context (the cache) amplifies your{' '}
          <em>current investment</em> (fresh input). High leverage is like having a
          large bankroll working for you — a small fresh deposit moves a lot of
          cached capital. Low leverage is like starting with an empty account every
          time.
        </p>
      </section>

      {/* ── What it means ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What leverage means
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Leverage captures the <strong className="text-text-primary">amplification
          effect</strong> of prompt caching. When you maintain a stable context
          across turns, your cached prefix grows. Each new turn sends a small amount
          of fresh input (the new question or task), but the model processes it
          against the full cached context (everything from prior turns). Your fresh
          input is <em>amplified</em> by the cache — a 100-token question is
          interpreted in the context of 50,000 cached tokens of project history.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is why leverage matters: it measures whether you&rsquo;re operating
          with <strong className="text-text-primary">compounding context</strong>{' '}
          (high leverage — the cache does the heavy lifting) or{' '}
          <strong className="text-text-primary">flat context</strong> (low leverage
          — every turn is a fresh start with no accumulated foundation).
        </p>
      </section>

      {/* ── High vs low leverage ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          High leverage vs low leverage
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            High leverage — building on prior context
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            You maintain a stable, growing cached prefix across turns. Each new turn
            sends minimal fresh input — a targeted question, a small code snippet, a
            specific instruction — and the model interprets it against the full
            weight of your accumulated context. You&rsquo;re building on a
            foundation. This is the signature of a{' '}
            <strong className="text-text-primary">BUILDER</strong> or{' '}
            <strong className="text-text-primary">TRANSMITTER</strong>.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
            Low leverage — re-explaining from scratch
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            You send large fresh inputs each turn with little cached context to
            amplify them. You re-explain the project, re-paste the codebase, and
            re-establish conventions. The model processes your input from scratch
            with no accumulated understanding. Each turn is an island. This is the
            signature of an <strong className="text-text-primary">IGNITER</strong> —
            no foundation, no amplification.
          </p>
        </div>
      </section>

      {/* ── Leverage vs cache hit rate ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Leverage vs cache hit rate
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          These two metrics measure different aspects of context reuse and are often
          confused:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Cache hit rate</strong> ={' '}
            cache_read / (cache_read + cache_write) — measures whether your cache{' '}
            <em>writes</em> are paying off (are you reading back what you write?).
          </li>
          <li>
            <strong className="text-text-primary">Leverage</strong> = cache_read /
            input — measures whether your cache is{' '}
            <em>amplifying</em> your input (is your cached context large relative to
            your fresh input?).
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You can have a high cache hit rate but low leverage: you read back
          everything you write to cache, but your cache is small relative to your
          fresh input (short sessions, frequent topic switches). You can have high
          leverage but a moderate cache hit rate: your cache is large and amplifies
          your input, but you also write a lot of new cache that doesn&rsquo;t get
          read back. Both metrics matter — they diagnose different problems.
        </p>
      </section>

      {/* ── How to increase leverage ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to increase your leverage
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">1. Maintain long, stable sessions.</strong>{' '}
            Leverage grows naturally as a session progresses — the cached prefix
            accumulates with each turn. The longer your session, the more cache_read
            builds up. Don&rsquo;t restart unless you have to. A 50-turn focused
            session will have far higher leverage than ten 5-turn sessions.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">2. Send minimal fresh input per turn.</strong>{' '}
            Leverage = cache_read / input — shrinking the denominator is as powerful
            as growing the numerator. Reference prior context instead of re-pasting
            it. &ldquo;Add error handling to the function from turn 3&rdquo; is a
            10-token input amplified by 50,000 cached tokens. Re-pasting the function
            is a 500-token input that barely moves the leverage needle.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">3. Use structured, stable prefixes.</strong>{' '}
            A consistent prefix (project conventions, file layout, system prompt) at
            the top of your context gets cached on turn one and reused on every
            subsequent turn. This builds a large cache_read foundation that amplifies
            all future input.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">4. Avoid topic switches mid-session.</strong>{' '}
            Each topic switch forces new context that doesn&rsquo;t match the cached
            prefix. The cache resets, leverage drops to near zero, and you start
            rebuilding from scratch. Group related work into focused sessions.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">5. Build incrementally.</strong> Ask the
            model to extend, refactor, or test code it already generated in prior
            turns. Each incremental request sends small fresh input but leverages
            the full cached context of the codebase under discussion. Incremental
            building is the natural mode of high-leverage AI coding.
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
              What is leverage in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Leverage = cache_read / input. It measures how much cached context
              amplifies your fresh input. A leverage of 20 means you reuse 20 cached
              tokens for every 1 token of fresh input. High leverage means
              you&rsquo;re building on prior context; low leverage means
              you&rsquo;re re-explaining from scratch.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is a good leverage score?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Leverage scales with session length — longer sessions accumulate more
              cache_read. A leverage of 10-20 is typical for a focused mid-session
              turn. Track the trend: leverage should increase as a session progresses
              and drop if you restart or switch topics.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How is leverage different from cache hit rate?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache hit rate measures whether your cache writes pay off (reads vs
              writes). Leverage measures whether your cache amplifies your input
              (cache_read vs fresh input). You can have high cache hit rate but low
              leverage (small cache, large input) or high leverage but moderate hit
              rate (large cache, some wasted writes). Both diagnose different
              problems.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I increase my leverage?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Maintain long, stable sessions (leverage grows as cache accumulates),
              send minimal fresh input per turn (reference instead of re-pasting),
              use structured prefixes, avoid topic switches, and build incrementally
              on prior turns. Session continuity is leverage continuity.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related metrics:{' '}
          <Link href="/metrics/cache-hit-rate" className="text-gold underline underline-offset-2">
            Cache Hit Rate
          </Link>
          {' · '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
          {' · '}
          <Link href="/metrics/compression-ratio" className="text-gold underline underline-offset-2">
            Compression Ratio
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
