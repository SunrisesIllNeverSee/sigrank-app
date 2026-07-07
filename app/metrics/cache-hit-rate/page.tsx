/**
 * app/metrics/cache-hit-rate/page.tsx — "Cache Hit Rate — Context Reuse Efficiency"
 *
 * Defines cache hit rate: how well an operator reuses cached context. Explains
 * prompt caching, why this is the highest-leverage metric, and how to improve
 * cache reuse. Covers cost and latency impact.
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
  title: 'Cache Hit Rate — Context Reuse Efficiency',
  description:
    'Cache Hit Rate = cache_read / (cache_read + cache_write) measures how well you reuse prompt-cached context. Learn why it is the highest-leverage AI coding metric and how to improve cache reuse for lower cost and latency.',
  path: '/metrics/cache-hit-rate',
})

export default function CacheHitRatePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Metrics', path: '/metrics' },
            { name: 'Cache Hit Rate', path: '/metrics/cache-hit-rate' },
          ]),
          definedTerm(
            'Cache Hit Rate — Context Reuse Efficiency',
            'Cache Hit Rate = cache_read / (cache_read + cache_write). The fraction of cached-context operations that are reads (reuses) versus writes (new caches). High cache hit rate means you are efficiently reusing prior context; low hit rate means you are constantly writing new cache that is never read back.',
            '/metrics/cache-hit-rate',
          ),
          faqPage([
            {
              question: 'What is cache hit rate in AI coding?',
              answer:
                'Cache Hit Rate = cache_read / (cache_read + cache_write). It measures the fraction of cache operations that are reads (reusing prior context) versus writes (creating new cache). A hit rate of 0.9 means 90% of your cache activity is reuse; 0.1 means 90% is writing cache that is never read back.',
            },
            {
              question: 'What is prompt caching?',
              answer:
                'Prompt caching is a feature offered by AI platforms (Claude, ChatGPT, Gemini, and others) where tokens sent in prior turns are stored and reused in subsequent turns at reduced cost and latency. Instead of reprocessing your entire context from scratch each turn, the model reads the cached prefix and only processes new input. Cache reads are typically 10x cheaper and faster than fresh input.',
            },
            {
              question: 'Why is cache hit rate the highest-leverage metric?',
              answer:
                'Cache reuse is the cheapest, fastest source of signal in the cascade. Cache reads cost a fraction of fresh input and process near-instantly. Every cache hit replaces an expensive fresh-input token with a cheap cached one. Improving cache hit rate directly reduces cost and latency while increasing yield — it is the one metric where improvement cascades into every other metric.',
            },
            {
              question: 'How do I improve my cache hit rate?',
              answer:
                'Keep context stable across turns (don\'t reorder or rewrite prefixes), use structured prefixes at the top of your prompts, maintain conversation continuity (don\'t restart sessions unnecessarily), and avoid mid-session context switches. The key insight: cache breaks when context changes, so stability is everything.',
            },
            {
              question: 'What is the impact of cache hit rate on cost and latency?',
              answer:
                'Cache reads are typically 10x cheaper and significantly faster than fresh input processing. An operator with a 90% cache hit rate pays a fraction of what a 10% hit-rate operator pays for the same total context. Latency drops proportionally — cached tokens are served from memory, not recomputed. High cache hit rate is the single biggest cost and latency lever in AI coding.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Highest-Leverage Metric"
        terminalText="CACHE"
        title="Cache Hit Rate — Context Reuse Efficiency"
        subtitle={
          <>
            How well you reuse cached context. The{' '}
            <span className="text-gold">single biggest lever</span> for cost,
            latency, and yield.
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
            Cache Hit Rate = cache_read / (cache_read + cache_write)
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The cache hit rate measures the fraction of cache operations that are{' '}
          <strong className="text-text-primary">reads</strong> (reusing prior
          context) versus <strong className="text-text-primary">writes</strong>{' '}
          (creating new cache). A hit rate of 0.9 means 90% of your cache activity is
          reuse — you&rsquo;re efficiently building on prior context. A hit rate of
          0.1 means 90% is writing cache that&rsquo;s never read back —
          you&rsquo;re constantly establishing context that doesn&rsquo;t compound.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The denominator (cache_read + cache_write) represents your total cache
          activity. If you never write cache, the rate is undefined (no cache
          activity at all). If you write cache and always read it back, the rate
          approaches 1. The metric captures whether your cache investments are
          paying off.
        </p>
      </section>

      {/* ── What prompt caching is ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What prompt caching is
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prompt caching is a feature offered by modern AI platforms — Claude,
          ChatGPT, Gemini, Copilot, Cursor, and others. When you send a prompt, the
          platform stores the processed tokens (the{' '}
          <strong className="text-text-primary">cache_write</strong>). On subsequent
          turns, if your prompt begins with the same prefix, the platform reuses the
          stored tokens (the <strong className="text-text-primary">cache_read</strong>)
          instead of reprocessing them from scratch.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The economics are dramatic. Cache reads typically cost{' '}
          <strong className="text-text-primary">10x less</strong> than fresh input
          tokens and process <strong className="text-text-primary">significantly
          faster</strong> — the model reads from memory rather than recomputing
          attention over the full context. An operator with a 90% cache hit rate pays
          a fraction of what a 10% hit-rate operator pays for the same total context
          size.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The catch: cache breaks when context changes. If you reorder your prompt,
          rewrite the prefix, or switch topics mid-session, the cached prefix no
          longer matches and the platform falls back to fresh processing. Cache hit
          rate is fundamentally a measure of <strong className="text-text-primary">context
          stability</strong>.
        </p>
      </section>

      {/* ── Why it's the highest-leverage metric ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why cache hit rate is the highest-leverage metric
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cache reuse is the cheapest, fastest source of signal in the entire
          cascade. Every cache hit replaces an expensive fresh-input token with a
          cheap cached one. Improving cache hit rate cascades into every other
          metric:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Yield goes up</strong> —
            cache_read is in the yield numerator. More cache reads, higher yield.
          </li>
          <li>
            <strong className="text-text-primary">SNR goes up</strong> — cache_read
            is signal. More signal, higher SNR.
          </li>
          <li>
            <strong className="text-text-primary">Leverage goes up</strong> —
            cache_read / input increases when you reuse more and send less.
          </li>
          <li>
            <strong className="text-text-primary">Cost goes down</strong> — cache
            reads cost a fraction of fresh input.
          </li>
          <li>
            <strong className="text-text-primary">Latency goes down</strong> —
            cached tokens are served from memory, not recomputed.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          No other metric has this many downstream effects. Compression ratio only
          affects yield through one term. Velocity is secondary. Cache hit rate is
          the multiplier that amplifies everything else — which is why it&rsquo;s the
          first metric to optimize when improving your cascade.
        </p>
      </section>

      {/* ── How to improve cache reuse ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to improve cache reuse
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">1. Keep context stable.</strong> The cache
            matches on prefix — if your prompt starts the same way each turn, the
            cache hits. Don&rsquo;t reorder your context, rewrite the opening, or
            shuffle file order between turns. Stability is the single most important
            factor.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">2. Use structured prefixes.</strong> Put
            stable, structured content at the top of your context: project
            conventions, file layout, coding standards, system prompt. This
            &ldquo;header&rdquo; gets cached on turn one and reused on every
            subsequent turn. Put variable content (the specific question or task) at
            the bottom.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">3. Maintain conversation continuity.</strong>{' '}
            Don&rsquo;t restart sessions unnecessarily. The cached prefix from turn 5
            is free signal on turn 50. Each session restart forces a new cache_write
            with no prior cache_read — a hit rate of zero until the cache builds
            again.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">4. Avoid mid-session context switches.</strong>{' '}
            Jumping between unrelated topics in one session dilutes the cache. Each
            topic switch changes the prefix and breaks the cache. Group related work
            into focused sessions where the cache stays relevant throughout.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">5. Reference, don&rsquo;t re-paste.</strong>{' '}
            If a file is already in context, reference it by name. Re-pasting its
            contents changes the prompt prefix and can break the cache. &ldquo;In the
            auth module from earlier&rdquo; preserves the cache; pasting auth.ts
            again may invalidate it.
          </li>
        </ul>
      </section>

      {/* ── Impact on cost and latency ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Impact on cost and latency
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            Cost
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Cache reads typically cost <strong className="text-text-primary">10x
            less</strong> than fresh input tokens on platforms that support prompt
            caching. An operator processing 100,000 tokens per session with a 90%
            cache hit rate pays for ~10,000 fresh tokens and ~90,000 cached tokens —
            a fraction of the cost of processing all 100,000 fresh. The same operator
            at 10% hit rate pays full price on 90,000 tokens.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            Latency
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Cached tokens are served from memory — the model reads the precomputed
            attention state rather than recomputing it. This makes cached turns
            <strong className="text-text-primary"> significantly faster</strong>,
            especially for long contexts. A 50,000-token cached prefix processes in a
            fraction of the time it would take to recompute from scratch. High cache
            hit rate means faster responses, not just cheaper ones.
          </p>
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
              What is cache hit rate in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache Hit Rate = cache_read / (cache_read + cache_write). It measures
              the fraction of cache operations that are reads (reusing prior context)
              versus writes (creating new cache). A hit rate of 0.9 means 90% of your
              cache activity is reuse.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is prompt caching?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Prompt caching stores processed tokens from prior turns and reuses them
              in subsequent turns at reduced cost and latency. Instead of reprocessing
              your full context from scratch, the model reads the cached prefix and
              only processes new input. Cache reads are typically 10x cheaper and
              faster than fresh input.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is cache hit rate the highest-leverage metric?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache reuse is the cheapest, fastest source of signal. Every cache hit
              replaces an expensive fresh-input token with a cheap cached one.
              Improving cache hit rate increases yield, SNR, and leverage while
              reducing cost and latency — no other metric has this many downstream
              effects.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I improve my cache hit rate?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Keep context stable across turns, use structured prefixes at the top of
              your prompts, maintain conversation continuity, avoid mid-session
              context switches, and reference files instead of re-pasting them. Cache
              breaks when context changes, so stability is everything.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the impact on cost and latency?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache reads cost a fraction of fresh input and process significantly
              faster. A 90% cache hit rate means paying a fraction of the cost and
              getting faster responses compared to a 10% hit rate for the same total
              context. High cache hit rate is the single biggest cost and latency
              lever.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related metrics:{' '}
          <Link href="/metrics/leverage" className="text-gold underline underline-offset-2">
            Leverage
          </Link>
          {' · '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
          {' · '}
          <Link href="/metrics/signal-to-noise-ratio" className="text-gold underline underline-offset-2">
            Signal-to-Noise Ratio
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
