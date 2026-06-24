import type { HistoryPoint } from '@/lib/data'

/**
 * SignaHistoryChart — hand-rolled SVG line+area chart of an operator's SIGNA
 * RATE over time. Zero dependencies; themes natively via CSS vars (the stroke /
 * fill / text read rgb(var(--…)) so it follows Carbon/Paper/Railway). Server
 * component — pure render from props.
 *
 * Sharp/modern: a single brand-gold line, a soft area wash, hairline gridlines,
 * an emphasized latest point, and minimal mono labels. Degrades to a quiet
 * empty state when there aren't yet two points to draw.
 */

interface Props {
  history: HistoryPoint[]
  /** Which series to plot. */
  valueKey?: 'signa_rate'
  /** SVG height in user units (width fills the container, aspect preserved). */
  height?: number
}

const MONO = 'var(--font-geist-mono), ui-monospace, monospace'

export function SignaHistoryChart({
  history,
  valueKey = 'signa_rate',
  height = 180,
}: Props) {
  const pts = history.map((h) => ({ date: h.date, v: h[valueKey], rank: h.global_rank }))

  if (pts.length < 2) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-lg border border-bg-border bg-bg-surface">
        <span className="font-mono text-xs text-text-muted">
          Not enough history yet — publish a few snapshots to chart your trajectory.
        </span>
      </div>
    )
  }

  const W = 640
  const H = height
  const padL = 12
  const padR = 12
  const padT = 18
  const padB = 24

  const vals = pts.map((p) => p.v)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || 1
  const min = lo - span * 0.18
  const max = hi + span * 0.18

  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const x = (i: number) => padL + (innerW * i) / (pts.length - 1)
  const y = (v: number) => padT + innerH * (1 - (v - min) / (max - min))
  const baseline = H - padB

  const linePath =
    'M ' + pts.map((p, i) => `${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' L ')
  const areaPath =
    `M ${x(0).toFixed(1)} ${baseline} ` +
    'L ' +
    pts.map((p, i) => `${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' L ') +
    ` L ${x(pts.length - 1).toFixed(1)} ${baseline} Z`

  const last = pts[pts.length - 1]
  const first = pts[0]
  const delta = last.v - first.v

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="SIGNA RATE history"
    >
      {/* gridlines (thirds) */}
      {[0, 0.5, 1].map((f) => {
        const gy = padT + innerH * f
        return (
          <line
            key={f}
            x1={padL}
            y1={gy}
            x2={W - padR}
            y2={gy}
            stroke="rgb(var(--bg-border) / 0.6)"
            strokeWidth={1}
          />
        )
      })}

      {/* area wash */}
      <path d={areaPath} fill="rgb(var(--gold) / 0.12)" stroke="none" />

      {/* line */}
      <path
        d={linePath}
        fill="none"
        stroke="rgb(var(--gold))"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* points */}
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1
        return (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.v)}
            r={isLast ? 4 : 2.5}
            fill={isLast ? 'rgb(var(--gold))' : 'rgb(var(--bg-base))'}
            stroke="rgb(var(--gold))"
            strokeWidth={1.5}
          />
        )
      })}

      {/* latest value label */}
      <text
        x={x(pts.length - 1)}
        y={y(last.v) - 10}
        textAnchor="end"
        fill="rgb(var(--gold))"
        fontSize={13}
        fontWeight={700}
        fontFamily={MONO}
      >
        {last.v.toFixed(1)}
      </text>

      {/* endpoint date labels + delta */}
      <text x={padL} y={H - 7} fill="rgb(var(--text-muted))" fontSize={9} fontFamily={MONO}>
        {first.date}
      </text>
      <text
        x={W - padR}
        y={H - 7}
        textAnchor="end"
        fill="rgb(var(--text-muted))"
        fontSize={9}
        fontFamily={MONO}
      >
        {last.date}
      </text>
      <text
        x={W / 2}
        y={H - 7}
        textAnchor="middle"
        fill={delta >= 0 ? 'rgb(var(--class-seeker))' : 'rgb(var(--class-refiner))'}
        fontSize={9}
        fontFamily={MONO}
      >
        {delta >= 0 ? '▲ +' : '▼ '}
        {Math.abs(delta).toFixed(1)} over window
      </text>
    </svg>
  )
}
