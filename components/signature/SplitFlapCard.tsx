'use client'

/**
 * components/signature/SplitFlapCard.tsx — terminal printout on black paper.
 *
 * Right panel: black background, bright phosphor-green monospace text
 * printing character-by-character with a blinking cursor. Fills the full
 * 630px height — no dead space. Left panel: gold SigRank identity + radar.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { track } from '@/lib/posthog/events'
import type { FieldAverages } from '@/lib/data/field-average'

export interface SplitFlapCardProps {
  codename: string
  name: string
  yieldValue: number | null
  classTier: string
  platform: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  cacheRead?: number | null
  cacheCreate?: number | null
  snr?: number | null
  leverage?: number | null
  velocity?: number | null
  dev10x?: number | null
  scaleV?: number | null
  efficiency?: number | null
  costPerMillion?: number | null
  opRatio?: string | null
  cascadeStr?: string | null
  radarAxes?: { label: string; value: number; max: number }[]
  /** Live per-metric field averages — single source for the AVG USER column,
   *  the radar's field polygon, and the op-ratio footer. Absent → legacy
   *  hardcoded references. */
  fieldAvg?: FieldAverages | null
  showControls?: boolean
}

// ── Format helpers ────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

// ── Colored radar ─────────────────────────────────────────────────────────

interface RadarAxis { label: string; value: number; max: number; color: string; glyph: string }

