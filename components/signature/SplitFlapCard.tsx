'use client'

/**
 * components/signature/SplitFlapCard.tsx — real Solari split-flap board.
 *
 * No midline seam. Glyphs label each metric. Name at top. Big radar.
 * 2-column board grid: raw pillars left, derived metrics right.
 * Fills the full 1200×630 with no dead space.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { SplitFlap, type Palette } from 'clackboard'
import { track } from '@/lib/posthog/events'

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
  showControls?: boolean
}

// ── Palettes — NO MIDLINE (div = bg) ──────────────────────────────────────

const mk = (text: string, bg = '#0a0a08'): Palette => ({
  text, topBg: bg, botBg: bg, border: '#1a1a16', div: bg,
})
const GOLD_P = mk('#f0c862')       // brighter gold for readability
const GREEN_P = mk('#8ae89a')      // brighter green
const BONE_P = mk('#f0eee0')       // brighter bone
const DIM_P = mk('#7aaa7a')        // brighter dim
const LABEL_P = mk('#6a9a6a', '#060606')

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

// ── A compact metric cell: glyph + value stacked ──────────────────────────

function MetricCell({ glyph, value, palette }: { glyph: string; value: string; palette: Palette }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '2px', padding: '6px 4px',
      borderBottom: '1px solid #131311',
    }}>
      {/* Glyph — small, colored */}
      <SplitFlap
        value={glyph} length={glyph.length}
        size="sm" variant="classic" palette={palette}
        mode="board" easing="decelerate" flipMs={60} stagger={12} gap={1}
        perspective={150} animateOnMount
      />
      {/* Value — bigger, readable */}
      <SplitFlap
        value={value.padEnd(8, ' ')} length={8}
        size="sm" variant="classic" palette={palette}
        mode="board" easing="decelerate" flipMs={80} stagger={18} gap={2}
        perspective={200} animateOnMount
      />
    </div>
  )
}

// ── The board ─────────────────────────────────────────────────────────────

