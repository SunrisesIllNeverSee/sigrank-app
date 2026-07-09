/**
 * app/token-telemetry/page.tsx — "Token Telemetry — Measuring AI Coding Activity"
 *
 * Topic hub for the token-telemetry category. Aggregates the four pillars,
 * the privacy argument for token counts over prompt content, and links out
 * to the metric pages, the cascade-tracking guide, and the yield calculator.
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
  title: 'Token Telemetry — Measuring AI Coding Activity',
  description:
    'Token telemetry measures AI coding activity privately. Four pillars \u2014 input, output, cache-read, cache-write \u2014 capture the cascade without reading prompts.',
  path: '/token-telemetry',
})

const PILLARS = [
  {
    name: 'Input',
    glyph: '→',
    desc: 'Fresh tokens you send to the model. The cost side of the cascade — every input token is a spend.',
  },
  {
    name: 'Output',
    glyph: '←',
    desc: 'Tokens the model generates back. The return side — what you actually keep from the exchange.',
  },
  {
    name: 'Cache-read',
    glyph: '↻',
    desc: 'Cached tokens reused from prior context via prompt caching. The compounding layer — signal you already paid for, served again for free.',
  },
  {
    name: 'Cache-write',
    glyph: '✎',
    desc: 'New tokens written to cache for future reuse. An investment in the next turn — you pay now to compound later.',
  },
]

const RELATED = [
  {
    href: '/metrics/yield-cascade',
    title: 'Yield (Υ) Cascade',
    desc: 'The headline metric: cache_read × output / input². Measures the architecture of your token cascade.',
  },
  {
    href: '/metrics/compression-ratio',
    title: 'Compression Ratio',
    desc: 'Output divided by input — how much you get back per token you put in.',
  },
  {
    href: '/metrics/signal-to-noise-ratio',
    title: 'Signal-to-Noise Ratio (SNR)',
    desc: 'Signal tokens over total tokens — the density of useful output in your cascade.',
  },
  {
    href: '/metrics/cache-hit-rate',
    title: 'Cache Hit Rate',
    desc: 'How well you reuse cached context: cache_read / (cache_read + cache_write).',
  },
  {
    href: '/metrics/leverage',
    title: 'Leverage',
    desc: 'cache_read / input — how much cached context amplifies your fresh input.',
  },
  {
    href: '/metrics/velocity',
    title: 'Velocity',
    desc: 'output / session_time — tokens produced per unit of wall-clock time.',
  },
  {
    href: '/guides/how-to-track-token-cascade',
    title: 'How to Track Your Token Cascade',
    desc: 'A step-by-step guide to capturing the four pillars from your AI coding sessions.',
  },
  {
    href: '/tools/yield-calculator',
    title: 'Yield Calculator',
    desc: 'Paste your token stats and see your Υ Yield, class tier, and compression ratio instantly.',
  },
]

export default function TokenTelemetryPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Token Telemetry', path: '/token-telemetry' },
          ]),
          faqPage([
            {
              question: 'What is token telemetry?',
              answer:
                'Token telemetry is the measurement of AI coding activity through four token counts — input, output, cache-read, and cache-write — captured on-device. It records how many tokens flowed through your AI coding sessions without ever reading the content of your prompts or the model\'s responses.',
            },
            {
              question: 'Why token counts instead of prompt content?',
              answer:
                'Token counts are the privacy-preserving unit of measurement. Four integers (input, output, cache_read, cache_write) fully describe the architecture of a token cascade — whether signal is compounding or tokens are burning — without revealing a single word of what you typed or what the model returned. No message content is ever read, transmitted, or stored.',
            },
            {
              question: 'What are the four token pillars?',
              answer:
                'The four pillars are input (fresh tokens sent to the model), output (tokens the model generates back), cache-read (cached tokens reused from prior context via prompt caching), and cache-write (new tokens written to cache for future reuse). Together they describe the full flow of tokens through an AI coding session.',
            },
            {
              question: 'How do I collect token telemetry?',
              answer:
                'Install the SigRank CLI (npm install -g sigrank) and run sigrank enroll. The on-device scanner reads token counts from your AI coding logs locally — it bundles ccusage for Claude Code logs — computes the cascade metrics, and publishes an ed25519-signed snapshot to the leaderboard. No message content leaves your machine.',
            },
            {
              question: 'Is token telemetry private?',
              answer:
                'Yes. The scanner reads token counts and content lengths only — never the words of your prompts. Only the resulting numeric scores, signed with ed25519, leave your device. Snapshots are verified server-side with replay and plausibility guards, but the verification operates on integers, not text.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="TELEMETRY"
        title="Token Telemetry — Measuring AI Coding Activity"
        subtitle={
          <>
            The privacy-preserving unit of measurement for AI coding. Four
            integers capture the full{' '}
            <span className="text-gold">token cascade</span> — without reading
            a single word of your prompts.
          </>
        }
      />

      {/* ── What token telemetry is ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What token telemetry is
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token telemetry is the on-device measurement of AI coding activity
          through token counts. Every interaction with an AI coding tool — a
          prompt sent to Claude, a completion from Copilot, a chat turn in
          Cursor — moves tokens through a cascade: you send some in, the model
          sends some back, and prompt caching reuses or writes context for the
          next turn. Telemetry records the counts at each stage. Four numbers,
          per session, per platform. That is the entire data layer.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          It is the foundation everything else in SigRank is built on. Without
          telemetry there are no metrics, no leaderboard, no operator scoring.
          With it, you get a complete, privacy-preserving picture of how
          efficiently you drive your AI tools — measured not in hours or
          keystrokes, but in the actual currency of LLM compute: tokens.
        </p>
      </section>

      {/* ── The four pillars ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The four pillars
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every token in an AI coding session falls into exactly one of four
          buckets. Together they describe the full flow of the cascade.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.name}
              className="rounded-lg border border-bg-border bg-bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg text-gold">{p.glyph}</span>
                <h3 className="font-mono text-sm font-bold text-text-primary">
                  {p.name}
                </h3>
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why token counts, not prompt content ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why token counts, not prompt content
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The central privacy design choice in SigRank is this: measure the
          counts, never the content. Four integers — input, output,
          cache_read, cache_write — fully describe the architecture of a token
          cascade. They tell you whether signal is compounding (high cache
          reuse, high output per fresh input) or tokens are burning (low
          cache, low output). You do not need a single word of the prompt or
          the response to know that.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is what makes token telemetry privacy-preserving by
          construction. The scanner reads counts and content lengths locally.
          Only the resulting numeric scores, signed with ed25519, leave your
          device. Server-side verification operates on integers — replay
          guards, plausibility checks — never on text. Your prompts, your
          code, your conversation history never leave your machine.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The tradeoff is deliberate: you give up the ability to analyze what
          someone said to their AI, and in exchange you get a measurement
          system that is safe enough to run continuously, across 15+ platforms,
          and publish to a public leaderboard. Token counts are the unit that
          makes a global operator ranking possible without a privacy scandal.
        </p>
      </section>

      {/* ── Related pages ── */}
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
              What is token telemetry?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The on-device measurement of AI coding activity through four
              token counts — input, output, cache-read, and cache-write. It
              records how many tokens flowed through your sessions without ever
              reading the content of your prompts or the model&apos;s
              responses.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why token counts instead of prompt content?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Four integers fully describe the architecture of a token cascade
              without revealing a single word. Token counts are the
              privacy-preserving unit that makes a global, continuous operator
              ranking possible without reading anyone&apos;s prompts.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are the four token pillars?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Input (fresh tokens sent), output (tokens generated back),
              cache-read (cached tokens reused from prior context), and
              cache-write (new tokens written to cache for future reuse).
              Together they describe the full flow of tokens through a session.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I collect token telemetry?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Install the SigRank CLI (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">npm install -g sigrank</code>),
              run <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">sigrank enroll</code>,
              and submit a snapshot. The on-device scanner reads token counts
              locally and publishes a signed snapshot. No message content
              leaves your machine.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is token telemetry private?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yes. The scanner reads token counts and content lengths only —
              never the words of your prompts. Only ed25519-signed numeric
              scores leave your device, and server-side verification operates
              on integers, not text.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
