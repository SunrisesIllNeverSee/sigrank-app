'use client'

import { useMemo, useState } from 'react'

/**
 * ClassChecker — client-side operator-class tier checker.
 *
 * Accepts either a direct yield score OR four token pillars to compute one,
 * then maps the yield to a class tier (IGNITER → SEEKER → BUILDER → TRANSMITTER)
 * with a description of what that tier means.
 */

const TIERS = [
  { name: 'TRANSMITTER', min: 10, color: 'text-gold', desc: 'Signal compounds aggressively. Cached context amplifies every fresh input into outsized output — the cascade is a multiplier, not a cost. The top tier of the board.' },
  { name: 'BUILDER', min: 2, color: 'text-accent', desc: 'A productive, compounding cascade. Good cache reuse and solid output density. Most strong operators live here — efficient without being extraordinary.' },
  { name: 'SEEKER', min: 0.5, color: 'text-text-primary', desc: 'A working cascade, but most input is spent once. Cache reuse and output-per-input have clear headroom. The middle of the field — learning to compound.' },
  { name: 'IGNITER', min: 0, color: 'text-text-muted', desc: 'Early-stage cascade. Tokens are largely burned for context, not yet compounding. Every operator starts here; the first gains come from caching, not from typing more.' },
] as const

const PILLARS = [
  { key: 'input', label: 'Input tokens' },
  { key: 'output', label: 'Output tokens' },
  { key: 'cacheRead', label: 'Cache-read tokens' },
  { key: 'cacheWrite', label: 'Cache-write tokens' },
] as const

type PillarKey = (typeof PILLARS)[number]['key']

function classForYield(y: number) {
  for (const t of TIERS) if (y >= t.min) return t
  return TIERS[TIERS.length - 1]
}

export function ClassChecker() {
  const [mode, setMode] = useState<'yield' | 'pillars'>('yield')
  const [yieldInput, setYieldInput] = useState('3.5')
  const [pillars, setPillars] = useState<Record<PillarKey, string>>({
    input: '12000',
    output: '4500',
    cacheRead: '80000',
    cacheWrite: '15000',
  })

  const yield_ = useMemo(() => {
    if (mode === 'yield') return Number(yieldInput) || 0
    const input = Number(pillars.input) || 0
    const output = Number(pillars.output) || 0
    const cacheRead = Number(pillars.cacheRead) || 0
    return input > 0 ? (cacheRead * output) / (input * input) : 0
  }, [mode, yieldInput, pillars])

  const tier = classForYield(yield_)
  const rank = TIERS.indexOf(tier) // 0 = top (TRANSMITTER)

  function updatePillar(key: PillarKey, v: string) {
    setPillars((prev) => ({ ...prev, [key]: v }))
  }

  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('yield')}
          className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
            mode === 'yield'
              ? 'border-gold bg-bg-elevated text-gold'
              : 'border-bg-border bg-bg-base text-text-muted hover:text-text-primary'
          }`}
        >
          Enter yield directly
        </button>
        <button
          onClick={() => setMode('pillars')}
          className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
            mode === 'pillars'
              ? 'border-gold bg-bg-elevated text-gold'
              : 'border-bg-border bg-bg-base text-text-muted hover:text-text-primary'
          }`}
        >
          Compute from pillars
        </button>
      </div>

      {/* Inputs */}
      {mode === 'yield' ? (
        <label className="mt-5 flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Υ Yield score
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={yieldInput}
            onChange={(e) => setYieldInput(e.target.value)}
            className="rounded-lg border border-bg-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
          />
        </label>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <label key={p.key} className="flex flex-col gap-1">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                {p.label}
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={pillars[p.key]}
                onChange={(e) => updatePillar(p.key, e.target.value)}
                className="rounded-lg border border-bg-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
              />
            </label>
          ))}
        </div>
      )}

      {/* Result */}
      <div className="mt-6 rounded-lg border border-bg-border bg-bg-elevated p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Computed yield</span>
          <span className="font-mono text-2xl font-bold text-gold">
            {yield_ >= 1000 ? `${(yield_ / 1000).toFixed(1)}K` : yield_.toFixed(2)}
          </span>
        </div>
        <div className={`mt-4 font-mono text-lg font-bold ${tier.color}`}>{tier.name}</div>
        <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">{tier.desc}</p>

        {/* Tier ladder */}
        <div className="mt-5 flex flex-col gap-1.5">
          {[...TIERS].reverse().map((t) => {
            const active = t.name === tier.name
            return (
              <div
                key={t.name}
                className={`flex items-center gap-3 rounded-md border px-3 py-1.5 font-mono text-xs ${
                  active ? 'border-gold bg-bg-base text-gold' : 'border-bg-border-subtle text-text-muted'
                }`}
              >
                <span className="w-28">{t.name}</span>
                <span className="text-text-muted">
                  {t.min === 0 ? '< 0.5' : t.min === 0.5 ? '0.5 – 2' : t.min === 2 ? '2 – 10' : '10+'}
                </span>
                {active && <span className="ml-auto">◆ you are here</span>}
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">
        Class thresholds are approximate (IGNITER &lt; 0.5, SEEKER 0.5–2, BUILDER 2–10,
        TRANSMITTER 10+). Authoritative tiers are assigned server-side from signed snapshots.
      </p>
    </div>
  )
}
