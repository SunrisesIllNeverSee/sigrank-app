'use client'

/**
 * components/share/CompareMatchupCard.tsx — the downloadable matchup + radars card.
 *
 * Sibling of CompareShareCard. Combines the CompareMatchup (identity + 3 facts
 * per operator) and CompareRadars (raw shape + metric shape with ghost underlay)
 * into a single 1200×900 social card. Dark top section for the matchup, terminal-black
 * bottom section with CRT scanlines for the dual radars.
 *
 * Radars mirror the site's CascadeRadar: ghost layers on the metric radar, legend,
 * full axis labels with direction arrows (↑/↓), matching colors/opacity/vertex sizes.
 *
 * Same html-to-image approach as CompareShareCard — off-screen element
 * captured to PNG, no server route / Satori.
 */

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { track } from '@/lib/posthog/events'
import type { LeaderboardRow } from '@/lib/data'
import { operatorDisplayName } from '@/lib/compare/operator-name'
import { deriveFacts, type OperatorFact } from '@/lib/compare/facts'
import { glyphFor } from '@/lib/canon/ids'
import type { SignalClass } from '@/components/sigrank/types'

// ── Palette (static hex — html-to-image can't resolve CSS vars) ──────────────
const INK = '#0a0a0a'
const C_GREEN = '#8ae89a'
const C_GOLD = '#f0c862'
const C_DULL = '#6e8a6e'
const C_BONE = '#e9e3d5'   // matches --text-primary
const C_LINE = '#332d20'   // matches --bg-border
const A_COLOR = '#7ab8e8'  // matches rgb(var(--class-arch)) — blue
const B_COLOR = '#f0c862'  // matches rgb(var(--class-seeker)) — gold

// Class → hex (static for the card; can't use CSS vars in html-to-image reliably)
const CLASS_HEX: Record<string, string> = {
  TRANSMITTER: '#c4923a',
  'ARCH+': '#e8a0d0',
  ARCH: '#7ab8e8',
  POWER: '#e87a7a',
  BASE: '#a8a8a8',
  SEEKER: '#f0c862',
  REFINER: '#8ae89a',
  BEARER: '#c8a8e8',
  IGNITER: '#e8c87a',
}

function classColor(cls: string): string {
  return CLASS_HEX[cls] ?? CLASS_HEX.BASE
}

function yieldStr(r: LeaderboardRow): string {
  const c = r.snapshot.cascade
  if (!c || c.nonCompounding) return '—'
  const y = c.yield_
  if (y >= 1000) return `${(y / 1000).toFixed(1)}K`
  if (y >= 1) return y.toFixed(0)
  return y.toFixed(2)
}

function tally(a: LeaderboardRow, b: LeaderboardRow): { aWins: number; bWins: number } {
  const ca = a.snapshot.cascade
  const cb = b.snapshot.cascade
  const ta = a.telemetry
  const tb = b.telemetry
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) => (c ? pick(c) : 0)
  const tel = (t: typeof ta, pick: (x: NonNullable<typeof ta>) => number) => (t ? pick(t) : 0)
  const axes: Array<[number, number, boolean]> = [
    [comp(ca, (x) => x.yield_), comp(cb, (x) => x.yield_), true],
    [raw(ca, (x) => x.snr), raw(cb, (x) => x.snr), true],
    [comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage), true],
    [raw(ca, (x) => x.velocity), raw(cb, (x) => x.velocity), true],
    [comp(ca, (x) => x.dev10x ?? 0), comp(cb, (x) => x.dev10x ?? 0), true],
    [raw(ca, (x) => x.costPerMillion), raw(cb, (x) => x.costPerMillion), false],
    [tel(ta, (x) => x.fresh_input), tel(tb, (x) => x.fresh_input), true],
    [tel(ta, (x) => x.output), tel(tb, (x) => x.output), true],
    [tel(ta, (x) => x.cache_read), tel(tb, (x) => x.cache_read), true],
    [tel(ta, (x) => x.cache_create), tel(tb, (x) => x.cache_create), true],
  ]
  let aWins = 0, bWins = 0
  for (const [av, bv, higherWins] of axes) {
    if (av === bv) continue
    const aBetter = higherWins ? av > bv : av < bv
    if (aBetter) aWins++
    else bWins++
  }
  return { aWins, bWins }
}

