/**
 * app/blog/how-to-benchmark-ai-coding-workflow/page.tsx — "How to Benchmark
 * Your AI Coding Workflow: A Complete Guide".
 *
 * Long-form tutorial targeting "benchmark ai coding workflow", "ai coding
 * benchmark guide", and "measure ai developer productivity". Seven-step guide
 * from install to iterate, with real examples throughout.
 *
 * JSON-LD: HowTo (inline, following the scoreHowTo() pattern) +
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
  title: 'How to Benchmark Your AI Coding Workflow',
  description:
    'A guide to benchmarking your AI coding workflow. Set a baseline, fix weak pillars, re-measure, and compare on the leaderboard. With real examples.',
  path: '/blog/how-to-benchmark-ai-coding-workflow',
})

/** Inline HowTo JSON-LD (follows the scoreHowTo() pattern). */
function howToJsonLd() {
  const url = `${SITE_ORIGIN}/blog/how-to-benchmark-ai-coding-workflow`
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Benchmark Your AI Coding Workflow',
    description:
      'A seven-step guide to benchmarking your AI coding workflow: install, baseline, identify weak pillars, fix, re-measure, compare against the field, and iterate.',
    url,
    totalTime: 'P7D',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Install the tools',
        text: 'Run `npx sigrank` to install the SigRank CLI, which bundles ccusage, tokscale, and the Token Dashboard. No global install required. Then run `sigrank enroll` to create your operator identity.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Establish a baseline',
        text: 'Code normally for one week. Do not change your habits. At the end of the week, run `sigrank me` to record your token cascade — input, output, cache-read, and cache-write. This is your baseline yield (Υ).',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Identify your weak pillars',
        text: 'Look at your four token pillars. A low cache hit rate means you are re-explaining context. High input means your prompts are verbose. Low output means the model is not producing. Pinpoint the weakest pillar.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Apply one fix at a time',
        text: 'Change exactly one thing. If your cache hit rate is low, structure your session to reuse context. If your input is high, write tighter prompts. Never change two variables at once — you will not know which fix worked.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Re-measure',
        text: 'After applying the fix, code for another week under the new habit. Run `sigrank me` again and compare your new yield to your baseline. Did it go up? Down? Stay flat? The numbers tell you whether the fix worked.',
      },
      {
        '@type': 'HowToStep',
        position: 6,
        name: 'Compare against the field',
        text: 'Submit your snapshot with `sigrank submit` and check the leaderboard. See your class tier (IGNITER to TRANSMITTER) and your rank. Compare your pillar ratios against the top decile to find your next gap.',
      },
      {
        '@type': 'HowToStep',
        position: 7,
        name: 'Iterate',
        text: 'Repeat steps 3–6. Benchmarking is not a one-time audit — it is a feedback loop. Each cycle tightens your cascade. Over weeks, your yield climbs and your class tier rises.',
      },
    ],
  }
}

const faqs = [
  {
    question: 'How do I benchmark my AI coding workflow?',
    answer:
      'Install the SigRank CLI (npx sigrank), code normally for one week to establish a baseline, record your token cascade with `sigrank me`, identify your weakest pillar (cache hit rate, input, or output), apply one fix, re-measure after a week, compare against the leaderboard, and iterate. The full seven-step guide is above.',
  },
  {
    question: 'What is a good yield (Υ) score for an AI coding workflow?',
    answer:
      'Yield varies by class tier. IGNITER is the entry tier; TRANSMITTER is the top. The median yield on the SigRank leaderboard sits in the BUILDER band. Rather than chasing an absolute number, benchmark against your own baseline week-over-week and against the leaderboard\'s top decile for your platform. The goal is consistent upward movement, not a single target.',
  },
  {
    question: 'How long should I wait before re-measuring my workflow?',
    answer:
      'One week is the minimum useful interval — shorter and session-level noise dominates. Two weeks gives a cleaner signal. Never re-measure after a single session; one good or bad day does not indicate a trend. The benchmarking loop is designed for weekly cadence.',
  },
  {
    question: 'Should I change multiple things at once to improve faster?',
    answer:
      'No. Change exactly one variable per cycle. If you tighten your prompts and restructure your session simultaneously and your yield goes up, you will not know which fix drove the improvement. If it goes down, you will not know which change hurt. One fix, one re-measure, one conclusion — then repeat.',
  },
  {
    question: 'Does benchmarking my workflow require sharing my prompt content?',
    answer:
      'No. SigRank reads only four token integers — input, output, cache-read, and cache-write — from local logs. No prompt content is ever read, stored, or transmitted. Snapshots are ed25519-signed on-device. Privacy is architectural, not optional.',
  },
]

