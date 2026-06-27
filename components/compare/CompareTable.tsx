import React from 'react'
import type { LeaderboardRow } from '@/lib/data'
import { operatorDisplayName } from '@/lib/compare/operator-name'
import { SignalClassBadge } from '@/components/sigrank'
import { CanonId } from '@/components/ui/CanonId'
import { Placeholder } from '@/components/ui/Placeholder'
import CascadeRadar, { type CascadeRadarSeries } from '@/components/charts/CascadeRadar'

/**
 * components/compare/CompareTable.tsx — head-to-head A vs B comparison.
 *
 * Renders a Metric / A / B / Delta table with a per-row winner highlight, plus
 * a lightweight CSS radar across the Core 5 + Signal Force. The page resolves
 * both operators via getOperator() and passes the rows here; this component is
 * purely presentational (server component, no hooks). Real values carry a
 * <CanonId/> superscript; placeholder rows mark values with the gold star.
 *
 * Unlimited multi-operator compare is a Pro reward (RW.07-adjacent / RW.23):
 * the "add a third operator" upgrade gate was removed 2026-06-22 (ProGate archived
 * while billing is dormant; returns with Stripe-live in the new repo).
 */

export interface MetricRow {
  label: string
  canonId: string
  a: number
  b: number
  /** Higher value wins (true) or lower wins (false). */
  higherWins: boolean
  /** Format the raw number for display. */
  fmt: (v: number) => string
  /** Radar axis max for normalization. */
  radarMax: number
}

interface Props {
  a: LeaderboardRow
  b: LeaderboardRow
  /** Whether the current viewer holds Pro (gates unlimited compare). */
  isPro?: boolean
}

/**
 * Cascade head-to-head rows (Υ-layer), matching the leaderboard. Reads from
 * snapshot.cascade — the canonical token metrics derived on read. A null/
 * non-compounding cascade contributes 0 on each axis (the operator simply loses
 * the compounding rows), so the table never throws on un-scored operators.
 * $/1M is the one "lower wins" axis; its radarMax inverts in the radar via the
 * higherWins flag handling below.
 */
