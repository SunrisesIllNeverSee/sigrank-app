/**
 * components/marketing/SignalIntegrity.tsx — two linked wiki sections:
 *
 *   1. SignatureDrift  — the "tune meter" concept (owner: 019_micro_sync_drift.md).
 *      IP-SAFE: tells the shape-drift + passive-observer story WITHOUT the proprietary
 *      internals (the exact DRIFT formula, band thresholds, and calibrated signature
 *      vector are deliberately omitted — marked as proprietary). Owner: "no ip exposure."
 *   2. LocalAgentMcp   — the SigRank local agent / MCP, anchored on the SAME contamination
 *      constraint that governs drift (read-only, emits no tokens). Owner: "this equation
 *      also applies to the mcp — connect the two."
 *
 * The shared spine is the CONTAMINATION CONSTRAINT — a live observer that PROMPTS
 * generates the tokens it measures (the claude-mem ~25% inflation, now a design rule).
 * That single rule binds the drift instrument and the MCP, which is why they cross-link.
 *
 * Pure presentational server components. Token counts only — never prompt content.
 */

import React from 'react'
import Link from 'next/link'

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-mono text-lg font-bold text-text-primary">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">{children}</p>
}

/** The non-negotiable rule shared by drift + the MCP. Rendered in both sections so
 * the connection is explicit on each page. */
function ContaminationConstraint() {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-dashed border-gold/40 bg-gold/5 p-4">
      <h3 className="font-mono text-sm font-bold text-gold">
        The contamination constraint (non-negotiable)
      </h3>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        Any live observer that <strong>prompts</strong> generates the tokens it measures. We learned
        this directly: a memory observer that auto-prompts (low-input / high-output) inflated a real
        operator&apos;s output by ~25% — visible openly on the live board as the inflated-vs-clean pair
        (rows 2 and 3). So every SigRank instrument that touches a live session is{' '}
        <strong className="text-text-primary">read-only against telemetry and emits no prompt</strong>{' '}
        — no auto-memory, no keep-alive, no self-query. Verified-passive, or it re-contaminates every
        operator running it. This is a hard requirement, not a caution — and it is the moat: the
        instrument that doesn&apos;t disturb what it measures.
      </p>
    </section>
  )
}

/* ───────────────────────── 1 · SIGNATURE DRIFT (tune meter) ───────────────────────── */

export function SignatureDrift() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Signature Drift — the tune meter
        </h1>
        <P>
          Every operator has a <strong>signature</strong>: the characteristic <em>shape</em> of their
          token cascade — the proportions between output, cache-write, and cache-read, anchored to
          input. Signature drift measures how far a stretch of work has moved from that shape. Zero
          drift = locked in tune; rising drift = the cascade is desyncing from the operator&apos;s own
          calibrated peak. It&apos;s a measure of <strong>shape, not magnitude</strong> — the same log
          family as 10xDEV.
        </P>
      </div>

      <section className="flex flex-col gap-2">
        <H2>Shape, not size</H2>
        <P>
          Drift is computed in log-space on purpose. Working twice as hard across the board (every axis
          doubled) is still <em>in tune</em> — the shape is unchanged — so it reads as zero drift.
          Going off on a single axis (lots of cache-write, no reuse) breaks the shape and reads as real
          drift. Naive similarity measures get this backwards: one axis can dominate the vector and
          mask a badly desynced cascade as a false &ldquo;high.&rdquo; The log-shape read fixes that —
          no single component can dominate, and being 0.5× or 2× off counts equally. The exact
          formulation, thresholds, and per-operator calibration are{' '}
          <span className="text-text-dim">SigRank proprietary internals.</span>
        </P>
      </section>

      <section className="flex flex-col gap-3">
        <H2>Where it runs — three time-scales</H2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-text-primary">Macro</span>
              <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[9px] uppercase text-gold">
                ship now
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">
              One drift number per session — a live session-level &ldquo;tune meter,&rdquo; updating as
              the session total moves. Contamination-free, no live hook required.
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-text-primary">Window</span>
              <span className="rounded-full border border-bg-border px-2 py-0.5 font-mono text-[9px] uppercase text-text-dim">
                the bridge
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">
              Drift on the change between successive polls — a rolling time-series. This is where drift
              becomes a <em>cadence</em> instrument (the timing / burstiness layer). Flagged as a
              windowed estimate.
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-text-primary">Micro</span>
              <span className="rounded-full border border-bg-border px-2 py-0.5 font-mono text-[9px] uppercase text-text-dim">
                gated
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">
              True per-turn drift — a UX tune-meter. Requires per-turn granularity the source must
              expose, and only ever as a strictly passive reader.
            </p>
          </div>
        </div>
        <p className="font-sans text-xs text-text-dim">
          Sequence: session drift (now, safe) → window-delta drift (the cadence research) → true
          per-turn micro (passive-only, gated on granularity).
        </p>
      </section>

      <ContaminationConstraint />

      <P>
        The drift instrument and the SigRank local agent are governed by the same rule — see{' '}
        <Link href="/wiki/local-agent" className="text-text-accent underline-offset-2 hover:underline">
          the local agent (MCP)
        </Link>
        . The agent is how drift is read live, and the constraint is why it can be trusted.
      </P>

      <p className="font-sans text-[11px] italic text-text-dim">
        All signal is monitored. All drift is noted. · Token counts only — never prompt content.
      </p>
    </div>
  )
}

