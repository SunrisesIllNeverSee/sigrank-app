/**
 * app/guides/how-to-read-your-cascade/page.tsx
 *
 * SEO guide: "read token cascade", "understand ai token metrics", "cascade analysis".
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'How to Read Your Token Cascade',
  description:
    'A diagnostic guide to reading your token cascade. Learn what each pillar reveals about your workflow and how to interpret your class tier.',
  path: '/guides/how-to-read-your-cascade',
})

const howTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to read your token cascade as a diagnostic',
  description:
    'Examine the four token pillars to diagnose your AI coding workflow. Learn what high cache-read, high input/low output, and balanced cascades reveal — and how to interpret your class tier.',
  totalTime: 'PT10M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Get your cascade numbers',
      text: 'Run `sigrank me` or paste your ccusage JSON into /score to get your four pillars: input, output, cache-read, cache-write.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Check your cache-read to input ratio',
      text: 'If cache-read is high relative to input, your context reuse is strong. If input dominates, you are re-sending context from scratch — fix your context window stability.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Check your output to input ratio',
      text: 'If output is high relative to input, your prompting is efficient. If input dominates output, your prompts are verbose or the model is churning — restructure your inputs.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Check your cache hit rate',
      text: 'Cache hit rate = cache_read / (cache_read + cache_write). Above 80% is excellent. Below 50% means your cache is churning — stabilize your context.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Interpret your class tier',
      text: 'Your class tier (IGNITER → SEEKER → BUILDER → TRANSMITTER) summarizes your cascade shape. Use it as a quick diagnostic and a target for improvement.',
    },
  ],
}

export default function HowToReadYourCascadePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Guides', path: '/guides' },
            { name: 'Read Your Cascade', path: '/guides/how-to-read-your-cascade' },
          ]),
          faqPage([
            {
              question: 'What does the token cascade tell me about my workflow?',
              answer:
                'The cascade is a diagnostic. The four pillars (input, output, cache-read, cache-write) reveal how you manage context, how efficiently you prompt, and whether signal is compounding or being burned. High cache-read means good context reuse; high input with low output means inefficient prompting; balanced cascades indicate a healthy, compounding workflow.',
            },
            {
              question: 'What does high cache-read mean?',
              answer:
                'High cache-read means you are reusing context effectively via prompt caching. The model already has your context loaded and reads from cache instead of re-processing it as fresh input. This is the signature of an efficient operator — cache-read tokens are cheaper and they multiply your yield because they appear in the numerator of Υ = (cache_read × output) / input².',
            },
            {
              question: 'What does high input with low output mean?',
              answer:
                'It means you are sending a lot of fresh context but getting little signal back. This typically indicates verbose prompts, poorly structured context, or a model that is churning. The fix is to structure your inputs to be minimal, prune noisy context, and ensure your context window is stable so cache-read engages instead of fresh input.',
            },
            {
              question: 'What does a balanced cascade look like?',
              answer:
                'A balanced cascade has high cache-read (good context reuse), low input (small deltas on top of cache), and high output (productive model responses). The cache-write pillar shows early investment that converts to cache-read over time. This is the cascade shape of a TRANSMITTER-class operator.',
            },
            {
              question: 'How do I interpret my class tier?',
              answer:
                'Class tiers go from IGNITER (lowest) through SEEKER and BUILDER to TRANSMITTER (highest). IGNITERs have low yield — mostly fresh input, little cache reuse. SEEKERs are improving but inconsistent. BUILDERs have solid cache reuse and decent output. TRANSMITTERs have high cache-read, low input, and high output — the ideal cascade shape.',
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="How to Read Your Token Cascade"
        subtitle={
          <>
            Your cascade is a <span className="text-gold">diagnostic</span> — it tells you
            exactly what&rsquo;s working and what&rsquo;s broken in your AI coding workflow.
            Here&rsquo;s how to read it.
          </>
        }
      />

      {/* ── The cascade as a diagnostic ─────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The cascade as a diagnostic
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Your token cascade isn&rsquo;t just a score — it&rsquo;s a diagnostic tool. The
          four pillars are like blood panel results: each tells you something specific
          about your workflow&rsquo;s health. Read together, they tell you exactly what to
          fix. Run{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            sigrank me
          </code>{' '}
          or paste your ccusage JSON into the{' '}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score
          </Link>{' '}
          calculator to get your pillars, then use this guide to interpret them.
        </p>
      </section>

      {/* ── What each pillar reveals ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What each pillar reveals about your workflow
        </h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Input — your context injection rate</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Input reveals how much fresh context you inject per turn. High input means
              you&rsquo;re sending new context the model hasn&rsquo;t seen — either because
              your context window is unstable (cache breaks) or because you&rsquo;re
              re-pasting files unnecessarily. Low input means you&rsquo;re sending small
              deltas on top of a stable cached base.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Output — your signal production</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Output reveals how much signal the model produces per turn. High output means
              your prompts generate useful code efficiently. Low output with high input
              means the model is churning or your prompts are unfocused.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Cache-read — your context reuse</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache-read reveals how well you reuse context via prompt caching — the most
              diagnostic pillar. High cache-read means your context window is stable and
              the model reads from cache. Low cache-read means your cache breaks every turn.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Cache-write — your cache investment</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache-write reveals how much you&rsquo;re investing in future cache hits.
              High cache-write early that converts to cache-read later is a healthy,
              compounding cascade. High cache-write that never converts means your cache
              keeps breaking before it pays off.
            </p>
          </div>
        </div>
      </section>

      {/* ── What high cache-read means ──────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What high cache-read means (good context reuse)
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          High cache-read is the signature of an efficient operator. It means:
        </p>
        <ul className="flex flex-col gap-2">
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            Your <strong className="text-text-primary">context window is stable</strong> —
            you&rsquo;re not reordering context or changing the system prompt between turns.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            You&rsquo;re sending <strong className="text-text-primary">small deltas</strong>{' '}
            on top of a large cached base, not re-pasting full context.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            Your <strong className="text-text-primary">cache hit rate</strong> is high
            (above 80%) — you write to cache once and read from it many times.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            Your <strong className="text-text-primary">yield is high</strong> — cache-read
            is in the yield numerator, so high cache-read directly boosts Υ.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If your cache-read is high, keep doing what you&rsquo;re doing. The next lever is
          output — can you get even more signal per turn with better prompt structure?
        </p>
      </section>

      {/* ── What high input / low output means ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What high input / low output means (inefficient prompting)
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          High input with low output is the most common dysfunction — you&rsquo;re sending
          a lot of fresh context but the model isn&rsquo;t producing much signal. The usual
          culprits:
        </p>
        <ul className="flex flex-col gap-2">
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Verbose prompts</strong> —
            conversational padding, restated context, redundant instructions. The model
            processes 500 tokens to find the 20-token instruction buried inside.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Unstable context</strong> — your cache
            breaks every turn, so the model re-processes everything as fresh input but
            produces the same output it would have from cache.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Noisy context</strong> — your context
            window includes irrelevant files or instructions that dilute the signal. The
            model processes noise instead of signal.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Re-rolls</strong> — you regenerate from
            scratch instead of correcting, sending fresh input without advancing cache-read.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The fix: structure inputs to be minimal, stabilize your context window, and
          replace re-rolls with corrections. Each fix reduces input and increases output.
        </p>
      </section>

      {/* ── What balanced cascades look like ────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What balanced cascades look like
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A balanced cascade isn&rsquo;t about equal pillar counts — it&rsquo;s about the
          right <em>ratios</em>. The ideal cascade shape:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <ul className="flex flex-col gap-2">
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              <strong className="text-gold">High cache-read</strong> — the largest pillar.
              Most of your context is reused, not re-sent.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              <strong className="text-gold">Low input</strong> — the smallest pillar. You
              send only tiny deltas on top of cache.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              <strong className="text-gold">High output</strong> — the model generates
              substantial signal per turn.
            </li>
            <li className="font-sans text-sm leading-relaxed text-text-secondary">
              <strong className="text-gold">Moderate cache-write</strong> — early
              investment that converts to cache-read over time.
            </li>
          </ul>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In numbers: input 5,000, output 12,000, cache-read 40,000, cache-write 8,000.
          Cache-read dominates, input is minimal. Yield = (40,000 × 12,000) / 5,000² =
          19,200 — a BUILDER or TRANSMITTER-class cascade.
        </p>
      </section>

      {/* ── Class tier interpretation ───────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Class tier interpretation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Your class tier summarizes your cascade shape into a single label — a quick
          diagnostic and a target:
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">IGNITER</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Low yield. Mostly fresh input, little cache reuse. The cascade burns tokens,
              not compounds them. Focus: stabilize your context window.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">SEEKER</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Improving but inconsistent. Some cache reuse, but input still dominates. The
              cascade starts to compound but breaks frequently. Focus: maintain context
              stability.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">BUILDER</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Solid cache reuse and decent output. The cascade is compounding reliably.
              Input is controlled. Focus: increase output per turn with better prompt
              structure and batched tasks.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">TRANSMITTER</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              High cache-read, low input, high output — the ideal cascade shape. Signal
              compounds efficiently. Focus: maintain discipline and push yield higher.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What does the cascade tell me about my workflow?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The four pillars reveal how you manage context, how efficiently you prompt,
              and whether signal is compounding or being burned. It&rsquo;s a diagnostic —
              each pillar points to a specific aspect of your workflow.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What does high cache-read mean?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Good context reuse. Your context window is stable and the model reads from
              cache instead of re-processing fresh input. This is the signature of an
              efficient operator and directly boosts yield.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What does high input with low output mean?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Inefficient prompting. You&rsquo;re sending a lot but getting little back.
              Usually caused by verbose prompts, unstable context, noisy context, or
              re-rolls. Fix: structure inputs, stabilize context, replace re-rolls with
              corrections.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What does a balanced cascade look like?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              High cache-read (largest pillar), low input (smallest), high output, and
              moderate cache-write that converts to cache-read over time. Cache-read
              dominates, input is minimal, output is high.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I interpret my class tier?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              IGNITER (low yield, burning tokens) → SEEKER (improving, inconsistent cache)
              → BUILDER (solid reuse, decent output) → TRANSMITTER (ideal cascade shape,
              high yield). Use it as a diagnostic and a target.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
          {' · '}
          <Link href="/tools/cascade-comparator" className="text-gold underline underline-offset-2">
            Cascade Comparator
          </Link>
          {' · '}
          <Link href="/guides/how-to-track-token-cascade" className="text-gold underline underline-offset-2">
            Track Your Token Cascade
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
