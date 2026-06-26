import React from 'react'
import Link from 'next/link'

/**
 * HowItWorks — the landing "how to use SigRank" section.
 *
 * Clean + visual (owner 2026-06-26): npm command → TUI board mockup →
 * 1-2-3 submit steps → "or send it to your agent" one-liner.
 *
 * The full CLI command reference + MCP tool table live on the wiki
 * (SignalIntegrity.tsx) — the landing keeps it simple: install, see the
 * board, submit in 3 steps, or let your agent run the command.
 */

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 font-mono text-sm font-bold text-gold">
          {n}
        </span>
        <h3 className="text-base font-semibold tracking-tight text-text-primary">{title}</h3>
      </div>
      <p className="pl-10 text-sm leading-relaxed text-text-secondary">{children}</p>
    </div>
  )
}

/** A single monospace command line with a $ prompt. */
function Cmd({ children }: { children: string }) {
  return (
    <code className="rounded bg-bg-base px-1.5 py-0.5 font-mono text-[12px] text-text-accent">
      {children}
    </code>
  )
}

// ── TUI board mockup data (realistic — mirrors the live 30d board) ──────────
const BOARD_ROWS = [
  { rank: 1, name: 'TransVaultOrigin', cls: 'TRANSMITTER', yld: '18,436.98', snr: '90.2', lev: '4.27×', vel: '1.63', d10: '0.63', pct: '100%', mv: '▲', you: true },
  { rank: 2, name: 'OrcaVanguard',     cls: 'TRANSMITTER', yld: '12,104.41', snr: '84.1', lev: '3.82×', vel: '1.41', d10: '0.58', pct: '99%',  mv: '▲' },
  { rank: 3, name: 'IronLattice',      cls: 'ARCHITECT',   yld:  '8,902.17', snr: '78.5', lev: '3.10×', vel: '1.29', d10: '0.49', pct: '98%',  mv: '—' },
  { rank: 4, name: 'MeridianScribe',   cls: 'ARCHITECT',   yld:  '6,418.80', snr: '71.3', lev: '2.64×', vel: '1.12', d10: '0.42', pct: '95%',  mv: '▼' },
  { rank: 5, name: 'VectorHerald',     cls: 'POWER',       yld:  '4,771.02', snr: '65.8', lev: '2.21×', vel: '0.98', d10: '0.34', pct: '91%',  mv: '▲' },
  { rank: 6, name: 'DriftPilgrim',     cls: 'POWER',       yld:  '3,209.44', snr: '58.2', lev: '1.87×', vel: '0.84', d10: '0.27', pct: '85%',  mv: '—' },
]

