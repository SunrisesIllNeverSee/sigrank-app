/**
 * components/compare/CompareHistoryChart.tsx — CMP-HISTORY (owner 2026-07-02).
 *
 * Dual-line overtime chart for the compare page. Plots both operators' Υ Yield
 * history on a shared timeline with smooth monotone curves, gradient
 * area fills, dashed gridlines, every x-label, and a field baseline.
 *
 * Inspired by the chart-demo-composite concepts (owner 2026-06-28):
 *  - Smooth midpoint-quadratic curves (chart 1 — Composed)
 *  - Gradient area wash under each line (chart 1)
 *  - Dashed gridlines with full y-ticks + every x-label (charts 1 + 3)
 *  - Class threshold band (chart 3 — BigComposed)
 *  - End-of-line value labels (chart 6 — MultiLine)
 *
 * Pure inline SVG, zero dependencies. Theme-reactive via CSS vars.
 * Server component — pure render from props.
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
  /** Field average Υ Yield (current board mean). Drawn as a horizontal
   *  reference line so both operators are contextualized against the field. */
  fieldAvg?: number | null
  /** SVG height. Default 240. */
  height?: number
}

// Theme-reactive CSS vars — re-resolve when data-theme flips.
const GOLD = 'rgb(var(--gold))'
const BLUE = 'rgb(var(--class-arch))'
const LINE = 'rgb(var(--bg-border))'
const BONE = 'rgb(var(--text-primary))'
const MUTED = 'rgb(var(--text-muted))'
const FIELD = 'rgb(var(--text-muted))' // field baseline — muted/neutral
const SURF = 'rgb(var(--bg-surface))'
const MONO = 'var(--font-geist-mono), ui-monospace, monospace'

interface Pt {
  date: string
  v: number
}

function toPts(h: HistoryPoint[]): Pt[] {
  return h.map((p) => ({ date: p.date, v: p.yield_ }))
}

