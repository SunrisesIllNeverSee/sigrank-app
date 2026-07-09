/**
 * app/guides/how-to-reduce-token-waste/page.tsx
 *
 * SEO guide: "reduce token waste", "ai token optimization", "save ai tokens".
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'How to Reduce Token Waste',
  description:
    'A practical guide to reducing AI token waste. Identify common waste sources and apply concrete fixes. Measure your improvement with yield.',
  path: '/guides/how-to-reduce-token-waste',
})

const howTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to reduce token waste in AI coding',
  description:
    'Identify and fix the four common sources of token waste: repeated context, poor prompt caching, verbose prompts, and unnecessary re-rolls. Measure improvement with Υ Yield.',
  totalTime: 'PT15M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Identify your waste sources',
      text: 'Run `sigrank me` and examine your cascade. High input with low cache-read indicates repeated context. Low cache hit rate indicates poor caching. High input with low output indicates verbose prompts or re-rolls.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Fix repeated context',
      text: 'Build a stable context window so prompt caching engages. Send only deltas on top of cached context instead of re-pasting full files every turn.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Fix verbose prompts',
      text: 'Replace conversational padding with structured, minimal instructions. Remove restated context the model already has in cache. Target 3-5x reduction in input per turn.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Reduce re-rolls',
      text: 'Replace re-rolls with corrections — small deltas on top of cached context. Plan your prompt before sending to avoid wasted turns.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Measure improvement',
      text: 'Run `sigrank me` again after a week of applying the fixes. Compare your yield, cache hit rate, and input count against your pre-fix baseline. Submit a new snapshot to update your rank.',
    },
  ],
}

export default function HowToReduceTokenWastePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Guides', path: '/guides' },
            { name: 'Reduce Token Waste', path: '/guides/how-to-reduce-token-waste' },
          ]),
          faqPage([
            {
              question: 'What are the most common sources of token waste?',
              answer:
                'The four most common sources are: repeated context (re-sending files the model already has), poor prompt caching (unstable context windows that invalidate cache), verbose prompts (conversational padding instead of structured instructions), and unnecessary re-rolls (regenerating from scratch instead of correcting). Each wastes fresh input tokens, which are squared in the yield denominator.',
            },
            {
              question: 'How do I identify token waste in my cascade?',
              answer:
                'Run `sigrank me` and examine your four pillars. High input with low cache-read means repeated context. Low cache hit rate (cache_read / (cache_read + cache_write) below 50%) means poor caching. High input with low output means verbose prompts or re-rolls. Each pattern points to a specific waste source.',
            },
            {
              question: 'How do I fix repeated context waste?',
              answer:
                'Build a stable context window: keep the same system prompt, file order, and project preamble across turns. Send only the delta — the changed lines or new instruction — on top of the cached base. This engages prompt caching and converts fresh input into cache-read.',
            },
            {
              question: 'How do I measure token waste reduction?',
              answer:
                'Compare your Υ Yield before and after applying fixes. Yield = (cache_read × output) / input², so reducing input (less waste) and increasing cache-read (more reuse) both raise yield. Track cache hit rate and input count as secondary indicators. Use `sigrank me` across 7d, 30d, and 90d windows.',
            },
            {
              question: 'Does reducing token waste save money?',
              answer:
                'Yes. Fresh input tokens are the most expensive token type. Cache-read tokens are significantly cheaper on most platforms. By converting fresh input into cache-read (via stable context windows), you reduce both your token spend and your yield penalty simultaneously.',
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="How to Reduce Token Waste"
        subtitle={
          <>
            Token waste is the silent killer of AI coding efficiency. Here&rsquo;s how to
            find it, fix it, and <span className="text-gold">measure the improvement</span>.
          </>
        }
      />

      {/* ── Common sources of token waste ──────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Common sources of token waste
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token waste isn&rsquo;t about using too many tokens — it&rsquo;s about using the
          <em> wrong kind</em>. Fresh input is expensive (squared in the yield denominator);
          cache-read is cheap (in the numerator). Waste happens when you burn fresh input
          that could have been cache-read. The four most common sources:
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">1. Repeated context</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Re-sending files, system prompts, or project context the model already has.
              Every re-paste is fresh input that could have been cache-read. The #1 waste
              source — and the easiest to fix.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">2. Poor prompt caching</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Unstable context windows that invalidate the cache between turns. If you
              reorder context, change the system prompt, or restructure your file list,
              the cache breaks and everything re-processes as fresh input.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">3. Verbose prompts</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Conversational padding, restated context, and redundant instructions. A
              500-token prompt that could be 50 tokens costs 100× more in the yield
              denominator (input is squared). Brevity isn&rsquo;t just style — it&rsquo;s
              math.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">4. Unnecessary re-rolls</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Regenerating from scratch instead of correcting. Each re-roll sends fresh
              input and generates new output without advancing cache-read. Three re-rolls
              triples your input with zero cache benefit.
            </p>
          </div>
        </div>
      </section>

      {/* ── How to identify waste in your cascade ───────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to identify waste in your cascade
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Run{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            sigrank me
          </code>{' '}
          and examine your four pillars. Each waste source leaves a specific fingerprint:
        </p>
        <ul className="flex flex-col gap-3">
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              High input, low cache-read → repeated context
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              You&rsquo;re re-sending context the model already has. Your cache hit rate
              will be low (below 50%). Fix: stabilize your context window.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              Low cache hit rate → poor prompt caching
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache hit rate = cache_read / (cache_read + cache_write). Below 50% means
              your cache is churning. Fix: keep context stable across turns.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              High input, low output → verbose prompts
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              You&rsquo;re sending a lot but getting little back. Your compression ratio
              (output / input) will be low. Fix: structure inputs to be minimal.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              High input, high output, low cache-read → re-rolls
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              You&rsquo;re generating a lot of output but not reusing context. Multiple
              re-rolls produce high output but low signal density. Fix: replace re-rolls
              with corrections.
            </p>
          </li>
        </ul>
      </section>

      {/* ── Concrete fixes for each waste source ────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Concrete fixes for each waste source
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-sm font-bold text-gold">Fix: Repeated context</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              1. Front-load stable context (project rules, file contents) in turn 1.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              2. Keep the same context order in every subsequent turn.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              3. Send only the delta — changed lines, new instructions — on top of cache.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              4. Use file references instead of re-pasting file contents.
            </li>
          </ol>
        </div>

        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-sm font-bold text-gold">Fix: Poor prompt caching</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              1. Don&rsquo;t reorder context between turns — position matters for cache.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              2. Don&rsquo;t change the system prompt mid-session.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              3. Ensure your context exceeds the cache threshold (typically 1,024+ tokens).
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              4. Track cache hit rate — target above 80%.
            </li>
          </ol>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-sm font-bold text-gold">Fix: Verbose prompts</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              1. Remove conversational padding (&ldquo;Hey, so I was wondering...&rdquo;).
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              2. Use bullet points and file references instead of prose.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              3. Don&rsquo;t restate context the model has in cache.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              4. Target 3-5× reduction in input tokens per turn.
            </li>
          </ol>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-sm font-bold text-gold">Fix: Unnecessary re-rolls</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              1. Plan your prompt before sending — know what you want.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              2. If the response is wrong, correct with a small delta on top of cache.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              3. Reserve re-rolls for when the model is truly off-track, not for minor
              adjustments.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              4. Track re-roll count per task — target zero or one.
            </li>
          </ol>
        </div>
      </section>

      {/* ── Measuring improvement ───────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Measuring improvement
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          After applying the fixes for a week, run{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            sigrank me
          </code>{' '}
          again and compare against your pre-fix baseline. The key indicators:
        </p>
        <ul className="flex flex-col gap-2">
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Υ Yield</strong> should rise — less input
            and more cache-read both push it up.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Cache hit rate</strong> should climb
            toward 80%+ as your context stabilizes.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Input count</strong> should drop — fewer
            fresh tokens, more cache reuse.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Compression ratio</strong> should rise —
            more output per input token.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Submit a new snapshot with{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            sigrank submit
          </code>{' '}
          to update your leaderboard rank and class tier. If your yield improved
          significantly, you may have jumped a tier.
        </p>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are the most common sources of token waste?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Repeated context, poor prompt caching, verbose prompts, and unnecessary
              re-rolls. Each wastes fresh input tokens, which are squared in the yield
              denominator.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I identify waste in my cascade?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Run `sigrank me` and examine your pillars. High input + low cache-read =
              repeated context. Low cache hit rate = poor caching. High input + low output
              = verbose prompts. High input + high output + low cache-read = re-rolls.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I fix repeated context waste?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Build a stable context window. Send only deltas on top of cached context.
              Use file references instead of re-pasting contents.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I measure waste reduction?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Compare yield before and after. Reducing input and increasing cache-read both
              raise yield. Track cache hit rate and input count as secondary indicators.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Does reducing token waste save money?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yes. Fresh input tokens are the most expensive. Cache-read tokens are
              significantly cheaper. Converting fresh input into cache-read reduces both
              spend and yield penalty.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/tools/token-waste-calculator" className="text-gold underline underline-offset-2">
            Token Waste Calculator
          </Link>
          {' · '}
          <Link href="/metrics/cache-hit-rate" className="text-gold underline underline-offset-2">
            Cache Hit Rate
          </Link>
          {' · '}
          <Link href="/guides/how-to-improve-your-yield" className="text-gold underline underline-offset-2">
            Improve Your Yield
          </Link>
        </p>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Next:{' '}
          <Link
            href="/guides/how-to-improve-your-yield"
            className="text-gold underline underline-offset-2"
          >
            How to Improve Your Yield →
          </Link>
        </p>
      </section>
    </div>
  )
}
