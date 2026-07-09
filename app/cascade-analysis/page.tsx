/**
 * app/cascade-analysis/page.tsx — "Cascade Analysis — Understanding Token
 * Flow"
 *
 * Topic hub for the cascade-analysis category. Explains what a token
 * cascade is, how to read your cascade, what each pillar reveals,
 * diagnostic patterns, and links to the cascade-reading guide, the metric
 * pages, and the cascade comparator tool.
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
  title: 'Cascade Analysis — Understanding Token Flow',
  description:
    'Cascade analysis studies token flow through AI coding sessions. What a cascade is, how to read yours, and patterns separating signal from burning tokens.',
  path: '/cascade-analysis',
})

const PATTERNS = [
  {
    name: 'The Compounder',
    signal: 'High cache-read, low input, high output',
    read: 'Signal is compounding. You reuse cached context well and send minimal fresh input. This is the TRANSMITTER pattern — the cascade architecture yield rewards.',
  },
  {
    name: 'The Burner',
    signal: 'High input, low cache-read, low output',
    read: 'Tokens are burning. You send large fresh prompts without reusing context and get thin output back. Yield is low. Cut input, build cache, reuse context.',
  },
  {
    name: 'The Echo',
    signal: 'High input, high output, low cache-read',
    read: 'The model is parroting your input back. Compression ratio may look fine, but without cache reuse the cascade is not compounding. Yield stays flat because input² punishes the spend.',
  },
  {
    name: 'The Hoarder',
    signal: 'High cache-write, low cache-read, low output',
    read: 'You are writing context to cache but never reading it back. The investment is not paying off. Either the cached context is not reusable or you are not structuring turns to recall it.',
  },
]

const RELATED = [
  {
    href: '/guides/how-to-read-your-cascade',
    title: 'How to Read Your Cascade',
    desc: 'A step-by-step guide to interpreting your four token pillars, spotting diagnostic patterns, and turning the numbers into action.',
  },
  {
    href: '/metrics/yield-cascade',
    title: 'Yield (Υ) Cascade',
    desc: 'The headline metric that summarizes cascade architecture: cache_read × output / input².',
  },
  {
    href: '/metrics/cache-hit-rate',
    title: 'Cache Hit Rate',
    desc: 'How well you reuse cached context — the difference between compounding and hoarding.',
  },
  {
    href: '/metrics/leverage',
    title: 'Leverage',
    desc: 'How much cached context amplifies your fresh input — the compounding multiplier.',
  },
  {
    href: '/metrics/compression-ratio',
    title: 'Compression Ratio',
    desc: 'Output over input — whether the model is doing more with your input than echoing it.',
  },
  {
    href: '/metrics/signal-to-noise-ratio',
    title: 'Signal-to-Noise Ratio (SNR)',
    desc: 'The density of useful output in your cascade — signal tokens over total tokens.',
  },
  {
    href: '/metrics/velocity',
    title: 'Velocity',
    desc: 'Tokens produced per unit time — the throughput lens on the cascade.',
  },
  {
    href: '/tools/cascade-comparator',
    title: 'Cascade Comparator',
    desc: 'Compare two operators\' token cascades side by side — see where the yield gap comes from.',
  },
  {
    href: '/token-telemetry',
    title: 'Token Telemetry',
    desc: 'How the four token pillars are captured on-device from real coding sessions — the data layer that makes cascade analysis possible.',
  },
]

export default function CascadeAnalysisPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Cascade Analysis', path: '/cascade-analysis' },
          ]),
          faqPage([
            {
              question: 'What is a token cascade?',
              answer:
                'A token cascade is the flow of tokens through an AI coding session. Every turn moves tokens through four stages: fresh input you send to the model, output the model generates back, cache-read tokens reused from prior context, and cache-write tokens written to cache for future reuse. The cascade is the full picture of how tokens enter, circulate, and leave a session.',
            },
            {
              question: 'What is cascade analysis?',
              answer:
                'Cascade analysis is the study of token flow through AI coding sessions. By reading the four token pillars — input, output, cache-read, cache-write — you can diagnose whether signal is compounding (high cache reuse, high output per input) or tokens are burning (high input, low cache, low output). The yield metric Υ = cache_read × output / input² summarizes the architecture in one number.',
            },
            {
              question: 'How do I read my token cascade?',
              answer:
                'Look at the four pillars together. High cache-read with low input and high output means you are compounding — the ideal pattern. High input with low cache-read and low output means you are burning tokens. High cache-write with low cache-read means you are hoarding context you never reuse. The diagnostic patterns on this page map the common shapes.',
            },
            {
              question: 'What does each token pillar reveal?',
              answer:
                'Input reveals your spend — how many fresh tokens you are sending. Output reveals your return — how many tokens the model generates back. Cache-read reveals your compounding — how much prior context you are reusing for free. Cache-write reveals your investment — how much context you are storing for future turns. Together they describe the full cascade architecture.',
            },
            {
              question: 'What is the difference between a compounding cascade and a burning cascade?',
              answer:
                'A compounding cascade has high cache-read (reusing context), low input (minimal fresh spend), and high output (dense return). A burning cascade has high input, low cache-read, and low output — you spend a lot, reuse nothing, and get little back. Yield is high for the first and low for the second. The difference is the architecture of the cascade, not the model.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="CASCADE"
        title="Cascade Analysis — Understanding Token Flow"
        subtitle={
          <>
            Every AI coding session moves tokens through a{' '}
            <span className="text-gold">cascade</span>. Learn to read the
            flow — and tell compounding signal from burning tokens.
          </>
        }
      />

      {/* ── What a token cascade is ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What a token cascade is — the architecture
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A token cascade is the flow of tokens through an AI coding session.
          Every turn moves tokens through four stages: you send fresh{' '}
          <strong className="text-text-primary">input</strong> to the model,
          the model generates{' '}
          <strong className="text-text-primary">output</strong> back,{' '}
          <strong className="text-text-primary">cache-read</strong> tokens
          are reused from prior context via prompt caching, and{' '}
          <strong className="text-text-primary">cache-write</strong> tokens
          are written to cache for future reuse. The cascade is the full
          picture of how tokens enter, circulate, and leave the session.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The metaphor is deliberate: tokens cascade like water through a
          series of pools. Some pools compound — cached context flows back
          into the next turn, amplifying a small fresh input into large
          output. Other pools drain — fresh input pours in, nothing is
          reused, and thin output trickles out. Cascade analysis is the art
          of reading which kind of cascade you have.
        </p>
      </section>

      {/* ── How to read your cascade ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to read your cascade
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Read the four pillars together, never in isolation. A high input
          number is bad if cache-read is low (you are spending without
          compounding) but fine if cache-read is also high (you are sending
          fresh input on top of a large cached foundation). A high output
          number is good only if it is dense — SNR tells you that. The yield
          metric Υ = cache_read × output / input² is the synthesis: it
          rewards high cache reuse and high output while punishing high fresh
          input. If your yield is low, the four pillars tell you why.
        </p>
      </section>

      {/* ── What each pillar reveals ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What each pillar reveals
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <h3 className="font-mono text-sm font-bold text-gold">Input → Spend</h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              How many fresh tokens you are sending. The cost side. High input
              without cache reuse means you are paying full price every turn.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <h3 className="font-mono text-sm font-bold text-gold">Output ← Return</h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              How many tokens the model generates back. The return side. High
              output is good — but only if it is dense (check SNR).
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <h3 className="font-mono text-sm font-bold text-gold">Cache-read ↻ Compounding</h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              How much prior context you are reusing for free. The compounding
              layer. High cache-read is the hallmark of a healthy cascade.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <h3 className="font-mono text-sm font-bold text-gold">Cache-write ✎ Investment</h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              How much context you are storing for future turns. An
              investment. It only pays off if you read it back — check
              cache-read.
            </p>
          </div>
        </div>
      </section>

      {/* ── Diagnostic patterns ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Diagnostic patterns
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The four pillars combine into recognizable shapes. Here are the
          four most common — and what each one tells you.
        </p>
        <div className="flex flex-col gap-3">
          {PATTERNS.map((p) => (
            <div
              key={p.name}
              className="rounded-lg border border-bg-border bg-bg-surface p-5"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-mono text-sm font-bold text-text-primary">
                  {p.name}
                </h3>
                <code className="rounded bg-bg-elevated px-2 py-1 font-mono text-xs text-gold">
                  {p.signal}
                </code>
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                {p.read}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore the category
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RELATED.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
            >
              <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
                {r.title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
                {r.desc}
              </p>
            </Link>
          ))}
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
              What is a token cascade?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The flow of tokens through an AI coding session across four
              stages: input, output, cache-read, and cache-write. The cascade
              is the full picture of how tokens enter, circulate, and leave a
              session.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is cascade analysis?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The study of token flow through sessions. By reading the four
              pillars you diagnose whether signal is compounding or tokens are
              burning. Yield (Υ) summarizes the architecture in one number.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I read my cascade?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Read the four pillars together. High cache-read + low input +
              high output = compounding. High input + low cache-read + low
              output = burning. The diagnostic patterns on this page map the
              common shapes.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What does each pillar reveal?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Input reveals spend, output reveals return, cache-read reveals
              compounding, and cache-write reveals investment. Together they
              describe the full cascade architecture.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Compounding vs. burning cascade?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              A compounding cascade has high cache-read, low input, high
              output. A burning cascade has high input, low cache-read, low
              output. Yield is high for the first, low for the second. The
              difference is architecture, not model.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
