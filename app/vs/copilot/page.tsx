/**
 * app/vs/copilot/page.tsx — "SigRank vs GitHub Copilot" SEO comparison page.
 *
 * Angle: Copilot is an AI pair programmer. SigRank measures how efficiently
 * ANY operator uses ANY AI tool — including Copilot. Copilot tells you what
 * you wrote; SigRank tells you how efficiently you drove the AI to write it.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's conventions.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'
import { WaveHero } from '@/components/ui/WaveHero'

export const metadata: Metadata = withOG({
  title: 'SigRank vs GitHub Copilot — Token Tracking for Any AI Tool',
  description:
    'GitHub Copilot is an AI pair programmer. SigRank measures how efficiently any operator uses any AI tool — including Copilot. Copilot tells you what you wrote; SigRank tells you how efficiently you drove the AI. GitHub Copilot token tracking, explained.',
  path: '/vs/copilot',
})

const COMPARE_ROWS: { feature: string; copilot: string; sigrank: string }[] = [
  { feature: 'What it is', copilot: 'AI pair programmer (inline + chat)', sigrank: 'Platform-neutral operator scoring layer' },
  { feature: 'Token usage tracking', copilot: 'Limited (subscription-scoped)', sigrank: 'Yes (four-pillar cascade)' },
  { feature: 'Cascade efficiency score (Υ = cache_read × output / input²)', copilot: 'No', sigrank: 'Yes' },
  { feature: 'Compression ratio + SNR + Leverage + Velocity', copilot: 'No', sigrank: 'Yes' },
  { feature: 'Class tier (IGNITER → TRANSMITTER)', copilot: 'No', sigrank: 'Yes' },
  { feature: 'Global operator leaderboard', copilot: 'No', sigrank: 'Yes' },
  { feature: 'Works across Copilot + Cursor + Claude Code + 15+', copilot: 'No (Copilot only)', sigrank: 'Yes' },
  { feature: 'Score follows you across tools', copilot: 'No', sigrank: 'Yes' },
  { feature: 'Operator profiles + head-to-head compare', copilot: 'No', sigrank: 'Yes' },
  { feature: 'ed25519-signed snapshot submission', copilot: 'No', sigrank: 'Yes' },
  { feature: 'MCP server for agent integration', copilot: 'No', sigrank: 'Yes' },
  { feature: 'Privacy-preserving (token counts only, no content)', copilot: 'Yes', sigrank: 'Yes' },
]

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Does SigRank replace GitHub Copilot?',
    answer:
      'No. Copilot is an AI pair programmer — it writes code alongside you in VS Code, JetBrains, and on GitHub.com. SigRank is not an AI tool; it is the scoring layer that measures how efficiently you drive any AI tool, Copilot included. You keep using Copilot for completions and chat, and run the SigRank CLI alongside it to score your token cascade and publish to the leaderboard. Copilot does the writing; SigRank scores the driving.',
  },
  {
    question: 'Does GitHub Copilot track token usage?',
    answer:
      'Copilot exposes limited usage signals — mostly subscription-tier scoped (how many completions or chat messages you used against your quota). It does not expose the four-pillar token cascade (input, output, cache-read, cache-write) needed to compute cascade efficiency. SigRank reads that telemetry locally — including from Copilot sessions where available — and derives Υ Yield, compression ratio, SNR, Leverage, and Velocity. Copilot tells you how many times you asked; SigRank tells you how efficiently you asked.',
  },
  {
    question: 'How does SigRank measure Copilot efficiency specifically?',
    answer:
      'SigRank reads the token telemetry your Copilot sessions produce — the same four pillars every AI tool emits — and computes the cascade architecture. An operator who writes tight, high-context Copilot prompts that reuse prior completions (high cache_read, low fresh input, high output) scores a higher Υ than one who re-pastes the same context every turn. The metric is tool-agnostic, so your Copilot driving is directly comparable to someone driving Claude Code or Cursor.',
  },
  {
    question: 'Why use SigRank if I only use Copilot?',
    answer:
      'Two reasons. First, Copilot&apos;s own metrics are quota-scoped, not efficiency-scoped — they tell you whether you are near your limit, not whether you are driving well. SigRank tells you the latter. Second, even Copilot-only operators benefit from a leaderboard: you see how your cascade efficiency compares to thousands of other operators, get a class tier (IGNITER to TRANSMITTER), and can track your Υ trajectory over time. Copilot gives you a tool; SigRank gives you a rank.',
  },
  {
    question: 'Can I compare my Copilot efficiency to operators using other tools?',
    answer:
      'Yes — that is the core point of SigRank&apos;s platform neutrality. Because Υ Yield is computed from token integers that every AI tool produces, an operator driving Copilot is scored on the exact same axis as one driving Cursor, Claude Code, or Gemini. The leaderboard does not silo by tool. Your Copilot sessions and your Claude Code sessions both feed one unified rank. That cross-tool comparability is something no single AI tool&apos;s built-in metrics can give you.',
  },
]

export default function VsCopilotPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Comparisons', path: '/vs' },
            { name: 'SigRank vs GitHub Copilot', path: '/vs/copilot' },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs GitHub Copilot"
        title="What You Wrote vs How You Drove"
        subtitle={
          <>
            Copilot is an AI pair programmer. SigRank measures how efficiently{' '}
            <span className="text-gold">any operator</span> uses{' '}
            <span className="text-gold">any AI tool</span> — including Copilot.
            Copilot tells you what you wrote; SigRank tells you how efficiently
            you drove the AI to write it.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          GitHub Copilot is an AI pair programmer — inline completions, chat, and
          now agentic features inside VS Code, JetBrains, and GitHub.com. It is
          good at its job: helping you write code faster. What it does not do is
          tell you how <em>efficiently</em> you are driving it. Copilot&apos;s
          metrics are quota-scoped (are you near your limit?) not
          efficiency-scoped (are you compounding signal or burning tokens?).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the layer that answers the second question. It reads token
          telemetry from Copilot and every other AI tool you use, computes the
          cascade efficiency (Υ Yield), and ranks you against all operators on
          one platform-neutral leaderboard. Copilot tells you{' '}
          <strong className="text-text-primary">what you wrote</strong>; SigRank
          tells you{' '}
          <strong className="text-text-primary">
            how efficiently you drove the AI to write it
          </strong>
          .
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Feature comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  GitHub Copilot
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  SigRank
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr
                  key={r.feature}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.feature}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.copilot}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* What you wrote vs how you drove */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What you wrote vs how you drove
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Copilot&apos;s value proposition is output: it writes code so you
          don&apos;t have to. The natural question — &quot;how much did I help it
          write well?&quot; — is exactly the one Copilot doesn&apos;t answer. Two
          developers can accept the same number of Copilot completions and have
          wildly different cascade efficiency. One feeds Copilot tight, reusable
          context (high cache_read, low fresh input, high output); the other
          pastes a wall of stale context every turn (low cache_read, high input,
          low output). Same completions accepted. Ten-fold difference in Υ.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s{' '}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{' '}
          measures that difference directly. It rewards the operator who
          compounds cached context into output and penalizes the one who burns
          input without leverage. Copilot counts the lines; SigRank scores the
          driving behind them.
        </p>
      </section>

      {/* Any tool, any operator */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Any operator, any tool — including Copilot
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is platform-neutral by design. It does not compete with Copilot
          — it <em>measures</em> Copilot usage alongside every other AI tool you
          drive. Your Copilot sessions, your Claude Code sessions, your Cursor
          sessions: all scored on the same cascade axis, all feeding one
          leaderboard rank. That is something Copilot&apos;s own metrics
          structurally cannot give you, because Copilot only sees Copilot.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (Copilot emits these too)
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Input</strong> — tokens you
              send (your prompt, selected context)
            </li>
            <li>
              <strong className="text-text-primary">Output</strong> — tokens
              Copilot generates back
            </li>
            <li>
              <strong className="text-text-primary">Cache-read</strong> — cached
              context reused from prior turns
            </li>
            <li>
              <strong className="text-text-primary">Cache-write</strong> — new
              context written to cache for reuse
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Frequently asked questions
        </h2>
        <dl className="flex flex-col gap-5">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1.5">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Keep Copilot. Score the driving.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Copilot writes the code. SigRank tells you how efficiently you steered
          it — and how you compare to every other operator, on any tool. Install
          the CLI, submit a signed snapshot, and see your Υ Yield and global rank.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <a
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </a>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/alternatives/ai-coding-metrics" className="text-gold underline underline-offset-2">
            AI Coding Metrics Tools
          </Link>
          {' · '}
          <Link href="/tools/yield-calculator" className="text-gold underline underline-offset-2">
            Yield Calculator
          </Link>
          {' · '}
          <Link href="/guides/how-to-measure-ai-coding-efficiency" className="text-gold underline underline-offset-2">
            Measure AI Coding Efficiency
          </Link>
        </p>
      </section>
    </div>
  )
}
