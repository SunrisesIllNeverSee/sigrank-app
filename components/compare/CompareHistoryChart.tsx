/**
 * components/compare/CompareHistoryChart.tsx — CMP-HISTORY (owner 2026-07-02).
 *
 * Dual-line overtime chart for the compare page. Plots both operators' SIGNA
 * RATE history on a shared timeline so you can see trajectory head-to-head:
 * who's climbing, who's flat, who crossed over.
 *
 * Pure inline SVG, zero dependencies. Theme-reactive via CSS vars — matches
 * EvolutionLine / SignaHistoryChart conventions (gold/blue lines, hairline
 * gridlines, mono labels, emphasized latest points).
 *
 * Server component — pure render from props. The page fetches both histories
 * via getOperatorHistory and passes them in.
 */

import type { HistoryPoint } from '@/lib/data'

interface Props {
  /** Operator A history (ascending by date). */
  historyA: HistoryPoint[]
  /** Operator B history (ascending by date). */
  historyB: HistoryPoint[]
  /** Display name for A (legend label). */
  nameA: string
  /** Display name for B (legend label). */
  nameB: string
  /** SVG height. Default 220. */
  height?: number
}

// Theme-reactive CSS vars — re-resolve when data-theme flips.
const GOLD = 'rgb(var(--gold))'
const BLUE = 'rgb(var(--class-arch))'
const LINE = 'rgb(var(--bg-border))'
const BONE = 'rgb(var(--text-primary))'
const MUTED = 'rgb(var(--text-muted))'
const MONO = 'var(--font-geist-mono), ui-monospace, monospace'

interface Pt {
  date: string
  v: number
  rank: number
}

function toPts(h: HistoryPoint[]): Pt[] {
  return h.map((p) => ({ date: p.date, v: p.signa_rate, rank: p.global_rank }))
}