function Board({
  cardRef, codename, name, yieldValue, classTier, platform,
  inputTokens, outputTokens, cacheRead, cacheCreate,
  snr, leverage, velocity, dev10x, scaleV, efficiency, costPerMillion,
  opRatio, cascadeStr, radarAxes,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>
} & Omit<SplitFlapCardProps, 'showControls'>) {
  const W = 1200, H = 630, LEFT_W = 420, RIGHT_W = W - LEFT_W

  const yieldStr = yieldValue !== null ? (yieldValue >= 1000 ? `${(yieldValue / 1000).toFixed(1)}K` : yieldValue.toFixed(0)) : '—'
  const snrStr = snr != null ? `${(snr * 100).toFixed(0)}%` : '—'
  const levStr = leverage != null ? `${leverage.toFixed(0)}x` : '—'
  const velStr = velocity != null ? velocity.toFixed(1) : '—'
  const devStr = dev10x != null ? dev10x.toFixed(2) : '—'
  const scaleStr = scaleV != null ? scaleV.toFixed(2) : '—'
  const effStr = efficiency != null ? `${efficiency.toFixed(1)}x` : '—'
  const costStr = costPerMillion != null ? `$${costPerMillion.toFixed(2)}` : '—'
  const inputStr = inputTokens != null ? fmtTokens(inputTokens) : '—'
  const outputStr = outputTokens != null ? fmtTokens(outputTokens) : '—'
  const cacheReadStr = cacheRead != null ? fmtTokens(cacheRead) : '—'
  const cacheCreateStr = cacheCreate != null ? fmtTokens(cacheCreate) : '—'
  const totalStr = (inputTokens && outputTokens && cacheRead && cacheCreate) ? fmtTokens(inputTokens + outputTokens + cacheRead + cacheCreate) : '—'
  const opStr = opRatio ?? '—'
  const cascadeStrVal = cascadeStr ?? '—'

  const radarColors = ['#f0c862', '#8ae89a', '#8ae89a', '#f0c862', '#f0eee0', '#8ae89a']
  const radarGlyphs = ['Υ', 'SNR', 'LEV', '⚡', 'SCL', 'EFF']
  const coloredAxes: RadarAxis[] = radarAxes && radarAxes.length >= 3
    ? radarAxes.map((a, i) => ({ ...a, color: radarColors[i % 6], glyph: radarGlyphs[i % 6] }))
    : []

  const GOLD_BG = '#c4923a'
  const GOLD_DARK = '#0a0a0a'

  // Raw + derived metrics for the 2-column grid
  const rawMetrics = [
    { glyph: 'IN', value: inputStr, palette: BONE_P },
    { glyph: 'OUT', value: outputStr, palette: GREEN_P },
    { glyph: 'CR', value: cacheReadStr, palette: GREEN_P },
    { glyph: 'CW', value: cacheCreateStr, palette: BONE_P },
    { glyph: '∑', value: totalStr, palette: DIM_P },
  ]
  const derivedMetrics = [
    { glyph: 'Υ', value: yieldStr, palette: GOLD_P },
    { glyph: 'SNR', value: snrStr, palette: GREEN_P },
    { glyph: 'LEV', value: levStr, palette: GREEN_P },
    { glyph: 'VEL', value: velStr, palette: BONE_P },
    { glyph: '⚡', value: devStr, palette: GOLD_P },
    { glyph: 'SCL', value: scaleStr, palette: BONE_P },
    { glyph: 'EFF', value: effStr, palette: GREEN_P },
    { glyph: '$', value: costStr, palette: DIM_P },
  ]

  return (
    <div ref={cardRef} style={{
      width: W, height: H, background: '#050605',
      display: 'flex', flexDirection: 'row', boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
    }}>
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

        {/* Name — TOP, largest */}
        <div style={{
          fontSize: '38px', fontWeight: 900, color: GOLD_DARK,
          letterSpacing: '1px', lineHeight: 1.02, wordBreak: 'break-word',
        }}>
          {name.toUpperCase()}
        </div>

        {/* Brand row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: GOLD_DARK, letterSpacing: '3px' }}>◈ SIGRANK</span>
          <span style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '2px' }}>DEPARTURES · MO§ES™</span>
        </div>

        {/* Diamond divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <div style={{ width: '7px', height: '7px', background: GOLD_DARK, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.2 }} />
        </div>

        {/* Yield headline */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '26px', fontWeight: 900, color: GOLD_DARK }}>Υ</span>
          <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Yield</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: GOLD_DARK, marginLeft: 'auto' }}>{yieldStr}</span>
        </div>

        {/* Info rows */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            ['CLASS', classTier],
            ['PLATFORM', (platform ?? '—').toUpperCase()],
            ['CASCADE', cascadeStrVal],
            ['OP RATIO', opStr],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.35, letterSpacing: '1.5px', textTransform: 'uppercase', width: '62px', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: '13px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '0.5px' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Radar — BIG, fills bottom */}
        {coloredAxes.length >= 3 && (
          <div style={{
            marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          }}>
            <span style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.35, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Cascade Fingerprint
            </span>
            <div style={{ width: '340px', background: 'rgba(10,10,10,0.06)', borderRadius: '8px', padding: '4px' }}>
              <ColoredRadar axes={coloredAxes} size={340} />
            </div>
          </div>
        )}

        <div style={{ marginTop: '4px', fontSize: '9px', color: GOLD_DARK, opacity: 0.3, letterSpacing: '1px' }}>
          signalaf.com/user/{codename}
        </div>
      </div>

      {/* ═══ RIGHT 2/3 — dark Solari board, 2-column grid ═══ */}
      <div style={{
        width: RIGHT_W, height: H, background: '#050605',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box', flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px 6px', borderBottom: '2px solid #264028',
        }}>
          <SplitFlap
            value="CASCADE TELEMETRY" size="sm" variant="classic" palette={GOLD_P}
            mode="board" easing="decelerate" flipMs={60} stagger={25} gap={2}
            perspective={200} animateOnMount
          />
          <SplitFlap
            value="LIVE" size="sm" variant="classic" palette={DIM_P}
            mode="board" flipMs={60} animateOnMount
          />
        </div>

        {/* Section labels */}
        <div style={{
          display: 'flex', padding: '6px 16px 4px',
          borderBottom: '1px solid #1a2a1a',
        }}>
          <span style={{ flex: 1, fontSize: '10px', color: '#6e966e', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
            RAW TOKENS
          </span>
          <span style={{ flex: 1, fontSize: '10px', color: '#6e966e', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'center' }}>
            DERIVED METRICS
          </span>
        </div>

        {/* 2-column grid: raw left, derived right */}
        <div style={{
          flex: 1, display: 'flex', overflow: 'hidden',
        }}>
          {/* Left column — raw */}
          <div style={{
            flex: 1, borderRight: '1px solid #1a2a1a',
            display: 'flex', flexDirection: 'column',
          }}>
            {rawMetrics.map((m) => (
              <MetricCell key={m.glyph} glyph={m.glyph} value={m.value} palette={m.palette} />
            ))}
          </div>

          {/* Right column — derived */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
          }}>
            {derivedMetrics.map((m) => (
              <MetricCell key={m.glyph} glyph={m.glyph} value={m.value} palette={m.palette} />
            ))}
          </div>
        </div>
      </div>

      {/* Scanline */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)',
      }} />
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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => setScale(container.clientWidth / 1200)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
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
          <button type="button" onClick={replay} className={btn}>↻ Replay</button>
          <button type="button" onClick={shareLink} className={btn}>{copied ? 'Copied ✓' : 'Share'}</button>
          <button type="button" onClick={download} disabled={busy} className={btn}>{busy ? 'Rendering…' : 'Download card'}</button>
        </div>
      )}
      <div ref={containerRef} className="overflow-hidden rounded-lg border border-[#264028]" style={{ width: '100%', height: 630 * scale }}>
        <div key={replayKey} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1200, height: 630 }}>
          <Board cardRef={cardRef} {...props} />
        </div>
      </div>
    </div>
  )
}
