'use client'

/**
 * ScorePasteCard — the anonymous paste preview on /score.
 *
 * Calls /api/v1/ingest-parse (no auth, no DB write) to parse the paste and
 * show the four token pillars + compression ratio. This is a pure calculator
 * — nothing is persisted. To land on the board, the operator uses the local
 * agent (npx sigrank me) or creates an account.
 */

import React, { useState } from 'react'

interface ParsePreview {
  input: number
  output: number
  cacheCreate: number
  cacheRead: number
  compressionRatio: number
  source: string
  estimated: boolean
  caveat: string | null
  costUsd: number | null
  // Projected scoring (the "ghost rank" preview):
  yield: number
  leverage: number
  velocity: number
  signaRate: number
  classTier: string
  signalForce: number
  dev10x: number | null
  cascadeStr: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'parsing' }
  | { kind: 'parsed'; preview: ParsePreview }
  | { kind: 'error'; detail: string }

const EXAMPLE_SNIPPET = `{
  "totals": {
    "inputTokens": 1251211,
    "outputTokens": 11296121,
    "cacheCreationTokens": 128196310,
    "cacheReadTokens": 2555179769,
    "totalCost": 0.527
  }
}`

export function ScorePasteCard() {
  const [paste, setPaste] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function onParse() {
    if (!paste.trim()) return
    setStatus({ kind: 'parsing' })
    try {
      const res = await fetch('/api/v1/ingest-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: paste }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        setStatus({ kind: 'error', detail: `Parse failed (${res.status}). ${txt}`.trim() })
        return
      }
      const data = await res.json()
      setStatus({ kind: 'parsed', preview: data })
    } catch {
      setStatus({ kind: 'error', detail: 'Could not reach the parse endpoint.' })
    }
  }

  const preview = status.kind === 'parsed' ? status.preview : null

  return (
    <div className="flex flex-col gap-4">
      {/* Paste area */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-secondary">
          Paste <code className="font-mono text-text-primary">ccusage --json</code> output
        </span>
        <textarea
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value)
            if (status.kind !== 'idle') setStatus({ kind: 'idle' })
          }}
          rows={8}
          placeholder={EXAMPLE_SNIPPET}
          className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-dim"
          aria-label="ccusage JSON paste"
        />
        <span className="text-[11px] text-text-muted">
          Accepts: full ccusage JSON, partial fragments, Codex exports, or four bare numbers.
        </span>
      </label>

      {/* Parse button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onParse}
          disabled={!paste.trim() || status.kind === 'parsing'}
          className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-50"
        >
          {status.kind === 'parsing' ? 'Parsing…' : 'Parse & preview'}
        </button>
        {status.kind === 'error' && (
          <span role="status" className="text-sm text-class-refiner">
            {status.detail}
          </span>
        )}
      </div>

      {/* Parse preview */}
      {preview && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold">
            ◈ Your cascade — projected
          </p>
          {preview.caveat && (
            <p className="mb-2 rounded bg-gold/10 px-3 py-2 font-mono text-xs text-gold">
              {preview.caveat}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-4">
            <span className="text-text-muted">Input</span>
            <span className="text-text-primary">{preview.input.toLocaleString()}</span>
            <span className="text-text-muted">Output</span>
            <span className="text-text-primary">{preview.output.toLocaleString()}</span>
            <span className="text-text-muted">Cache write</span>
            <span className="text-text-primary">{preview.cacheCreate.toLocaleString()}</span>
            <span className="text-text-muted">Cache read</span>
            <span className="text-text-primary">{preview.cacheRead.toLocaleString()}</span>
            <span className="text-text-muted">Compression</span>
            <span className="text-gold font-bold">{preview.compressionRatio.toFixed(3)}</span>
            <span className="text-text-muted">Source</span>
            <span className="text-text-primary">{preview.source}</span>
            {preview.costUsd != null && (
              <>
                <span className="text-text-muted">Cost (window)</span>
                <span className="text-text-primary">${preview.costUsd.toFixed(3)}</span>
              </>
            )}
          </div>

          {/* Projected scoring — the ghost rank preview */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-gold/20 pt-3 font-mono text-xs sm:grid-cols-4">
            <span className="text-text-muted">Υ Yield</span>
            <span className="text-gold font-bold">{preview.yield.toFixed(1)}</span>
            <span className="text-text-muted">Class tier</span>
            <span className="text-gold font-bold">{preview.classTier}</span>
            <span className="text-text-muted">SIGNA rate</span>
            <span className="text-text-primary">{preview.signaRate.toFixed(1)}</span>
            <span className="text-text-muted">Leverage</span>
            <span className="text-text-primary">{preview.leverage.toFixed(1)}:1</span>
            <span className="text-text-muted">Velocity</span>
            <span className="text-text-primary">{preview.velocity.toFixed(2)}×</span>
            {preview.dev10x != null && (
              <>
                <span className="text-text-muted">10× dev</span>
                <span className="text-text-primary">{preview.dev10x.toFixed(2)}</span>
              </>
            )}
            <span className="text-text-muted">Cascade</span>
            <span className="text-text-primary">{preview.cascadeStr}</span>
          </div>

          {/* Not-saved notice + CTA */}
          <div className="mt-4 rounded-lg border border-text-accent/25 bg-text-accent/5 px-4 py-3">
            <p className="font-mono text-xs font-semibold text-text-accent">
              These are run numbers — not saved to the board.
            </p>
            <p className="mt-1 font-sans text-[12px] leading-snug text-text-secondary">
              To land on the leaderboard, run the local agent
              (<code className="font-mono text-text-primary">npx sigrank me</code>) and submit
              through your account. Board entries are reviewed, so the board stays honest.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