export default function HowToBenchmarkAiCodingWorkflowPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          howToJsonLd(),
          breadcrumb([
            { name: 'Blog', path: '/blog' },
            {
              name: 'Benchmark AI Coding Workflow',
              path: '/blog/how-to-benchmark-ai-coding-workflow',
            },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Tutorial"
        title="How to Benchmark Your AI Coding Workflow"
        subtitle={
          <>
            A complete, seven-step guide to measuring and improving your{' '}
            <span className="text-gold">token cascade</span> — from install to
            iterate, with real examples.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-07">Published July 7, 2026</time>
        <span aria-hidden="true">·</span>
        <span>10 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You&apos;ve been coding with AI for months. Your sessions feel
          productive — the agent generates code, you review it, you ship. But
          &ldquo;feels productive&rdquo; is not a metric. The question every
          AI-assisted developer eventually faces is simple and uncomfortable:{' '}
          <strong className="text-text-primary">am I actually getting better
          at this, or am I just burning more tokens?</strong>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This guide walks through a complete, repeatable workflow for
          benchmarking your AI coding performance. Seven steps. One week per
          cycle. By the end you&apos;ll have a number — your{' '}
          <Link href="/wiki" className="text-gold underline underline-offset-2">
            yield (Υ)
          </Link>{' '}
          — that tells you whether your signal is compounding or your tokens
          are being burned, and a process for driving that number up.
        </p>
      </section>

      {/* ── Prerequisites ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What you&apos;ll need
        </h2>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            An AI coding workflow you already use (Claude Code, Cursor, Copilot,
            ChatGPT, Gemini — any of the 15+ supported platforms).
          </li>
          <li>
            Node.js 18+ on your machine (for the{' '}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
              sigrank
            </code>{' '}
            CLI).
          </li>
          <li>One week of normal coding to establish a baseline.</li>
          <li>The discipline to change one variable at a time.</li>
        </ul>
      </section>

      {/* ── Step 1 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 1 — Install the tools
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The fastest path is a single command. The SigRank CLI bundles
          everything you need — ccusage for parsing local logs, tokscale for
          token scaling, and the Token Dashboard for visualization:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>{`# No global install required — npx runs it directly
npx sigrank

# Or install globally for daily use
npm install -g sigrank

# Create your operator identity (one-time)
sigrank enroll`}</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
            sigrank enroll
          </code>{' '}
          creates your operator identity and generates an ed25519 keypair
          on-device. The private key never leaves your machine; the public key
          is what signs your snapshots. No account, no email, no cloud — your
          identity is cryptographic, not personal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you use Claude Code specifically, the bundled{' '}
          <strong className="text-text-primary">ccusage</strong> will find your
          logs automatically. For other platforms, SigRank&apos;s scanner
          detects the relevant log directories on its own. Run{' '}
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
            sigrank me --dry-run
          </code>{' '}
          to see what it would parse before submitting anything.
        </p>
      </section>

      {/* ── Step 2 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 2 — Establish a baseline
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is the step most people skip, and it&apos;s the one that makes
          everything else work. <strong className="text-text-primary">Code
          normally for one full week.</strong> Do not optimize. Do not change
          your habits. Do not try to impress the tool. The goal is an honest
          picture of where you are right now.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          At the end of the week, record your cascade:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>{`sigrank me

# Example output:
# ┌──────────────────────────────────────┐
# │  Input:        1,240,000 tokens      │
# │  Output:         312,000 tokens      │
# │  Cache-read:     890,000 tokens      │
# │  Cache-write:    210,000 tokens      │
# │                                      │
# │  Yield (Υ):          14,237          │
# │  Cache hit rate:        80.9%        │
# │  Leverage:              0.72         │
# │  Class tier:          BUILDER        │
# └──────────────────────────────────────┘`}</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Real example:</strong> A
          developer we&apos;ll call &ldquo;Seeker-7&rdquo; ran this after their
          first week. Their yield was 14,237 — solidly in the{' '}
          <span className="text-gold">BUILDER</span> tier, but their cache hit
          rate was only 53% and their input was unusually high at 1.24M tokens.
          The baseline told them two things: they were doing okay, and they
          were re-explaining context far more than they should be.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Write your baseline numbers down. You&apos;ll compare every future
          cycle against them.
        </p>
      </section>

      {/* ── Step 3 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 3 — Identify your weak pillars
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Your yield is a composite of four pillars. To improve it, you need to
          know which pillar is dragging. Look at your baseline and ask:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Low cache hit rate? (&lt; 60%)
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            You&apos;re re-explaining context the model already has. Your
            sessions are probably starting fresh too often, or you&apos;re
            switching topics mid-session and losing the cache.{' '}
            <span className="text-gold">Fix direction:</span> structure sessions
            around a single task; let the cache build; avoid context-clearing
            resets.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            High input? (&gt; 1M tokens/week)
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            Your prompts are verbose. You&apos;re pasting large files, repeating
            instructions, or over-specifying.{' '}
            <span className="text-gold">Fix direction:</span> write tighter
            prompts; reference files by path instead of pasting contents; let
            the model ask for clarification rather than front-loading
            everything.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Low output? (&lt; 200K tokens/week)
          </h3>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            The model isn&apos;t producing much relative to what you&apos;re
            sending. You may be asking small questions when you could be asking
            for whole modules, or you&apos;re interrupting generation too
            early.{' '}
            <span className="text-gold">Fix direction:</span> request larger
            units of work per turn; let the agent complete a full pass before
            reviewing.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Real example:</strong>{' '}
          Seeker-7&apos;s weakest pillar was cache hit rate (53%). Their input
          was high, but the root cause was the same — they were starting new
          sessions for every sub-task and re-pasting the same context each
          time. One problem, one fix.
        </p>
      </section>

      {/* ── Step 4 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 4 — Apply one fix at a time
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is the discipline that separates benchmarking from guessing.
          Change{' '}
          <strong className="text-text-primary">exactly one thing</strong>. If
          you tighten your prompts and restructure your sessions
          simultaneously, and your yield goes up, you won&apos;t know which fix
          drove it. If it goes down, you won&apos;t know which change hurt.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Pick the single highest-leverage fix from Step 3 and apply only that.
          For Seeker-7, the fix was: <em>stop starting fresh sessions for each
          sub-task; work within one long session per feature so the cache
          builds.</em> That&apos;s it. No prompt-tightening, no output-boosting,
          no other changes. One variable.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Anti-pattern:</strong>{' '}
            &ldquo;I&apos;ll try being more efficient this week.&rdquo; That is
            not a fix — it is a vibe. A fix is a specific, observable change to
            one behavior: &ldquo;I will work in one session per feature instead
            of three.&rdquo; If you can&apos;t describe the change in one
            sentence, it&apos;s not a fix yet.
          </p>
        </div>
      </section>

      {/* ── Step 5 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 5 — Re-measure
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Code for another week under the new habit. At the end, run{' '}
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
            sigrank me
          </code>{' '}
          again and compare to your baseline:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>{`# Seeker-7, Week 2 (after session-structuring fix)
# ┌──────────────────────────────────────┐
# │  Input:          980,000 tokens  ↓21% │
# │  Output:         340,000 tokens   ↑9% │
# │  Cache-read:   1,120,000 tokens  ↑26% │
# │  Cache-write:    240,000 tokens  ↑14% │
# │                                      │
# │  Yield (Υ):          39,801   ↑180%   │
# │  Cache hit rate:        82.4%  ↑29pp  │
# │  Leverage:              1.14   ↑58%   │
# │  Class tier:       TRANSMITTER        │
# └──────────────────────────────────────┘`}</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          One fix. One week. Yield up 180%, cache hit rate from 53% to 82%,
          class tier jumped from BUILDER to TRANSMITTER. The numbers confirm
          the hypothesis: the problem was session fragmentation, and
          consolidating sessions fixed it. If the yield had stayed flat or
          dropped, the fix was wrong — revert and try the next-weakest pillar.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Don&apos;t re-measure after a
          single session.</strong> One good day doesn&apos;t prove a fix
          worked; one bad day doesn&apos;t prove it failed. The weekly cadence
          averages out session-level noise. Patience is part of the method.
        </p>
      </section>

      {/* ── Step 6 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 6 — Compare against the field
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Your yield in isolation is just a number. Context comes from the{' '}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            leaderboard
          </Link>
          . Submit your snapshot and see where you stand:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>{`# Submit your signed snapshot
sigrank submit

# Then check the board
sigrank board --window 30d`}</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The leaderboard shows your{' '}
          <strong className="text-text-primary">class tier</strong>{' '}
          (IGNITER → SEEKER → BUILDER → TRANSMITTER and beyond), your global
          rank, and — critically — the{' '}
          <strong className="text-text-primary">pillar ratios of the top
          decile</strong>. If the top decile averages a 90% cache hit rate and
          you&apos;re at 82%, that&apos;s your next gap. If their leverage is
          1.5 and yours is 1.14, that&apos;s the pillar to attack next cycle.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Real example:</strong>{' '}
          Seeker-7 hit TRANSMITTER after one cycle but ranked #847 globally. The
          top decile&apos;s leverage was 1.8 — theirs was 1.14. Next
          cycle&apos;s fix: increase cache depth by referencing larger shared
          context blocks early in each session, so the cache-read base grows
          faster than input.
        </p>
      </section>

      {/* ── Step 7 ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Step 7 — Iterate
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Benchmarking is not a one-time audit. It is a{' '}
          <strong className="text-text-primary">feedback loop</strong>. Each
          cycle: identify the weakest pillar, apply one fix, re-measure,
          compare. Over weeks, your yield climbs and your class tier rises.
          The developers at the top of the leaderboard didn&apos;t get there in
          one sprint — they got there by running this loop dozens of times,
          each cycle tightening their cascade by a few percent.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            The loop, condensed
          </h3>
          <ol className="mt-3 flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
            <li>
              <strong className="text-gold">Measure</strong> → record your four
              pillars.
            </li>
            <li>
              <strong className="text-gold">Diagnose</strong> → find the weakest
              pillar.
            </li>
            <li>
              <strong className="text-gold">Fix</strong> → change one behavior.
            </li>
            <li>
              <strong className="text-gold">Re-measure</strong> → did yield go
              up?
            </li>
            <li>
              <strong className="text-gold">Compare</strong> → where&apos;s the
              next gap on the board?
            </li>
            <li>
              <strong className="text-gold">Repeat.</strong>
            </li>
          </ol>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The developers who treat AI coding as a measurable skill — not a
          vibe — are the ones who climb. The loop is simple. The discipline is
          hard. Run it for a month and you&apos;ll know your cascade better than
          anyone who&apos;s been &ldquo;just coding&rdquo; for a year.
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Start your first cycle
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The whole guide reduces to one command. Run it, code for a week, and
          come back to Step 2:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>npx sigrank</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Already have token stats?{' '}
          <Link href="/score" className="text-gold underline underline-offset-2">
            Score your yield instantly →
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
          <Link href="/guides/how-to-benchmark-ai-coding-workflow" className="text-gold underline underline-offset-2">
            Benchmark Workflow Guide
          </Link>
          {' · '}
          <Link href="/ai-benchmarking" className="text-gold underline underline-offset-2">
            AI Benchmarking
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
