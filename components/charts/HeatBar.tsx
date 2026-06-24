'use client'

/*
 * HeatBar — rows of horizontal bars whose length encodes `width` (0..1) and
 * whose fill color interpolates a cool→gold heat ramp by `heat` (0..1).
 * Use for Υ-by-window or per-platform breakdowns.
 *
 * Locked theme: track = field/line, ramp anchors cool #5b6472 (base/thru) →
 * #e0a64a (power) → #c4923a (gold). Bone labels, muted values.
 */

export interface HeatBarRow {
  label: string
  /** bar length, 0..1 */
  width: number
  /** heat for color ramp, 0..1 */
  heat: number
  /** pre-formatted trailing value (server-computed; avoids passing a function
      across the RSC boundary). Falls back to width-as-% when absent. */
  display?: string
}

export interface HeatBarProps {
  rows: HeatBarRow[]
  /** per-row bar height in px. Default 16. */
  barHeight?: number
}

const clamp01 = (n: number) => (isFinite(n) ? Math.max(0, Math.min(1, n)) : 0)

// cool → power → gold ramp
const RAMP: Array<[number, [number, number, number]]> = [
  [0, [91, 100, 114]], // #5b6472 cool / thru
  [0.6, [224, 166, 74]], // #e0a64a power
  [1, [196, 146, 58]], // #c4923a gold
]

function heatColor(t: number): string {
  const x = clamp01(t)
  for (let i = 1; i < RAMP.length; i++) {
    const [p1, c1] = RAMP[i - 1]
    const [p2, c2] = RAMP[i]
    if (x <= p2) {
      const f = p2 === p1 ? 0 : (x - p1) / (p2 - p1)
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * f)
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * f)
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * f)
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  const last = RAMP[RAMP.length - 1][1]
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`
}

export default function HeatBar({ rows, barHeight = 16 }: HeatBarProps) {
  const valueOf = (row: HeatBarRow) =>
    row.display ?? `${Math.round(clamp01(row.width) * 100)}%`

  if (rows.length === 0) {
    return <div className="font-sans text-sm text-text-muted">no rows</div>
  }

  return (
    <div className="font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => {
          const w = clamp01(row.width)
          return (
            <li key={`${row.label}-${i}`} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-text-secondary" title={row.label}>
                {row.label}
              </span>
              <div
                className="relative flex-1 overflow-hidden rounded-[3px] bg-bg-surface ring-1 ring-inset ring-bg-border"
                style={{ height: barHeight }}
                role="img"
                aria-label={`${row.label}: ${valueOf(row)}`}
              >
                <div
                  className="h-full rounded-[3px]"
                  style={{ width: `${w * 100}%`, background: heatColor(row.heat) }}
                />
              </div>
              <span
                className="w-12 shrink-0 text-right text-xs text-text-primary"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {valueOf(row)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