export function CompareHistoryChart({
  historyA,
  historyB,
  nameA,
  nameB,
  height = 220,
}: Props) {
  const ptsA = toPts(historyA)
  const ptsB = toPts(historyB)

  // Need at least 2 points across both series to draw anything meaningful.
  if (ptsA.length < 2 && ptsB.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border border-bg-border bg-bg-surface">
        <span className="font-mono text-xs text-text-muted">
          Not enough history yet — both operators need at least two snapshots to chart trajectory.
        </span>
      </div>
    )
  }

  const W = 640
  const H = height
  const padL = 44
  const padR = 14
  const padT = 30
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Shared y-scale: union of both series' values.
  const allVals = [...ptsA.map((p) => p.v), ...ptsB.map((p) => p.v)]
  const lo = Math.min(...allVals)
  const hi = Math.max(...allVals)
  const span = hi - lo || 1
  const min = lo - span * 0.12
  const max = hi + span * 0.12
  const range = max - min || 1

  // Shared x-scale: union of both series' dates, sorted ascending.
  // Each series maps its points onto the shared date index.
  const allDates = Array.from(
    new Set([...ptsA.map((p) => p.date), ...ptsB.map((p) => p.date)]),
  ).sort()
  const dateIndex = new Map(allDates.map((d, i) => [d, i]))
  const xAt = (i: number) => padL + (innerW * i) / Math.max(1, allDates.length - 1)
  const yAt = (v: number) => padT + innerH * (1 - (v - min) / range)

  const lineFor = (pts: Pt[]) => {
    if (pts.length < 2) return ''
    return pts
      .map((p, i) => {
        const di = dateIndex.get(p.date) ?? 0
        return `${i === 0 ? 'M' : 'L'}${xAt(di).toFixed(2)},${yAt(p.v).toFixed(2)}`
      })
      .join(' ')
  }

  const areaFor = (pts: Pt[]) => {
    if (pts.length < 2) return ''
    const baseline = H - padB
    const first = dateIndex.get(pts[0].date) ?? 0
    const last = dateIndex.get(pts[pts.length - 1].date) ?? 0
    return (
      `M ${xAt(first).toFixed(2)} ${baseline} ` +
      pts
        .map((p) => {
          const di = dateIndex.get(p.date) ?? 0
          return `L ${xAt(di).toFixed(2)} ${yAt(p.v).toFixed(2)}`
        })
        .join(' ') +
      ` L ${xAt(last).toFixed(2)} ${baseline} Z`
    )
  }

  const lastA = ptsA[ptsA.length - 1]
  const lastB = ptsB[ptsB.length - 1]
  const firstA = ptsA[0]
  const firstB = ptsB[0]
  const deltaA = ptsA.length >= 2 ? lastA.v - firstA.v : 0
  const deltaB = ptsB.length >= 2 ? lastB.v - firstB.v : 0

  const gridLines = [0, 0.5, 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="SIGNA RATE overtime comparison"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {/* title */}
      <text x={padL} y={14} fontSize={11} fill={MUTED} style={{ letterSpacing: '0.04em' }} fontFamily={MONO}>
        SIGNA RATE · OVERTIME
      </text>

      {/* legend (top-right) */}
      <g>
        <rect x={W - padR - 180} y={6} width={10} height={10} rx={2} fill={BLUE} />
        <text x={W - padR - 166} y={15} fill={BONE} fontSize={10} fontFamily={MONO}>
          {nameA.length > 16 ? nameA.slice(0, 16) + '…' : nameA}
        </text>
        <rect x={W - padR - 90} y={6} width={10} height={10} rx={2} fill={GOLD} />
        <text x={W - padR - 76} y={15} fill={BONE} fontSize={10} fontFamily={MONO}>
          {nameB.length > 16 ? nameB.slice(0, 16) + '…' : nameB}
        </text>
      </g>

      {/* horizontal gridlines + y labels */}
      {gridLines.map((t) => {
        const y = padT + innerH - t * innerH
        const v = min + t * range
        return (
          <g key={t}>
            <line x1={padL} y1={y.toFixed(2)} x2={W - padR} y2={y.toFixed(2)} stroke={LINE} strokeWidth={1} opacity={0.6} />
            <text
              x={padL - 6}
              y={y.toFixed(2)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={MUTED}
              fontFamily={MONO}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {v.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* A area wash + line */}
      {ptsA.length >= 2 && (
        <>
          <path d={areaFor(ptsA)} fill={BLUE} fillOpacity={0.08} stroke="none" />
          <path d={lineFor(ptsA)} fill="none" stroke={BLUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}

      {/* B area wash + line */}
      {ptsB.length >= 2 && (
        <>
          <path d={areaFor(ptsB)} fill={GOLD} fillOpacity={0.08} stroke="none" />
          <path d={lineFor(ptsB)} fill="none" stroke={GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}

      {/* A points + last-point halo */}
      {ptsA.map((p, i) => {
        const di = dateIndex.get(p.date) ?? 0
        const isLast = i === ptsA.length - 1
        return (
          <circle
            key={`a-${i}`}
            cx={xAt(di).toFixed(2)}
            cy={yAt(p.v).toFixed(2)}
            r={isLast ? 5 : 2.5}
            fill={isLast ? BLUE : 'rgb(var(--bg-base))'}
            stroke={BLUE}
            strokeWidth={1.5}
          />
        )
      })}

      {/* B points + last-point halo */}
      {ptsB.map((p, i) => {
        const di = dateIndex.get(p.date) ?? 0
        const isLast = i === ptsB.length - 1
        return (
          <circle
            key={`b-${i}`}
            cx={xAt(di).toFixed(2)}
            cy={yAt(p.v).toFixed(2)}
            r={isLast ? 5 : 2.5}
            fill={isLast ? GOLD : 'rgb(var(--bg-base))'}
            stroke={GOLD}
            strokeWidth={1.5}
          />
        )
      })}

      {/* latest value labels */}
      {ptsA.length >= 2 && (
        <text
          x={xAt(dateIndex.get(lastA.date) ?? 0).toFixed(2)}
          y={(yAt(lastA.v) - 10).toFixed(2)}
          textAnchor="end"
          fill={BLUE}
          fontSize={11}
          fontWeight={700}
          fontFamily={MONO}
        >
          {lastA.v.toFixed(1)}
        </text>
      )}
      {ptsB.length >= 2 && (
        <text
          x={xAt(dateIndex.get(lastB.date) ?? 0).toFixed(2)}
          y={(yAt(lastB.v) + 16).toFixed(2)}
          textAnchor="end"
          fill={GOLD}
          fontSize={11}
          fontWeight={700}
          fontFamily={MONO}
        >
          {lastB.v.toFixed(1)}
        </text>
      )}

      {/* x-axis date labels (first + last from the shared timeline) */}
      <text x={padL} y={H - 8} textAnchor="start" fontSize={9} fill={MUTED} fontFamily={MONO}>
        {allDates[0]?.slice(5) ?? ''}
      </text>
      <text x={W - padR} y={H - 8} textAnchor="end" fontSize={9} fill={MUTED} fontFamily={MONO}>
        {allDates[allDates.length - 1]?.slice(5) ?? ''}
      </text>

      {/* delta labels (center) */}
      {ptsA.length >= 2 && (
        <text
          x={padL + innerW * 0.33}
          y={H - 8}
          textAnchor="middle"
          fill={deltaA >= 0 ? 'rgb(var(--class-seeker))' : 'rgb(var(--class-refiner))'}
          fontSize={9}
          fontFamily={MONO}
        >
          {nameA.length > 10 ? nameA.slice(0, 10) + '…' : nameA}: {deltaA >= 0 ? '▲ +' : '▼ '}
          {Math.abs(deltaA).toFixed(1)}
        </text>
      )}
      {ptsB.length >= 2 && (
        <text
          x={padL + innerW * 0.66}
          y={H - 8}
          textAnchor="middle"
          fill={deltaB >= 0 ? 'rgb(var(--class-seeker))' : 'rgb(var(--class-refiner))'}
          fontSize={9}
          fontFamily={MONO}
        >
          {nameB.length > 10 ? nameB.slice(0, 10) + '…' : nameB}: {deltaB >= 0 ? '▲ +' : '▼ '}
          {Math.abs(deltaB).toFixed(1)}
        </text>
      )}
    </svg>
  )
}
