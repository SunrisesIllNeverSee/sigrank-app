import React from 'react'
import Link from 'next/link'
import { CopyButton } from '@/components/marketing/CopyButton'
import { TuiBoardMockup } from '@/components/marketing/TuiBoardMockup'

/**
 * HowItWorks — the landing "how to use SigRank" section.
 *
 * Command-forward (tokscale-style, owner 2026-06-26): two big cards side by
 * side — "View your cascade" + "Submit to the board" — each with the command,
 * a copy button, and the TUI board mockup. Below: the agent option callout.
 *
 * The full CLI command reference + MCP tool table live on the wiki
 * (SignalIntegrity.tsx) — the landing keeps it clean: two commands, two cards.
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
          Two commands. That&apos;s it.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          The SigRank agent reads your local AI session logs on-device, derives your token cascade,
          and publishes to the board. No paste, no prompts read — only the four token counts leave
          your machine.
        </p>
      </div>

      {/* ── Two-card quickstart ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommandCard
          kicker="Step 1"
          title="View your cascade"
          command="npx sigrank-mcp"
          note="Opens the tabbed TUI. Reads your local logs (Claude Code, Codex, Gemini CLI, and 11+ others), derives Υ Yield + your cascade on-device. Zero paste."
        >
          <TuiBoardMockup />
        </CommandCard>

        <CommandCard
          kicker="Step 2"
          title="Submit to the board"
          command="npx sigrank-mcp submit"
          note={'Sign in once first with npx sigrank-mcp enroll (paste a key from Settings → "New key"). Then submit signs + publishes your cascade — your rank updates live.'}
        >
          <TuiBoardMockup highlightYou />
        </CommandCard>
      </div>

      {/* ── Agent option ── */}
      <div className="rounded-xl border border-bg-border bg-bg-surface px-5 py-4">
        <div className="font-mono text-xs uppercase tracking-wide text-gold">Or let your AI agent do it</div>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Don&apos;t want to leave your agent? Just tell it to run{' '}
          <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">npx sigrank-mcp me</code>{' '}
          to see your cascade, or{' '}
          <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">npx sigrank-mcp submit</code>{' '}
          to publish (sign in once first with{' '}
          <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">npx sigrank-mcp enroll</code>).
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
