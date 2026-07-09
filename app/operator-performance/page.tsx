/**
 * app/operator-performance/page.tsx — "Operator Performance — Scoring the
 * Human, Not the Model"
 *
 * Topic hub for the operator-performance category. Explains why the operator
 * is the variable, how SigRank scores operators, the class tiers, and links
 * to the operator-comparison guide, the yield-cascade metric, and the
 * benchmarking-tools alternatives page.
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
  title: 'Operator Performance — Scoring the Human, Not the Model',
  description:
    'Operator performance is about the human driving the AI, not the model. How SigRank scores operators, the class tiers from IGNITER to TRANSMITTER, and why the operator is the variable that matters.',
  path: '/operator-performance',
})

const TIERS = [
  {
    name: 'IGNITER',
    desc: 'The entry tier. Operators here are lighting the first sparks — high input, low cache reuse, output still finding its footing. Everyone starts here.',
  },
  {
    name: 'SEEKER',
    desc: 'Cache reuse is growing. The operator is learning to reuse context and reduce fresh input. Yield is rising but not yet compounding.',
  },
  {
    name: 'BUILDER',
    desc: 'The cascade is taking shape. Cache hit rate is healthy, output is dense, and yield is climbing. The operator is constructing signal, not just consuming it.',
  },
  {
    name: 'TRANSMITTER',
    desc: 'The top tier. Signal compounds: small fresh input rides a large cached foundation into high output. The operator transmits more than they spend. This is the top percentile of the board.',
  },
]

const RELATED = [
  {
    href: '/guides/how-to-compare-ai-operators',
    title: 'How to Compare AI Operators',
    desc: 'A guide to head-to-head operator comparison — what to look at, what to ignore, and how to read the yield gap.',
  },
  {
    href: '/metrics/yield-cascade',
    title: 'Yield (Υ) Cascade',
    desc: 'The headline metric that ranks operators: cache_read × output / input². The architecture of the cascade, not raw spend.',
  },
  {
    href: '/alternatives/ai-benchmarking-tools',
    title: 'AI Benchmarking Tools — Alternatives',
    desc: 'How SigRank compares to LMSYS Arena, WakaTime, Cursor metrics, and other adjacent tools — and why operator scoring is a different category.',
  },
  {
    href: '/methodology',
    title: 'The SigRank Index — Methodology',
    desc: 'The canonical methodology: how operator scores are computed, verified, and ranked across platforms and time windows.',
  },
  {
    href: '/ai-operator-scoring',
    title: 'AI Operator Scoring — The New Performance Layer',
    desc: 'The companion hub: what operator scoring is, how it differs from model benchmarking and time tracking, and the privacy-preserving scoring system.',
  },
  {
    href: '/metrics/velocity',
    title: 'Velocity',
    desc: 'Tokens produced per unit of wall-clock time. The throughput metric — useful for speed comparisons, but yield is the number the leaderboard ranks by.',
  },
]

export default function OperatorPerformancePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Operator Performance', path: '/operator-performance' },
          ]),
          faqPage([
            {
              question: 'What is operator performance in AI coding?',
              answer:
                'Operator performance measures how efficiently the human driving the AI tool uses it — not how good the model is. SigRank scores the operator by the architecture of their token cascade: how well they reuse cached context, how much output they produce per fresh input, and whether signal is compounding or tokens are burning. The model is held constant; the operator is the variable.',
            },
            {
              question: 'Why score the operator, not the model?',
              answer:
                'Because the model is not the variable. Two operators on the same model, same platform, same session length can produce wildly different token cascades. One compounds signal; the other burns tokens. The difference is the operator — how they structure prompts, how they reuse context, how they manage the cascade. Model leaderboards already exist (LMSYS Arena). SigRank measures the layer no one else does: the human.',
            },
            {
              question: 'What are the SigRank class tiers?',
              answer:
                'Operators are classified into tiers from low to high: IGNITER (entry, high input, low cache reuse), SEEKER (cache reuse growing, yield rising), BUILDER (cascade taking shape, signal compounding), and TRANSMITTER (top tier, signal compounds, small input rides large cache into high output). The tiers are assigned from the scoring ruleset based on yield and the composite SIGNA rate.',
            },
            {
              question: 'How is operator performance scored?',
              answer:
                'From the four token pillars captured on-device: input, output, cache-read, cache-write. The yield metric Υ = cache_read × output / input² is the headline. The composite SIGNA rate blends yield with signal-force and drift components. Proprietary weights (RS.xx) govern the composite and remain server-side. Snapshots are ed25519-signed and verified server-side.',
            },
            {
              question: 'Is operator scoring private?',
              answer:
                'Yes. The on-device scanner reads token counts only — never the content of prompts or responses. Only ed25519-signed numeric scores leave your device. Server-side verification operates on integers, not text. Your prompts, your code, and your conversation history never leave your machine.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="OPERATOR"
        title="Operator Performance — Scoring the Human, Not the Model"
        subtitle={
          <>
            The model is held constant. The{' '}
            <span className="text-gold">operator</span> is the variable.
            SigRank scores the human driving the AI — because that is where
            the signal lives.
          </>
        }
      />

      {/* ── The operator is the variable ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The operator is the variable
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Two developers sit down with the same model — the same Claude, the
          same ChatGPT, the same Gemini — on the same platform, for the same
          session length. One walks away with a token cascade that compounds:
          small fresh input riding a large cached foundation into dense
          output. The other walks away with a cascade that burns: high input,
          low cache reuse, thin output. Same model. Same clock. Wildly
          different results.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The difference is not the model. The difference is the operator —
          how they structure their prompts, how they reuse context, how they
          manage the cascade across turns. The model is a constant. The
          operator is the variable. SigRank is built to measure that variable.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is the inversion that makes SigRank a different category from
          model leaderboards. LMSYS Arena ranks which model humans prefer.
          SigRank ranks which human drives their model best. The question is
          not &ldquo;which AI is smarter?&rdquo; — it is &ldquo;who is
          better at using the AI they have?&rdquo;
        </p>
      </section>

      {/* ── How SigRank scores operators ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank scores operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Scoring starts with token telemetry — four counts captured
          on-device per session: input, output, cache-read, cache-write. From
          those four integers, the yield metric{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{' '}
          is computed. Yield is the headline: it measures the architecture of
          the cascade in one number.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The composite SIGNA rate blends yield with signal-force and drift
          components to produce the final operator score. Proprietary weights
          (RS.xx) govern the composite and remain server-side — the scoring
          shape is public, the exact weights are not, to prevent gaming.
          Snapshots are ed25519-signed and verified server-side with replay
          and plausibility guards. Operators are ranked over 7-day, 30-day,
          90-day, and all-time windows.
        </p>
      </section>

      {/* ── Class tiers ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Class tiers explained
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every operator is assigned a class tier from the scoring ruleset.
          Tiers run from low to high — they describe where an operator is in
          the compounding journey, not a fixed label.
        </p>
        <div className="flex flex-col gap-3">
          {TIERS.map((t, i) => (
            <div
              key={t.name}
              className="rounded-lg border border-bg-border bg-bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-muted">
                  {i + 1}
                </span>
                <h3 className="font-mono text-sm font-bold text-gold">
                  {t.name}
                </h3>
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                {t.desc}
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
              What is operator performance in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It measures how efficiently the human driving the AI uses it —
              not how good the model is. SigRank scores the operator by the
              architecture of their token cascade. The model is held constant;
              the operator is the variable.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why score the operator, not the model?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Because the model is not the variable. Two operators on the same
              model can produce wildly different cascades. Model leaderboards
              already exist — SigRank measures the layer no one else does:
              the human.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are the class tiers?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              IGNITER (entry), SEEKER (cache reuse growing), BUILDER (cascade
              taking shape), and TRANSMITTER (top tier, signal compounds).
              Tiers are assigned from the scoring ruleset based on yield and
              the composite SIGNA rate.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How is operator performance scored?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              From four on-device token counts. Yield (Υ = cache_read ×
              output / input²) is the headline. The composite SIGNA rate
              blends yield with signal-force and drift. Weights (RS.xx) are
              server-side. Snapshots are ed25519-signed and verified.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is operator scoring private?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yes. The scanner reads token counts only — never prompt content.
              Only ed25519-signed numeric scores leave your device. Your
              prompts, code, and conversation history never leave your
              machine.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
