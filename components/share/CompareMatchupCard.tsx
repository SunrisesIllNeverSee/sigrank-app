'use client'

/**
 * components/share/CompareMatchupCard.tsx — the downloadable matchup + radars card.
 *
 * Sibling of CompareShareCard. Combines the CompareMatchup (identity + 5 facts
 * per operator) and CompareRadars (raw shape + metric shape) into a single
 * 1200×900 social card. Dark top section for the matchup, terminal-black
 * bottom section with CRT scanlines for the dual radars.
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

// ── Palette ──────────────────────────────────────────────────────────────────
const INK = '#0a0a0a'
const C_GREEN = '#8ae89a'
const C_GOLD = '#f0c862'
const C_DULL = '#6e8a6e'
const A_COLOR = '#e8a0d0'
const B_COLOR = '#f0c862'

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

// ── SVG radar for the card (static, no CSS vars) ─────────────────────────────

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
    mk('Υ', comp(ca, (x) => x.yield_), comp(cb, (x) => x.yield_)),
    mk('Lev', comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage)),
    mk('SNR', raw(ca, (x) => x.snr), raw(cb, (x) => x.snr)),
    mk('Vel', raw(ca, (x) => x.velocity), raw(cb, (x) => x.velocity)),
    mk('10xD', comp(ca, (x) => x.dev10x ?? 0), comp(cb, (x) => x.dev10x ?? 0)),
    mk('Eff', raw(ca, (x) => x.efficiency), raw(cb, (x) => x.efficiency)),
    mk('$/1M', raw(ca, (x) => x.costPerMillion), raw(cb, (x) => x.costPerMillion), false),
    mk('OpR', comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage)),
  ]
}

function proj(ax: RadarAxis, v: number): number {
  const c = Math.max(0, Math.min(ax.max, v))
  return ax.higherWins ? c : ax.max - c
}

function CardRadar({ axes, aColor, bColor, size }: {
  axes: RadarAxis[]
  aColor: string
  bColor: string
  size: number
}) {
  const n = axes.length
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 36
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

  const aVals = axes.map((ax) => proj(ax, ax.a))
  const bVals = axes.map((ax) => proj(ax, ax.b))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => point(i, ring * radius).map((v) => v.toFixed(2)).join(',')).join(' ')}
          fill="none" stroke="#1a3a1a" strokeWidth={1} opacity={ring === 1 ? 0.7 : 0.4}
        />
      ))}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={`s-${i}`} x1={cx} y1={cy} x2={x.toFixed(2)} y2={y.toFixed(2)} stroke="#1a3a1a" strokeWidth={1} opacity={0.3} />
      })}
      {/* A polygon */}
      <polygon points={pathFor(aVals)} fill={aColor} fillOpacity={0.15} stroke={aColor} strokeWidth={2} strokeLinejoin="round" />
      {/* B polygon */}
      <polygon points={pathFor(bVals)} fill={bColor} fillOpacity={0.15} stroke={bColor} strokeWidth={2} strokeLinejoin="round" />
      {/* A vertices */}
      {aVals.map((v, i) => {
        const [x, y] = point(i, norm(v, axes[i].max) * radius)
        return <circle key={`a-${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={2.5} fill={aColor} />
      })}
      {/* B vertices */}
      {bVals.map((v, i) => {
        const [x, y] = point(i, norm(v, axes[i].max) * radius)
        return <circle key={`b-${i}`} cx={x.toFixed(2)} cy={y.toFixed(2)} r={2.5} fill={bColor} />
      })}
      {/* labels */}
      {axes.map((ax, i) => {
        const [lx, ly] = point(i, radius + 18)
        const cos = Math.cos(angleAt(i))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text key={`l-${i}`} x={lx.toFixed(2)} y={ly.toFixed(2)} textAnchor={anchor}
            dominantBaseline="middle" fontSize={9} fill={C_DULL} fontWeight={700}
            fontFamily="ui-monospace, monospace" letterSpacing={0.3}>
            {ax.label}
          </text>
        )
      })}
    </svg>
  )
}

// ── Fact line for the card (static inline styles) ────────────────────────────

function FactLine({ fact }: { fact: OperatorFact }) {
  const mark = fact.polarity === 'up' ? '✦' : fact.polarity === 'down' ? '△' : '·'
  const markColor = fact.polarity === 'up' ? C_GOLD : fact.polarity === 'down' ? C_DULL : '#4a6a4a'
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 9, color: markColor, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>{mark}</span>
      <span style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', lineHeight: 1.3, minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: '#e9e3d5' }}>{fact.label}</span>
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
  const factsA = deriveFacts(a, b)
  const factsB = deriveFacts(b, a)

  const aNameSize = nameA.length <= 10 ? 22 : nameA.length <= 16 ? 18 : nameA.length <= 24 ? 15 : 13
  const bNameSize = nameB.length <= 10 ? 22 : nameB.length <= 16 ? 18 : nameB.length <= 24 ? 15 : 13

  const rAxes = rawAxes(a, b)
  const mAxes = metricAxes(a, b)

  return (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 900,
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
        borderBottom: '1px solid #1a3a1a', boxSizing: 'border-box',
      }}>
        {/* header strip */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 28px', borderBottom: '1px solid #1a3a1a',
          fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: C_DULL,
        }}>
          <span style={{ color: C_GREEN, textShadow: '0 0 8px rgba(138,232,154,0.5)' }}>MANUS AD MANUM</span>
          <span>HEAD TO HEAD</span>
        </div>

        {/* matchup panels — both sides use the SAME layout (identity outboard, facts inboard) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
          {/* A panel */}
          <div style={{
            flex: 1, display: 'flex', gap: 12, padding: '10px 20px',
            background: winner === 'a'
              ? `linear-gradient(105deg, ${colA}22, transparent 72%)`
              : `linear-gradient(105deg, ${colA}11, transparent 72%)`,
          }}>
            {/* identity (outboard = left for A) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 160, flexShrink: 0 }}>
              <span style={{ fontSize: 22, color: colA, lineHeight: 1 }}>{glyphFor(clsA)}</span>
              <span style={{ fontSize: aNameSize, fontWeight: 900, color: '#e9e3d5', letterSpacing: 0.5, lineHeight: 1.1 }}>{nameA}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: colA, letterSpacing: 0.3 }}>{clsA} · #{a.global_rank}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: C_GOLD, lineHeight: 1, marginTop: 2 }}>{yieldStr(a)}</span>
              <span style={{ fontSize: 8, color: '#7d7461' }}>Υ YIELD</span>
              {winner === 'a' && (
                <span style={{
                  marginTop: 3, fontSize: 8, fontWeight: 800, color: C_GOLD,
                  border: '1px solid ' + C_GOLD + '66', borderRadius: 999,
                  padding: '1px 6px', letterSpacing: 1, textTransform: 'uppercase', alignSelf: 'flex-start',
                }}>◆ Leads {aWins}–{bWins}</span>
              )}
            </div>
            {/* facts (inboard = right for A) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center', minWidth: 0, flex: 1 }}>
              {factsA.map((f, i) => <FactLine key={i} fact={f} />)}
            </div>
          </div>

          {/* VS divider */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: '0 10px', flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#7d7461', letterSpacing: 4 }}>VS</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#4a6a4a', fontVariantNumeric: 'tabular-nums' }}>{aWins}–{bWins}</span>
          </div>

          {/* B panel — SAME layout as A (identity outboard = right, facts inboard = left) */}
          <div style={{
            flex: 1, display: 'flex', gap: 12, padding: '10px 20px', flexDirection: 'row-reverse',
            background: winner === 'b'
              ? `linear-gradient(255deg, ${colB}22, transparent 72%)`
              : `linear-gradient(255deg, ${colB}11, transparent 72%)`,
          }}>
            {/* identity (outboard = right for B, via row-reverse) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 160, flexShrink: 0, alignItems: 'flex-end', textAlign: 'right' }}>
              <span style={{ fontSize: 22, color: colB, lineHeight: 1 }}>{glyphFor(clsB)}</span>
              <span style={{ fontSize: bNameSize, fontWeight: 900, color: '#e9e3d5', letterSpacing: 0.5, lineHeight: 1.1 }}>{nameB}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: colB, letterSpacing: 0.3 }}>{clsB} · #{b.global_rank}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: C_GOLD, lineHeight: 1, marginTop: 2 }}>{yieldStr(b)}</span>
              <span style={{ fontSize: 8, color: '#7d7461' }}>Υ YIELD</span>
              {winner === 'b' && (
                <span style={{
                  marginTop: 3, fontSize: 8, fontWeight: 800, color: C_GOLD,
                  border: '1px solid ' + C_GOLD + '66', borderRadius: 999,
                  padding: '1px 6px', letterSpacing: 1, textTransform: 'uppercase',
                }}>◆ Leads {bWins}–{aWins}</span>
              )}
            </div>
            {/* facts (inboard = left for B, via row-reverse) — uses the SAME FactLine component */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center', minWidth: 0, flex: 1, alignItems: 'flex-end', textAlign: 'right' }}>
              {factsB.map((f, i) => <FactLine key={i} fact={f} />)}
            </div>
          </div>
        </div>
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
          display: 'flex', justifyContent: 'space-around', padding: '8px 0',
          fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C_DULL,
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
          <CardRadar axes={rAxes} aColor={A_COLOR} bColor={B_COLOR} size={460} />
          <CardRadar axes={mAxes} aColor={A_COLOR} bColor={B_COLOR} size={460} />
        </div>

        {/* footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 28px', borderTop: '1px solid #1a3a1a',
          fontSize: 11, fontWeight: 700, position: 'relative', zIndex: 2,
        }}>
          <span style={{ color: A_COLOR }}>{aWins} WINS</span>
          <span style={{ color: '#4a6a4a', fontSize: 9 }}>↑ HIGHER BETTER · ↓ LOWER BETTER</span>
          <span style={{ color: C_GOLD }}>{bWins} WINS</span>
        </div>
        <div style={{
          textAlign: 'center', fontSize: 9, color: '#3a5a3a', letterSpacing: 1,
          paddingBottom: 8, position: 'relative', zIndex: 2,
        }}>
          signalaf.com/compare{href.replace(/.*\?/, '?')}
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
      const dataUrl = await toPng(cardRef.current, { width: 1200, height: 900, pixelRatio: 2, cacheBust: true })
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
                transform: 'scale(min(1, calc((100vw - 2rem) / 1200), calc((100vh - 2rem) / 900)))',
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