/** Smooth monotone-ish curve via midpoint quadratics (from chart-demo Composed). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const x0 = pts[i - 1].x, y0 = pts[i - 1].y
    const x1 = pts[i].x, y1 = pts[i].y
    const mx = (x0 + x1) / 2
    d += ` C${mx.toFixed(2)},${y0.toFixed(2)} ${mx.toFixed(2)},${y1.toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`
  }
  return d
}

export function CompareHistoryChart({
  historyA,
  historyB,
  nameA,
  nameB,
  fieldAvg,
  height = 240,
}: Props) {
  const ptsA = toPts(historyA)
  const ptsB = toPts(historyB)

  // Need at least 2 points across both series to draw anything meaningful.
  if (ptsA.length < 2 && ptsB.length < 2) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-bg-border bg-bg-surface">
        <span className="font-mono text-xs text-text-muted">
          Not enough history yet — both operators need at least two snapshots to chart Υ Yield trajectory.
        </span>
      </div>
    )
  }

  const W = 1040
  const H = height
  const padL = 42
  const padR = 120 // room for end-of-line labels
  const padT = 32
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Shared y-scale: union of both series' values, rounded to nice ticks.
  const allVals = [...ptsA.map((p) => p.v), ...ptsB.map((p) => p.v)]
  const rawMin = Math.min(...allVals)
  const rawMax = Math.max(...allVals)
  const tickStep = Math.max(1, Math.ceil((rawMax - rawMin) / 4))
  const min = Math.floor(rawMin / tickStep) * tickStep - tickStep
  const max = Math.ceil(rawMax / tickStep) * tickStep + tickStep
  const range = max - min || 1

  // Shared x-scale: union of both series' dates, sorted ascending.
  const allDates = Array.from(
    new Set([...ptsA.map((p) => p.date), ...ptsB.map((p) => p.date)]),
  ).sort()
  const dateIndex = new Map(allDates.map((d, i) => [d, i]))
  const xAt = (i: number) => padL + (innerW * i) / Math.max(1, allDates.length - 1)
  const yAt = (v: number) => padT + innerH * (1 - (v - min) / range)

  // Map a series points to {x, y} coords using the shared date index.
  const coordsFor = (pts: Pt[]) =>
    pts.map((p) => ({ x: xAt(dateIndex.get(p.date) ?? 0), y: yAt(p.v) }))

  const linePathA = ptsA.length >= 2 ? smoothPath(coordsFor(ptsA)) : ''
  const linePathB = ptsB.length >= 2 ? smoothPath(coordsFor(ptsB)) : ''

  // Area paths (line + drop to baseline + close).
  const baseline = padT + innerH
  const areaPathA = ptsA.length >= 2
    ? `${linePathA} L${xAt(dateIndex.get(ptsA[ptsA.length - 1].date) ?? 0).toFixed(2)},${baseline} L${xAt(dateIndex.get(ptsA[0].date) ?? 0).toFixed(2)},${baseline} Z`
    : ''
  const areaPathB = ptsB.length >= 2
    ? `${linePathB} L${xAt(dateIndex.get(ptsB[ptsB.length - 1].date) ?? 0).toFixed(2)},${baseline} L${xAt(dateIndex.get(ptsB[0].date) ?? 0).toFixed(2)},${baseline} Z`
    : ''

  // Y-axis ticks (5 steps).
  const yTicks = Array.from({ length: 5 }, (_, i) => min + (range * i) / 4)

  // Field baseline — the current board mean Υ Yield, drawn as a horizontal
  // reference line. Not time-varying (we don't have aggregate history), but
  // it contextualizes both operators against the field.
  const hasField = fieldAvg != null && Number.isFinite(fieldAvg) && fieldAvg > 0
  const fieldY = hasField ? yAt(fieldAvg!) : 0

  const lastA = ptsA[ptsA.length - 1]
  const lastB = ptsB[ptsB.length - 1]

  const truncName = (n: string) => (n.length > 14 ? n.slice(0, 14) + '…' : n)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Yield overtime comparison"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      <defs>
        <linearGradient id="cmp-grad-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
          <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="cmp-grad-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.28} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* title */}
      <text x={padL} y={16} fontSize={11} fill={MUTED} style={{ letterSpacing: '0.04em' }} fontFamily={MONO}>
        Υ YIELD · OVERTIME
      </text>

      {/* legend (top-right, inline) */}
      <g>
        <rect x={W - padR - 270} y={8} width={10} height={10} rx={2} fill={BLUE} />
        <text x={W - padR - 256} y={17} fill={BONE} fontSize={10} fontFamily={MONO}>
          {truncName(nameA)}
        </text>
        <rect x={W - padR - 170} y={8} width={10} height={10} rx={2} fill={GOLD} />
        <text x={W - padR - 156} y={17} fill={BONE} fontSize={10} fontFamily={MONO}>
          {truncName(nameB)}
        </text>
        {hasField && (
          <>
            <line x1={W - padR - 70} y1={13} x2={W - padR - 60} y2={13} stroke={FIELD} strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={W - padR - 56} y={17} fill={MUTED} fontSize={10} fontFamily={MONO}>
              Field avg
            </text>
          </>
        )}
      </g>

      {/* dashed gridlines + y labels */}
      {yTicks.map((t, i) => {
        const y = yAt(t)
        return (
          <g key={i}>
            <line x1={padL} y1={y.toFixed(2)} x2={W - padR} y2={y.toFixed(2)} stroke={LINE} strokeDasharray="2 4" strokeWidth={1} />
            <text x={padL - 6} y={y.toFixed(2)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill={MUTED} fontFamily={MONO}>
              {t.toFixed(0)}
            </text>
          </g>
        )
      })}

      {/* field baseline — horizontal reference line at the board mean */}
      {hasField && (
        <>
          <line x1={padL} y1={fieldY.toFixed(2)} x2={W - padR} y2={fieldY.toFixed(2)} stroke={FIELD} strokeWidth={1.2} strokeDasharray="5 3" opacity={0.6} />
          <text x={padL + 4} y={(fieldY - 5).toFixed(2)} textAnchor="start" fontSize={9} fill={MUTED} fontFamily={MONO}>
            Field avg {fieldAvg!.toFixed(1)}
          </text>
        </>
      )}

      {/* A area wash + smooth line */}
      {ptsA.length >= 2 && (
        <>
          <path d={areaPathA} fill="url(#cmp-grad-a)" stroke="none" />
          <path d={linePathA} fill="none" stroke={BLUE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {/* B area wash + smooth line */}
      {ptsB.length >= 2 && (
        <>
          <path d={areaPathB} fill="url(#cmp-grad-b)" stroke="none" />
          <path d={linePathB} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {/* A data points */}
      {ptsA.map((p, i) => {
        const x = xAt(dateIndex.get(p.date) ?? 0)
        const y = yAt(p.v)
        const isLast = i === ptsA.length - 1
        return (
          <circle
            key={`a-${i}`}
            cx={x.toFixed(2)}
            cy={y.toFixed(2)}
            r={isLast ? 4 : 2.5}
            fill={isLast ? BLUE : SURF}
            stroke={BLUE}
            strokeWidth={1.5}
          />
        )
      })}

      {/* B data points */}
      {ptsB.map((p, i) => {
        const x = xAt(dateIndex.get(p.date) ?? 0)
        const y = yAt(p.v)
        const isLast = i === ptsB.length - 1
        return (
          <circle
            key={`b-${i}`}
            cx={x.toFixed(2)}
            cy={y.toFixed(2)}
            r={isLast ? 4 : 2.5}
            fill={isLast ? GOLD : SURF}
            stroke={GOLD}
            strokeWidth={1.5}
          />
        )
      })}

      {/* end-of-line value labels (right margin) */}
      {ptsA.length >= 2 && (
        <text
          x={W - padR + 8}
          y={yAt(lastA.v).toFixed(2)}
          dominantBaseline="middle"
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
          x={W - padR + 8}
          y={yAt(lastB.v).toFixed(2)}
          dominantBaseline="middle"
          fill={GOLD}
          fontSize={11}
          fontWeight={700}
          fontFamily={MONO}
        >
          {lastB.v.toFixed(1)}
        </text>
      )}

      {/* x-axis labels — every date from the shared timeline */}
      {allDates.map((d, i) => (
        <text
          key={`x-${i}`}
          x={xAt(i).toFixed(2)}
          y={H - 7}
          textAnchor="middle"
          fontSize={9}
          fill={MUTED}
          fontFamily={MONO}
        >
          {d.slice(5)}
        </text>
      ))}
    </svg>
  )
}
