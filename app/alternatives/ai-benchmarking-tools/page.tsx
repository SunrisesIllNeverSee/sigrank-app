/**
 * app/alternatives/ai-benchmarking-tools/page.tsx — "Best AI Benchmarking Tools (2026)"
 *
 * SEO listicle targeting "ai benchmarking tools", "ai benchmark leaderboard",
 * "llm benchmarking". Compares 6 benchmarking tools with the key distinction
 * that most benchmark LLMs while SigRank benchmarks operators.
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
  title: 'Best AI Benchmarking Tools (2026)',
  description:
    'The 6 best AI benchmarking tools in 2026, compared. SigRank, LMSYS Arena, HELM, Open LLM Leaderboard, Chatbot Arena, and HumanEval — what each benchmarks, pros, cons, and best for.',
  path: '/alternatives/ai-benchmarking-tools',
})

type Tool = {
  name: string
  benchmarks: string
  pros: string[]
  cons: string[]
  pricing: string
  bestFor: string
  featured?: boolean
}

const TOOLS: Tool[] = [
  {
    name: 'SigRank',
    benchmarks:
      'Operators — the humans driving AI. Scores token-cascade efficiency (Υ Yield = cache_read × output / input²) and ranks operators on a live, cross-platform leaderboard with class tiers.',
    pros: [
      'The only tool that benchmarks the operator, not the model',
      'Platform-neutral: Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms',
      'Privacy-preserving: on-device scanning, token counts only, ed25519-signed',
      'Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison',
      'Published science: Conservation Law of Commitment (DOI: 10.5281/zenodo.20029607)',
    ],
    cons: [
      'Newer than model-benchmarking leaderboards',
      'Requires CLI install and enrollment to submit',
    ],
    pricing: 'Free (open-source, MIT-licensed)',
    bestFor: 'Benchmarking how efficiently you operate AI, not which model is best',
    featured: true,
  },
  {
    name: 'LMSYS Chatbot Arena',
    benchmarks:
      'AI models — ranks LLMs by human preference in blind side-by-side comparisons using Elo ratings.',
    pros: [
      'Large-scale, community-driven model rankings',
      'Elo-based system is well understood and trusted',
      'Continuously updated as new models are released',
    ],
    cons: [
      'Ranks models, not operators — tells you nothing about your own efficiency',
      'Preference-based, not efficiency-based',
      'No token-cascade metrics or per-session telemetry',
    ],
    pricing: 'Free',
    bestFor: 'Choosing which AI model to use',
  },
  {
    name: 'HELM (Holistic Evaluation of Language Models)',
    benchmarks:
      'AI models — a standardized, multi-metric evaluation framework from Stanford CRFM covering accuracy, calibration, robustness, fairness, efficiency, and more.',
    pros: [
      'Rigorous, multi-dimensional evaluation across many metrics',
      'Academic credibility from Stanford CRFM',
      'Reproducible with public harnesses and datasets',
    ],
    cons: [
      'Evaluates models, not operators',
      'Heavy to run — designed for researchers, not everyday developers',
      'No live leaderboard of human operators',
    ],
    pricing: 'Free (open-source)',
    bestFor: 'Researchers needing rigorous, multi-metric model evaluation',
  },
  {
    name: 'Open LLM Leaderboard (Hugging Face)',
    benchmarks:
      'Open-source LLMs — ranks models on standardized benchmarks (MMLU, ARC, HellaSwag, etc.) hosted on the Hugging Face platform.',
    pros: [
      'The standard leaderboard for open-source model comparison',
      'Wide benchmark coverage with automated evaluation',
      'Community-trusted and frequently updated',
    ],
    cons: [
      'Open-source models only — no closed-model or operator benchmarking',
      'Static benchmarks, not live operator telemetry',
      'No token-cascade or efficiency metrics',
    ],
    pricing: 'Free',
    bestFor: 'Comparing open-source LLMs on standard benchmarks',
  },
  {
    name: 'HumanEval (OpenAI)',
    benchmarks:
      'AI models — a code-generation benchmark where models must pass functional unit tests for programming problems. Measures coding correctness, not operator efficiency.',
    pros: [
      'Simple, well-defined pass@k metric for code generation',
      'Widely adopted as a standard coding benchmark',
      'Easy to run and reproduce',
    ],
    cons: [
      'Benchmarks model code-generation ability, not operator efficiency',
      'Limited to functional correctness — no token-cascade or efficiency dimension',
      'Small benchmark suite (164 problems) can saturate quickly',
    ],
    pricing: 'Free (open-source)',
    bestFor: 'Measuring whether a model can write correct code',
  },
  {
    name: 'Chatbot Arena (LMSYS)',
    benchmarks:
      'AI models — the public-facing side of LMSYS where users vote on model responses in blind A/B tests, feeding the Elo leaderboard.',
    pros: [
      'Real human preferences at scale',
      'Covers coding, math, writing, and general chat tasks',
      'Free and accessible to anyone',
    ],
    cons: [
      'Ranks models by preference, not operators by efficiency',
      'No operator-level metrics, no token cascade, no class tiers',
      'Preference is subjective — not a measure of token efficiency',
    ],
    pricing: 'Free',
    bestFor: 'Crowdsourced model preference ranking',
  },
]

const FAQS = [
  {
    question: 'What are AI benchmarking tools?',
    answer:
      'AI benchmarking tools measure and rank AI systems. Most — like LMSYS Chatbot Arena, HELM, the Open LLM Leaderboard, and HumanEval — benchmark AI models on quality, correctness, or human preference. SigRank is the only tool that benchmarks the operator (the human driving the AI) by token-cascade efficiency (Υ Yield = cache_read × output / input²) and ranks them on a live, cross-platform leaderboard.',
  },
  {
    question: 'What is the difference between benchmarking models and benchmarking operators?',
    answer:
      'Model benchmarking (LMSYS, HELM, HumanEval, Open LLM Leaderboard) answers "which AI model is best?" by testing the model on standardized tasks. Operator benchmarking (SigRank) answers "who uses AI most efficiently?" by measuring the token cascade of the human driving the model — whether their context compounds or burns. The two are complementary: pick the best model, then operate it efficiently.',
  },
  {
    question: 'Is SigRank an LLM benchmark?',
    answer:
      'No. SigRank is an operator benchmark. It does not rank GPT-4, Claude, or Gemini — it ranks the people who use them, by token-cascade efficiency. The same model can produce a Burner or a 10×er depending on how the operator manages context. SigRank measures that difference.',
  },
  {
    question: 'Which AI benchmarking tool should I use?',
    answer:
      'Use LMSYS Chatbot Arena or HELM to choose which model to use. Use the Open LLM Leaderboard to compare open-source models. Use HumanEval to test code-generation correctness. Use SigRank to benchmark how efficiently you operate whichever model you chose — and to see where you rank against other operators.',
  },
  {
    question: 'Are AI benchmarking tools free?',
    answer:
      'Most are free. SigRank, HELM, the Open LLM Leaderboard, HumanEval, and LMSYS Chatbot Arena are all free and open-source. SigRank additionally offers a live operator leaderboard, MCP server integration, and class tiers at no cost.',
  },
]

export default function AIBenchmarkingToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Alternatives', path: '/alternatives' },
            { name: 'AI Benchmarking Tools', path: '/alternatives/ai-benchmarking-tools' },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best AI Benchmarking Tools (2026)"
        subtitle={
          <>
            Six tools that benchmark AI. Most benchmark{' '}
            <span className="text-gold">models</span>. Only one benchmarks the{' '}
            <span className="text-gold">operator</span>.
          </>
        }
      />

      {/* Intro */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The model-vs-operator distinction
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI benchmarking splits into two camps. <strong className="text-text-primary">Model
          benchmarking</strong> asks "which AI model is best?" — LMSYS, HELM, the Open LLM
          Leaderboard, and HumanEval all live here. <strong className="text-text-primary">
          Operator benchmarking</strong> asks "who uses AI most efficiently?" — and SigRank is
          the only tool in this camp. The distinction matters: the same model can produce a
          Burner or a 10×er depending on how the operator manages context. Model benchmarks
          tell you what to drive; operator benchmarks tell you how well you drive it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Here are the six best AI benchmarking tools in 2026, compared.
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
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Benchmarks</th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">Live leaderboard?</th>
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
                    {t.benchmarks.split('—')[0].trim()}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? <span className="text-gold">Yes (operators)</span> : 'Yes (models)'}
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
          The 6 tools, in detail
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
                    operator benchmark
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    What it benchmarks
                  </span>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                    {t.benchmarks}
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
          Model benchmarks and operator benchmarks answer different questions. Use LMSYS, HELM,
          the Open LLM Leaderboard, or HumanEval to decide <em>which model</em> to drive. Then
          use SigRank to measure <em>how well you drive it</em> — your Υ Yield, your class
          tier, and your rank against every other operator. The best stack is both: pick the
          best model, then operate it efficiently.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          SigRank is free and bundles ccusage, tokscale, and token-dashboard:{' '}
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
          <Link href="/ai-benchmarking" className="text-gold underline underline-offset-2">
            AI Benchmarking
          </Link>
          {' · '}
          <Link href="/vs/lmsys-arena" className="text-gold underline underline-offset-2">
            vs LMSYS Arena
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