// ── Radar axis data (mirrors CompareRadars.tsx exactly) ──────────────────────

interface RadarAxis {
  label: string
  a: number
  b: number
  max: number
  higherWins: boolean
}

function rawAxes(a: LeaderboardRow, b: LeaderboardRow): RadarAxis[] {
  const ta = a.telemetry
  const tb = b.telemetry
  const totA = ta ? ta.fresh_input + ta.output + ta.cache_read + ta.cache_create : 0
  const totB = tb ? tb.fresh_input + tb.output + tb.cache_read + tb.cache_create : 0
  const ca = a.snapshot.cascade
  const cb = b.snapshot.cascade
  const mk = (label: string, av: number, bv: number, higherWins = true): RadarAxis => ({
    label, a: av, b: bv, max: Math.max(av, bv, 1), higherWins,
  })
  return [
    mk('Input', ta?.fresh_input ?? 0, tb?.fresh_input ?? 0),
    mk('Output', ta?.output ?? 0, tb?.output ?? 0),
    mk('CR', ta?.cache_read ?? 0, tb?.cache_read ?? 0),
    mk('CW', ta?.cache_create ?? 0, tb?.cache_create ?? 0),
    mk('Total', totA, totB),
    mk('Cost', ca?.costPerMillion ?? 0, cb?.costPerMillion ?? 0, false),
  ]
}

function metricAxes(a: LeaderboardRow, b: LeaderboardRow): RadarAxis[] {
  const ca = a.snapshot.cascade
  const cb = b.snapshot.cascade
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) => (c ? pick(c) : 0)
  const mk = (label: string, av: number, bv: number, higherWins = true): RadarAxis => ({
    label, a: av, b: bv, max: Math.max(av, bv, 1), higherWins,
  })
  return [
    mk('Υ Yield', comp(ca, (x) => x.yield_), comp(cb, (x) => x.yield_)),
    mk('Leverage', comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage)),
    mk('SNR', raw(ca, (x) => x.snr), raw(cb, (x) => x.snr)),
    mk('Velocity', raw(ca, (x) => x.velocity), raw(cb, (x) => x.velocity)),
    mk('10xDEV', comp(ca, (x) => x.dev10x ?? 0), comp(cb, (x) => x.dev10x ?? 0)),
    mk('Efficacy', raw(ca, (x) => x.efficiency), raw(cb, (x) => x.efficiency)),
    mk('$/1M', raw(ca, (x) => x.costPerMillion), raw(cb, (x) => x.costPerMillion), false),
    mk('Op Ratio', comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage)),
  ]
}

function proj(ax: RadarAxis, v: number): number {
  const c = Math.max(0, Math.min(ax.max, v))
  return ax.higherWins ? c : ax.max - c
}

// ── Card radar — mirrors CascadeRadar.tsx output (ghost + solid + legend) ────

interface CardRadarSeries {
  name: string
  values: number[]
  color: string
  variant: 'solid' | 'ghost'
}