/* ───────────────────────── 2 · LOCAL AGENT / MCP ───────────────────────── */

function Mono({ children }: { children: string }) {
  return (
    <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-text-accent">
      {children}
    </code>
  )
}

const CLI_CMDS = [
  { cmd: 'sigrank-mcp', args: '',        desc: 'Full tabbed TUI — Dashboard / Trends / Compare / Board / Watch / Connect. Default in a terminal.' },
  { cmd: 'sigrank-mcp', args: 'tui',     desc: 'Same as above — explicit launch. Keys: 1–6 or ← → switch, R refresh, Q quit.' },
  { cmd: 'sigrank-mcp', args: 'enroll',  desc: 'Sign in: paste a key from signalaf.com → Settings → "New key". (Or in the TUI: Connect tab, key 6.)' },
  { cmd: 'sigrank-mcp', args: 'submit',  desc: 'Publish your verified runs to the board. (Or press [S] from any read tab in the TUI.)' },
  { cmd: 'sigrank-mcp', args: 'me',      desc: 'Your local cascade across 7d / 30d / 90d / all-time. Zero paste, on-device.' },
  { cmd: 'sigrank-mcp', args: 'board',   desc: 'Live leaderboard from signalaf.com — auto-refreshes every 30s.' },
  { cmd: 'sigrank-mcp', args: 'compare', desc: 'Source audit — tokenpull vs ccusage vs token-dash vs tokscale, with delta %.' },
  { cmd: 'sigrank-mcp', args: 'watch',   desc: 'Live cascade meter — re-reads logs on every poll, shows what moved.' },
  { cmd: 'sigrank-mcp', args: '--help',  desc: 'Full command reference with all flags and platform options.' },
]

const MCP_TOOL_LIST = [
  { name: 'tokenpull',         desc: 'On-device read → 4-window cascade. Zero paste, token-only.' },
  { name: 'tokenpull_submit',  desc: 'Read + publish to the board in one call. Server re-scores authoritatively.' },
  { name: 'tokenpull_compare', desc: 'All four sources side-by-side: tokenpull / ccusage / token-dash / tokscale with delta % per pillar.' },
  { name: 'rank_paste',        desc: 'Score a ccusage / tokscale paste locally. Returns Υ + narration card.' },
  { name: 'rank_windows',      desc: 'Score all four windows from a dashboard paste at once.' },
  { name: 'submit_paste',      desc: 'Rank a paste AND publish it to the board in one call.' },
  { name: 'submit_verified',   desc: 'Sign + POST the verified cascade to /api/v1/snapshots (the ranked path).' },
  { name: 'enroll',            desc: 'Paste a key from Settings → "New key" → bind this device (signed submit).' },
  { name: 'get_leaderboard',   desc: 'Live leaderboard from signalaf.com, any window.' },
  { name: 'get_operator',      desc: "One operator's live profile by codename." },
  { name: 'watch_tokenpull',   desc: 'Streaming cascade snapshot — diffs on each poll.' },
]

