/**
 * app/alternatives/token-tracking-tools/page.tsx — "Best Token Tracking Tools (2026)"
 *
 * SEO listicle targeting "token tracking tools", "ai token usage tracker",
 * "llm token counter". Compares 5 token-tracking tools with the angle that
 * most token trackers just count, while SigRank scores and ranks.
 *
 * RSC (no "use client"). Uses withOG, JsonLd (breadcrumb + faqPage), WaveHero,
 * and Tailwind theme tokens from the SEO build spec.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Best Token Tracking Tools (2026)',
  description:
    'The 5 best token tracking tools in 2026. SigRank, ccusage, Tokscale, Token Dashboard, and Tiktoken \u2014 compared on counting, scoring, and multi-platform.',
  path: '/alternatives/token-tracking-tools',
})

type Tool = {
  name: string
  what: string
  pros: string[]
  cons: string[]
  pricing: string
  bestFor: string
  featured?: boolean
}

const TOOLS: Tool[] = [
  {
    name: 'SigRank',
    what:
      'An operator-scoring platform that tracks the four token pillars (input, output, cache-read, cache-write), computes cascade efficiency (Υ Yield = cache_read × output / input²), and ranks operators on a live leaderboard with class tiers.',
    pros: [
      'Tracks tokens AND scores them — the only tool that ranks the operator',
      'Platform-neutral: Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms',
      'Privacy-preserving: on-device scanning, token counts only, ed25519-signed',
      'Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison',
      'Bundles ccusage, tokscale, and token-dashboard — full telemetry stack in one install',
      'MCP server mode for AI-agent self-monitoring',
    ],
    cons: [
      'More setup than a bare counter (enroll + submit)',
      'Leaderboard sample still growing in 2026',
    ],
    pricing: 'Free (open-source, MIT-licensed)',
    bestFor: 'Operators who want their tokens scored and ranked, not just counted',
    featured: true,
  },
  {
    name: 'ccusage',
    what:
      'A CLI that reads Claude Code token logs locally and reports input, output, cache-read, and cache-write counts per session. Pure measurement — no scoring.',
    pros: [
      'Dead simple: reads Claude Code logs, no account needed',
      'Accurate token counts straight from the source',
      'Bundled with SigRank, so you get both in one install',
    ],
    cons: [
      'Counts only — no scoring, no ranking, no operator identity',
      'Claude Code only; no multi-platform support',
      'No cascade metrics (Υ Yield, compression ratio, leverage)',
    ],
    pricing: 'Free (open-source CLI)',
    bestFor: 'Quickly checking your Claude Code token spend',
  },
  {
    name: 'Tokscale',
    what:
      'A token-scaling tool that aggregates token usage across sessions and normalizes metrics for comparison. Bundled with SigRank.',
    pros: [
      'Aggregates and normalizes token usage across many sessions',
      'Useful for comparing operators of very different scales',
      'Free and open-source, bundled with SigRank',
    ],
    cons: [
      'Scaling tool, not a scorer — no Υ Yield, no class tier, no leaderboard',
      'Needs a data source (ccusage or sigrank) to feed it',
      'No operator identity or signed submissions on its own',
    ],
    pricing: 'Free (open-source, bundled with SigRank)',
    bestFor: 'Normalizing token usage across sessions of different scales',
  },
  {
    name: 'Token Dashboard (tokendash)',
    what:
      'A token-visualization tool that turns raw token counts into charts and breakdowns of input, output, cache-read, and cache-write. Bundled with SigRank.',
    pros: [
      'Clean visual dashboards for token flows',
      'Spot cache-heavy vs input-heavy patterns at a glance',
      'Free and open-source, bundled with SigRank',
    ],
    cons: [
      'Visualization only — no scoring, ranking, or operator identity',
      'Needs a data source to feed it',
      'No leaderboard or cross-operator comparison on its own',
    ],
    pricing: 'Free (open-source, bundled with SigRank)',
    bestFor: 'Visualizing token flows once you have the raw counts',
  },
  {
    name: 'Tiktoken',
    what:
      'OpenAI\'s tokenizer library that counts tokens for a given string and model encoding. A building block, not a tracker — it counts tokens in text, not across sessions.',
    pros: [
      'Official OpenAI tokenizer — accurate for OpenAI model encodings',
      'Lightweight library, easy to embed in any app',
      'Good for pre-flight cost estimation before sending a prompt',
    ],
    cons: [
      'Counts tokens in a string, not across sessions — no session tracking',
      'OpenAI encodings only; no Claude, Gemini, or multi-platform support',
      'No scoring, no ranking, no cascade metrics, no leaderboard',
    ],
    pricing: 'Free (open-source)',
    bestFor: 'Counting tokens in a single string before sending a prompt',
  },
]

const FAQS = [
  {
    question: 'What are token tracking tools?',
    answer:
      'Token tracking tools measure how many tokens you send to and receive from AI models. They range from simple counters (Tiktoken, ccusage) to visualizers (Token Dashboard) to full scoring platforms (SigRank). Most just count tokens; SigRank is the only one that scores token-cascade efficiency (Υ Yield = cache_read × output / input²) and ranks operators on a live leaderboard.',
  },
  {
    question: 'What is the best AI token usage tracker?',
    answer:
      'SigRank is the best AI token usage tracker because it goes beyond counting. It tracks the four token pillars (input, output, cache-read, cache-write), computes cascade efficiency metrics (Υ Yield, compression ratio, SNR, leverage, velocity), assigns a class tier, and ranks you on a live, cross-platform leaderboard. It also bundles ccusage, tokscale, and token-dashboard, so you get counting, scaling, visualization, and scoring in one install.',
  },
  {
    question: 'How is SigRank different from ccusage or Tiktoken?',
    answer:
      'ccusage reads Claude Code logs and reports raw token counts — it is a counter. Tiktoken counts tokens in a single string for OpenAI encodings — it is a tokenizer. Neither scores, ranks, or tracks across sessions and platforms. SigRank bundles ccusage and adds operator-level scoring (Υ Yield), a live leaderboard, class tiers, multi-platform support, and MCP integration. Counters tell you what you spent; SigRank tells you how efficiently you spent it.',
  },
  {
    question: 'Do token tracking tools read my prompt content?',
    answer:
      'Most do not. SigRank reads token counts only — never the words of your prompts — and signs snapshots with ed25519 before they leave your device. ccusage reads local Claude Code logs. Tiktoken counts tokens in text you explicitly pass to it. None of these tools require you to share prompt content to track tokens.',
  },
  {
    question: 'Are token tracking tools free?',
    answer:
      'Yes. SigRank, ccusage, Tokscale, Token Dashboard, and Tiktoken are all free and open-source. SigRank additionally offers a live operator leaderboard, MCP server integration, and class tiers at no cost.',
  },
]

export default function TokenTrackingToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Alternatives', path: '/alternatives' },
            { name: 'Token Tracking Tools', path: '/alternatives/token-tracking-tools' },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best Token Tracking Tools (2026)"
        subtitle={
          <>
            Five tools that track AI tokens. Most just{' '}
            <span className="text-gold">count</span>. Only one{' '}
            <span className="text-gold">scores and ranks</span>.
          </>
        }
      />

      {/* Intro */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Counting vs scoring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token tracking splits into two layers. <strong className="text-text-primary">Counting</strong>{' '}
          tells you how many tokens you sent and received — ccusage, Tiktoken, and Token
          Dashboard live here. <strong className="text-text-primary">Scoring</strong> tells you
          whether those tokens compounded or burned — and that is SigRank alone. Knowing you
          spent 500K tokens is useful. Knowing your Υ Yield puts you in the top decile is
          actionable. The best stack does both: count, then score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Here are the five best token tracking tools in 2026, compared.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          At-a-glance comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Tool</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Counts?</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Scores?</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Ranks?</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Multi-platform?</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr
                  key={t.name}
                  className={`border-b border-bg-border-subtle last:border-b-0 ${t.featured ? 'bg-gold/5' : ''}`}
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {t.featured ? <span className="text-gold">{t.name}</span> : t.name}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    <span className="text-gold">Yes</span>
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? <span className="text-gold">Yes</span> : 'No'}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? <span className="text-gold">Yes</span> : 'No'}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? <span className="text-gold">Yes</span> : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 5 tools, in detail
        </h2>
        <div className="flex flex-col gap-5">
          {TOOLS.map((t, i) => (
            <article
              key={t.name}
              className={`flex flex-col gap-4 rounded-lg border p-6 ${
                t.featured
                  ? 'border-gold/40 bg-gold/5'
                  : 'border-bg-border bg-bg-surface'
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-mono text-lg font-bold text-text-primary">
                  {t.featured ? <span className="text-gold">{t.name}</span> : t.name}
                </h3>
                {t.featured && (
                  <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                    counts + scores + ranks
                  </span>
                )}
              </div>

              <p className="font-sans text-sm leading-relaxed text-text-secondary">{t.what}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    Pros
                  </span>
                  <ul className="mt-1 flex flex-col gap-1">
                    {t.pros.map((p) => (
                      <li
                        key={p}
                        className="font-sans text-xs leading-relaxed text-text-secondary"
                      >
                        <span className="text-gold">+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    Cons
                  </span>
                  <ul className="mt-1 flex flex-col gap-1">
                    {t.cons.map((c) => (
                      <li
                        key={c}
                        className="font-sans text-xs leading-relaxed text-text-secondary"
                      >
                        <span className="text-text-muted">−</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    Pricing
                  </span>
                  <p className="mt-1 font-sans text-sm text-text-secondary">{t.pricing}</p>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    Best for
                  </span>
                  <p className="mt-1 font-sans text-sm text-text-secondary">{t.bestFor}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">The verdict</h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you only need to <em>count</em> tokens, ccusage (for Claude Code) or Tiktoken (for
          OpenAI strings) are the simplest options. If you want to <em>visualize</em> them,
          Token Dashboard is clean. But if you want to know whether your tokens are{' '}
          <strong className="text-text-primary">compounding or burning</strong> — and where you
          rank against every other operator — SigRank is the only tool that scores and ranks.
          It bundles the counters, so you lose nothing and gain the scoring layer.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          One install, full stack:{' '}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            npm install -g sigrank
          </code>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-mono text-sm font-bold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/token-telemetry" className="text-gold underline underline-offset-2">
            Token Telemetry
          </Link>
          {' · '}
          <Link href="/vs/ccusage" className="text-gold underline underline-offset-2">
            vs ccusage
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