function CardRadar({
  axes,
  series,
  size,
}: {
  axes: { label: string; max: number }[]
  series: CardRadarSeries[]
  size: number
}) {
  const n = axes.length
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 56  // matches CascadeRadar — room for labels
  const rings = [0.25, 0.5, 0.75, 1]
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, r: number): [number, number] => {
    const a = angleAt(i)
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  }
  const norm = (value: number, max: number) => {
    if (!max || !isFinite(max) || max <= 0) return 0
    return Math.max(0, Math.min(1, value / max))
  }
  const pathFor = (vals: number[]) =>
    axes.map((_, i) => {
      const r = norm(vals[i] ?? 0, axes[i].max) * radius
      const [x, y] = point(i, r)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    }).join(' ') + ' Z'

  // Sort: ghost layers first (behind), solid layers on top — matches CascadeRadar
  const sorted = [...series].map((s, si) => ({ s, si }))
    .sort((p, q) => (p.s.variant === 'ghost' ? 0 : 1) - (q.s.variant === 'ghost' ? 0 : 1))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* concentric grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => point(i, ring * radius).map((v) => v.toFixed(2)).join(',')).join(' ')}
          fill="none" stroke={C_LINE} strokeWidth={1} opacity={ring === 1 ? 0.9 : 0.5}
        />
      ))}
      {/* radial spokes */}
      {axes.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={`s-${i}`} x1={cx} y1={cy} x2={x.toFixed(2)} y2={y.toFixed(2)} stroke={C_LINE} strokeWidth={1} opacity={0.4} />
      })}
      {/* data polygons — ghost first (fill-only), then solid (stroked) */}
      {sorted.map(({ s, si }) => {
        const ghost = s.variant === 'ghost'
        return (
          <path
            key={`poly-${si}`}
            d={pathFor(s.values)}
            fill={s.color}
            fillOpacity={ghost ? 0.1 : 0.16}
            stroke={ghost ? 'none' : s.color}
            strokeWidth={ghost ? 0 : 2}
            strokeLinejoin="round"
          />
        )
      })}
      {/* data vertices — solid layers only */}
      {series.map((s, si) =>
        s.variant === 'ghost'
          ? null
          : axes.map((_, i) => {
              const [x, y] = point(i, norm(s.values[i] ?? 0, axes[i].max) * radius)
              return <circle key={`pt-${si}-${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={3} fill={s.color} />
            }),
      )}
      {/* axis labels — bone, with direction arrows */}
      {axes.map((ax, i) => {
        const [lx, ly] = point(i, radius + 22)
        const cos = Math.cos(angleAt(i))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text key={`l-${i}`} x={lx.toFixed(2)} y={ly.toFixed(2)} textAnchor={anchor}
            dominantBaseline="middle" fontSize={11} fill={C_BONE} fontWeight={600}
            fontFamily="ui-monospace, monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {ax.label}
          </text>
        )
      })}
      {/* legend — solid layers only, top-left */}
      {series
        .filter((s) => s.variant !== 'ghost')
        .map((s, si) => (
          <g key={`leg-${si}`}>
            <rect x={8} y={8 + si * 16} width={10} height={10} rx={2} fill={s.color} />
            <text x={22} y={17 + si * 16} fill={C_BONE} fontSize={10} fontFamily="ui-monospace, monospace">
              {s.name}
            </text>
          </g>
        ))}
    </svg>
  )
}

// ── Fact line for the card ───────────────────────────────────────────────────

function FactLine({ fact }: { fact: OperatorFact }) {
  const mark = fact.polarity === 'up' ? '✦' : fact.polarity === 'down' ? '△' : '·'
  const markColor = fact.polarity === 'up' ? C_GOLD : fact.polarity === 'down' ? C_DULL : '#4a6a4a'
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 11, color: markColor, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>{mark}</span>
      <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', lineHeight: 1.4, minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: C_BONE }}>{fact.label}</span>
        <span style={{ color: '#7d7461' }}> · {fact.detail}</span>
      </span>
    </div>
  )
}

// ── The card itself ──────────────────────────────────────────────────────────

function Card({ cardRef, a, b, href }: {
  cardRef: React.RefObject<HTMLDivElement | null>
  a: LeaderboardRow
  b: LeaderboardRow
  href: string
}) {
  const nameA = operatorDisplayName(a).toUpperCase()
  const nameB = operatorDisplayName(b).toUpperCase()
  const clsA = a.snapshot.class_tier as SignalClass
  const clsB = b.snapshot.class_tier as SignalClass
  const colA = classColor(clsA)
  const colB = classColor(clsB)
  const { aWins, bWins } = tally(a, b)
  const winner: 'a' | 'b' | null = aWins === bWins ? null : aWins > bWins ? 'a' : 'b'
  const factsA = deriveFacts(a, b).slice(0, 3)
  const factsB = deriveFacts(b, a).slice(0, 3)

  // Build radar data — mirrors CompareRadars.tsx
  const rAxes = rawAxes(a, b)
  const mAxes = metricAxes(a, b)
  // Ghost backdrop for metric radar = raw footprint normalized 0..1, padded to 8 axes
  const ghostA = rAxes.map((ax) => proj(ax, ax.a) / ax.max)
  const ghostB = rAxes.map((ax) => proj(ax, ax.b) / ax.max)
  const fit = (arr: number[]) =>
    Array.from({ length: mAxes.length }, (_, i) => arr[i % arr.length] ?? 0)

  // Radar axes with direction arrows (matches CompareRadars RadarBlock)
  const rawRadarAxes = rAxes.map((ax) => ({ label: `${ax.label} ${ax.higherWins ? '↑' : '↓'}`, max: ax.max }))
  const metricRadarAxes = mAxes.map((ax) => ({ label: `${ax.label} ${ax.higherWins ? '↑' : '↓'}`, max: ax.max }))

  const rawSeries: CardRadarSeries[] = [
    { name: operatorDisplayName(a), values: rAxes.map((ax) => proj(ax, ax.a)), color: A_COLOR, variant: 'solid' },
    { name: operatorDisplayName(b), values: rAxes.map((ax) => proj(ax, ax.b)), color: B_COLOR, variant: 'solid' },
  ]
  const metricSeries: CardRadarSeries[] = [
    { name: `${operatorDisplayName(a)} raw`, values: fit(ghostA).map((v, i) => v * (mAxes[i]?.max ?? 1)), color: A_COLOR, variant: 'ghost' },
    { name: `${operatorDisplayName(b)} raw`, values: fit(ghostB).map((v, i) => v * (mAxes[i]?.max ?? 1)), color: B_COLOR, variant: 'ghost' },
    { name: operatorDisplayName(a), values: mAxes.map((ax) => proj(ax, ax.a)), color: A_COLOR, variant: 'solid' },
    { name: operatorDisplayName(b), values: mAxes.map((ax) => proj(ax, ax.b)), color: B_COLOR, variant: 'solid' },
  ]

  return (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 903,
        background: '#050605',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ═══ TOP — matchup on dark background (300px = 1/3) ═══ */}
      <div style={{
        height: 300, display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {/* header strip — operator names flank the title so name length
            doesn't affect the matchup box widths below */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 24px', borderBottom: '1px solid #1a3a1a',
          fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: C_DULL,
        }}>
          <span style={{ color: colA, fontSize: 16, fontWeight: 900, letterSpacing: 0.5 }}>{nameA}</span>
          <span style={{ color: C_GREEN, textShadow: '0 0 8px rgba(138,232,154,0.5)', letterSpacing: 3, fontSize: 13 }}>MANUS AD MANUM</span>
          <span style={{ color: colB, fontSize: 16, fontWeight: 900, letterSpacing: 0.5 }}>{nameB}</span>
        </div>

        {/* matchup panels — 5 columns: identity | facts | VS | facts | identity */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
          {/* A identity (outboard = left) */}
          <div style={{
            width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
            gap: 4, padding: '14px 20px', justifyContent: 'space-evenly',
            alignItems: 'center', textAlign: 'center',
            background: winner === 'a'
              ? `linear-gradient(105deg, ${colA}22, transparent 72%)`
              : `linear-gradient(105deg, ${colA}11, transparent 72%)`,
          }}>
            <span style={{ fontSize: 32, color: colA, lineHeight: 1 }}>{glyphFor(clsA)}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colA, letterSpacing: 0.3 }}>{clsA} · #{a.global_rank}</span>
            <span style={{ fontSize: 36, fontWeight: 800, color: C_GOLD, lineHeight: 1 }}>{yieldStr(a)}</span>
            <span style={{ fontSize: 9, color: '#7d7461' }}>Υ YIELD</span>
            {winner === 'a' && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: C_GOLD,
                border: '1px solid ' + C_GOLD + '66', borderRadius: 999,
                padding: '2px 8px', letterSpacing: 1, textTransform: 'uppercase',
              }}>◆ Leads {aWins}–{bWins}</span>
            )}
          </div>

          {/* A facts (inboard) */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: 8, padding: '12px 16px', justifyContent: 'space-evenly', minWidth: 0,
          }}>
            {factsA.map((f, i) => <FactLine key={i} fact={f} />)}
          </div>

          {/* VS divider */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6, padding: '0 16px', flexShrink: 0, width: 90,
          }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#7d7461', letterSpacing: 4 }}>VS</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#4a6a4a', fontVariantNumeric: 'tabular-nums' }}>{aWins}–{bWins}</span>
          </div>

          {/* B facts (inboard) */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: 8, padding: '12px 16px', justifyContent: 'space-evenly', minWidth: 0,
            alignItems: 'flex-end', textAlign: 'right',
          }}>
            {factsB.map((f, i) => <FactLine key={i} fact={f} />)}
          </div>

          {/* B identity (outboard = right) */}
          <div style={{
            width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
            gap: 4, padding: '14px 20px', justifyContent: 'space-evenly',
            alignItems: 'center', textAlign: 'center',
            background: winner === 'b'
              ? `linear-gradient(255deg, ${colB}22, transparent 72%)`
              : `linear-gradient(255deg, ${colB}11, transparent 72%)`,
          }}>
            <span style={{ fontSize: 32, color: colB, lineHeight: 1 }}>{glyphFor(clsB)}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colB, letterSpacing: 0.3 }}>{clsB} · #{b.global_rank}</span>
            <span style={{ fontSize: 36, fontWeight: 800, color: C_GOLD, lineHeight: 1 }}>{yieldStr(b)}</span>
            <span style={{ fontSize: 9, color: '#7d7461' }}>Υ YIELD</span>
            {winner === 'b' && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: C_GOLD,
                border: '1px solid ' + C_GOLD + '66', borderRadius: 999,
                padding: '2px 8px', letterSpacing: 1, textTransform: 'uppercase',
              }}>◆ Leads {bWins}–{aWins}</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DIVIDER — between matchup and radars ═══ */}
      <div style={{
        height: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(90deg, transparent, #1a3a1a 15%, #2a5a2a 50%, #1a3a1a 85%, transparent)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 10, height: 10, background: '#2a5a2a', transform: 'rotate(45deg)',
          boxShadow: '0 0 12px rgba(42,90,42,0.5)',
        }} />
      </div>

      {/* ═══ BOTTOM — dual radars on terminal black (600px = 2/3) ═══ */}
      <div style={{
        height: 600, background: INK, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
      }}>
        {/* CRT scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)',
        }} />

        {/* radar labels */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', padding: '10px 0',
          fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C_DULL,
          position: 'relative', zIndex: 2,
        }}>
          <span>RAW SHAPE</span>
          <span>METRIC SHAPE</span>
        </div>

        {/* radars */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          position: 'relative', zIndex: 2, padding: '0 20px',
        }}>
          <CardRadar axes={rawRadarAxes} series={rawSeries} size={460} />
          <CardRadar axes={metricRadarAxes} series={metricSeries} size={460} />
        </div>

        {/* footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 28px', borderTop: '1px solid #1a3a1a',
          fontSize: 11, fontWeight: 700, position: 'relative', zIndex: 2,
        }}>
          <span style={{ color: A_COLOR }}>{aWins} WINS</span>
          <span style={{ color: '#4a6a4a', fontSize: 9 }}>↑ HIGHER BETTER · ↓ LOWER BETTER · GHOST = RAW FOOTPRINT</span>
          <span style={{ color: C_GOLD }}>{bWins} WINS</span>
        </div>
        <div style={{
          textAlign: 'center', fontSize: 11, color: C_GREEN, letterSpacing: 1,
          paddingBottom: 10, position: 'relative', zIndex: 2,
          textShadow: '0 0 8px rgba(138,232,154,0.4)',
        }}>
          ▸ CLAIM YOUR SCORE AT SIGNALAF.COM ▸
        </div>
      </div>
    </div>
  )
}

// ── Exported component with buttons ──────────────────────────────────────────

export interface CompareMatchupCardProps {
  a: LeaderboardRow
  b: LeaderboardRow
  href: string
}

export function CompareMatchupCard({ a, b, href }: CompareMatchupCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://signalaf.com${href}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      track.compareShared('copy', { href })
    } catch {
      /* clipboard blocked */
    }
  }

  const download = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { width: 1200, height: 903, pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `sigrank-compare-matchup.png`
      link.click()
      track.compareShared('download')
    } finally {
      setBusy(false)
    }
  }

  const btn =
    'rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50'

  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={shareLink} className={btn}>
        {copied ? 'Copied ✓' : 'Share matchup'}
      </button>
      <button type="button" onClick={() => setPreview(true)} className={btn}>
        Preview
      </button>
      <button type="button" onClick={download} disabled={busy} className={btn}>
        {busy ? 'Rendering…' : 'Download matchup card'}
      </button>

      <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <Card cardRef={cardRef} a={a} b={b} href={href} />
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="relative max-h-full max-w-full overflow-auto rounded-lg border border-bg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-bg-border bg-bg-surface px-2 py-1 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover"
            >
              Close ✕
            </button>
            <div
              style={{
                transform: 'scale(min(1, calc((100vw - 2rem) / 1200), calc((100vh - 2rem) / 903)))',
                transformOrigin: 'top left',
              }}
            >
              <Card cardRef={cardRef} a={a} b={b} href={href} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