const PROFILE_PIPELINE = [
  {
    step: '01',
    title: 'Agent reads your local logs',
    body: 'tokenpull reads local session logs from 14+ platforms — Claude Code, Codex, Amp, Kimi, Gemini CLI, GitHub Copilot CLI, Goose, Kilo, Hermes, and more — and counts the four token pillars across each window. Never prompt content; only the four integers.',
  },
  {
    step: '02',
    title: 'Cascade derived on-device',
    body: 'The cascade math runs locally: Υ Yield, SNR, Leverage, Velocity, 10xDEV, and your class tier. You see your full cascade before anything leaves your machine.',
  },
  {
    step: '03',
    title: 'Pillars submitted to the board API',
    body: 'tokenpull_submit posts the four canonical pillars per window. The server re-scores them authoritatively (proprietary threshold cuts apply server-side). Only the four integers are transmitted.',
  },
  {
    step: '04',
    title: 'Your operator profile updates live',
    body: 'The board entry links to your operator profile at signalaf.com/user/[codename]. All cascade metrics — Υ Yield, SNR, Leverage, 10xDEV, class tier, per-window history — render on your profile card. The profile is the public face of your cascade.',
  },
]

export function LocalAgentMcp() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          The local agent (MCP)
        </h1>
        <P>
          The SigRank local agent is an MCP that reads your token counts straight from local session
          logs — 14+ platforms supported, including Claude Code, Codex, Amp, Gemini CLI, GitHub Copilot
          CLI, Goose, Kilo, and more — and keeps your live cascade in sync with the board and your
          operator profile. You never touch a number; the agent is the verifier. It counts tokens; it
          never reads the content of your prompts or replies.
        </P>
      </div>

      {/* What it does */}
      <section className="flex flex-col gap-3">
        <H2>What it does</H2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              t: 'Zero-paste, on-device read',
              b: 'tokenpull reads local session logs from 14+ platforms and counts the four token pillars across 7d / 30d / 90d / all-time — no copy-paste, nothing to assemble by hand.',
            },
            {
              t: 'Publishes in one call',
              b: 'tokenpull_submit posts each window\'s pillars; the server re-scores authoritatively, so your Υ Yield, Leverage, SNR & 10xDEV land on the board and profile and update live.',
            },
            {
              t: 'Stays strictly passive',
              b: 'Read-only against telemetry, emits no prompt of its own. It measures without disturbing what it measures — only the four counts ever leave your machine.',
            },
          ].map((c) => (
            <div key={c.t} className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4">
              <span className="font-mono text-sm font-bold text-text-primary">{c.t}</span>
              <span className="font-sans text-xs leading-relaxed text-text-muted">{c.b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Platform coverage */}
      <section className="flex flex-col gap-3">
        <H2>Supported platforms</H2>
        <P>
          tokenpull reads local session logs from 14+ AI coding platforms. Each adapter
          reads that platform&apos;s own log format — you don&apos;t reconfigure anything.
        </P>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Claude Code',          path: '~/.claude/projects/', note: 'Full 4-pillar' },
            { name: 'Codex CLI',            path: '~/.codex/sessions/',  note: 'Full 4-pillar' },
            { name: 'Amp',                  path: '~/.local/share/amp/', note: 'Full 4-pillar' },
            { name: 'Kimi',                 path: '~/.kimi/sessions/',   note: 'Full 4-pillar' },
            { name: 'pi-agent',             path: '~/.pi/agent/',        note: 'Full 4-pillar' },
            { name: 'OpenClaw / ClawdBot',  path: '~/.openclaw/',        note: 'Full 4-pillar' },
            { name: 'Droid / Factory',      path: '~/.factory/sessions/',note: 'Full 4-pillar' },
            { name: 'Codebuff',             path: '~/.config/manicode/', note: 'Full 4-pillar' },
            { name: 'Kilo',                 path: '~/.local/share/kilo/',note: 'Full 4-pillar' },
            { name: 'Hermes Agent',         path: '~/.hermes/state.db',  note: 'Full 4-pillar' },
            { name: 'Gemini CLI',           path: '~/.gemini/tmp/',      note: 'Estimated cache-write' },
            { name: 'GitHub Copilot CLI',   path: '~/.copilot/otel/',    note: 'Needs COPILOT_OTEL_ENABLED=true' },
            { name: 'Qwen',                 path: '~/.qwen/projects/',   note: 'Estimated cache-write' },
            { name: 'Goose',                path: 'sessions.db',         note: 'Estimated cache-write' },
            { name: 'OpenCode',             path: '~/.local/share/opencode/', note: 'No raw token fields in logs' },
          ].map((p) => (
            <div key={p.name} className="flex flex-col gap-0.5 rounded-lg border border-bg-border bg-bg-surface px-3 py-2.5">
              <span className="font-mono text-[12px] font-bold text-text-primary">{p.name}</span>
              <span className="font-mono text-[10px] text-text-dim">{p.path}</span>
              <span className="font-sans text-[11px] text-text-muted">{p.note}</span>
            </div>
          ))}
        </div>
        <p className="font-sans text-[11px] text-text-dim">
          &ldquo;Estimated cache-write&rdquo; means that platform&apos;s log format doesn&apos;t expose
          cache-creation tokens; the other three pillars are exact. Env-var overrides let you point any
          adapter at a custom log path.
        </p>
      </section>

      {/* Install */}
      <section className="flex flex-col gap-3">
        <H2>Install</H2>
        <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-base px-4 py-3 font-mono text-[11px] leading-loose text-text-secondary">
{`# install globally (recommended)
npm install -g sigrank-mcp

# or run without installing
npx sigrank-mcp

# wire into Claude Code — .mcp.json
{
  "mcpServers": {
    "sigrank": { "command": "npx", "args": ["sigrank-mcp"] }
  }
}`}
        </pre>
        <p className="font-sans text-[11px] text-text-muted">
          In a terminal it opens the TUI. Wired into your AI client it starts the MCP stdio server
          automatically — no extra config. Verified on Node ≥18, macOS + Linux.
        </p>
      </section>

      {/* CLI commands */}
      <section className="flex flex-col gap-3">
        <H2>CLI commands</H2>
        <div className="flex flex-col divide-y divide-bg-border-subtle overflow-hidden rounded-lg border border-bg-border">
          {CLI_CMDS.map((c) => (
            <div key={c.cmd + c.args} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-bg-surface px-4 py-2.5">
              <span className="shrink-0 font-mono text-[11px] font-bold text-text-primary">{c.cmd}</span>
              {c.args && (
                <span className="shrink-0 font-mono text-[11px] font-semibold text-gold">{c.args}</span>
              )}
              <span className="font-sans text-xs leading-snug text-text-muted">{c.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MCP tools */}
      <section className="flex flex-col gap-3">
        <H2>MCP tools — callable by your AI client</H2>
        <P>
          When wired into Claude Code or Cursor, your AI agent can call these tools directly — no
          paste, no copy-out.
        </P>
        <div className="grid gap-2 sm:grid-cols-2">
          {MCP_TOOL_LIST.map((t) => (
            <div key={t.name} className="flex flex-col gap-1.5 rounded-lg border border-bg-border bg-bg-surface p-3">
              <Mono>{t.name}</Mono>
              <span className="font-sans text-xs leading-relaxed text-text-muted">{t.desc}</span>
            </div>
          ))}
        </div>
        <p className="font-sans text-[11px] text-text-dim">
          Open by design — the cascade math is public; proprietary threshold cuts stay server-side.
          Canonical anchor: rank_paste reproduces MO§ES Υ 18,436.98 exactly.
        </p>
      </section>

      {/* MCP ↔ profile pipeline */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <H2>How the MCP feeds your operator profile</H2>
          <P>
            The agent is the data pipeline between your local session logs and your public operator
            profile at signalaf.com. Here is the exact path, step by step.
          </P>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROFILE_PIPELINE.map((p) => (
            <div key={p.step} className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
              <span className="font-mono text-xs text-text-accent">{p.step}</span>
              <span className="font-mono text-sm font-bold text-text-primary">{p.title}</span>
              <span className="font-sans text-xs leading-relaxed text-text-muted">{p.body}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">The profile is not separate from the MCP.</strong>{' '}
            The MCP is the write path. Every cascade metric your profile displays — Υ Yield, SNR,
            Leverage, 10xDEV, class tier, per-window history — originates from a{' '}
            <Mono>tokenpull_submit</Mono> call (or a manual paste through the calculator). The
            profile is the read surface; the agent is the write path.
          </p>
        </div>
      </section>

      <ContaminationConstraint />

      <P>
        This is the same rule that governs{' '}
        <Link href="/wiki/signal-drift" className="text-text-accent underline-offset-2 hover:underline">
          signature drift
        </Link>
        : the agent is the live reader the drift instrument runs on, and because it never prompts, the
        drift it reports is the operator&apos;s own — not the observer&apos;s. A live observer that
        prompted would inflate the very numbers it reports; this one cannot.
      </P>

      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface/40 p-4">
        <span className="font-mono text-xs uppercase tracking-wide text-text-muted">Status</span>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          The agent is how board entries become exact and live — vs. the manual paste calculator, which
          runs your numbers but does not save to the board or update your profile. Account + review
          still gate the board so it stays honest.
        </p>
      </section>

      <p className="font-sans text-[11px] italic text-text-dim">
        Token counts only — never prompt content. Verified-passive by design.
      </p>
    </div>
  )
}

/* ───────────────────────── 3 · CREDITS / TIP THE HAT ─────────────────────────
 * The token-measurement tools SigRank reads alongside / was inspired by (owner
 * 2026-06-23: "tip the hat to the other builds"). Positioning: they measure the
 * tokens; SigRank ranks the architecture on top — inputs to the ranking layer, not
 * rivals. tokscale framing is the owner's own line ("how much / how well").
 *
 * OWNER: tune the exact relationship word per tool — "reads alongside" / "inspired
 * by" / "built on" / "verified against" — I left neutral, non-endorsement wording.
 * Handles + URLs are real (Devins_Plans/INTEGRATION_PLAN.md §4). */
const CREDIT_TOOLS = [
  {
    name: 'ccusage',
    by: '@ryoppippi',
    url: 'https://github.com/ryoppippi/ccusage',
    note: "The token-usage reader the community runs. SigRank is the reputation layer on top of that data — paste its output as a fallback when you're not running the agent.",
  },
  {
    name: 'tokscale',
    by: '@junhoyeo',
    url: 'https://tokscale.ai',
    note: "Ranks operators by volume spent. The honest one-liner: they measure how much, SigRank measures how well. Our seed field is sourced from tokscale's public board.",
  },
  {
    name: 'token-dashboard',
    by: 'nateherkai',
    url: 'https://github.com/nateherkai/token-dashboard',
    note: "A per-window pillar dashboard. The agent's on-device read (tokenpull) was verified to match its numbers exactly.",
  },
]

export function Credits() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Measured alongside
        </h1>
        <P>
          SigRank doesn&apos;t measure tokens in a vacuum — it builds on a small ecosystem of token-usage
          tools, and ranks the <em>architecture</em> of the cascade on top of what they count. Credit
          where it&apos;s due:
        </P>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {CREDIT_TOOLS.map((t) => (
          <a
            key={t.name}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1.5 rounded-lg border border-bg-border bg-bg-surface p-4 transition-colors hover:border-gold/40 hover:bg-bg-elevated"
          >
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold text-text-primary">{t.name}</span>
              <span className="font-mono text-[11px] text-text-muted">{t.by}</span>
              <span className="ml-auto font-mono text-[11px] text-text-accent">↗</span>
            </span>
            <span className="font-sans text-xs leading-relaxed text-text-muted">{t.note}</span>
          </a>
        ))}
      </div>
      <p className="font-sans text-[11px] italic text-text-dim">
        Independent project — not affiliated with or endorsed by the tools above; names belong to their
        authors. Token counts only.
      </p>
    </div>
  )
}
