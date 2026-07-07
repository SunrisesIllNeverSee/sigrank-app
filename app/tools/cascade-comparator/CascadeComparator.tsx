'use client'

import { useMemo, useState } from 'react'

/**
 * CascadeComparator — client-side side-by-side comparison of two token cascades.
 *
 * Two sets of four token pillars (A vs B) → yield, compression ratio, cache hit
 * rate, and leverage for each, with the winner flagged per metric.
 */

const PILLARS = [
  { key: 'input', label: 'Input' },
  { key: 'output', label: 'Output' },
  { key: 'cacheRead', label: 'Cache-read' },
  { key: 'cacheWrite', label: 'Cache-write' },
] as const

type PillarKey = (typeof PILLARS)[number]['key']

type Cascade = Record<PillarKey, string>

const DEFAULT_A: Cascade = { input: '12000', output: '4500', cacheRead: '80000', cacheWrite: '15000' }
const DEFAULT_B: Cascade = { input: '30000', output: '2000', cacheRead: '10000', cacheWrite: '5000' }

function metrics(c: Cascade) {
  const input = Number(c.input) || 0
  const output = Number(c.output) || 0
  const cacheRead = Number(c.cacheRead) || 0
  const cacheWrite = Number(c.cacheWrite) || 0
  const yield_ = input > 0 ? (cacheRead * output) / (input * input) : 0
  const compression = input > 0 ? output / input : 0
  const cacheHitRate = cacheRead + cacheWrite > 0 ? cacheRead / (cacheRead + cacheWrite) : 0
  const leverage = input > 0 ? cacheRead / input : 0
  return { yield_, compression, cacheHitRate, leverage }
}

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toFixed(digits)
}

const ROWS: { label: string; key: 'yield_' | 'compression' | 'cacheHitRate' | 'leverage'; higher: boolean; fmt: (n: number) => string }[] = [
  { label: 'Υ Yield', key: 'yield_', higher: true, fmt: (n) => fmt(n, 2) },
  { label: 'Compression ratio', key: 'compression', higher: true, fmt: (n) => n.toFixed(2) },
  { label: 'Cache hit rate', key: 'cacheHitRate', higher: true, fmt: (n) => `${(n * 100).toFixed(0)}%` },
  { label: 'Leverage', key: 'leverage', higher: true, fmt: (n) => `${n.toFixed(1)}x` },
]

export function CascadeComparator() {
  const [a, setA] = useState<Cascade>(DEFAULT_A)
  const [b, setB] = useState<Cascade>(DEFAULT_B)

  const ma = useMemo(() => metrics(a), [a])
  const mb = useMemo(() => metrics(b), [b])

  function update(side: 'a' | 'b', key: PillarKey, v: string) {
    const setter = side === 'a' ? setA : setB
    setter((prev) => ({ ...prev, [key]: v }))
  }

  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {(['a', 'b'] as const).map((side) => {
          const vals = side === 'a' ? a : b
          return (
            <div key={side} className="flex flex-col gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-gold">
                Cascade {side.toUpperCase()}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {PILLARS.map((p) => (
                  <label key={p.key} className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{p.label}</span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={vals[p.key]}
                      onChange={(e) => update(side, p.key, e.target.value)}
                      className="rounded-lg border border-bg-border bg-bg-base px-2.5 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-gold"
                    />
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-bg-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-elevated font-mono text-xs uppercase tracking-wider text-text-muted">
              <th className="px-4 py-2 text-left">Metric</th>
              <th className="px-4 py-2 text-right">A</th>
              <th className="px-4 py-2 text-right">B</th>
              <th className="px-4 py-2 text-right">Edge</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const va = ma[row.key]
              const vb = mb[row.key]
              const aWins = row.higher ? va > vb : va < vb
              const bWins = row.higher ? vb > va : vb < va
              return (
                <tr key={row.key} className="border-t border-bg-border-subtle">
                  <td className="px-4 py-2 font-sans text-text-secondary">{row.label}</td>
                  <td className={`px-4 py-2 text-right font-mono ${aWins ? 'text-gold' : 'text-text-primary'}`}>{row.fmt(va)}</td>
                  <td className={`px-4 py-2 text-right font-mono ${bWins ? 'text-gold' : 'text-text-primary'}`}>{row.fmt(vb)}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-text-muted">
                    {aWins ? 'A' : bWins ? 'B' : 'tie'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">
        Comparing raw cascades is a quick diagnostic. For the full operator-vs-operator
        experience (radars, history, signed snapshots), see{' '}
        <a href="/compare" className="text-text-accent underline-offset-2 hover:underline">/compare</a>.
      </p>
    </div>
  )
}
