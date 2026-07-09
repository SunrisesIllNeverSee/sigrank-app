/**
 * app/alternatives/ai-coding-metrics/page.tsx — "Best AI Coding Metrics Tools (2026)"
 *
 * SEO listicle targeting "ai coding metrics", "ai coding measurement tools",
 * "ai developer metrics". Compares 7 tools that measure AI-assisted coding,
 * positioning SigRank as the only operator-level scoring tool.
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
  title: 'Best AI Coding Metrics Tools (2026)',
  description:
    'The 7 best AI coding metrics tools in 2026. SigRank, ccusage, WakaTime, LMSYS, Cursor, Copilot, and Token Dashboard \u2014 what each measures and best for.',
  path: '/alternatives/ai-coding-metrics',
})

type Tool = {
  name: string
  measures: string
  pros: string[]
  cons: string[]
  pricing: string
  bestFor: string
  featured?: boolean
}

const TOOLS: Tool[] = [
  {
    name: 'SigRank',
    measures:
      'Operator-level token-cascade efficiency — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier.',
    pros: [
      'Scores the operator, not the model — the only tool that ranks the human driving the AI',
      'Platform-neutral: works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms',
      'Privacy-preserving: on-device scanning, token counts only, ed25519-signed submissions',
      'Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison',
      'Bundles ccusage, tokscale, and token-dashboard — one install, full telemetry stack',
    ],
    cons: [
      'Newer ecosystem — leaderboard sample still growing',
      'Requires a CLI install and enrollment to submit',
    ],
    pricing: 'Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)',
    bestFor: 'Operators who want to be scored and ranked, not just measured',
    featured: true,
  },
  {
    name: 'ccusage',
    measures:
      'Claude Code token usage — reads local logs and reports input, output, cache-read, and cache-write counts per session.',
    pros: [
      'Dead simple: reads Claude Code logs locally, no account needed',
      'Accurate token counts straight from the source',
      'SigRank bundles it, so you get both in one install',
    ],
    cons: [
      'Read-only — counts tokens but does not score or rank them',
      'Claude Code only; no multi-platform support',
      'No operator-level efficiency metric or leaderboard',
    ],
    pricing: 'Free (open-source CLI)',
    bestFor: 'Quickly checking your Claude Code token spend',
  },
  {
    name: 'WakaTime',
    measures:
      'Time spent coding — hours, languages, editors, and project breakdowns. Measures activity duration, not token efficiency.',
    pros: [
      'Mature time-tracking product with broad editor support',
      'Good for productivity dashboards and daily/weekly reports',
      'Integrates with GitHub, Jira, and IDEs',
    ],
    cons: [
      'Measures hours, not token efficiency — blind to the cascade',
      'No AI-specific metrics: no cache-read, yield, or compression ratio',
      'Cannot tell you whether your AI usage is compounding or burning',
    ],
    pricing: 'Free tier; Pro from $9/month',
    bestFor: 'Tracking how long you code, not how efficiently you use AI',
  },
  {
    name: 'LMSYS Chatbot Arena',
    measures:
      'AI model quality — ranks LLMs by human preference in blind side-by-side comparisons.',
    pros: [
      'Large-scale, community-driven model rankings',
      'Elo-based leaderboard is well understood and trusted',
      'Useful for choosing which model to use',
    ],
    cons: [
      'Ranks models, not operators — tells you nothing about your own efficiency',
      'No token-cascade metrics, no per-session telemetry',
      'Preference-based, not efficiency-based',
    ],
    pricing: 'Free',
    bestFor: 'Deciding which AI model to use, not how well you use it',
  },
  {
    name: 'Cursor insights',
    measures:
      'Built-in usage stats within the Cursor AI code editor — lines accepted, edits, and tab completions.',
    pros: [
      'Native to Cursor — no extra install if you already use the editor',
      'Shows AI acceptance rates and edit counts',
      'Good for editor-internal productivity feedback',
    ],
    cons: [
      'Locked to Cursor — no data from Claude, ChatGPT, Gemini, or Copilot',
      'No token-cascade metrics (yield, leverage, cache hit rate)',
      'No operator scoring, no leaderboard, no cross-platform comparison',
    ],
    pricing: 'Included with Cursor (Free / Pro from $20/month)',
    bestFor: 'Cursor users wanting quick in-editor feedback',
  },
  {
    name: 'GitHub Copilot metrics',
    measures:
      'Copilot acceptance and suggestion stats surfaced in GitHub organization dashboards.',
    pros: [
      'Built into GitHub for orgs already using Copilot',
      'Team-level adoption and acceptance-rate visibility',
      'No separate tool to install',
    ],
    cons: [
      'GitHub Copilot only — no multi-platform support',
      'Acceptance rate is a weak proxy for efficiency',
      'No token-cascade metrics, no operator-level scoring or ranking',
    ],
    pricing: 'Included with Copilot Business/Enterprise',
    bestFor: 'Org admins monitoring Copilot adoption across a team',
  },
  {
    name: 'Token Dashboard (tokendash)',
    measures:
      'Token usage visualization — charts and breakdowns of input, output, cache-read, and cache-write across sessions.',
    pros: [
      'Clean visual dashboards for token flows',
      'Helps spot cache-heavy vs input-heavy patterns at a glance',
      'Bundled with SigRank alongside ccusage and tokscale',
    ],
    cons: [
      'Visualization only — no scoring, ranking, or operator identity',
      'No leaderboard or cross-operator comparison on its own',
      'Needs a data source (ccusage or sigrank) to feed it',
    ],
    pricing: 'Free (open-source, bundled with SigRank)',
    bestFor: 'Visualizing token flows once you have the raw counts',
  },
]

const FAQS = [
  {
    question: 'What are AI coding metrics tools?',
    answer:
      'AI coding metrics tools measure how you use AI assistants during coding. They range from simple token counters (ccusage) to time trackers (WakaTime) to model-quality leaderboards (LMSYS). SigRank is the only tool that scores the operator — the human driving the AI — by token-cascade efficiency (Υ Yield = cache_read × output / input²) and ranks them on a live, cross-platform leaderboard.',
  },
  {
    question: 'How is SigRank different from ccusage?',
    answer:
      'ccusage reads Claude Code logs and reports raw token counts — it is a measurement tool. SigRank bundles ccusage and adds scoring (Υ Yield, compression ratio, SNR, leverage, velocity), operator identity, ed25519-signed submissions, a live leaderboard with class tiers, and multi-platform support across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms. ccusage tells you what you spent; SigRank tells you how efficiently you spent it and where you rank.',
  },
  {
    question: 'Which AI coding metrics tool is best for measuring developer productivity?',
    answer:
      'It depends on what you mean by productivity. If you mean hours coded, WakaTime is the established choice. If you mean how efficiently you use AI tokens — whether your context is compounding or burning — SigRank is the only tool that measures operator-level token-cascade efficiency and ranks you against other operators on a live leaderboard.',
  },
  {
    question: 'Do these tools read my prompt content?',
    answer:
      'Most do not. SigRank reads token counts only — never the words of your prompts — and signs snapshots with ed25519 before they leave your device. ccusage reads local Claude Code logs. WakaTime tracks editor activity. None of these tools require you to share prompt content to get metrics.',
  },
  {
    question: 'Are AI coding metrics tools free?',
    answer:
      'Most are free or have a free tier. SigRank, ccusage, and Token Dashboard are free and open-source. WakaTime has a free tier with Pro from $9/month. LMSYS Chatbot Arena is free. Cursor insights and GitHub Copilot metrics are included with their respective paid products.',
  },
]

export default function AICodingMetricsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Alternatives', path: '/alternatives' },
            { name: 'AI Coding Metrics Tools', path: '/alternatives/ai-coding-metrics' },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best AI Coding Metrics Tools (2026)"
        subtitle={
          <>
            Seven tools that measure AI-assisted coding, compared. Only one scores the{' '}
            <span className="text-gold">operator</span>, not the model.
          </>
        }
      />

      {/* Intro */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why AI coding metrics matter in 2026
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI coding assistants are now the default — but most developers have no idea whether
          their AI usage is <em>efficient</em>. Are you compounding context across a session,
          or burning fresh tokens every turn? The tools below each measure some slice of
          AI-assisted coding, from raw token counts to time-on-task to model quality. Only
          SigRank scores the <strong className="text-text-primary">operator</strong> — the
          human driving the AI — by token-cascade efficiency and ranks them on a live
          leaderboard.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Here is how the seven leading AI coding metrics tools compare in 2026.
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
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Measures</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Operator scoring?</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Pricing</th>
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
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {t.measures.split('—')[0].trim()}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? <span className="text-gold">Yes — the only one</span> : 'No'}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">{t.pricing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 7 tools, in detail
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
                    editor&apos;s pick
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    What it measures
                  </span>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                    {t.measures}
                  </p>
                </div>

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
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">The verdict</h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you only want to <em>read</em> your token counts, ccusage is the simplest option.
          If you want to <em>track time</em>, WakaTime is mature. If you want to know which
          <em> model</em> is best, check LMSYS. But if you want to know how{' '}
          <strong className="text-text-primary">efficiently you operate AI</strong> — and
          where you rank against every other operator — SigRank is the only tool that scores
          the operator, not the model.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          SigRank bundles ccusage, tokscale, and token-dashboard, so you get the raw counts
          <em> and</em> the scoring in one install:{' '}
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
          <Link href="/ai-coding-metrics" className="text-gold underline underline-offset-2">
            AI Coding Metrics
          </Link>
          {' · '}
          <Link href="/vs/ccusage" className="text-gold underline underline-offset-2">
            vs ccusage
          </Link>
          {' · '}
          <Link href="/vs/wakatime" className="text-gold underline underline-offset-2">
            vs WakaTime
          </Link>
        </p>
      </section>
    </div>
  )
}
