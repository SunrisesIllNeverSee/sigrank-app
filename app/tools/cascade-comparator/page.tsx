import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'
import { CascadeComparator } from './CascadeComparator'

export const metadata: Metadata = withOG({
  title: 'Cascade Comparator — Compare Two AI Token Cascades',
  description:
    'Free AI metrics comparison tool. Enter two sets of token pillars and compare yield, compression ratio, cache hit rate, and leverage side by side.',
  path: '/tools/cascade-comparator',
})

const FAQS = [
  {
    question: 'What does the Cascade Comparator do?',
    answer:
      'It takes two sets of four token pillars (input, output, cache-read, cache-write) — call them A and B — and computes yield, compression ratio, cache hit rate, and leverage for each, flagging which cascade has the edge on every metric.',
  },
  {
    question: 'How is this different from the /compare page?',
    answer:
      'The /compare page compares two ranked operators from the leaderboard (radars, history, signed snapshots). This comparator is a quick raw-cascade diagnostic: paste any two sets of token counts and see the metric deltas instantly, no account or leaderboard entry required.',
  },
  {
    question: 'Which metrics matter most when comparing cascades?',
    answer:
      'Υ Yield is the headline — it captures cache reuse and output density in one number. Cache hit rate shows how well context is reused, and leverage shows how much cached context amplifies fresh input. Compression ratio rounds out the picture of output-per-input.',
  },
  {
    question: 'Can I compare cascades from different AI platforms?',
    answer:
      'Yes. The four token pillars are platform-neutral — Claude, ChatGPT, Gemini, Copilot, Cursor and 15+ platforms all expose equivalent counts. Comparing cascades across platforms is exactly how cross-platform operator efficiency is measured.',
  },
]

export default function CascadeComparatorPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Tools', path: '/tools' },
            { name: 'Cascade Comparator', path: '/tools/cascade-comparator' },
          ]),
          faqPage(FAQS),
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'SigRank Cascade Comparator',
            url: 'https://signalaf.com/tools/cascade-comparator',
            description:
              'Compare two AI token cascades side by side. Enter two sets of four token pillars to see yield, compression ratio, cache hit rate, and leverage for each, with the winning cascade flagged per metric.',
            applicationCategory: 'CalculatorApplication',
            operatingSystem: 'Any (web browser)',
            browserRequirements: 'Requires JavaScript',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            featureList: [
              'Side-by-side yield comparison',
              'Compression ratio comparison',
              'Cache hit rate comparison',
              'Leverage comparison',
            ],
          },
        ]}
      />

      <WaveHero
        eyebrow="◈ Cascade Comparator"
        title="Cascade Comparator"
        subtitle={
          <>
            Two token cascades, side by side. See which one{' '}
            <span className="text-gold">compounds</span> and which one burns — across
            yield, compression, cache hit rate, and leverage.
          </>
        }
      />

      <CascadeComparator />

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          Reading the comparison
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Each row flags the cascade with the edge. <strong className="text-text-primary">Υ Yield</strong>{' '}
          is the headline — it folds cache reuse and output density into one number, so a
          cascade can win on raw output yet lose on yield if it re-sends fresh context every
          turn. <strong className="text-text-primary">Cache hit rate</strong> and{' '}
          <strong className="text-text-primary">leverage</strong> reveal whether the edge comes
          from reusing context or from denser output. Read them together: a high-yield cascade
          with low leverage is output-dense but cache-poor; a high-yield cascade with high
          leverage is the compounding ideal.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">{f.question}</h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/compare" className="text-gold underline underline-offset-2">
            Compare Operators
          </Link>
          {' · '}
          <Link href="/tools/yield-calculator" className="text-gold underline underline-offset-2">
            Yield Calculator
          </Link>
          {' · '}
          <Link href="/guides/how-to-read-your-cascade" className="text-gold underline underline-offset-2">
            Read Your Cascade
          </Link>
        </p>
      </section>
    </div>
  )
}
