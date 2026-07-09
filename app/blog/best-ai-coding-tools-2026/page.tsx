/**
 * app/blog/best-ai-coding-tools-2026/page.tsx — "Best AI Coding Tools for
 * Measuring Developer Performance (2026)".
 *
 * Long-form blog post targeting "best ai coding tools 2026", "ai developer
 * performance tools", and "ai coding measurement". Reviews 7 tools, argues
 * that the operator (the human driving the AI) is the new unit of measurement.
 *
 * JSON-LD: ScholarlyArticle (inline, following lib/jsonld.ts pattern) +
 * BreadcrumbList + FAQPage.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { SITE_ORIGIN } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Best AI Coding Tools for Measuring Developer Performance (2026)',
  description:
    'The best AI coding tools for measuring developer performance in 2026. Why LOC, commits, and hours fail in the AI era — and the new token-based metrics (yield, cache hit rate, leverage) that replace them. 7 tools reviewed.',
  path: '/blog/best-ai-coding-tools-2026',
})

/** Inline ScholarlyArticle JSON-LD (follows the researchArticle() pattern). */
function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/best-ai-coding-tools-2026`
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    '@id': url,
    headline: 'Best AI Coding Tools for Measuring Developer Performance (2026)',
    description:
      'The shift from time-based to token-based developer metrics. Why traditional dev metrics fail in the AI coding era, the new metrics that matter, and 7 tools reviewed.',
    url,
    datePublished: '2026-07-07',
    author: { '@type': 'Organization', name: 'SigRank', url: SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: 'SigRank', url: SITE_ORIGIN },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    about: 'AI developer performance measurement and token-based metrics',
    keywords: [
      'best ai coding tools 2026',
      'ai developer performance tools',
      'ai coding measurement',
      'token efficiency',
      'developer metrics',
    ],
  }
}

const faqs = [
  {
    question: 'What are the best AI coding tools for measuring developer performance in 2026?',
    answer:
      'SigRank, ccusage, and the Token Dashboard lead the field for token-based measurement. WakaTime remains useful for time tracking, while Cursor and GitHub Copilot offer limited built-in metrics. LMSYS ranks AI models, not operators. For measuring the human driving the AI, SigRank is the only tool that scores the operator directly.',
  },
  {
    question: 'Why do traditional developer metrics like LOC and commits fail in the AI coding era?',
    answer:
      'Lines of code and commit counts measure the wrong unit. When an AI agent generates 90% of the code, LOC reflects the model\'s verbosity, not the developer\'s skill. Hours tracked miss that a 15-minute high-leverage session can outperform an 8-hour low-yield one. Token-based metrics — yield, cache hit rate, leverage — measure how efficiently the operator drives the cascade instead.',
  },
  {
    question: 'What is the yield metric (Υ) and why does it matter for AI coding?',
    answer:
      'Yield (Υ) = (cache_read × output) / input². It measures token-cascade efficiency: how well an operator reuses cached context and converts input tokens into useful output. A high yield means signal is compounding; a low yield means tokens are being burned. It is the headline metric for AI developer performance because it captures the full cascade, not just one dimension.',
  },
  {
    question: 'Does SigRank read my prompt content?',
    answer:
      'No. SigRank reads only four token integers — input, output, cache-read, and cache-write — from local logs. No message content is ever read, stored, or transmitted. Snapshots are ed25519-signed on-device and verified server-side. Privacy is architectural, not a promise.',
  },
  {
    question: 'How is SigRank different from LMSYS Chatbot Arena?',
    answer:
      'LMSYS ranks AI MODELS by human preference in head-to-head matchups. SigRank ranks OPERATORS — the humans driving the AI — by token-cascade efficiency. LMSYS answers "which model is best?"; SigRank answers "which developer uses their model most efficiently?" They measure different units entirely.',
  },
]

export default function BestAiCodingTools2026Page() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: 'Blog', path: '/blog' },
            { name: 'Best AI Coding Tools 2026', path: '/blog/best-ai-coding-tools-2026' },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Developer Metrics"
        title="Best AI Coding Tools for Measuring Developer Performance (2026)"
        subtitle={
          <>
            The shift from{' '}
            <span className="text-gold">time-based</span> to{' '}
            <span className="text-gold">token-based</span> developer metrics —
            and the 7 tools that define the new field.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-07">Published July 7, 2026</time>
        <span aria-hidden="true">·</span>
        <span>12 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For thirty years, developer performance was measured in the same
          currency: <strong className="text-text-primary">time</strong>. Hours
          logged, tickets closed, commits pushed, lines of code written. The
          assumption underneath all of it was that the developer was the one
          <em> typing the code</em>. That assumption broke in 2025. When an AI
          agent generates ninety percent of the keystrokes, lines of code
          measure the model&apos;s verbosity, not the developer&apos;s skill.
          When a fifteen-minute high-leverage session outperforms an eight-hour
          low-yield grind, hours logged measure stamina, not impact.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A new class of tools has emerged to measure what actually matters in
          the AI coding era: <strong className="text-text-primary">token
          efficiency</strong>. This is the story of why the old metrics failed,
          what replaced them, and the seven tools every engineering leader
          should know in 2026.
        </p>
      </section>

      {/* ── Why traditional metrics fail ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why traditional developer metrics fail in the AI era
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The old metrics were never perfect, but they were coherent: they
          measured the developer&apos;s direct output. LOC counted what you
          typed. Commits counted what you shipped. Hours counted how long you
          sat at the keyboard. Each was a proxy for effort and, loosely, for
          skill. The AI coding era severed the link between the developer and
          the keystroke — and every time-based proxy broke with it.
        </p>

        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Lines of code (LOC)
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            An AI agent can emit a thousand lines of boilerplate in seconds.
            High LOC now correlates with{' '}
            <span className="text-gold">verbosity, not value</span>. The
            developer who prompts for a tight, correct fifty-line module is
            more effective than the one who accepts a sprawling five-hundred-line
            dump. LOC rewards the wrong behavior.
          </p>
        </div>

        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Commit count &amp; frequency
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Commits measure shipping cadence, but an AI-assisted commit and a
            hand-written commit are not the same unit of work. A developer who
            ships twenty AI-generated commits in an afternoon isn&apos;t twenty
            times more productive than one who ships one carefully-reviewed
            commit. The metric can&apos;t tell the difference.
          </p>
        </div>

        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Hours &amp; active time
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Time tracking assumes throughput is proportional to minutes spent.
            In the AI era, the opposite is often true: the developer who spends
            fifteen minutes crafting a high-leverage prompt that triggers a
            long cache-read cascade outperforms the one who spends eight hours
            re-explaining context the model already has.{' '}
            <span className="text-gold">Leverage, not hours</span>, is the new
            throughput.
          </p>
        </div>
      </section>

      {/* ── The new metrics ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The new metrics that matter
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If the old metrics measured the developer&apos;s hands, the new
          metrics measure the developer&apos;s{' '}
          <strong className="text-text-primary">cascade</strong> — the flow of
          tokens between operator and model. Four pillars define it:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Input</strong> — tokens you
            send to the model.
          </li>
          <li>
            <strong className="text-text-primary">Output</strong> — tokens the
            model generates back.
          </li>
          <li>
            <strong className="text-text-primary">Cache-read</strong> — cached
            tokens reused from prior context (prompt caching).
          </li>
          <li>
            <strong className="text-text-primary">Cache-write</strong> — new
            tokens written to cache for future reuse.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          From these four integers, three derived metrics capture the shape of
          an operator&apos;s efficiency:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Yield (Υ)</strong> ={' '}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              (cache_read × output) / input²
            </code>
            . The headline metric. It measures token-cascade efficiency —
            whether signal is compounding or tokens are being burned. A high
            yield means the operator is reusing cached context and converting
            input into useful output. A low yield means input is being wasted.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Cache hit rate</strong> ={' '}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              cache_read / (cache_read + cache_write)
            </code>
            . How well you reuse context. A high cache hit rate means
            you&apos;re building on prior turns instead of re-explaining
            everything from scratch. It&apos;s the AI-era equivalent of not
            repeating yourself — but at the context layer, not the code layer.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Leverage</strong> ={' '}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              cache_read / input
            </code>
            . How much cached context amplifies your input. A leverage of 10
            means every input token is backed by ten cached tokens — the
            operator has built a rich context that the model can draw on. This
            is the metric that replaces &ldquo;hours&rdquo;: it measures how
            much mileage you get from each token you spend.
          </p>
        </div>
      </section>

      {/* ── Tool reviews ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          7 tools reviewed
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Here are the seven tools that matter for measuring AI-assisted
          developer performance in 2026 — ranked roughly by how directly they
          measure the operator, not the model.
        </p>

        {/* SigRank */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            1. SigRank
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            Operator-scoring · token-based · privacy-preserving
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> The only
            tool that scores the <em>operator</em>, not the model. Computes
            yield (Υ), cache hit rate, leverage, compression ratio, and SNR from
            four token integers read locally. Platform-neutral — works across
            Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms.
            Privacy-preserving: reads token counts only, never prompt content;
            snapshots are ed25519-signed on-device. Bundles ccusage, tokscale,
            and the Token Dashboard. Publishes a live cross-platform leaderboard
            with class tiers (IGNITER → TRANSMITTER).
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong> Newer
            ecosystem; requires a CLI install or MCP server setup. The scoring
            ruleset (RS.xx weights) is server-side, so you can&apos;t fully
            audit the headline number locally. Focused on token efficiency, not
            code quality or business impact.
          </p>
          <p className="mt-2 font-sans text-xs text-text-muted">
            Install:{' '}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-gold">
              npx sigrank
            </code>{' '}
            ·{' '}
            <Link
              href="/methodology"
              className="text-gold underline underline-offset-2"
            >
              Methodology
            </Link>
          </p>
        </div>

        {/* ccusage */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            2. ccusage
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            Token log parser · Claude Code · CLI
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> A clean
            CLI that reads Claude Code token usage from local logs and prints
            the four pillars (input, output, cache-read, cache-write). No
            account, no cloud, no telemetry. The raw data layer that
            token-based measurement is built on. SigRank bundles it so you
            don&apos;t need a separate install.
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong> Claude
            Code only — no support for ChatGPT, Gemini, or Cursor logs. Raw
            numbers only; no derived metrics, no scoring, no leaderboard. You
            get the four integers and nothing else. It&apos;s a data source, not
            an analytics layer.
          </p>
        </div>

        {/* WakaTime */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            3. WakaTime
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            Time tracking · IDE plugins · dashboards
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> Mature,
            widely-adopted time tracker with plugins for every major editor.
            Good for measuring <em>active coding time</em>, language breakdown,
            and project allocation. Useful for the &ldquo;how long did I
            sit&nbsp;down&rdquo; question that token metrics don&apos;t answer.
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong> Measures
            hours, not token efficiency. Can&apos;t distinguish an
            AI-assisted session from a hand-typed one. In the AI era, its core
            metric — time-in-editor — is increasingly decoupled from output.
            Best used as a complement to token-based tools, not a replacement.
          </p>
        </div>

        {/* Cursor */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            4. Cursor
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            AI code editor · built-in usage stats
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> The
            leading AI-native editor. Shows per-session token usage and request
            counts in its settings panel, giving developers a rough sense of
            how much they&apos;re spending. Excellent editing experience; the
            tool most AI-first developers actually live in.
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong> Metrics
            are usage-oriented (tokens consumed, requests made), not
            efficiency-oriented (no yield, no cache hit rate, no leverage).
            Locked to the Cursor platform — no cross-platform comparison.
            No operator scoring, no leaderboard, no way to benchmark against
            the field.
          </p>
        </div>

        {/* GitHub Copilot */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            5. GitHub Copilot
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            AI pair programmer · IDE integration · org dashboards
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> The most
            widely deployed AI coding tool. GitHub&apos;s org-level dashboards
            show acceptance rate, suggestions shown vs. accepted, and active
            users — useful for adoption tracking across a team. Deep
            integration with the GitHub workflow (PRs, issues, code review).
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong> No
            operator-level efficiency scoring. Acceptance rate measures whether
            you took a suggestion, not whether the overall cascade was
            efficient. No cache-read or cache-write visibility — Copilot&apos;s
            telemetry doesn&apos;t expose the prompt-caching layer where most
            efficiency is won or lost.
          </p>
        </div>

        {/* LMSYS */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            6. LMSYS Chatbot Arena
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            Model ranking · human preference · Elo
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> The gold
            standard for ranking AI <em>models</em> by human preference.
            Blind, head-to-head, Elo-rated. If you want to know whether GPT-5.4
            beats Claude 4.5 for coding tasks, LMSYS is the source.
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong> Ranks
            models, not operators. Two developers using the same model can have
            wildly different efficiency — LMSYS can&apos;t see that. It answers
            &ldquo;which model is best?&rdquo; not &ldquo;which developer uses
            their model best?&rdquo; Complementary to SigRank, not a
            competitor.
          </p>
        </div>

        {/* Token Dashboard */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            7. Token Dashboard (tokendash)
          </h3>
          <p className="mt-1 font-sans text-xs text-text-muted">
            Token visualization · bundled with SigRank · local
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Strengths:</strong> Visualizes
            the four token pillars over time — input, output, cache-read,
            cache-write — as charts and trends. Helps you see when your cache
            hit rate drops or your input spikes. Bundled with SigRank so
            there&apos;s nothing extra to install. Local-first; no data leaves
            your machine.
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Weaknesses:</strong>
            Visualization only — no scoring, no leaderboard, no class tier.
            You still need SigRank (or manual calculation) to turn the charts
            into a yield number. Most useful as the &ldquo;eyes&rdquo; on top of
            ccusage&apos;s raw data and SigRank&apos;s scoring.
          </p>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          At a glance
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-bg-border bg-bg-elevated font-mono text-text-muted">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Unit measured</th>
                <th className="px-4 py-3">Operator score?</th>
                <th className="px-4 py-3">Cross-platform?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border-subtle text-text-secondary">
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">SigRank</td>
                <td className="px-4 py-3">Token cascade (Υ)</td>
                <td className="px-4 py-3 text-gold">Yes</td>
                <td className="px-4 py-3 text-gold">Yes (15+)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">ccusage</td>
                <td className="px-4 py-3">Raw token counts</td>
                <td className="px-4 py-3 text-text-muted">No</td>
                <td className="px-4 py-3 text-text-muted">Claude only</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">WakaTime</td>
                <td className="px-4 py-3">Time in editor</td>
                <td className="px-4 py-3 text-text-muted">No</td>
                <td className="px-4 py-3 text-gold">Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">Cursor</td>
                <td className="px-4 py-3">Token usage</td>
                <td className="px-4 py-3 text-text-muted">No</td>
                <td className="px-4 py-3 text-text-muted">Cursor only</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">Copilot</td>
                <td className="px-4 py-3">Acceptance rate</td>
                <td className="px-4 py-3 text-text-muted">No</td>
                <td className="px-4 py-3 text-text-muted">GitHub only</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">LMSYS</td>
                <td className="px-4 py-3">Model preference</td>
                <td className="px-4 py-3 text-text-muted">No (models)</td>
                <td className="px-4 py-3 text-gold">Yes</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-bold text-text-primary">Token Dashboard</td>
                <td className="px-4 py-3">Token trends</td>
                <td className="px-4 py-3 text-text-muted">No</td>
                <td className="px-4 py-3 text-gold">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Conclusion ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The operator is the new unit of measurement
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For three decades, we measured developers by what they typed and how
          long they sat at the keyboard. The AI coding era made both proxies
          obsolete. When the model writes the code, lines of code measure the
          model. When a fifteen-minute session beats an eight-hour one, hours
          measure stamina, not skill.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The tools that win in 2026 are the ones that measure the{' '}
          <strong className="text-text-primary">cascade</strong> — the flow of
          tokens between operator and model — and that score the{' '}
          <strong className="text-text-primary">operator</strong>, not the
          model. Yield, cache hit rate, and leverage are the new LOC, commit
          count, and hours. They capture what actually matters: is signal
          compounding, or are tokens being burned?
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Of the seven tools reviewed, only SigRank scores the operator
          directly, across platforms, with privacy preserved by architecture.
          The rest measure pieces — raw counts, time, usage, model preference,
          trends. Useful, but incomplete. The operator is the new unit of
          measurement, and the tools that measure it will define how
          engineering teams evaluate performance for the next decade.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Ready to see your cascade?{' '}
          <Link
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Score your yield →
          </Link>
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3 border-t border-bg-border-subtle pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="text-base text-text-secondary">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/alternatives/ai-coding-metrics" className="text-gold underline underline-offset-2">
            AI Coding Metrics Tools
          </Link>
          {' · '}
          <Link href="/ai-coding-metrics" className="text-gold underline underline-offset-2">
            AI Coding Metrics
          </Link>
          {' · '}
          <Link href="/tools/yield-calculator" className="text-gold underline underline-offset-2">
            Yield Calculator
          </Link>
        </p>
      </section>
    </div>
  )
}
