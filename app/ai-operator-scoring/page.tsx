/**
 * app/ai-operator-scoring/page.tsx — "AI Operator Scoring — The New
 * Performance Layer"
 *
 * Topic hub for the ai-operator-scoring category. Explains what operator
 * scoring is, how it differs from model benchmarking and time tracking,
 * the SigRank scoring system, privacy preservation, and links to
 * /operator-performance, /methodology, /science, and /metrics/yield-cascade.
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
  title: 'AI Operator Scoring — The New Performance Layer',
  description:
    'AI operator scoring is the new performance layer: it ranks the human driving the AI, not the model. How it differs from model benchmarking and time tracking, the SigRank scoring system, and privacy preservation.',
  path: '/ai-operator-scoring',
})

const RELATED = [
  {
    href: '/operator-performance',
    title: 'Operator Performance — Scoring the Human',
    desc: 'The companion hub: why the operator is the variable, how SigRank scores operators, and the class tiers from IGNITER to TRANSMITTER.',
  },
  {
    href: '/methodology',
    title: 'The SigRank Index — Methodology',
    desc: 'The canonical methodology: how operator scores are computed from token telemetry, how snapshots are verified, and how the leaderboard is ranked.',
  },
  {
    href: '/science',
    title: 'The Conservation Law of Commitment',
    desc: 'The academic foundation: a published conservation law for language under compression, with Zenodo DOIs and an empirical record.',
  },
  {
    href: '/metrics/yield-cascade',
    title: 'Yield (Υ) Cascade',
    desc: 'The headline metric in the scoring system: cache_read × output / input². The architecture of the cascade, not raw spend.',
  },
]

export default function AIOperatorScoringPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'AI Operator Scoring', path: '/ai-operator-scoring' },
          ]),
          faqPage([
            {
              question: 'What is AI operator scoring?',
              answer:
                'AI operator scoring is the systematic ranking of humans who drive AI coding tools by the efficiency of their token cascade. Instead of ranking which AI model is best (model benchmarking) or how many hours a developer spent (time tracking), it ranks who uses their AI most efficiently — measured by yield (Υ = cache_read × output / input²) and the composite SIGNA rate. It is a new performance layer that sits between model benchmarks and time trackers.',
            },
            {
              question: 'How does operator scoring differ from model benchmarking?',
              answer:
                'Model benchmarking ranks models by test-suite scores or preference votes — it asks "which AI is best?" Operator scoring ranks humans by real token telemetry from live coding sessions — it asks "who uses the AI best?" Model benchmarking holds the operator constant; operator scoring holds the model constant. They are complements: one helps you choose a model, the other helps you measure whether you are driving it well.',
            },
            {
              question: 'How does operator scoring differ from time tracking?',
              answer:
                'Time tracking (e.g. WakaTime) measures hours spent coding — it rewards presence, not efficiency. Operator scoring measures token-cascade efficiency — it rewards the architecture of how you use the AI, not how long you sit with it. A developer who compounds signal in two hours outscores one who burns tokens for eight. Time is a proxy; token efficiency is the actual currency of LLM compute.',
            },
            {
              question: 'What is the SigRank scoring system?',
              answer:
                'SigRank scores operators from four on-device token pillars (input, output, cache-read, cache-write). The yield metric Υ = cache_read × output / input² is the headline. The composite SIGNA rate blends yield with signal-force and drift components. Proprietary weights (RS.xx) govern the composite and stay server-side to prevent gaming. Operators are classified into tiers (IGNITER to TRANSMITTER) and ranked over 7-day, 30-day, 90-day, and all-time windows. Snapshots are ed25519-signed and verified server-side.',
            },
            {
              question: 'Is operator scoring private?',
              answer:
                'Yes — by construction. The on-device scanner reads token counts only: four integers per session. It never reads the content of your prompts or the model\'s responses. Only ed25519-signed numeric scores leave your device. Server-side verification operates on integers with replay and plausibility guards, never on text. Your prompts, your code, and your conversation history never leave your machine.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="SCORING"
        title="AI Operator Scoring — The New Performance Layer"
        subtitle={
          <>
            Not the model. Not the clock. The{' '}
            <span className="text-gold">operator</span>. A performance layer
            that ranks who drives their AI best — built on real telemetry,
            not preference votes.
          </>
        }
      />

      {/* ── What operator scoring is ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What operator scoring is
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI operator scoring is the systematic ranking of humans who drive AI
          coding tools by the efficiency of their token cascade. It does not
          rank which model is smartest. It does not rank who spent the most
          hours at the keyboard. It ranks who uses their AI most efficiently
          — who compounds signal, who reuses context, who turns a small fresh
          input into dense output. The unit of measurement is the token, and
          the architecture of the cascade is the score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          It is a new performance layer because it sits between two existing
          layers that each miss half the picture. Model benchmarks rank the
          AI but ignore the operator. Time trackers rank the operator but
          measure the wrong currency — hours, not tokens. Operator scoring
          ranks the operator in the currency that actually matters for LLM
          compute: token-cascade efficiency.
        </p>
      </section>

      {/* ── How it differs from model benchmarking ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How it differs from model benchmarking
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Model benchmarking asks <em>which AI is best?</em> and ranks models
          by test-suite scores (MMLU, HumanEval, SWE-bench) or preference
          votes (LMSYS Chatbot Arena). It holds the operator as a constant —
          the same harness, the same prompts, the same evaluators — and
          varies the model. Operator scoring inverts that: it holds the model
          as a constant (you pick one and drive it) and varies the operator.
          The data is not a synthetic test or a vote; it is real token
          telemetry from live coding sessions, captured on-device.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The two are complements. A model benchmark helps you choose a model.
          Operator scoring helps you measure whether you are driving the model
          you chose well. Most developers have never had the second
          measurement. That is the gap SigRank fills.
        </p>
      </section>

      {/* ── How it differs from time tracking ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How it differs from time tracking
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Time trackers — WakaTime and its peers — measure hours spent
          coding. They reward presence: the more time you log, the more
          productive you appear. But time is a proxy for productivity, not a
          measure of it. A developer who compounds signal in two hours
          outscores one who burns tokens for eight — but the time tracker
          ranks them in the opposite order. Operator scoring measures the
          actual currency of LLM compute: tokens. It rewards the architecture
          of the cascade, not the duration of the session.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This matters more as AI coding becomes the dominant mode of
          development. When the bottleneck is not how fast you type but how
          well you drive an AI, hours become a misleading metric. Token
          efficiency is the number that tracks the skill that actually
          matters.
        </p>
      </section>

      {/* ── The SigRank scoring system ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The SigRank scoring system
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Scoring starts with four on-device token pillars: input, output,
          cache-read, cache-write. The yield metric{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{' '}
          is the headline — it measures the architecture of the cascade in one
          number. The composite SIGNA rate blends yield with signal-force and
          drift components to produce the final operator score. Proprietary
          weights (RS.xx) govern the composite and remain server-side — the
          scoring shape is public, the exact weights are not, to prevent
          gaming.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Operators are classified into tiers — IGNITER, SEEKER, BUILDER,
          TRANSMITTER — and ranked over 7-day, 30-day, 90-day, and all-time
          windows. Snapshots are ed25519-signed on-device and verified
          server-side with replay and plausibility guards. The system is
          platform-neutral: it works across Claude, ChatGPT, Gemini, Copilot,
          Cursor, and 15+ platforms. The foundation is a published
          conservation law for language under compression (DOI:
          10.5281/zenodo.20029607).
        </p>
      </section>

      {/* ── Privacy preservation ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Privacy preservation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Operator scoring is privacy-preserving by construction. The
          on-device scanner reads token counts only — four integers per
          session. It never reads the content of your prompts or the
          model&apos;s responses. Only ed25519-signed numeric scores leave
          your device. Server-side verification operates on integers with
          replay and plausibility guards, never on text. Your prompts, your
          code, and your conversation history never leave your machine.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is what makes a global, continuous operator leaderboard
          possible. You cannot publish a ranking built on prompt content
          without a privacy scandal. You can publish one built on four
          signed integers. Token counts are the unit that makes operator
          scoring safe enough to run at scale.
        </p>
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
              What is AI operator scoring?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The systematic ranking of humans who drive AI coding tools by
              token-cascade efficiency. It ranks who uses their AI best —
              measured by yield and the composite SIGNA rate — not which model
              is best or who spent the most hours.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does it differ from model benchmarking?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Model benchmarking ranks models by test scores or votes — it
              asks &ldquo;which AI is best?&rdquo; Operator scoring ranks
              humans by real token telemetry — it asks &ldquo;who uses the AI
              best?&rdquo; One holds the operator constant; the other holds
              the model constant. They are complements.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does it differ from time tracking?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Time tracking measures hours — it rewards presence, not
              efficiency. Operator scoring measures token-cascade efficiency
              — it rewards the architecture of how you use the AI. A developer
              who compounds signal in two hours outscores one who burns tokens
              for eight.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the SigRank scoring system?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Four on-device token pillars feed yield (Υ = cache_read ×
              output / input²) and the composite SIGNA rate. Weights (RS.xx)
              are server-side. Operators are tiered (IGNITER to TRANSMITTER)
              and ranked over multiple windows. Snapshots are ed25519-signed
              and verified.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is operator scoring private?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yes. The scanner reads token counts only — four integers, never
              prompt content. Only ed25519-signed numeric scores leave your
              device. Server-side verification operates on integers, not text.
              Your prompts, code, and conversation history never leave your
              machine.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
