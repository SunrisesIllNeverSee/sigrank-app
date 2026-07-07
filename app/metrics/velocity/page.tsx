/**
 * app/metrics/velocity/page.tsx — "Velocity — Token Production Rate"
 *
 * Defines velocity: tokens produced per unit time. Explains why it's a secondary
 * metric (high velocity without yield = fast waste), how it interacts with yield,
 * and when velocity matters (throughput-oriented tasks).
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
  title: 'Velocity — Token Production Rate in AI Coding',
  description:
    'Velocity = output / session_time measures token production rate in AI coding. Learn why velocity is a secondary metric, how it interacts with yield, and when high AI output speed matters.',
  path: '/metrics/velocity',
})

export default function VelocityPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Metrics', path: '/metrics' },
            { name: 'Velocity', path: '/metrics/velocity' },
          ]),
          definedTerm(
            'Velocity — Token Production Rate',
            'Velocity = output / session_time. The rate at which an AI operator produces output tokens per unit of session time. A secondary metric: high velocity without yield is fast waste. Velocity matters most for throughput-oriented tasks where raw output volume per hour is the goal.',
            '/metrics/velocity',
          ),
          faqPage([
            {
              question: 'What is velocity in AI coding?',
              answer:
                'Velocity = output / session_time. It measures how many output tokens an operator produces per unit of session time — tokens per minute, per hour, or per session. High velocity means you are generating output quickly; low velocity means you are spending time on input and context management without proportional output.',
            },
            {
              question: 'Why is velocity a secondary metric?',
              answer:
                'High velocity without yield is fast waste. An operator who generates 10,000 output tokens per hour but sends 50,000 fresh input tokens with no cache reuse has high velocity but low yield — they are burning tokens quickly. Velocity measures speed; yield measures efficiency. Speed without efficiency is just faster waste. Yield is the headline; velocity is context.',
            },
            {
              question: 'How does velocity interact with yield?',
              answer:
                'They measure different dimensions. Yield = (cache_read × output) / input² measures cascade efficiency. Velocity = output / session_time measures production rate. An operator can have high yield and low velocity (efficient but slow — deep, careful work with long thinking time). Or high velocity and low yield (fast but wasteful — rapid-fire prompts with no context reuse). The best operators have both: high yield AND high velocity — efficient cascades that also produce a lot of output quickly.',
            },
            {
              question: 'When does velocity matter?',
              answer:
                'Velocity matters most for throughput-oriented tasks: bulk code generation, large refactors, test suite generation, documentation writing. In these cases, raw output volume per hour is the goal, and velocity is the relevant metric. For precision tasks — debugging, architecture decisions, security review — yield matters more than velocity. Use velocity as a diagnostic, not a target.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Secondary Metric"
        terminalText="VELOCITY"
        title="Velocity — Token Production Rate"
        subtitle={
          <>
            How fast you produce output. A{' '}
            <span className="text-gold">secondary metric</span> — high velocity
            without yield is just fast waste.
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
            Velocity = output / session_time
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Velocity is the rate of output token production per unit of session time.
          It answers a simple question: <em>how many tokens of useful output am I
          generating per hour?</em> A velocity of 5,000 tokens/hour means
          you&rsquo;re producing 5,000 output tokens for every hour of active
          session time. A velocity of 500 tokens/hour means you&rsquo;re spending
          most of your time on input, context management, or waiting — not
          generating output.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">session_time</strong> is the wall-clock
          duration of the active session — from first prompt to last response. It
          includes the time you spend composing prompts, the time the model spends
          generating, and the time you spend reviewing output. Velocity captures the
          full loop, not just model inference speed.
        </p>
      </section>

      {/* ── What it measures ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What velocity measures
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Velocity measures your <strong className="text-text-primary">throughput</strong>{' '}
          — how much output you produce per unit of time invested. It is the AI-coding
          analog of lines-of-code-per-hour, but measured in output tokens rather than
          lines. Unlike lines of code, output tokens are a direct measure of the
          model&rsquo;s productive work, not your typing speed.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Velocity is influenced by several factors: how quickly you compose prompts
          (your input velocity), how long the model takes to respond (inference
          latency), how much output you request per turn (prompt design), and how
          much time you spend reviewing or editing between turns (your review loop).
          Improving any of these increases velocity — but not all improvements are
          equal.
        </p>
      </section>

      {/* ── Why it's a secondary metric ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why velocity is a secondary metric
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The fundamental insight: <strong className="text-text-primary">high
          velocity without yield is fast waste</strong>. An operator who generates
          10,000 output tokens per hour but sends 50,000 fresh input tokens with no
          cache reuse has high velocity but low yield. They are burning tokens
          quickly — efficient at producing volume, inefficient at producing value.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is why SigRank treats velocity as secondary. Yield is the headline
          because it measures the <em>architecture</em> of the cascade — whether
          signal is compounding. Velocity measures the <em>speed</em> of the cascade
          — how fast tokens flow. Speed without architecture is noise. Architecture
          without speed is still signal (just slower signal). The priority is
          architecture first, speed second.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Consider two operators. Operator A produces 3,000 tokens/hour with a yield
          of 50 (efficient cascade, moderate speed). Operator B produces 8,000
          tokens/hour with a yield of 2 (fast cascade, wasteful). Operator A is the
          better AI coder — their output compounds. Operator B is generating more
          volume but burning context to do it. Velocity alone would rank B higher;
          yield correctly ranks A higher.
        </p>
      </section>

      {/* ── How velocity interacts with yield ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How velocity interacts with yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Velocity and yield measure orthogonal dimensions. Yield measures cascade
          efficiency (output × cache reuse / input²). Velocity measures production
          rate (output / time). They share the <strong className="text-text-primary">output</strong>{' '}
          term but diverge everywhere else.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            High yield, low velocity
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Efficient but deliberate. Long thinking time between turns, careful prompt
            composition, deep review of output. Each turn is high-value — the cascade
            compounds — but throughput is modest. This is the signature of precision
            work: debugging, architecture, security review.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
            High velocity, low yield
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Fast but wasteful. Rapid-fire prompts, minimal review, no cache reuse.
            Output volume is high but each turn starts from scratch. The cascade
            doesn&rsquo;t compound — tokens are burned quickly. This is the signature
            of volume-oriented work without context discipline.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            High yield AND high velocity
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            The ideal. An efficient cascade that also produces a lot of output
            quickly. Stable cached context (high yield) plus rapid, substantive
            output requests (high velocity). This is the signature of a{' '}
            <strong className="text-text-primary">TRANSMITTER</strong> operating at
            full capacity — the flywheel is spinning fast <em>and</em> efficiently.
          </p>
        </div>
      </section>

      {/* ── When velocity matters ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          When velocity matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Velocity matters most for <strong className="text-text-primary">throughput-oriented
          tasks</strong> where raw output volume per hour is the goal:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Bulk code generation</strong> —
            generating boilerplate, scaffolding, or repetitive implementations where
            quality is uniform and volume is the bottleneck.
          </li>
          <li>
            <strong className="text-text-primary">Large refactors</strong> —
            applying a consistent transformation across many files or functions.
          </li>
          <li>
            <strong className="text-text-primary">Test suite generation</strong> —
            writing comprehensive test cases for an existing module.
          </li>
          <li>
            <strong className="text-text-primary">Documentation writing</strong> —
            generating API docs, README files, or inline comments across a codebase.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For <strong className="text-text-primary">precision tasks</strong> —
          debugging a subtle race condition, making an architecture decision,
          reviewing a security-critical change — yield matters more than velocity.
          These tasks reward careful, efficient cascades over raw throughput. Use
          velocity as a diagnostic to understand your working style, not as a target
          to maximize at the expense of yield.
        </p>
      </section>

      {/* ── How to improve velocity (without sacrificing yield) ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to improve velocity without sacrificing yield
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">1. Request larger outputs per turn.</strong>{' '}
            Instead of asking for one function at a time, request a complete module or
            feature. This increases output per turn without increasing input or
            breaking cache — both yield and velocity go up.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">2. Reduce review-loop overhead.</strong>{' '}
            Time spent reviewing and editing between turns is session_time that
            doesn&rsquo;t produce output. Trust the cascade — if your context is
            stable and your prompts are specific, the output quality is high enough
            to reduce round-trip edits.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">3. Batch related requests.</strong>{' '}
            Instead of five sequential turns (&ldquo;write the function,&rdquo; then
            &ldquo;add types,&rdquo; then &ldquo;add tests,&rdquo; then &ldquo;add
            docs,&rdquo; then &ldquo;add error handling&rdquo;), batch them into one
            turn: &ldquo;write the function with types, tests, docs, and error
            handling.&rdquo; One turn, large output, same cached context.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">4. Maintain cache continuity.</strong>{' '}
            Cache reads are faster than fresh input processing — high cache hit rate
            reduces model latency, which increases velocity. Context discipline
            improves both yield and velocity simultaneously.
          </li>
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is velocity in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Velocity = output / session_time. It measures how many output tokens
              you produce per unit of session time. High velocity means
              you&rsquo;re generating output quickly; low velocity means
              you&rsquo;re spending time on input and context management without
              proportional output.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is velocity a secondary metric?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              High velocity without yield is fast waste. An operator generating 10,000
              tokens/hour with no cache reuse has high velocity but low yield — they
              are burning tokens quickly. Yield measures efficiency; velocity measures
              speed. Speed without efficiency is just faster waste. Yield is the
              headline; velocity is context.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does velocity interact with yield?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              They measure orthogonal dimensions. You can have high yield and low
              velocity (efficient but deliberate — precision work) or high velocity
              and low yield (fast but wasteful — volume without context discipline).
              The best operators have both: efficient cascades that also produce a
              lot of output quickly.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              When does velocity matter?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Velocity matters most for throughput-oriented tasks: bulk code
              generation, large refactors, test suite generation, documentation
              writing. For precision tasks — debugging, architecture, security review
              — yield matters more. Use velocity as a diagnostic, not a target.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related metrics:{' '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
          {' · '}
          <Link href="/metrics/compression-ratio" className="text-gold underline underline-offset-2">
            Compression Ratio
          </Link>
          {' · '}
          <Link href="/metrics/cache-hit-rate" className="text-gold underline underline-offset-2">
            Cache Hit Rate
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
