import React from 'react'
import Link from 'next/link'
import { CopyButton } from '@/components/marketing/CopyButton'
import { TuiBoardMockup } from '@/components/marketing/TuiBoardMockup'

/**
 * HowItWorks — the landing "how to use SigRank" section.
 *
 * 3-step quickstart (owner 2026-06-27): Install → Sign in → Submit.
 * Three command cards with copy buttons + TUI mockup. Below: the agent
 * option callout for users who don't want to leave their AI client.
 *
 * The full CLI command reference + MCP tool table live on the wiki
 * (SignalIntegrity.tsx) — the landing keeps it clean: three commands, three cards.
 */

/** A command line with a copy button — the tokscale-style quickstart unit. */
function CommandCard({
  kicker,
  title,
  command,
  note,
  children,
}: {
  kicker: string
  title: string
  command: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-bg-border-subtle bg-bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">{kicker}</span>
        <h3 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">{title}</h3>
      </div>
      {/* command + copy */}
      <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-base px-4 py-3">
        <code className="flex-1 overflow-x-auto font-mono text-sm font-semibold text-text-accent sm:text-base">
          {command}
        </code>
        <CopyButton text={command} />
      </div>
      {note && <p className="text-sm leading-relaxed text-text-secondary">{note}</p>}
      {/* visual */}
      {children}
    </div>
  )
}

export function HowItWorks() {
  return (
    <section className="my-16 flex flex-col gap-10">

      {/* ── Section header ── */}
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-gold">⊙ How it works</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Three commands. That&apos;s it.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          The SigRank agent reads your local AI session logs on-device, derives your token cascade,
          and publishes to the board. No paste, no prompts read — only the four token counts leave
          your machine. ccusage, tokscale, and tokendash are bundled — no separate installs.
        </p>
      </div>

      {/* ── Three-card quickstart ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CommandCard
          kicker="Step 1"
          title="Install"
          command="npm install -g sigrank"
          note="Pulls the agent + ccusage + tokscale + tokendash in one install. Node ≥18, macOS + Linux."
        >
          <TuiBoardMockup />
        </CommandCard>

        <CommandCard
          kicker="Step 2"
          title="Sign in"
          command="sigrank enroll"
          note={'Paste a connect code from signalaf.com → Settings → "New key". Binds your device to your operator identity.'}
        >
          <TuiBoardMockup />
        </CommandCard>

        <CommandCard
          kicker="Step 3"
          title="Submit to the board"
          command="sigrank submit"
          note="Signs + publishes your cascade. Your rank updates live on signalaf.com."
        >
          <TuiBoardMockup highlightYou />
        </CommandCard>
      </div>

      {/* ── Agent option ── */}
      <div className="rounded-xl border border-bg-border bg-bg-surface px-5 py-4">
        <div className="font-mono text-xs uppercase tracking-wide text-gold">Or let your AI agent do it</div>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Don&apos;t want to leave your agent? Just tell it to run{' '}
          <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">npx sigrank</code>{' '}
          to see your cascade, or{' '}
          <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">npx sigrank submit</code>{' '}
          to publish (sign in once first with{' '}
          <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">npx sigrank enroll</code>).
          It reads your logs, derives the cascade, and submits — you don&apos;t paste anything. For
          direct tool calls, wire it as an MCP server — see the{' '}
          <Link href="/wiki/local-agent" className="text-text-accent underline-offset-2 hover:underline">
            local agent wiki page
          </Link>.
        </p>
      </div>

    </section>
  )
}