function ColoredRadar({ axes, size }: { axes: RadarAxis[]; size: number }) {
  const n = axes.length
  if (n < 3) return null
  const cx = size / 2, cy = size / 2, radius = size / 2 - 44
  const rings = [0.25, 0.5, 0.75, 1]
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, r: number): [number, number] => {
    const a = angleAt(i)
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  }
  const norm = (v: number, m: number) => (!m || m <= 0 ? 0 : Math.max(0, Math.min(1, v / m)))
  const polyPath = axes.map((_, i) => {
    const r = norm(axes[i].value, axes[i].max) * radius
    const [x, y] = point(i, r)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + ' Z'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label="Cascade fingerprint">
      {rings.map((ring) => (
        <polygon key={ring}
          points={axes.map((_, i) => point(i, ring * radius).map((v) => v.toFixed(1)).join(',')).join(' ')}
          fill="none" stroke="rgba(10,10,10,0.12)" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={`s-${i}`} x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgba(10,10,10,0.08)" strokeWidth={1} />
      })}
      <path d={polyPath} fill="rgba(10,10,10,0.12)" stroke="#0a0a0a" strokeWidth={3} strokeLinejoin="round" />
      {axes.map((ax, i) => {
        const [x, y] = point(i, norm(ax.value, ax.max) * radius)
        return <circle key={`v-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={6} fill={ax.color} stroke="#0a0a0a" strokeWidth={1.5} />
      })}
      {axes.map((ax, i) => {
        const [lx, ly] = point(i, radius + 24)
        const cos = Math.cos(angleAt(i))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text key={`l-${i}`} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize={14} fontWeight={800} fill={ax.color}
            style={{ fontFamily: 'ui-monospace, monospace' }}>
            {ax.glyph}
          </text>
        )
      })}
    </svg>
  )
}

// ── Radial rings (#4 composite — concentric arcs, one metric per ring) ─────
// Hand-rolled SVG (no charting dep), gold-panel palette: dark arcs on gold.
// Each metric is one ring; the arc sweep = normalized value; Υ sits in center.

function RadialRings({ axes, size, centerValue, reduced, replayKey }: { axes: RadarAxis[]; size: number; centerValue: string; reduced: boolean; replayKey: number }) {
  const n = axes.length
  // Animate each ring's fill from 0 → its value on mount (and on replay).
  // Render a full circle with stroke-dasharray = circumference; the visible
  // arc length = dashoffset, transitioned via CSS. Export-safe (PNG grabs rest state).
  const [grown, setGrown] = useState(reduced)
  useEffect(() => {
    if (reduced) { setGrown(true); return }
    setGrown(false)
    const t = setTimeout(() => setGrown(true), 60)  // next frame → triggers the transition
    return () => clearTimeout(t)
  }, [reduced, replayKey])

  if (n < 3) return null
  const cx = size / 2, cy = size / 2
  const norm = (v: number, m: number) => (!m || m <= 0 ? 0 : Math.max(0, Math.min(1, v / m)))
  const TRACK = 'rgba(10,10,10,0.10)'
  const INK = '#0a0a0a'

  const outerR = size / 2 - 16
  const ringGap = 4
  const ringW = (outerR - size * 0.18 - (n - 1) * ringGap) / n
  const startAngle = -90

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label="Cascade signature rings">
      {axes.map((ax, i) => {
        const r = outerR - i * (ringW + ringGap) - ringW / 2
        const frac = norm(ax.value, ax.max)
        const circ = 2 * Math.PI * r
        // dasharray: [visible run, rest]. visible = frac × circ. Animate from 0 → frac.
        const visible = (grown ? frac : 0) * circ
        const [lx, ly] = [cx, cy + r]
        return (
          <g key={`ring-${i}`}>
            {/* full track */}
            <circle cx={cx} cy={cy} r={r.toFixed(1)} fill="none" stroke={TRACK} strokeWidth={ringW.toFixed(1)} />
            {/* value arc — a circle rotated so the dash starts at top, growing clockwise */}
            <circle
              cx={cx} cy={cy} r={r.toFixed(1)} fill="none"
              stroke={ax.color} strokeWidth={ringW.toFixed(1)} strokeLinecap="round"
              strokeDasharray={`${visible.toFixed(2)} ${(circ - visible).toFixed(2)}`}
              transform={`rotate(${startAngle} ${cx} ${cy})`}
              style={{ transition: reduced ? 'none' : `stroke-dasharray 900ms cubic-bezier(.22,1,.36,1) ${i * 110}ms` }}
            />
            {/* glyph label riding just inside the arc start (top) */}
            <text x={cx} y={(cy - r).toFixed(1)} dx={6} dy={4}
              fontSize={Math.max(10, ringW * 0.7).toFixed(0)} fontWeight={800}
              fill={INK} style={{ fontFamily: 'ui-monospace, monospace' }} opacity={0.75}>
              {ax.glyph}
            </text>
            <text x={lx} y={ly.toFixed(1)} dy={3} textAnchor="middle"
              fontSize={Math.max(9, ringW * 0.55).toFixed(0)} fontWeight={700}
              fill={INK} opacity={0.45} style={{ fontFamily: 'ui-monospace, monospace' }}>
              {`${Math.round(frac * 100)}`}
            </text>
          </g>
        )
      })}
      {/* center Υ */}
      <text x={cx} y={cy} dy={-2} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.075} fontWeight={900} fill={INK} style={{ fontFamily: 'ui-monospace, monospace' }}>
        {'Υ'}
      </text>
      <text x={cx} y={cy} dy={size * 0.07} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.058} fontWeight={800} fill={INK} style={{ fontFamily: 'ui-monospace, monospace' }}>
        {centerValue}
      </text>
    </svg>
  )
}

// ── You-vs-field radar (two series, ink on gold) ───────────────────────────
// You = solid ink stroke + translucent fill; field avg = dashed faint overlay.
// Fixed size in a fixed-height zone — geometry constant, nothing to crop.

function TwoSeriesRadar({ rows, size, reduced, replayKey }: {
  rows: MeterRow[]
  size: number
  reduced: boolean
  replayKey: number
}) {
  const [grown, setGrown] = useState(reduced)
  useEffect(() => {
    if (reduced) { setGrown(true); return }
    setGrown(false)
    const t = setTimeout(() => setGrown(true), 60)
    return () => clearTimeout(t)
  }, [reduced, replayKey])

  const n = rows.length
  if (n < 3) return null
  const INK = '#0a0a0a'
  const cx = size / 2, cy = size / 2, radius = size / 2 - 52
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const pt = (i: number, r: number): [number, number] => {
    const a = angleAt(i)
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  }
  const poly = (fracs: number[], scale: number) =>
    fracs.map((f, i) => pt(i, Math.max(0.02, f) * radius * scale).map((v) => v.toFixed(1)).join(',')).join(' ')

  const youFracs = rows.map((r) => r.frac)
  const avgFracs = rows.map((r) => r.avgFrac ?? 0)
  const scale = grown ? 1 : 0.05

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label="You vs the average operator">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring}
          points={rows.map((_, i) => pt(i, ring * radius).map((v) => v.toFixed(1)).join(',')).join(' ')}
          fill="none" stroke="rgba(10,10,10,0.12)" strokeWidth={1} />
      ))}
      {rows.map((_, i) => {
        const [x, y] = pt(i, radius)
        return <line key={`sp-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(10,10,10,0.08)" strokeWidth={1} />
      })}
      {/* field average — dashed faint reference */}
      <polygon points={poly(avgFracs, 1)}
        fill="rgba(10,10,10,0.07)" stroke={INK} strokeWidth={1.5}
        strokeDasharray="5 4" opacity={0.5} strokeLinejoin="round" />
      {/* field-avg vertex markers — hollow, so the two series stay legible */}
      {rows.map((r, i) => {
        if (r.avgFrac == null) return null
        const [x, y] = pt(i, Math.max(0.02, r.avgFrac) * radius)
        return <circle key={`av-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={4}
          fill="none" stroke={INK} strokeWidth={1.5} opacity={0.55} />
      })}
      {/* you — solid ink, animated grow */}
      <polygon points={poly(youFracs, scale)}
        fill="rgba(10,10,10,0.16)" stroke={INK} strokeWidth={3} strokeLinejoin="round"
        style={{ transition: reduced ? 'none' : 'all 900ms cubic-bezier(.22,1,.36,1)' }} />
      {rows.map((r, i) => {
        const [x, y] = pt(i, Math.max(0.02, r.frac) * radius * scale)
        return <circle key={`v-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={5} fill={INK}
          style={{ transition: reduced ? 'none' : 'all 900ms cubic-bezier(.22,1,.36,1)' }} />
      })}
      {rows.map((r, i) => {
        const [lx, ly] = pt(i, radius + 16)
        const cos = Math.cos(angleAt(i))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text key={`lb-${i}`} x={lx.toFixed(1)} y={(ly - 5).toFixed(1)} textAnchor={anchor} dominantBaseline="middle"
            fontSize={13} fontWeight={800} fill={INK} style={{ fontFamily: 'ui-monospace, monospace' }}>
            {r.glyph}
            {/* value stacked BELOW the glyph — short lines can't clip the viewBox edge */}
            <tspan x={lx.toFixed(1)} dy={13} fontSize={11} fontWeight={900} opacity={0.6}>{r.you}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

// ── Meter panel (hero Υ + horizontal metric bars) ──────────────────────────
// Fresh left-side viz: a hero stat + metric meters. Horizontal bars fit the
// rectangular panel natively — nothing to crop. Each bar carries an avg-user
// tick + dimmed avg label, so every fill reads "you vs the average operator."

interface MeterRow { glyph: string; label: string; frac: number; you: string; avgFrac: number | null; avg: string | null }

function MeterPanel({ meters, heroValue, heroAvg, reduced, replayKey }: {
  meters: MeterRow[]
  heroValue: string
  heroAvg: string
  reduced: boolean
  replayKey: number
}) {
  const [grown, setGrown] = useState(reduced)
  useEffect(() => {
    if (reduced) { setGrown(true); return }
    setGrown(false)
    const t = setTimeout(() => setGrown(true), 60)
    return () => clearTimeout(t)
  }, [reduced, replayKey])

  const INK = '#0a0a0a'

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', width: '100%' }}>
      {/* Hero stat — Υ yield, the one number that matters */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <span style={{ fontSize: '84px', fontWeight: 900, color: INK, lineHeight: 1, letterSpacing: '-2px' }}>
          {heroValue}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: INK, letterSpacing: '1px' }}>{'Υ'} YIELD</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: INK, opacity: 0.45, letterSpacing: '0.5px' }}>avg {heroAvg}</span>
        </div>
      </div>

      {/* You vs the field — two-series radar; the field-avg polygon is the
          reference that makes the shape mean something */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <div style={{ width: '100%', maxWidth: '310px' }}>
          <TwoSeriesRadar rows={meters} size={330} reduced={reduced} replayKey={replayKey} />
        </div>
        <div style={{ display: 'flex', gap: '18px', fontSize: '10px', fontWeight: 700, color: INK, letterSpacing: '1px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '16px', height: '3px', background: INK, borderRadius: '2px' }} /> YOU
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.55 }}>
            <span style={{ width: '16px', height: '0px', borderTop: `2px dashed ${INK}` }} /> FIELD AVG
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Print animation CSS ───────────────────────────────────────────────────

const PRINT_CSS = `
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes scanline {
  from { transform: translateY(-100%); }
  to { transform: translateY(100%); }
}
.print-cursor {
  animation: blink 0.3s steps(1) infinite;
}
`

// ── Line layout (4 columns) ─────────────────────────────────────────────────
// Each metric line is one monospace string, four zones (owner's header map):
//   CASCADE        NEW USER       TELEMETRY        AVERAGE USER
//   [abbr/glyph]   [your value]   [metric name]    [avg value]
// Widths chosen to fit the 780px right panel at 24px mono.
const ABBR_W = 5     // CASCADE  — Υ / SNR / LEV
const YOU_W = 10     // NEW USER — your value (right-aligned)
const NAME_W = 15    // TELEMETRY — metric name
const AVG_W = 8      // AVERAGE USER — avg value (right-aligned)
const G1 = 2, G2 = 3, G3 = 3
// zone boundaries (char offsets) for slicing the revealed string into colored spans
const Z_YOU = ABBR_W + G1                       // your-value starts here
const Z_NAME = Z_YOU + YOU_W + G2               // metric-name starts here
const Z_AVG = Z_NAME + NAME_W + G3              // avg-value starts here

function formatLine(abbr: string, you: string, name: string, avg: string): string {
  return abbr.padEnd(ABBR_W) + ' '.repeat(G1) + you.padStart(YOU_W) + ' '.repeat(G2) + name.padEnd(NAME_W) + ' '.repeat(G3) + avg.padStart(AVG_W)
}

// ── Typewriter line (colored glyph + label + value) ───────────────────────

// Weighted to content within the 60% (720px) panel: abbr narrow · your value ·
// TELEMETRY (metric name) widest · AVERAGE USER. fr units flex with the panel.
// CASCADE column (col 3) gets extra right padding to nudge it right slightly.
const COLS = '0.6fr 1fr 1.6fr 1fr'
const CELL_PAD = '0 18px'

function TypewriterLine({
  abbr, you, name, avg, glyphColor, startDelay, charDelay, reduced,
}: {
  abbr: string
  you: string
  name: string
  avg: string
  glyphColor: string
  startDelay: number
  charDelay: number
  reduced: boolean
}) {
  const total = abbr.length + you.length + name.length + avg.length
  const [count, setCount] = useState(reduced ? total : 0)
  const done = count >= total

  useEffect(() => {
    if (done) return
    const delay = count === 0 ? startDelay : charDelay
    const timer = setTimeout(() => setCount(c => c + 1), delay)
    return () => clearTimeout(timer)
  }, [count, done, startDelay, charDelay])

  const aEnd = abbr.length, yEnd = aEnd + you.length, nEnd = yEnd + name.length
  const rev = (start: number, str: string) => str.slice(0, Math.max(0, Math.min(str.length, count - start)))
  return (
    <div style={{
      flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: COLS, alignItems: 'center',
      padding: CELL_PAD, fontSize: '24px', fontWeight: 700,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    }}>
      <span style={{ color: '#8ae89a', fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px', textShadow: '0 0 7px rgba(138,232,154,0.45)' }}>{rev(yEnd, name)}</span>
      <span style={{ color: '#6e8a6e', fontWeight: 800, textAlign: 'right' }}>{rev(aEnd, you)}</span>
      {/* CASCADE: glyph/abbr — centered + glowing, nudged right slightly */}
      <span style={{ color: glyphColor, fontWeight: 800, textAlign: 'center', paddingLeft: '24px', textShadow: `0 0 8px ${glyphColor}88` }}>{rev(0, abbr)}</span>
      <span style={{ color: '#6e8a6e', fontWeight: 700, textAlign: 'right' }}>{rev(nEnd, avg)}</span>
      {!done && <span className="print-cursor" style={{ color: '#a8ffa8', fontWeight: 800 }}>{'\u258c'}</span>}
    </div>
  )
}

// ── Typewriter simple (single color, for header/divider) ──────────────────

function TypewriterSimple({
  text, color, startDelay, charDelay, reduced, weight = 700, size = 22, rowH,
}: {
  text: string
  color: string
  startDelay: number
  charDelay: number
  reduced: boolean
  weight?: number
  size?: number
  rowH: number
}) {
  const [count, setCount] = useState(text.length)
  const done = count >= text.length

  useEffect(() => {
    if (done) return
    const delay = count === 0 ? startDelay : charDelay
    const timer = setTimeout(() => setCount(c => c + 1), delay)
    return () => clearTimeout(timer)
  }, [count, done, startDelay, charDelay])

  return (
    <div style={{
      flex: 1, minHeight: 0, display: 'flex', alignItems: 'center',
      padding: '0 24px 0 20px', whiteSpace: 'pre',
      fontSize: `${size}px`, fontWeight: weight, color,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      textShadow: `0 0 6px ${color}44`,
    }}>
      {text.slice(0, count)}
      {!done && <span className="print-cursor" style={{ color }}>{'\u258c'}</span>}
    </div>
  )
}

// ── The board ─────────────────────────────────────────────────────────────

function Board({
  cardRef, codename, name, yieldValue, classTier, platform,
  inputTokens, outputTokens, cacheRead, cacheCreate,
  snr, leverage, velocity, dev10x, scaleV, efficiency, costPerMillion,
  opRatio, cascadeStr, radarAxes, fieldAvg, reduced,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>
  reduced: boolean
} & Omit<SplitFlapCardProps, 'showControls'>) {
  const W = 1200, H = 630, LEFT_W = 600, RIGHT_W = W - LEFT_W  // 50/50 rings / printout

  const yieldStr = yieldValue !== null ? (yieldValue >= 1000 ? `${(yieldValue / 1000).toFixed(1)}K` : yieldValue.toFixed(0)) : '\u2014'
  const snrStr = snr != null ? `${(snr * 100).toFixed(0)}%` : '\u2014'
  const levStr = leverage != null ? `${leverage.toFixed(0)}x` : '\u2014'
  const velStr = velocity != null ? velocity.toFixed(1) : '\u2014'
  const devStr = dev10x != null ? dev10x.toFixed(2) : '\u2014'
  const scaleStr = scaleV != null ? scaleV.toFixed(2) : '\u2014'
  const effStr = efficiency != null ? `${efficiency.toFixed(1)}x` : '\u2014'
  const costStr = costPerMillion != null ? `$${costPerMillion.toFixed(2)}` : '\u2014'
  const inputStr = inputTokens != null ? fmtTokens(inputTokens) : '\u2014'
  const outputStr = outputTokens != null ? fmtTokens(outputTokens) : '\u2014'
  const cacheReadStr = cacheRead != null ? fmtTokens(cacheRead) : '\u2014'
  const cacheCreateStr = cacheCreate != null ? fmtTokens(cacheCreate) : '\u2014'
  const totalStr = (inputTokens != null && outputTokens != null && cacheRead != null && cacheCreate != null) ? fmtTokens(inputTokens + outputTokens + cacheRead + cacheCreate) : '\u2014'
  const opStr = opRatio ?? '\u2014'
  const cascadeStrVal = cascadeStr ?? '\u2014'

  const radarColors = ['#f0c862', '#8ae89a', '#8ae89a', '#f0c862', '#f0eee0', '#8ae89a']
  const radarGlyphs = ['\u03a5', 'SNR', 'LEV', '\u26a1', 'SCL', 'EFF']
  const coloredAxes: RadarAxis[] = radarAxes && radarAxes.length >= 3
    ? radarAxes.map((a, i) => ({ ...a, color: radarColors[i % 6], glyph: radarGlyphs[i % 6] }))
    : []

  // Meter rows — pair each radar axis (by label) with its display value and
  // the average-operator reference. When fieldAvg carries a live average for
  // a metric, the axis is normalized so THE FIELD AVERAGE SITS ON THE 50%
  // RING (frac = you / 2*avg): the avg polygon becomes a regular reference
  // shape and any vertex outside it reads "above the field" at a glance.
  // Metrics without a live average fall back to the fixed per-metric max.
  const fmtAvg = {
    pct: (v: number) => `${(v * 100).toFixed(0)}%`,
    x1: (v: number) => `${v.toFixed(1)}x`,
    f1: (v: number) => v.toFixed(1),
    f2: (v: number) => v.toFixed(2),
  }
  const meterMeta: Record<string, { glyph: string; you: string; youNum: number | null; avg: string | null; avgNum: number | null }> = {
    'SNR':        { glyph: 'SNR', you: snrStr,   youNum: snr ?? null,        avgNum: fieldAvg?.snr ?? 0.33,       avg: fieldAvg?.snr != null ? fmtAvg.pct(fieldAvg.snr) : '33%' },
    'Velocity':   { glyph: 'VEL', you: velStr,   youNum: velocity ?? null,   avgNum: fieldAvg?.velocity ?? 0.5,   avg: fieldAvg?.velocity != null ? fmtAvg.f1(fieldAvg.velocity) : '0.50' },
    'Leverage':   { glyph: 'LEV', you: levStr,   youNum: leverage ?? null,   avgNum: fieldAvg?.leverage ?? 3.2,   avg: fieldAvg?.leverage != null ? fmtAvg.x1(fieldAvg.leverage) : '3.2x' },
    '10xDEV':     { glyph: '\u26a1', you: devStr, youNum: dev10x ?? null,    avgNum: fieldAvg?.dev10x ?? 0.5,     avg: fieldAvg?.dev10x != null ? fmtAvg.f2(fieldAvg.dev10x) : '0.50' },
    'Scale V':    { glyph: 'SCL', you: scaleStr, youNum: scaleV ?? null,     avgNum: fieldAvg?.scaleV ?? null,    avg: fieldAvg?.scaleV != null ? fmtAvg.f2(fieldAvg.scaleV) : null },
    'Efficiency': { glyph: 'EFF', you: effStr,   youNum: efficiency ?? null, avgNum: fieldAvg?.efficiency ?? 1.0, avg: fieldAvg?.efficiency != null ? fmtAvg.x1(fieldAvg.efficiency) : '1.0x' },
  }
  const normFrac = (v: number, m: number) => (!m || m <= 0 ? 0 : Math.max(0, Math.min(1, v / m)))
  const meterRows: MeterRow[] = (radarAxes ?? []).map((ax) => {
    const meta = meterMeta[ax.label]
    // Avg-anchored scaling when both numbers exist; legacy max-scaling otherwise.
    const anchored = meta != null && meta.youNum != null && meta.avgNum != null && meta.avgNum > 0
    const frac = anchored
      ? Math.max(0.02, Math.min(1, meta.youNum! / (2 * meta.avgNum!)))
      : normFrac(ax.value, ax.max)
    const avgFrac = anchored ? 0.5 : meta?.avgNum != null ? normFrac(meta.avgNum, ax.max) : null
    return {
      glyph: meta?.glyph ?? ax.label.slice(0, 3).toUpperCase(),
      label: ax.label,
      frac,
      you: meta?.you ?? `${Math.round(frac * 100)}%`,
      avgFrac,
      avg: meta?.avg ?? null,
    }
  })

  const GOLD_BG = '#c4923a'
  const GOLD_DARK = '#0a0a0a'

  // Name auto-scales to fit the fixed 96px header zone instead of wrapping
  // taller and pushing the divider down. Longer name → smaller size; the zone
  // height never changes, so everything below it is geometrically anchored.
  const nameSize = name.length <= 12 ? 42 : name.length <= 18 ? 34 : name.length <= 26 ? 28 : 22

  // Bright phosphor colors on black
  const C_GOLD = '#f0c862'
  const C_GREEN = '#8ae89a'
  const C_BONE = '#e0e0d0'
  const C_DIM = '#5a8a5a'

  // ── Layout: 15 lines fill 630px exactly ─────────────────────────────────
  // 1 header + 5 raw + 1 divider + 8 derived = 15 lines
  // 630 / 15 = 42px per row — no dead space

  const NUM_LINES = 15
  const ROW_H = Math.floor(H / NUM_LINES)  // 42px

  const CHAR_DELAY = 22   // visible dot-matrix speed (was 8 = too fast to see)
  const LINE_GAP = 90     // pause between rows so the print head sweeps down
  const INITIAL_DELAY = 250

  // The 4 column heads (owner): CASCADE | NEW USER | TELEMETRY | AVERAGE USER
  const headerText = formatLine('CASC', 'NEW USER', 'TELEMETRY', 'AVG')
  const dividerText = '         - - - DERIVED - - -'

  // AVERAGE USER token breakdown \u2014 anchored on the NEW USER's input, split by the
  // average operating ratio 3.5 : 1 : 0.5 (cache : input : output, input-normalized).
  // i.e. "at your input volume, what a 3.5:1:0.5 operator would produce." The contrast
  // (your real cache_read >> 3.5\u00d7 input) is the leverage edge, made visible.
  const R_CR = fieldAvg?.crRatio ?? 3.5
  const R_OUT = fieldAvg?.outRatio ?? 0.5
  const R_CW = fieldAvg?.cwRatio ?? null
  const avgIn = inputTokens ?? null
  const avgOut = avgIn != null ? avgIn * R_OUT : null
  const avgCache = avgIn != null ? avgIn * R_CR : null
  const avgCw = avgIn != null && R_CW != null ? avgIn * R_CW : null
  const avgTotal = avgIn != null ? avgIn + avgOut! + avgCache! + (avgCw ?? 0) : null
  const avgFmt = (n: number | null) => (n != null ? fmtTokens(n) : '\u00b7')

  // value | metric name | AVG USER. Raw rows: avg = your-input \u00d7 the 3.5:1:0.5 ratio.
  const rawLines = [
    { glyph: 'IN', label: 'INPUT', value: inputStr, avg: avgFmt(avgIn), color: C_BONE },
    { glyph: 'OUT', label: 'OUTPUT', value: outputStr, avg: avgFmt(avgOut), color: C_GREEN },
    { glyph: 'CR', label: 'CACHE R', value: cacheReadStr, avg: avgFmt(avgCache), color: C_GREEN },
    { glyph: 'CW', label: 'CACHE W', value: cacheCreateStr, avg: avgFmt(avgCw), color: C_BONE },
    { glyph: '\u2211', label: 'TOTAL', value: totalStr, avg: avgFmt(avgTotal), color: C_DIM },
  ]
  const fa = fieldAvg
  const DOT = '\u00b7'
  const favgYield = fa?.yield_ != null ? (fa.yield_ >= 1000 ? `${(fa.yield_ / 1000).toFixed(1)}K` : fa.yield_.toFixed(2)) : '1.57'
  const derivedLines = [
    { glyph: '\u03a5', label: 'YIELD', value: yieldStr, avg: favgYield, color: C_GOLD },
    { glyph: 'SNR', label: 'SNR', value: snrStr, avg: fa?.snr != null ? `${(fa.snr * 100).toFixed(0)}%` : '33%', color: C_GREEN },
    { glyph: 'LEV', label: 'LEVERAGE', value: levStr, avg: fa?.leverage != null ? `${fa.leverage.toFixed(1)}x` : '3.2x', color: C_GREEN },
    { glyph: 'VEL', label: 'VELOCITY', value: velStr, avg: fa?.velocity != null ? fa.velocity.toFixed(1) : '0.50', color: C_BONE },
    { glyph: '\u26a1', label: '10X DEV', value: devStr, avg: fa?.dev10x != null ? fa.dev10x.toFixed(2) : '0.50', color: C_GOLD },
    { glyph: 'SCL', label: 'SCALE V', value: scaleStr, avg: fa?.scaleV != null ? fa.scaleV.toFixed(2) : DOT, color: C_BONE },
    { glyph: 'EFF', label: 'EFFICIENCY', value: effStr, avg: fa?.efficiency != null ? `${fa.efficiency.toFixed(1)}x` : '1.0x', color: C_GREEN },
    { glyph: '$', label: 'COST/1M', value: costStr, avg: fa?.costPerMillion != null ? `$${fa.costPerMillion.toFixed(2)}` : DOT, color: C_DIM },
  ]

  // Compute cumulative start delays
  const allTexts = [
    headerText,
    ...rawLines.map(l => formatLine(l.glyph, l.value, l.label, l.avg)),
    dividerText,
    ...derivedLines.map(l => formatLine(l.glyph, l.value, l.label, l.avg)),
  ]
  const delays: number[] = []
  let cursor = INITIAL_DELAY
  for (const t of allTexts) {
    delays.push(cursor)
    cursor += t.length * CHAR_DELAY + LINE_GAP
  }

  let delayIdx = 0

  return (
    <div ref={cardRef} style={{
      width: W, height: H, background: '#050605',
      display: 'flex', flexDirection: 'row', boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
    }}>
      <style>{PRINT_CSS}</style>

      {/* ═══ LEFT 1/3 — gold ═══ */}
      <div style={{
        width: LEFT_W, height: H, background: GOLD_BG,
        display: 'flex', flexDirection: 'column', padding: '20px 22px',
        boxSizing: 'border-box', position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)',
        }} />

        {/* ── HEADER ZONE — FIXED 96px. Name auto-scales (nameSize) and clips
            inside this box; it can never grow the zone, so the divider below
            sits at a constant y regardless of name length. ── */}
        <div style={{
          height: '96px', flexShrink: 0, overflow: 'hidden',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
        }}>
          <div style={{
            flex: 1, minWidth: 0, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{
              fontSize: `${nameSize}px`, fontWeight: 900, color: GOLD_DARK,
              letterSpacing: '1px', lineHeight: 1.05, wordBreak: 'break-word',
              overflow: 'hidden',
            }}>
              {name.toUpperCase()}
            </div>
            {/* brand pinned to zone bottom-left — baseline-mirrors the op-ratio
                line at the info block's bottom-right (symmetry, no dead gap) */}
            <span style={{ fontSize: '12px', fontWeight: 800, color: GOLD_DARK, letterSpacing: '2.5px', opacity: 0.7 }}>{'\u25c8'} SIGRANK</span>
          </div>
          {/* Info block — top-right corner (yield moved to radar center) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', flexShrink: 0, textAlign: 'right' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: GOLD_DARK, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{classTier} &middot; {(platform ?? '\u2014').toUpperCase()}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: GOLD_DARK, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{cascadeStrVal}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: GOLD_DARK, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{opStr}</span>
          </div>
        </div>

        {/* ── DIVIDER — FIXED 16px row at a constant y (padding 20 + header 96 +
            brand 28). Anchored: content above cannot push it, below cannot pull it. ── */}
        <div style={{ height: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <div style={{ width: '7px', height: '7px', background: GOLD_DARK, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.2 }} />
        </div>

        {/* Meters — hero Υ + metric bars fill the space below the divider.
            Rows are paired by radarAxes label (order: SNR, Velocity, Leverage,
            10xDEV, Scale V, Efficiency per app/user/[codename]/page.tsx). */}
        {meterRows.length >= 3 && (
          <MeterPanel
            meters={meterRows}
            heroValue={yieldStr}
            heroAvg={favgYield}
            reduced={reduced}
            replayKey={0}
          />
        )}

        {/* Footer divider + url */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.2 }} />
          <div style={{ width: '7px', height: '7px', background: GOLD_DARK, transform: 'rotate(45deg)' }} />
        </div>
        <div style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.3, letterSpacing: '1px' }}>
          signalaf.com/user/{codename}
        </div>
      </div>

      {/* ═══ RIGHT 2/3 — black terminal printout ═══ */}
      <div style={{
        width: RIGHT_W, height: H, background: '#0a0a0a',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        boxSizing: 'border-box', flexShrink: 0, position: 'relative',
        overflow: 'hidden',
      }}>
        {/* CRT scanline overlay — subtle moving glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)',
        }} />
        {/* Slow scan glow */}
        {!reduced && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '120px', pointerEvents: 'none', zIndex: 5,
            background: 'linear-gradient(to bottom, transparent, rgba(120,255,120,0.04), transparent)',
            animation: 'scanline 4s linear infinite',
          }} />
        )}

        {/* Column header row — CASCADE | NEW USER | TELEMETRY | AVERAGE USER */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS, alignItems: 'center',
          padding: '14px 28px 12px', borderBottom: '1px solid #2a5a2a',
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
          color: '#6e8a6e',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}>
          {/* order: TELEMETRY | WELCOME | CASCADE | AVG. telemetry+cascade bright, operator+avg dull */}
          <span style={{ color: '#8ae89a', textShadow: '0 0 8px rgba(138,232,154,0.5)' }}>TELEMETRY</span>
          <span style={{ textAlign: 'right' }}>WELCOME OPERATOR</span>
          <span style={{ textAlign: 'center', paddingLeft: '24px', color: '#8ae89a', textShadow: '0 0 8px rgba(138,232,154,0.5)' }}>CASCADE</span>
          <span style={{ textAlign: 'right' }}>AVERAGE USER</span>
        </div>

        {/* Raw token lines */}
        {rawLines.map((l) => (
          <TypewriterLine
            key={`raw-${l.glyph}`}
            abbr={l.glyph} you={l.value} name={l.label} avg={l.avg}
            glyphColor={l.color}
            startDelay={delays[delayIdx++]}
            charDelay={CHAR_DELAY}
            reduced={reduced}
          />
        ))}

        {/* Derived metric lines */}
        {derivedLines.map((l) => (
          <TypewriterLine
            key={`der-${l.glyph}`}
            abbr={l.glyph} you={l.value} name={l.label} avg={l.avg}
            glyphColor={l.color}
            startDelay={delays[delayIdx++]}
            charDelay={CHAR_DELAY}
            reduced={reduced}
          />
        ))}

        {/* Operating-ratio footer strip — you vs the average 3.5:1:0.5 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 30px', borderTop: '1px solid #1a3a1a',
          fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}>
          <span style={{ color: '#5a8a5a' }}>OP RATIO <span style={{ color: '#4a6a4a', fontSize: '11px' }}>C:I:O</span></span>
          <span style={{ color: '#a8ffa8', fontWeight: 800, textShadow: '0 0 8px rgba(168,255,168,0.4)' }}>{opStr}</span>
          <span style={{ color: '#6e8a6e' }}>avg {fieldAvg?.opRatio ?? '3.5:1:0.5'}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main export with responsive scaling ───────────────────────────────────

export function SplitFlapCard(props: SplitFlapCardProps) {
  const { showControls = true } = props
  const cardRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [scale, setScale] = useState(1)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => setScale(container.clientWidth / 1200)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const replay = useCallback(() => setReplayKey((k) => k + 1), [])

  const shareLink = async () => {
    const url = `https://signalaf.com/user/${props.codename}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      track.profileShared('copy', { codename: props.codename })
    } catch { /* */ }
  }

  const download = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { width: 1200, height: 630, pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `sigrank-${props.codename}.png`
      a.click()
      track.profileShared('download', { codename: props.codename })
    } finally { setBusy(false) }
  }

  const btn = 'rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50'

  return (
    <div className="flex flex-col gap-3">
      {showControls && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={replay} className={btn}>{'\u21bb'} Replay</button>
          <button type="button" onClick={shareLink} className={btn}>{copied ? 'Copied \u2713' : 'Share'}</button>
          <button type="button" onClick={download} disabled={busy} className={btn}>{busy ? 'Rendering\u2026' : 'Download card'}</button>
        </div>
      )}
      <div ref={containerRef} className="overflow-hidden rounded-lg border border-[#264028]" style={{ width: '100%', height: 630 * scale }}>
        <div key={replayKey} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1200, height: 630 }}>
          <Board cardRef={cardRef} reduced={reduced} {...props} />
        </div>
      </div>
    </div>
  )
}