export function HowItWorks() {
  return (
    <section className="my-16 flex flex-col gap-12">

      {/* ── Section header ── */}
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-gold">⊙ How it works</div>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Install. Run. Submit.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          The SigRank agent reads your local AI session logs on-device, derives your token cascade,
          and publishes to the board. No paste, no prompts read — only the four token counts leave
          your machine.
        </p>
      </div>

      {/* ── Install command ── */}
      <div className="flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-wide text-text-muted">Install</div>
        <pre className="overflow-x-auto rounded-xl border border-bg-border bg-bg-base px-5 py-4 font-mono text-[13px] leading-loose text-text-secondary">
{`# install globally
npm install -g sigrank-mcp

# or run without installing
npx sigrank-mcp`}
        </pre>
      </div>

      {/* ── TUI board mockup ── */}
      <div className="flex flex-col gap-3">
        <div className="font-mono text-xs uppercase tracking-wide text-text-muted">
          What you see — the tabbed TUI
        </div>
        <div className="overflow-hidden rounded-xl border border-bg-border bg-bg-surface shadow-lg">
          {/* terminal title bar */}
          <div className="flex items-center gap-2 border-b border-bg-border-subtle bg-bg-base/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 font-mono text-[11px] text-text-dim">sigrank-mcp — Dashboard</span>
          </div>
          {/* tab bar */}
          <div className="flex gap-4 border-b border-bg-border-subtle px-4 py-2 font-mono text-[11px]">
            <span className="text-text-dim">1 Dashboard</span>
            <span className="text-text-dim">2 Trends</span>
            <span className="text-text-dim">3 Compare</span>
            <span className="border-b-2 border-gold pb-1 text-gold">4 Board</span>
            <span className="text-text-dim">5 Watch</span>
            <span className="text-text-dim">6 Connect</span>
          </div>
          {/* board content */}
          <div className="overflow-x-auto px-4 py-3">
            <div className="font-mono text-[11px] text-text-dim">
              Leaderboard&nbsp;&nbsp;window: 30d&nbsp;&nbsp;·&nbsp;&nbsp;sorted by Υ Yield&nbsp;&nbsp;·&nbsp;&nbsp;signalaf.com/leaderboard
            </div>
            {/* column headers */}
            <div className="mt-3 flex gap-2 border-b border-bg-border-subtle pb-2 font-mono text-[10px] uppercase tracking-wide text-text-muted">
              <span className="w-8 text-right">#</span>
              <span className="w-36">Codename</span>
              <span className="w-24">Class</span>
              <span className="w-24 text-right">Υ Yield</span>
              <span className="w-14 text-right">SNR</span>
              <span className="w-14 text-right">Lev</span>
              <span className="w-12 text-right">Vel</span>
              <span className="w-12 text-right">10x</span>
              <span className="w-12 text-right">Pct</span>
              <span className="w-10 text-right">7d↕</span>
            </div>
            {/* rows */}
            {BOARD_ROWS.map((r) => (
              <div
                key={r.rank}
                className={`flex gap-2 py-1.5 font-mono text-[11px] ${
                  r.you ? 'rounded bg-gold/10' : ''
                }`}
              >
                <span className={`w-8 text-right ${r.rank <= 3 ? 'font-bold text-gold' : 'text-text-muted'}`}>
                  #{r.rank}
                </span>
                <span className={`w-36 truncate ${r.you ? 'font-bold text-gold' : 'text-text-primary'}`}>
                  {r.name}{r.you && <span className="ml-1 text-gold/70">YOU</span>}
                </span>
                <span className="w-24 text-text-secondary">{r.cls}</span>
                <span className="w-24 text-right font-semibold text-text-primary">{r.yld}</span>
                <span className="w-14 text-right text-text-secondary">{r.snr}</span>
                <span className="w-14 text-right text-text-secondary">{r.lev}</span>
                <span className="w-12 text-right text-text-secondary">{r.vel}</span>
                <span className="w-12 text-right text-text-secondary">{r.d10}</span>
                <span className="w-12 text-right text-text-muted">{r.pct}</span>
                <span className={`w-10 text-right ${r.mv === '▲' ? 'text-green-400' : r.mv === '▼' ? 'text-red-400' : 'text-text-dim'}`}>
                  {r.mv}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 1-2-3 submit steps ── */}
      <div className="flex flex-col gap-5">
        <div className="font-mono text-xs uppercase tracking-wide text-text-muted">
          Submit your cascade in 3 steps
        </div>
        <Step n={1} title="Install & open the TUI">
          Run <Cmd>npx sigrank-mcp</Cmd> in your terminal. It reads your local AI session logs
          (Claude Code, Codex, Gemini CLI, and 11+ others) and derives your cascade on-device.
        </Step>
        <Step n={2} title="Paste a key to sign in">
          Go to <Link href="/settings" className="text-text-accent underline-offset-2 hover:underline">signalaf.com → Settings</Link> and
          click <span className="font-semibold text-gold">&ldquo;New key&rdquo;</span>. Copy the key, open the{' '}
          <span className="text-text-secondary">Connect</span> tab (key 6) in the TUI, paste it, and press Enter.
        </Step>
        <Step n={3} title="Press [S] to submit">
          From any read tab, press <Cmd>S</Cmd> to sign + publish your cascade to the board. The server
          re-scores authoritatively — your rank updates live across all four windows.
        </Step>
      </div>

      {/* ── Agent option ── */}
      <div className="rounded-xl border border-bg-border bg-bg-surface px-5 py-4">
        <div className="font-mono text-xs uppercase tracking-wide text-gold">Or let your AI agent do it</div>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Don&apos;t want to leave your agent? Just tell it to run{' '}
          <Cmd>npx sigrank-mcp me</Cmd> to see your cascade, or{' '}
          <Cmd>npx sigrank-mcp submit</Cmd> to publish (sign in once first with{' '}
          <Cmd>npx sigrank-mcp enroll</Cmd>). It reads your logs, derives the cascade, and
          submits — you don&apos;t paste anything. For direct tool calls, wire it as an MCP
          server — see the{' '}
          <Link href="/wiki/local-agent" className="text-text-accent underline-offset-2 hover:underline">
            local agent wiki page
          </Link>.
        </p>
      </div>

    </section>
  )
}