export function buildRows(a: LeaderboardRow, b: LeaderboardRow): MetricRow[] {
  const ca = a.snapshot.cascade
  const cb = b.snapshot.cascade
  const yield_ = (c: typeof ca) => (c && !c.nonCompounding ? c.yield_ : 0)
  const lev = (c: typeof ca) => (c && !c.nonCompounding ? c.leverage : 0)
  const dev = (c: typeof ca) => (c && !c.nonCompounding && c.dev10x !== null ? c.dev10x : 0)
  const snr = (c: typeof ca) => (c ? c.snr : 0)
  const vel = (c: typeof ca) => (c ? c.velocity : 0)
  const cost = (c: typeof ca) => (c ? c.costPerMillion : 0)
  return [
    {
      label: 'Υ Yield',
      canonId: 'Υ',
      a: yield_(ca),
      b: yield_(cb),
      higherWins: true,
      fmt: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)),
      radarMax: Math.max(yield_(ca), yield_(cb), 1),
    },
    {
      label: 'SNR',
      canonId: 'M.01',
      a: snr(ca),
      b: snr(cb),
      higherWins: true,
      fmt: (v) => `${(v * 100).toFixed(1)}%`,
      radarMax: 1,
    },
    {
      label: 'Leverage',
      canonId: 'Cr/I',
      a: lev(ca),
      b: lev(cb),
      higherWins: true,
      fmt: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K×` : `${v.toFixed(0)}×`),
      radarMax: Math.max(lev(ca), lev(cb), 1),
    },
    {
      label: 'Velocity',
      canonId: 'O/I',
      a: vel(ca),
      b: vel(cb),
      higherWins: true,
      fmt: (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2)),
      radarMax: Math.max(vel(ca), vel(cb), 1),
    },
    {
      label: '10xDEV',
      canonId: '⚡',
      a: dev(ca),
      b: dev(cb),
      higherWins: true,
      fmt: (v) => v.toFixed(2),
      radarMax: 5,
    },
    {
      label: '$ / 1M',
      canonId: '$',
      a: cost(ca),
      b: cost(cb),
      higherWins: false, // lower blended cost wins
      fmt: (v) => `$${v.toFixed(2)}`,
      radarMax: Math.max(cost(ca), cost(cb), 1),
    },
  ]
}

/** Winner of a row: 'a' | 'b' | 'tie'. */
export function winnerOf(row: MetricRow): 'a' | 'b' | 'tie' {
  if (row.a === row.b) return 'tie'
  const aWins = row.higherWins ? row.a > row.b : row.a < row.b
  return aWins ? 'a' : 'b'
}

export function nameOf(row: LeaderboardRow): string {
  return operatorDisplayName(row)
}

/** Head-to-head radar — adapter over the shared CascadeRadar (CMP-3).
 * Builds shared axes + two colored series from the metric rows. Lower-wins axes
 * (e.g. $/1M) are pre-inverted here (value → max − value) so "better" always
 * reaches outward, keeping CascadeRadar domain-agnostic. */
function Radar({
  rows,
  aName,
  bName,
}: {
  rows: MetricRow[]
  aName: string
  bName: string
}) {
  const axes = rows.map((r) => ({ label: r.label, max: r.radarMax }))
  const proj = (r: MetricRow, v: number) => {
    const clamped = Math.max(0, Math.min(r.radarMax, v))
    return r.higherWins ? clamped : r.radarMax - clamped
  }
  const series: CascadeRadarSeries[] = [
    { name: aName, values: rows.map((r) => proj(r, r.a)), color: 'rgb(var(--accent))' },
    { name: bName, values: rows.map((r) => proj(r, r.b)), color: 'rgb(var(--class-seeker))' },
  ]
  return <CascadeRadar axes={axes} series={series} size={240} />
}

export function CompareTable({ a, b, isPro = false }: Props) {
  const rows = buildRows(a, b)
  const aName = nameOf(a)
  const bName = nameOf(b)
  const aPlaceholder = a.operator.isPlaceholder ?? false
  const bPlaceholder = b.operator.isPlaceholder ?? false

  let aWins = 0
  let bWins = 0
  for (const r of rows) {
    const w = winnerOf(r)
    if (w === 'a') aWins++
    else if (w === 'b') bWins++
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="grid grid-cols-2 gap-4">
        <OperatorHead row={a} accent="text-text-accent" wins={aWins} total={rows.length} />
        <OperatorHead row={b} accent="text-class-seeker" wins={bWins} total={rows.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        {/* Comparison table */}
        <div className="overflow-hidden rounded-lg border border-bg-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-bg-surface">
                <th className="px-3 py-2 font-sans text-[11px] uppercase tracking-wide text-text-muted">
                  Metric
                </th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-text-muted">
                  {aName}
                </th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-text-muted">
                  {bName}
                </th>
                <th className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wide text-text-muted">
                  Δ
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const w = winnerOf(r)
                const delta = r.a - r.b
                const deltaLabel = (delta >= 0 ? '+' : '') + r.fmt(Math.abs(delta)) // magnitude with sign
                return (
                  <tr key={r.canonId} className="border-t border-bg-border-subtle">
                    <td className="px-3 py-2 font-sans text-xs text-text-secondary">
                      {r.label}
                      <CanonId id={r.canonId} title={`Canonical metric ${r.canonId}`} />
                    </td>
                    <td
                      className={
                        'px-3 py-2 text-right font-mono text-xs ' +
                        (w === 'a' ? 'font-bold text-text-accent' : 'text-text-primary')
                      }
                    >
                      {aPlaceholder ? <Placeholder value={r.fmt(r.a)} /> : r.fmt(r.a)}
                    </td>
                    <td
                      className={
                        'px-3 py-2 text-right font-mono text-xs ' +
                        (w === 'b' ? 'font-bold text-class-seeker' : 'text-text-primary')
                      }
                    >
                      {bPlaceholder ? <Placeholder value={r.fmt(r.b)} /> : r.fmt(r.b)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[11px] text-text-muted">
                      {delta === 0 ? '—' : `${delta >= 0 ? '▲' : '▼'} ${r.fmt(Math.abs(delta))}`}
                      <span className="sr-only">{deltaLabel}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Radar */}
        <div className="flex flex-col items-center gap-2 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-sans text-[11px] uppercase tracking-wide text-text-muted">
            Shape
          </span>
          <Radar rows={rows} aName={aName} bName={bName} />
        </div>
      </div>
      {/* Upgrade gate removed (owner 2026-06-22) — the "+ add a third operator" Pro
          gate (ProGate) is archived while billing is dormant; returns with Stripe-live
          in the new repo. */}
    </div>
  )
}

function OperatorHead({
  row,
  accent,
  wins,
  total,
}: {
  row: LeaderboardRow
  accent: string
  wins: number
  total: number
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className={`font-mono text-sm font-bold ${accent}`}>{nameOf(row)}</span>
        <SignalClassBadge signalClass={row.snapshot.class_tier} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xl font-bold text-text-primary">
          {(() => {
            const c = row.snapshot.cascade
            if (!c || c.nonCompounding) return '—'
            return c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(0)
          })()}
        </span>
        <span className="font-sans text-[11px] text-text-muted">
          Υ · #{row.global_rank}
        </span>
      </div>
      <span className="font-sans text-[11px] text-text-secondary">
        Wins {wins}/{total} metrics
      </span>
    </div>
  )
}
