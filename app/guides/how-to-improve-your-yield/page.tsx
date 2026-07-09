/**
 * app/guides/how-to-improve-your-yield/page.tsx
 *
 * SEO guide targeting "improve ai coding yield", "increase token efficiency",
 * and "better prompt caching". Explains what Υ Yield means and gives 7
 * concrete strategies to improve it, with before/after examples.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'How to Improve Your AI Coding Yield',
  description:
    'Seven concrete strategies to improve your \u03A5 Yield \u2014 better prompt caching, structured inputs, cache reuse, and fewer re-rolls. With before/after examples.',
  path: '/guides/how-to-improve-your-yield',
})

const howTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to improve your AI coding yield',
  description:
    'Seven strategies to increase your Υ Yield (token-cascade efficiency): better context windows, prompt caching, structured inputs, fewer re-rolls, cache reuse patterns, and more.',
  totalTime: 'PT20M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Measure your current yield',
      text: 'Run `sigrank me` or paste your ccusage JSON into /score to get your baseline Υ Yield. You cannot improve what you do not measure.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Build a stable context window',
      text: 'Keep your context window stable across turns so prompt caching engages. Avoid re-pasting files or reordering context between turns — cache-read only fires when prior context matches.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Structure your inputs',
      text: 'Use structured, minimal prompts. Remove redundant instructions. Send small deltas on top of cached context rather than re-sending the full context every turn.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Reduce re-rolls',
      text: 'Each re-roll sends fresh input and generates new output without advancing cache-read. Plan your prompt before sending to minimize wasted turns.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Re-measure and compare',
      text: 'After applying the strategies, run `sigrank me` again and compare your yield. Submit a new snapshot to update your leaderboard rank and class tier.',
    },
  ],
}

export default function HowToImproveYourYieldPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Guides', path: '/guides' },
            { name: 'Improve Your Yield', path: '/guides/how-to-improve-your-yield' },
          ]),
          faqPage([
            {
              question: 'What is Υ Yield?',
              answer:
                'Yield (Υ) = (cache_read × output) / input². It measures token-cascade efficiency — whether signal is compounding (high cache reuse × high output per fresh input) or tokens are being burned. High yield means your AI coding sessions are efficient; low yield means you are wasting fresh input tokens.',
            },
            {
              question: 'How can I improve my yield?',
              answer:
                'The highest-leverage strategies are: building a stable context window so prompt caching engages, sending small deltas instead of re-pasting full context, structuring inputs to be minimal, reducing re-rolls, and reusing cache patterns across sessions. Each strategy increases cache-read or decreases input — both raise yield.',
            },
            {
              question: 'What is prompt caching and why does it matter?',
              answer:
                'Prompt caching lets the model reuse previously-processed context instead of re-processing it. When your context window is stable across turns, the model reads from cache (cache-read) instead of re-reading fresh input. Cache-read tokens are cheaper and they multiply your yield because they appear in the numerator of Υ = (cache_read × output) / input².',
            },
            {
              question: 'How do I know if my yield improved?',
              answer:
                'Run `sigrank me` before and after applying the strategies, or use the /score calculator to compare. Submit a new snapshot with `sigrank submit` to update your leaderboard rank and class tier. Track your yield over 7-day, 30-day, 90-day, and all-time windows.',
            },
            {
              question: 'What yield is considered good?',
              answer:
                'A yield of 5,000 is solid. 50,000 is excellent. The top operators on the SigRank leaderboard push well into six figures. Your class tier (IGNITER → SEEKER → BUILDER → TRANSMITTER) is assigned from your yield and cascade shape.',
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="How to Improve Your AI Coding Yield"
        subtitle={
          <>
            Yield (Υ) is the headline metric of token-cascade efficiency. Here are{' '}
            <span className="text-gold">seven concrete strategies</span> to raise it — with
            before/after examples.
          </>
        }
      />

      {/* ── What Υ Yield means ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What Υ Yield means
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Yield (Υ)</strong> ={' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            (cache_read × output) / input²
          </code>
          . It measures the architecture of your token cascade — whether signal is
          compounding (high cache reuse × high output per fresh input) or tokens are being
          burned (low cache, high fresh input, low output).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The formula has three levers, and understanding them is the key to improvement:
        </p>
        <ul className="flex flex-col gap-2">
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Increase cache-read</strong> — reuse
            context via prompt caching. This is the highest-leverage lever because it
            appears in the numerator and enables cheaper turns.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Increase output</strong> — get more
            signal per turn. Better prompts produce more useful code per response.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Decrease input</strong> — send less fresh
            context. Input is squared in the denominator, so reducing it has an outsized
            effect on yield.
          </li>
        </ul>
      </section>

      {/* ── Strategy 1: Stable context windows ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 1 — Build a stable context window
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prompt caching only fires when prior context matches. If you reorder your
          context, re-paste files, or change the system prompt between turns, the cache
          invalidates and the model re-processes everything as fresh input. Keep your
          context window stable: same system prompt, same file order, same project
          preamble. Send only the <em>delta</em> — the new instruction or the changed
          file — on top of the cached base.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs font-bold text-gold">Before</p>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            Every turn: paste the full file, paste the system prompt, paste the project
            context, then add your instruction. Cache-read stays at zero. Input balloons.
            Yield tanks.
          </p>
          <p className="font-mono text-xs font-bold text-gold mt-3">After</p>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            Turn 1: send the full context (cache-write fires). Turn 2+: send only the
            changed lines and your instruction. Cache-read soars. Input shrinks. Yield
            climbs.
          </p>
        </div>
      </section>

      {/* ── Strategy 2: Prompt caching ──────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 2 — Engage prompt caching deliberately
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most platforms support prompt caching, but it engages automatically only when
          your context is stable and large enough to hit the cache threshold (typically
          1,024+ tokens on Claude). To engage it deliberately: front-load your stable
          context (project rules, file contents, coding standards) in the first turn, then
          keep it in the same position for every subsequent turn. The model will read from
          cache instead of re-processing.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Track your <strong className="text-text-primary">cache hit rate</strong> ={' '}
          cache_read / (cache_read + cache_write). A hit rate above 80% means your caching
          strategy is working. Below 50% means your context is churning.
        </p>
      </section>

      {/* ── Strategy 3: Structured inputs ───────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 3 — Use structured, minimal inputs
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Verbose prompts burn input tokens. A 500-token prompt that could be 50 tokens
          costs you 10× in the yield denominator (100× because input is squared). Structure
          your inputs: use bullet points, file references instead of pasted content, and
          concise instructions. Remove pleasantries, restated context, and redundant
          constraints the model already has in cache.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs font-bold text-gold">Before</p>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            &ldquo;Hey, so I have this function here and I was wondering if you could maybe
            look at it and see if there&rsquo;s a way to make it faster because it&rsquo;s
            kind of slow when I run it with large inputs and I think the problem might be
            in the nested loop but I&rsquo;m not sure...&rdquo; (80 tokens, zero signal
            density)
          </p>
          <p className="font-mono text-xs font-bold text-gold mt-3">After</p>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            &ldquo;Optimize the nested loop in `processBatch` — it&rsquo;s O(n²). Target
            O(n log n).&rdquo; (15 tokens, same intent, 5× less input, 25× less penalty in
            the yield denominator)
          </p>
        </div>
      </section>

      {/* ── Strategy 4: Fewer re-rolls ──────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 4 — Reduce re-rolls
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every re-roll sends fresh input and generates new output without advancing
          cache-read. Three re-rolls on the same task triples your input and output without
          increasing your effective signal. Plan your prompt before sending. If the
          response is wrong, <em>correct</em> it with a small delta on top of cached
          context rather than re-rolling from scratch.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A correction (&ldquo;No, I meant the second function, not the first&rdquo;) is a
          small input delta on top of cache. A re-roll (&ldquo;Try again&rdquo;) is a full
          fresh input with no cache benefit. Corrections compound; re-rolls burn.
        </p>
      </section>

      {/* ── Strategy 5: Cache reuse patterns ────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 5 — Reuse cache across sessions
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If your platform supports cross-session caching (Claude Code does), keep the same
          project context loaded across sessions. The cache persists, and your first turn
          in a new session can hit cache-read immediately instead of starting from zero.
          This is especially powerful for long-running projects where the codebase context
          is stable.
        </p>
      </section>

      {/* ── Strategy 6: Batch related tasks ─────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 6 — Batch related tasks in one turn
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Instead of sending three separate prompts for three related changes, batch them
          into one turn. The model processes the context once (from cache) and produces
          all three outputs in a single response. You get more output per unit of input,
          and cache-read stays high because the context didn&rsquo;t change between
          sub-tasks.
        </p>
      </section>

      {/* ── Strategy 7: Prune noisy context ─────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Strategy 7 — Prune noisy context
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Context that isn&rsquo;t relevant to the current task dilutes your signal. If
          your context window includes files the model doesn&rsquo;t need, it still
          processes them — either as fresh input (bad) or as cache-read that doesn&rsquo;t
          contribute to output (wasted cache). Prune your context to only what&rsquo;s
          relevant. Smaller, focused context means higher output per input token.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Track your <strong className="text-text-primary">signal-to-noise ratio
          (SNR)</strong> = signal tokens / total tokens. A high SNR means your context is
          focused; a low SNR means you&rsquo;re carrying noise.
        </p>
      </section>

      {/* ── Before/after summary ────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Before/after: the full picture
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs font-bold text-gold">Before</p>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            Unstable context, verbose prompts, 3 re-rolls per task, full re-paste every
            turn. Input: 50,000. Output: 8,000. Cache-read: 2,000. Yield = (2,000 × 8,000)
            / 50,000² = <span className="text-text-muted">0.0064</span>
          </p>
          <p className="font-mono text-xs font-bold text-gold mt-3">After</p>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            Stable context, minimal deltas, corrections instead of re-rolls, pruned
            context. Input: 5,000. Output: 12,000. Cache-read: 40,000. Yield = (40,000 ×
            12,000) / 5,000² = <span className="text-gold">19,200</span>
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That&rsquo;s a <strong className="text-text-primary">3-million-fold</strong>{' '}
          improvement in yield — from the same operator, same model, same project. The
          cascade architecture changed; the raw effort didn&rsquo;t.
        </p>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">What is Υ Yield?</dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Υ = (cache_read × output) / input². It measures token-cascade efficiency —
              whether signal is compounding or tokens are being burned. High yield means
              efficient sessions; low yield means wasted fresh input.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">How can I improve my yield?</dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Build a stable context window, engage prompt caching, structure inputs to be
              minimal, reduce re-rolls, reuse cache across sessions, batch related tasks,
              and prune noisy context. Each strategy increases cache-read or decreases
              input — both raise yield.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is prompt caching and why does it matter?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Prompt caching lets the model reuse previously-processed context. When your
              context is stable, the model reads from cache instead of re-processing fresh
              input. Cache-read tokens are cheaper and multiply your yield.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I know if my yield improved?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Run `sigrank me` before and after, or use the /score calculator. Submit a new
              snapshot to update your leaderboard rank and class tier. Track across 7d,
              30d, 90d, and all-time windows.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">What yield is considered good?</dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              5,000 is solid. 50,000 is excellent. Top operators push into six figures.
              Your class tier (IGNITER → SEEKER → BUILDER → TRANSMITTER) is assigned from
              yield and cascade shape.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/tools/yield-calculator" className="text-gold underline underline-offset-2">
            Yield Calculator
          </Link>
          {' · '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
          {' · '}
          <Link href="/guides/how-to-read-your-cascade" className="text-gold underline underline-offset-2">
            Read Your Cascade
          </Link>
        </p>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Next:{' '}
          <Link
            href="/guides/how-to-reduce-token-waste"
            className="text-gold underline underline-offset-2"
          >
            How to Reduce Token Waste →
          </Link>
        </p>
      </section>
    </div>
  )
}
