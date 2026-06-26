import React from 'react'
import Link from 'next/link'

interface Step {
  n: number
  kicker: string
  title: string
  body: string
}

/**
 * HowItWorks — the four-step "From telemetry to rank" grid (INSTALL · CONNECT ·
 * COMPUTE · RANK) + a CLI quickstart block with the real install command, all CLI
 * commands, and the MCP tool table.
 *
 * MCP-first positioning (owner 2026-06-23): leads with the SigRank agent (MCP) +
 * its zero-paste `tokenpull` reader as the primary path; ccusage/tokscale paste is
 * the FALLBACK, not the headline.
 *
 * CLI commands and MCP tools are real — sigrank-mcp@0.11.0 is the live package.
 */
const STEPS: Step[] = [
  {
    n: 1,
    kicker: 'INSTALL',
    title: 'Install the SigRank agent',
    body: 'npm install -g sigrank-mcp — then run sigrank-mcp to open the tabbed TUI, or wire it into Claude Code or any MCP client with one JSON config line.',
  },
  {
    n: 2,
    kicker: 'CONNECT',
    title: 'It reads your tokens on-device',
    body: 'The agent reads local session logs from 14+ platforms — Claude Code, Codex, Amp, Gemini CLI, Copilot CLI, Goose, Kilo, and more — and counts the four token pillars across 7d / 30d / 90d / all-time. It never reads your prompts; only the counts.',
  },
  {
    n: 3,
    kicker: 'COMPUTE',
    title: 'Your cascade, derived locally',
    body: 'From those four pillars it derives Υ Yield, SNR, Leverage, Velocity & 10xDEV on-device, and hands back your cascade class. Only the four counts ever leave your machine.',
  },
  {
    n: 4,
    kicker: 'RANK',
    title: 'Publish to your profile',
    body: 'One zero-paste call publishes your snapshot; the server re-scores authoritatively and your operator profile updates live across all four windows. No agent yet? Paste your ccusage or tokscale output as a fallback.',
  },
]

function Code({ children }: { children: string }) {
  return (
    <code className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-[11px] text-text-accent">
      {children}
    </code>
  )
}

const CLI_COMMANDS = [
  {
    cmd: 'sigrank-mcp',
    args: '',
    desc: 'Opens the full tabbed TUI — Dashboard / Trends / Compare / Board / Watch / Connect. Default when run in a terminal. Keys: 1–6 or ← → switch tabs, R refresh, Q quit.',
  },
  {
    cmd: 'sigrank-mcp',
    args: 'tui',
    desc: 'Same as above — explicit TUI launch.',
  },
  {
    cmd: 'sigrank-mcp',
    args: 'me',
    desc: 'Your local cascade across all four time windows (7d / 30d / 90d / all-time). Reads on-device, zero paste.',
  },
  {
    cmd: 'sigrank-mcp',
    args: 'board',
    desc: 'Live leaderboard from signalaf.com — auto-refreshes every 30s.',
  },
  {
    cmd: 'sigrank-mcp',
    args: 'compare',
    desc: 'Source audit — reads all four verifiers (tokenpull / ccusage / token-dash / tokscale) and shows delta % between them.',
  },
  {
    cmd: 'sigrank-mcp',
    args: 'watch',
    desc: 'Live cascade meter — re-reads your logs on every poll and shows what moved.',
  },
  {
    cmd: 'sigrank-mcp',
    args: '--help',
    desc: 'Full command reference with all flags.',
  },
]

const MCP_TOOLS = [
  { name: 'tokenpull', desc: 'On-device read → 4-window cascade. Zero paste, token-only.' },
  { name: 'tokenpull_submit', desc: 'Read local logs + publish to the board in one call.' },
  { name: 'tokenpull_compare', desc: 'All four sources side-by-side with delta % vs tokenpull.' },
  { name: 'rank_paste', desc: 'Score a ccusage / tokscale paste locally. Returns Υ + card.' },
  { name: 'rank_windows', desc: 'Score all four windows from a dashboard paste at once.' },
  { name: 'get_leaderboard', desc: 'Live board from signalaf.com.' },
  { name: 'get_operator', desc: "One operator's live profile by codename." },
  { name: 'watch_tokenpull', desc: 'Streaming cascade snapshot — diffs on each poll.' },
]

export function HowItWorks() {
  return (
    <section className="my-16 flex flex-col gap-20">

      {/* ── Four-step flow ── */}
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-gold">⊙ How it works</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          From telemetry to rank in under a minute
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          Install the SigRank agent and it does the rest — reads your session token counts
          on-device, derives your cascade locally, and publishes a snapshot the server
          re-scores. Zero paste, and it never reads your prompts or replies; only the four
          token counts ever leave your machine.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-bg-border-subtle bg-bg-surface p-7 transition-colors hover:border-bg-border"
            >
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 font-mono text-base font-semibold text-gold">
                {s.n}
              </div>
              <div className="mb-3 font-mono text-xs font-medium tracking-wide text-gold">
                {s.kicker}
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CLI quickstart ── */}
      <div className="flex flex-col gap-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-gold">⊙ CLI quickstart</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">
            Install once. Run anywhere.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            The agent ships as a CLI tool and an MCP server in the same package. In a terminal it
            opens the interactive TUI; wired into your AI client it exposes MCP tools your agent
            can call directly. Non-TTY (piped) mode starts the MCP server automatically.
          </p>
        </div>

        {/* install block */}
        <pre className="overflow-x-auto rounded-xl border border-bg-border bg-bg-base px-5 py-4 font-mono text-[12px] leading-loose text-text-secondary">
{`# install globally
npm install -g sigrank-mcp

# or run without installing
npx sigrank-mcp

# wire into Claude Code  →  .mcp.json
{
  "mcpServers": {
    "sigrank": { "command": "npx", "args": ["sigrank-mcp"] }
  }
}`}
        </pre>

        {/* CLI commands */}
        <div>
          <div className="mb-3 font-mono text-xs uppercase tracking-wide text-text-muted">
            CLI commands
          </div>
          <div className="flex flex-col divide-y divide-bg-border-subtle rounded-xl border border-bg-border bg-bg-surface overflow-hidden">
            {CLI_COMMANDS.map((c) => (
              <div
                key={c.cmd + c.args}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3"
              >
                <span className="shrink-0 font-mono text-[12px] font-bold text-text-primary">
                  {c.cmd}
                </span>
                {c.args && (
                  <span className="shrink-0 font-mono text-[12px] font-semibold text-gold">
                    {c.args}
                  </span>
                )}
                <span className="text-xs leading-snug text-text-muted">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MCP tools */}
        <div>
          <div className="mb-3 font-mono text-xs uppercase tracking-wide text-text-muted">
            MCP tools — callable by your AI client
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MCP_TOOLS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-1.5 rounded-lg border border-bg-border bg-bg-surface p-3"
              >
                <Code>{t.name}</Code>
                <span className="text-xs leading-relaxed text-text-muted">{t.desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-sans text-[11px] text-text-dim">
            Full reference:{' '}
            <Link
              href="/wiki/local-agent"
              className="text-text-accent underline-offset-2 hover:underline"
            >
              The local agent (MCP) wiki page
            </Link>
            {' '}·{' '}
            <Code>sigrank-mcp --help</Code> in your terminal.
          </p>
        </div>
      </div>

    </section>
  )
}
