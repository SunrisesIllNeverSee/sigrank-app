/**
 * app/guides/how-to-track-token-cascade/page.tsx
 *
 * SEO guide targeting "token cascade tracking" and "ai token flow analysis".
 * Explains what a token cascade is, the four pillars, how to read each
 * pillar, and how to install sigrank for automatic tracking.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, faqPage } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'How to Track Your Token Cascade',
  description:
    'A complete guide to token cascade tracking. Learn the four pillars \u2014 input, output, cache-read, cache-write \u2014 and how to track them with sigrank.',
  path: '/guides/how-to-track-token-cascade',
})

const howTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to track your token cascade automatically',
  description:
    'Install sigrank to automatically track the four token pillars (input, output, cache-read, cache-write) from your local AI coding logs. Privacy-preserving, on-device, signed submissions.',
  totalTime: 'PT5M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Install sigrank',
      text: 'Run `npm install -g sigrank` or `npx sigrank` to install the CLI. It bundles ccusage for Claude Code log parsing and works across 15+ platforms.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Enroll your operator identity',
      text: 'Run `sigrank enroll` to generate an ed25519 keypair that signs your submissions. Your private key never leaves your device.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Read your token cascade',
      text: 'Run `sigrank me` to read local session logs and count the four pillars across 7d, 30d, 90d, and all-time windows. The cascade is computed on-device.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Submit a signed snapshot',
      text: 'Run `sigrank submit` to publish the four token integers (signed, no prompt content) to the SigRank leaderboard. Use --dry-run to inspect first.',
    },
  ],
}

export default function HowToTrackTokenCascadePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Guides', path: '/guides' },
            { name: 'Track Token Cascade', path: '/guides/how-to-track-token-cascade' },
          ]),
          faqPage([
            {
              question: 'What is a token cascade?',
              answer:
                'A token cascade is the flow of tokens through an AI coding session, described by four pillars: input (tokens you send), output (tokens the model generates), cache-read (cached tokens reused), and cache-write (new tokens written to cache). The cascade shape — not raw volume — determines your efficiency.',
            },
            {
              question: 'What are the four token pillars?',
              answer:
                'Input (fresh tokens sent to the model), output (tokens generated back), cache-read (cached tokens reused from prior context via prompt caching), and cache-write (new tokens written to cache for future reuse). Together they describe the complete token flow of any AI session.',
            },
            {
              question: 'How do I track my token cascade automatically?',
              answer:
                'Install the sigrank CLI (npm: sigrank), which bundles ccusage for local log parsing. Run `sigrank me` to read your session logs on-device and count the four pillars across multiple time windows. Run `sigrank submit` to publish signed snapshots to the leaderboard.',
            },
            {
              question: 'Does sigrank read my prompt content?',
              answer:
                'No. The on-device scanner reads token counts only — never the words of your prompts or replies. Only the four integers leave your machine, signed with ed25519. This is a core privacy guarantee of the SigRank protocol.',
            },
            {
              question: 'Which platforms are supported?',
              answer:
                'SigRank works across Claude Code, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms. The bundled ccusage tool reads Claude Code logs natively; other platforms are supported via the sigrank scanner.',
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="How to Track Your Token Cascade"
        subtitle={
          <>
            Every AI coding session has a{' '}
            <span className="text-gold">cascade</span> — the flow of tokens through four
            pillars. Here&rsquo;s how to read it and track it automatically.
          </>
        }
      />

      {/* ── What a token cascade is ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What a token cascade is
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          When you work with an AI coding agent, tokens flow through your session in four
          directions. That flow — the <strong className="text-text-primary">token
          cascade</strong> — is the complete record of how you and the model exchanged
          signal. Raw token volume tells you how much you spent. The cascade tells you{' '}
          <em>how</em> you spent it: whether you reused context efficiently or burned it
          from scratch every turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The cascade is described by four integers. No content, no prompts, no code — just
          counts. That&rsquo;s what makes it privacy-preserving and platform-neutral: the
          same four numbers work whether you&rsquo;re on Claude Code, Cursor, Copilot, or
          Gemini CLI.
        </p>
      </section>

      {/* ── The four pillars ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The four pillars
        </h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">1. Input</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Fresh tokens you send to the model — new instructions, re-pasted files,
              prompts not served from cache. Every fresh input token costs full price.
              Tracking input tells you how much new context you&rsquo;re injecting versus
              reusing.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">2. Output</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Tokens the model generates back — code, explanations, diffs, refactors. This
              is your gross signal. Tracking output tells you how much the model is
              producing per turn and per session.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">3. Cache-read</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Tokens reused from prior context via prompt caching. When the model already
              has your context loaded, it reads from cache instead of re-processing it.
              High cache-read is the signature of an efficient operator.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">4. Cache-write</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              New tokens written to cache for future reuse. You pay now so the next turn is
              cheaper. A healthy cascade shows cache-write early, then rising cache-read as
              the session compounds.
            </p>
          </div>
        </div>
      </section>

      {/* ── How to read your cascade ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to read your cascade
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The four pillars aren&rsquo;t just counts — they&rsquo;re a diagnostic. Here&rsquo;s
          what each one tells you about your workflow:
        </p>
        <ul className="flex flex-col gap-3">
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              High cache-read, low input
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              You&rsquo;re reusing context well. The model has your codebase loaded and
              you&rsquo;re sending small deltas. This is the ideal — high leverage, low
              cost. Your yield will be high.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              High input, low cache-read
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              You&rsquo;re re-sending context from scratch every turn. Prompt caching
              isn&rsquo;t engaging. This is the most common waste pattern — and the easiest
              to fix by structuring your context window better.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              High output, high cache-read
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The model is productive and has good context. You&rsquo;re getting a lot of
              signal out per unit of fresh input. This is a TRANSMITTER-class cascade.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              Low output, high input
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              You&rsquo;re sending a lot but getting little back. The model is churning,
              re-rolling, or producing low-signal output. Your prompts may need
              restructuring — or your context is too noisy.
            </p>
          </li>
        </ul>
      </section>

      {/* ── What each pillar tells you ──────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What each pillar tells you about your workflow
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Input</strong> reveals how much fresh
          context you inject. If it&rsquo;s high relative to cache-read, you&rsquo;re not
          leveraging prompt caching — your context window strategy needs work.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Output</strong> reveals how much signal the
          model produces. Low output with high input means the model is struggling with
          your context — it&rsquo;s either too noisy, too large, or poorly structured.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Cache-read</strong> reveals how well you
          reuse context. This is the single most important pillar for yield. High
          cache-read means you&rsquo;ve built a stable context window that the model can
          reference cheaply.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Cache-write</strong> reveals how much
          you&rsquo;re investing in future cache hits. High cache-write early in a session
          that converts to high cache-read later is a healthy, compounding cascade.
        </p>
      </section>

      {/* ── How to install sigrank and track automatically ──────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to install sigrank and track automatically
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You don&rsquo;t need to track tokens by hand. The sigrank CLI reads your local
          logs on-device and counts the four pillars automatically. Here&rsquo;s the
          step-by-step:
        </p>
        <ol className="flex flex-col gap-4">
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 1 — Install</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                npm install -g sigrank
              </code>
              . This gives you the full toolkit: ccusage for Claude Code logs, tokscale for
              scaling, and token-dashboard for visualization.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 2 — Enroll</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank enroll
              </code>
              . Generates an ed25519 keypair. Your submissions are cryptographically signed
              so the leaderboard can verify they came from you.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 3 — Read your cascade</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank me
              </code>
              . Reads local session logs and counts the four pillars across 7d, 30d, 90d,
              and all-time windows. You see the full cascade on-device before anything is
              submitted.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Step 4 — Submit</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank submit
              </code>
              . Publishes the four signed integers to the leaderboard. Use{' '}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                --dry-run
              </code>{' '}
              to inspect the payload first. No prompt content ever leaves your machine.
            </p>
          </li>
        </ol>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">What is a token cascade?</dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The flow of tokens through an AI coding session, described by four pillars:
              input, output, cache-read, and cache-write. The cascade shape — not raw
              volume — determines your efficiency.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">What are the four token pillars?</dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Input (fresh tokens sent), output (tokens generated back), cache-read (cached
              tokens reused), and cache-write (new tokens written to cache). They describe
              the complete token flow of any AI session.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I track my cascade automatically?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Install the sigrank CLI and run `sigrank me`. It reads your local session
              logs on-device and counts the four pillars across multiple time windows.
              Run `sigrank submit` to publish signed snapshots.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Does sigrank read my prompt content?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No. The scanner reads token counts only. Only the four integers leave your
              machine, signed with ed25519. This is a core privacy guarantee.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">Which platforms are supported?</dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              SigRank works across Claude Code, ChatGPT, Gemini, Copilot, Cursor, and 15+
              platforms. The bundled ccusage tool reads Claude Code logs natively.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{' '}
          <Link href="/wiki/local-agent" className="text-gold underline underline-offset-2">
            The Local Agent (MCP)
          </Link>
          {' · '}
          <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
            Yield (Υ)
          </Link>
          {' · '}
          <Link href="/guides/how-to-read-your-cascade" className="text-gold underline underline-offset-2">
            Read Your Cascade
          </Link>
        </p>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Next:{' '}
          <Link
            href="/guides/how-to-read-your-cascade"
            className="text-gold underline underline-offset-2"
          >
            How to Read Your Cascade →
          </Link>
        </p>
      </section>
    </div>
  )
}
