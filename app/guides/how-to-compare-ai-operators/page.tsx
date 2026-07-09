/**
 * app/guides/how-to-compare-ai-operators/page.tsx
 *
 * SEO guide targeting "compare ai operators", "ai operator comparison",
 * and "developer productivity comparison". Explains why comparing operators
 * (not models) matters, the SigRank compare tool, what metrics to compare,
 * how to read a comparison, and benchmarking against the field.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'How to Compare AI Operators',
  description:
    'A guide to comparing AI operators \u2014 not models. Compare yield, cache hit rate, leverage, and class tier, and benchmark against the field.',
  path: '/guides/how-to-compare-ai-operators',
})

const howTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to compare AI operators with SigRank',
  description:
    'Use the SigRank compare tool to benchmark operators head-to-head on yield, cache hit rate, leverage, and class tier. Learn what each metric reveals about workflow differences.',
  totalTime: 'PT5M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Find operators to compare',
      text: 'Browse the SigRank leaderboard to find operators in your class tier or one tier above. Note their codenames for the compare tool.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Open the compare tool',
      text: 'Go to /compare and enter two or more operator codenames. The tool renders a side-by-side cascade comparison.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Compare the four metrics',
      text: 'Compare yield, cache hit rate, leverage, and class tier. Each metric reveals a different aspect of the operator workflow — not just who is better, but why.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Study the cascade shape',
      text: 'Look at the four-pillar ratios. A higher cache-read to input ratio means better context reuse. A higher output to input ratio means more efficient prompting.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Apply what you learned',
      text: 'Identify the workflow difference that drives the yield gap. If the other operator has higher cache hit rate, focus on context stability. If higher compression ratio, focus on prompt structure.',
    },
  ],
}

export default function HowToCompareAIOperatorsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Guides', path: '/guides' },
            { name: 'Compare AI Operators', path: '/guides/how-to-compare-ai-operators' },
          ]),
          faqPage([
            {
              question: 'Why compare operators instead of models?',
              answer:
                'SigRank scores the human driving the AI, not the AI model itself. Two operators using the same model can have vastly different yields because their workflow — context management, prompt structure, cache reuse — is what determines efficiency. Comparing operators reveals workflow differences; comparing models only reveals model differences, which are already well-covered by LMSYS Chatbot Arena.',
            },
            {
              question: 'What is the SigRank compare tool?',
              answer:
                'The SigRank compare tool (/compare) renders a side-by-side cascade comparison of two or more operators. It shows yield, cache hit rate, leverage, compression ratio, class tier, and the four-pillar ratios so you can see not just who is more efficient but why.',
            },
            {
              question: 'What metrics should I compare?',
              answer:
                'Compare yield (overall efficiency), cache hit rate (context reuse quality), leverage (cache amplification of input), compression ratio (output per input), and class tier (performance band). Each metric reveals a different aspect of the operator workflow.',
            },
            {
              question: 'How do I read a comparison?',
              answer:
                'Start with yield — it is the headline. Then look at the four-pillar ratios to understand why. A higher cache-read to input ratio means better context reuse. A higher output to input ratio means more efficient prompting. The class tier gives you a quick summary of where each operator stands.',
            },
            {
              question: 'How do I benchmark myself against the field?',
              answer:
                'Submit your snapshot to the leaderboard with `sigrank submit`, then check your global rank and class tier. Use the compare tool to benchmark yourself head-to-head against operators one tier above you. Study their cascade shape to identify what they do differently.',
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="How to Compare AI Operators"
        subtitle={
          <>
            The model matters less than you think. The{' '}
            <span className="text-gold">operator</span> — the human driving the AI — is
            where efficiency lives. Here&rsquo;s how to compare them.
          </>
        }
      />

      {/* ── Why comparing operators (not models) matters ───────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Why comparing operators (not models) matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          When people talk about &ldquo;AI coding performance,&rdquo; they usually mean
          model performance. LMSYS Chatbot Arena ranks models by human preference. But
          model benchmarks tell you which AI is best — not who drives it best. Two
          operators using the exact same model, the exact same platform, can have yields
          that differ by orders of magnitude. The difference isn&rsquo;t the model.
          It&rsquo;s the <strong className="text-text-primary">operator</strong>.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An operator with a stable context window, minimal prompts, and deliberate cache
          reuse will outperform an operator who re-pastes files every turn — regardless of
          whether they&rsquo;re on Claude, GPT, or Gemini. The cascade architecture is a
          function of the operator&rsquo;s workflow, not the model&rsquo;s capabilities.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That&rsquo;s why SigRank ranks operators, not models. When you compare operators,
          you&rsquo;re comparing workflows — and workflows are what you can actually
          change. You can&rsquo;t upgrade the model, but you can restructure your context
          window today.
        </p>
      </section>

      {/* ── The SigRank compare tool ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The SigRank compare tool
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The{' '}
          <Link href="/compare" className="text-gold underline underline-offset-2">
            compare tool
          </Link>{' '}
          renders a side-by-side cascade comparison of two or more operators. You enter
          codenames from the leaderboard and get a full breakdown: yield, cache hit rate,
          leverage, compression ratio, class tier, and the four-pillar ratios. It shows
          you not just <em>who</em> is more efficient but <em>why</em>.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The compare tool is platform-neutral — you can compare a Claude Code operator
          against a Cursor operator, because the four pillars are the same across all
          platforms. The comparison is about the operator&rsquo;s cascade architecture,
          not the tool they happen to use.
        </p>
      </section>

      {/* ── What metrics to compare ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What metrics to compare
        </h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Υ Yield</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The headline. Overall cascade efficiency. Start here — it tells you who is
              more efficient. Then dig into the other metrics to understand why.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Cache Hit Rate</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              cache_read / (cache_read + cache_write). How well each operator reuses
              context. A higher hit rate means better context stability. This is the metric
              that most directly reflects context window management.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Leverage</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              cache_read / input. How much cached context amplifies fresh input. High
              leverage means the operator sends small deltas on a large cached base — the
              hallmark of an efficient workflow.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Compression Ratio</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              output / input. How much signal each operator gets per fresh input token.
              High compression means concise, high-signal prompting. Low compression means
              verbose prompts or wasted input.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Class Tier</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              IGNITER → SEEKER → BUILDER → TRANSMITTER. The performance band assigned from
              yield and cascade shape. A quick summary of where each operator stands
              relative to the field.
            </p>
          </div>
        </div>
      </section>

      {/* ── How to read a comparison ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to read a comparison
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Start with yield — it&rsquo;s the headline. If one operator has a yield of 50,000
          and the other has 5,000, there&rsquo;s a 10× gap. But yield alone doesn&rsquo;t
          tell you what to change. Dig into the four-pillar ratios:
        </p>
        <ul className="flex flex-col gap-3">
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              Higher cache-read, lower input
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The operator has a stable context window and sends small deltas. This is the
              most common yield driver. To close the gap: stabilize your context and stop
              re-pasting.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              Higher output, similar input
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The operator gets more signal per turn — better prompt structure, more
              focused tasks. To close the gap: structure your inputs and batch related
              tasks.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              Higher leverage (cache_read / input)
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The operator&rsquo;s cached context amplifies their fresh input more. They&rsquo;ve
              built a large cached base and send tiny deltas on top. To close the gap:
              invest in cache-write early, then maintain context stability.
            </p>
          </li>
        </ul>
      </section>

      {/* ── Benchmarking against the field ──────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Benchmarking yourself against the field
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Submitting your snapshot to the{' '}
          <Link href="/board/all" className="text-gold underline underline-offset-2">
            leaderboard
          </Link>{' '}
          gives you a global rank and class tier. But the real value of external
          benchmarking is finding operators one tier above you and studying their cascade.
        </p>
        <ol className="flex flex-col gap-4">
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 1 — Find your tier</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Check your class tier on the leaderboard. If you&rsquo;re a SEEKER, look for
              BUILDERs. If you&rsquo;re a BUILDER, look for TRANSMITTERs.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 2 — Compare head-to-head</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Use the compare tool to put yourself side-by-side with an operator one tier
              above. Look at the metric where the gap is largest — that&rsquo;s your
              highest-leverage improvement area.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 3 — Close the gap</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Apply the workflow change that addresses the gap. If their cache hit rate is
              higher, focus on context stability. If their compression ratio is higher,
              focus on prompt structure. Re-measure after a week.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 4 — Repeat</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Once you close one gap, find the next operator above you and repeat.
              Benchmarking is iterative — each comparison reveals the next improvement.
            </p>
          </li>
        </ol>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why compare operators instead of models?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              SigRank scores the human driving the AI, not the AI model. Two operators on
              the same model can have vastly different yields because their workflow
              determines efficiency. Comparing operators reveals workflow differences you
              can actually change.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the SigRank compare tool?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The /compare tool renders a side-by-side cascade comparison of operators —
              yield, cache hit rate, leverage, compression ratio, class tier, and
              four-pillar ratios. Platform-neutral: compare across Claude, Cursor, Copilot,
              and more.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What metrics should I compare?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yield (overall efficiency), cache hit rate (context reuse), leverage (cache
              amplification), compression ratio (output per input), and class tier
              (performance band). Each reveals a different aspect of the workflow.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I read a comparison?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Start with yield, then dig into the four-pillar ratios. Higher cache-read +
              lower input = better context reuse. Higher output + similar input = better
              prompting. The ratios tell you what to change.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I benchmark against the field?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Submit to the leaderboard, check your rank and tier, then use the compare
              tool against operators one tier above you. Study their cascade, close the
              gap, and repeat.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/compare" className="text-gold underline underline-offset-2">
            Compare Operators
          </Link>
          {' · '}
          <Link href="/tools/cascade-comparator" className="text-gold underline underline-offset-2">
            Cascade Comparator
          </Link>
          {' · '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
        </p>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Next:{' '}
          <Link
            href="/guides/how-to-read-your-cascade"
            className="text-gold underline underline-offset-2"
          >
            How to Read Your Cascade →
          </Link>
        </p>
      </section>
    </div>
  )
}
