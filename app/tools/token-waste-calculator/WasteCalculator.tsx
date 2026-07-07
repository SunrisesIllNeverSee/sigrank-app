'use client'

import { useMemo, useState } from 'react'

/**
 * WasteCalculator — client-side heuristic estimator for wasted AI tokens.
 *
 * Takes the four token pillars and estimates how many tokens likely did NOT
 * contribute to output, broken down by category. This is a heuristic tool —
 * the breakdown categories are approximations, not ground truth (see page copy).
 */

const PILLARS = [
  { key: 'input', label: 'Input tokens', hint: 'Fresh tokens sent to the model' },
  { key: 'output', label: 'Output tokens', hint: 'Tokens the model generated' },
  { key: 'cacheRead', label: 'Cache-read tokens', hint: 'Cached tokens reused from prior context' },
  { key: 'cacheWrite', label: 'Cache-write tokens', hint: 'New tokens written to cache' },
] as const

type PillarKey = (typeof PILLARS)[number]['key']

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return Math.round(n).toLocaleString('en-US')
}

export function WasteCalculator() {
  const [vals, setVals] = useState<Record<PillarKey, string>>({
    input: '30000',
    output: '2000',
    cacheRead: '10000',
    cacheWrite: '5000',
  })

  const result = useMemo(() => {
    const input = Number(vals.input) || 0
    const output = Number(vals.output) || 0
    const cacheRead = Number(vals.cacheRead) || 0
    const cacheWrite = Number(vals.cacheWrite) || 0

    const totalIn = input + cacheRead + cacheWrite
    // Heuristic: "useful" input is roughly proportional to output produced.
    // Assume a generous 10:1 input-to-output ratio is "efficient"; anything
    // beyond that is treated as waste. This is a rough proxy, not a measurement.
    const efficientInputCeiling = output * 10
    const excessInput = Math.max(0, input - efficientInputCeiling)

    // Cache waste: cache-write tokens that are never read back. Approximated as
    // cache-write minus cache-read when cache-write exceeds cache-read (i.e. you
    // wrote more to cache than you ever reused).
    const unreusedCacheWrite = Math.max(0, cacheWrite - cacheRead)

    // Repeated-context waste: cache-read tokens beyond what plausibly shaped
    // output. Proxy: if cache-read >> output * 20, the cached context is mostly
    // re-sent boilerplate that didn't drive new signal.
    const repeatedContext = Math.max(0, cacheRead - output * 20)

    const totalWaste = excessInput + unreusedCacheWrite + repeatedContext
    const efficiency = totalIn > 0 ? Math.max(0, 1 - totalWaste / totalIn) : 0

    const yield_ = input > 0 ? (cacheRead * output) / (input * input) : 0

    return {
      input,
      output,
      cacheRead,
      cacheWrite,
      totalIn,
      excessInput,
      unreusedCacheWrite,
      repeatedContext,
      totalWaste,
      efficiency,
      yield_,
    }
  }, [vals])

  function update(key: PillarKey, v: string) {
    setVals((prev) => ({ ...prev, [key]: v }))
  }

  const breakdown = [
    { label: 'Excess fresh input', value: result.excessInput, hint: 'Input beyond a 10:1 input-to-output ratio — likely over-specified prompts.' },
    { label: 'Unreused cache writes', value: result.unreusedCacheWrite, hint: 'Cache-write tokens never read back — context cached but not reused.' },
    { label: 'Repeated context', value: result.repeatedContext, hint: 'Cache-read tokens far exceeding what plausibly shaped output — re-sent boilerplate.' },
  ]
  const maxCat = Math.max(...breakdown.map((b) => b.value), 1)

  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
      <h2 className="font-mono text-base font-bold text-text-primary">Enter your four token pillars</h2>
      <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
        From <code className="font-mono text-text-primary">ccusage --json</code> or{' '}
        <code className="font-mono text-text-primary">npx sigrank me</code>. Token counts only.
      </p>

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
              value={vals[p.key]}
              onChange={(e) => update(p.key, e.target.value)}
              className="rounded-lg border border-bg-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
            />
            <span className="font-sans text-xs text-text-muted">{p.hint}</span>
          </label>
        ))}
      </div>

      {/* Headline result */}
      <div className="mt-6 rounded-lg border border-bg-border bg-bg-elevated p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted">Estimated waste</span>
          <span className="font-mono text-3xl font-bold text-gold">{fmt(result.totalWaste)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
          <span>Efficiency: <span className="text-text-primary">{(result.efficiency * 100).toFixed(0)}%</span></span>
          <span>Υ Yield: <span className="text-text-primary">{result.yield_.toFixed(2)}</span></span>
          <span>Total in: <span className="text-text-primary">{fmt(result.totalIn)}</span></span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-5 flex flex-col gap-4">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
          Waste breakdown by category
        </h3>
        {breakdown.map((b) => (
          <div key={b.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-sm font-semibold text-text-primary">{b.label}</span>
              <span className="font-mono text-sm text-text-secondary">{fmt(b.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-base">
              <div
                className="h-full rounded-full bg-gold/70"
                style={{ width: `${Math.min(100, (b.value / maxCat) * 100)}%` }}
              />
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">{b.hint}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 font-sans text-xs leading-relaxed text-text-muted">
        This is a <strong className="text-text-primary">heuristic estimator</strong>, not a
        measurement. The categories use rough proxies (a 10:1 efficient input-to-output ceiling,
        cache-write vs cache-read reuse, a 20:1 cache-read-to-output threshold). Real waste
        depends on your actual prompts and workflow. Use the numbers as a directional signal,
        not an audit. The Υ Yield metric is the rigorous counterpart.
      </p>
    </div>
  )
}
