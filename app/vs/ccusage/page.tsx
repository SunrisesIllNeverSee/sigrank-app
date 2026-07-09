/**
 * app/vs/ccusage/page.tsx — "SigRank vs ccusage" SEO comparison page.
 *
 * Angle: ccusage reads token usage from Claude Code logs. SigRank bundles ccusage
 * AND adds cascade scoring, leaderboards, operator profiles, MCP integration.
 * ccusage is the sensor; SigRank is the instrument panel.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage), WaveHero,
 * and a styled comparison table matching the repo's table conventions.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'
import { WaveHero } from '@/components/ui/WaveHero'

export const metadata: Metadata = withOG({
  title: 'SigRank vs ccusage \u2014 Sensor to Instrument Panel',
  description:
    'ccusage reads Claude Code token logs. SigRank bundles ccusage and adds cascade scoring, leaderboards, operator profiles, and MCP integration.',
  path: '/vs/ccusage',
})

// Comparison rows — feature-by-feature, ccusage vs SigRank.
const COMPARE_ROWS: { feature: string; ccusage: string; sigrank: string }[] = [
  { feature: 'Reads Claude Code token logs', ccusage: 'Yes', sigrank: 'Yes (bundles ccusage)' },
  { feature: 'Token pillar breakdown (input / output / cache-read / cache-write)', ccusage: 'Yes', sigrank: 'Yes' },
  { feature: 'Cascade efficiency score (Υ = cache_read × output / input²)', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'Compression ratio + SNR + Leverage + Velocity', ccusage: 'Partial (raw counts)', sigrank: 'Yes (derived metrics)' },
  { feature: 'Class tier (IGNITER → TRANSMITTER)', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'Global operator leaderboard', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'Operator profiles + head-to-head compare', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'MCP server for AI-agent integration', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'ed25519-signed snapshot submission', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'Platform-neutral (Cursor, Copilot, Gemini, 15+)', ccusage: 'Claude Code only', sigrank: 'Yes' },
  { feature: 'Bundled tools (tokscale, token-dashboard)', ccusage: 'No', sigrank: 'Yes' },
  { feature: 'Privacy-preserving (token counts only)', ccusage: 'Yes', sigrank: 'Yes' },
]

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Is SigRank a ccusage alternative or a ccusage upgrade?',
    answer:
      'Both. SigRank bundles ccusage as its local log reader, so you keep every number ccusage gives you — then layers cascade scoring (Υ Yield), a global leaderboard, operator profiles, class tiers, and MCP integration on top. ccusage is the sensor that reads the logs; SigRank is the instrument panel that turns those readings into a ranked, comparable signal. If you already run ccusage, `sigrank submit` is the upgrade path.',
  },
  {
    question: 'Does SigRank replace ccusage?',
    answer:
      'No — it wraps it. The SigRank CLI calls ccusage under the hood to parse your Claude Code token telemetry locally, then computes the four-pillar cascade metrics (Υ Yield, compression ratio, SNR, Leverage, Velocity), signs a snapshot with ed25519, and publishes it to the leaderboard. You can still run `ccusage` standalone anytime; SigRank just adds the scoring and ranking layer ccusage was never built to provide.',
  },
  {
    question: 'What does ccusage not measure that SigRank does?',
    answer:
      'ccusage reports raw token counts per session — input, output, cache creation, and cache read. SigRank derives the cascade architecture from those counts: Υ Yield = cache_read × output / input² (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). ccusage tells you what you spent; SigRank tells you how efficiently you drove.',
  },
  {
    question: 'Can I use SigRank with my existing ccusage output?',
    answer:
      'Yes. The SigRank score calculator at /score accepts pasted ccusage JSON — paste your `ccusage --json` output and it computes your Υ Yield, class tier, and compression ratio instantly, no account required. To publish to the leaderboard, run `sigrank enroll` then `sigrank submit`; the CLI handles the ccusage read, scoring, signing, and submission in one flow.',
  },
  {
    question: 'Does SigRank only work with Claude Code like ccusage?',
    answer:
      'No. ccusage is Claude Code-specific — it reads the Claude Code JSONL logs. SigRank is platform-neutral: it works across Claude Code, Cursor, GitHub Copilot, ChatGPT, Gemini, and 15+ other platforms. ccusage remains the reader for Claude Code logs; SigRank adds readers (tokscale, token-dashboard) and a unified scoring layer so your efficiency is comparable no matter which tool you drove.',
  },
]

export default function VsCcusagePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Comparisons', path: '/vs' },
            { name: 'SigRank vs ccusage', path: '/vs/ccusage' },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs ccusage"
        title="From Token Sensor to Instrument Panel"
        subtitle={
          <>
            ccusage reads your Claude Code token logs. SigRank{' '}
            <span className="text-gold">bundles ccusage</span> and adds cascade
            scoring, leaderboards, operator profiles, and MCP integration. The
            sensor stays — the instrument panel is what was missing.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccusage is a CLI that parses Claude Code&apos;s local JSONL logs and
          prints your token usage — input, output, cache creation, cache read.
          It does exactly one thing well: it <em>reads the sensor</em>. SigRank
          takes that same reading and turns it into an{' '}
          <strong className="text-text-primary">instrument panel</strong>: a
          cascade-efficiency score (Υ Yield), a class tier, a global leaderboard,
          operator profiles, head-to-head comparisons, and an MCP server your AI
          agents can query. You don&apos;t throw away ccusage — you graduate from
          it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The analogy: ccusage is the oxygen sensor in the exhaust. SigRank is
          the dashboard that turns that reading into a lap time, a ranking, and a
          pit strategy. Both matter. Only one tells you whether you&apos;re
          winning.
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
                  ccusage
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.ccusage}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why the cascade matters */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why raw token counts aren&apos;t enough
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccusage answers <em>&quot;how many tokens did I burn?&quot;</em> That&apos;s
          necessary but not sufficient. Two operators can spend the same 50K input
          tokens and get wildly different outcomes. One reuses cached context
          efficiently and produces 30K output tokens; the other re-sends the same
          context every turn and produces 3K. Same spend, ten-fold difference in
          signal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric —{' '}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{' '}
          — measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. ccusage gives you the four integers; SigRank tells you
          whether the cascade they describe is <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (both tools read these)
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Input</strong> — tokens you
              send to the model
            </li>
            <li>
              <strong className="text-text-primary">Output</strong> — tokens the
              model generates back
            </li>
            <li>
              <strong className="text-text-primary">Cache-read</strong> — cached
              tokens reused from prior context
            </li>
            <li>
              <strong className="text-text-primary">Cache-write</strong> — new
              tokens written to cache for future reuse
            </li>
          </ul>
        </div>
      </section>

      {/* The upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The ccusage upgrade path
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run ccusage, you&apos;re one command away from the full
          instrument panel:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
{`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs (ccusage bundled), scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to inspect before you submit? Run{' '}
          <span className="font-mono text-text-primary">sigrank me --dry-run</span>{' '}
          to see your scored payload locally, or paste your{' '}
          <span className="font-mono text-text-primary">ccusage --json</span>{' '}
          output into the{' '}
          <a href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </a>{' '}
          — no account, no submission, just the numbers.
        </p>
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
          Ready to see your cascade?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your ccusage reads. Add the scoring, the leaderboard, and the
          operator profile that turns those reads into a rank. Install SigRank and
          submit your first signed snapshot in under a minute.
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
          <Link href="/alternatives/ccusage-alternatives" className="text-gold underline underline-offset-2">
            ccusage Alternatives
          </Link>
          {' · '}
          <Link href="/tools/yield-calculator" className="text-gold underline underline-offset-2">
            Yield Calculator
          </Link>
          {' · '}
          <Link href="/wiki/local-agent" className="text-gold underline underline-offset-2">
            The Local Agent (MCP)
          </Link>
        </p>
      </section>
    </div>
  )
}
