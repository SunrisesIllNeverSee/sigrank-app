'use client'

/**
 * components/signature/SplitFlapCard.tsx — real Solari split-flap board.
 *
 * No midline seam (div = bg). Glyphs label each metric. Name at top.
 * Big radar. Board fills with no dead space.
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

// ── Palettes — NO MIDLINE (div = bg, invisible seam) ─────────────────────

const mkPalette = (text: string): Palette => ({
  text,
  topBg: '#0a0a08',
  botBg: '#0a0a08',
  border: '#151513',
  div: '#0a0a08',  // same as bg = no visible midline seam
})

const GOLD_P = mkPalette('#e0b240')
const GREEN_P = mkPalette('#78dc82')
const BONE_P = mkPalette('#dee6d2')
const DIM_P = mkPalette('#6e966e')
const LABEL_P = mkPalette('#5a8a5a')

// ── Glyphs (from CANON §IV) ───────────────────────────────────────────────

interface MetricDef {
  glyph: string
  label: string
  value: string
  palette: Palette
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
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 40
  const rings = [0.25, 0.5, 0.75, 1]
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, r: number): [number, number] => {
    const a = angleAt(i)
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  }
  const norm = (v: number, m: number) => (!m || m <= 0 ? 0 : Math.max(0, Math.min(1, v / m)))
  const polyPath = axes
    .map((_, i) => {
      const r = norm(axes[i].value, axes[i].max) * radius
      const [x, y] = point(i, r)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + ' Z'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label="Cascade fingerprint">
      {rings.map((ring) => (
        <polygon key={ring}
          points={axes.map((_, i) => point(i, ring * radius).map((v) => v.toFixed(1)).join(',')).join(' ')}
          fill="none" stroke="rgba(10,10,10,0.15)" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={`s-${i}`} x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgba(10,10,10,0.1)" strokeWidth={1} />
      })}
      <path d={polyPath} fill="rgba(10,10,10,0.15)" stroke="#0a0a0a" strokeWidth={2.5} strokeLinejoin="round" />
      {axes.map((ax, i) => {
        const [x, y] = point(i, norm(ax.value, ax.max) * radius)
        return <circle key={`v-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={5} fill={ax.color} stroke="#0a0a0a" strokeWidth={1} />
      })}
      {/* Axis labels: glyph + value, colored per metric */}
      {axes.map((ax, i) => {
        const [lx, ly] = point(i, radius + 22)
        const cos = Math.cos(angleAt(i))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text key={`l-${i}`} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize={13} fontWeight={700} fill={ax.color}
            style={{ fontFamily: 'ui-monospace, monospace' }}>
            {ax.glyph}
          </text>
        )
      })}
    </svg>
  )
}

// ── Metric row: glyph + label + value, all split-flap ─────────────────────

function MetricRow({ glyph, label, value, palette }: { glyph: string; label: string; value: string; palette: Palette }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderBottom: '1px solid #131311',
    }}>
      {/* Glyph — colored, prominent */}
      <SplitFlap
        value={glyph} length={glyph.length}
        size="sm" variant="classic" palette={palette}
        mode="board" easing="decelerate" flipMs={60} stagger={15} gap={1}
        perspective={150} animateOnMount
        style={{ flexShrink: 0 }}
      />
      {/* Label */}
      <SplitFlap
        value={label.padEnd(7, ' ')} length={7}
        size="sm" variant="classic" palette={LABEL_P}
        mode="board" easing="decelerate" flipMs={60} stagger={15} gap={1}
        perspective={150} animateOnMount
        style={{ flexShrink: 0 }}
      />
      {/* Value */}
      <SplitFlap
        value={value.padEnd(10, ' ')} length={10}
        size="sm" variant="classic" palette={palette}
        mode="board" easing="decelerate" flipMs={80} stagger={20} gap={2}
        perspective={200} animateOnMount
        style={{ justifyContent: 'flex-start' }}
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

  // Radar axes with per-metric colors + glyphs
  const radarColors = ['#e0b240', '#78dc82', '#78dc82', '#e0b240', '#dee6d2', '#78dc82']
  const radarGlyphs = ['Υ', 'SNR', 'LEV', '⚡', 'SCL', 'EFF']
  const coloredAxes: RadarAxis[] = radarAxes && radarAxes.length >= 3
    ? radarAxes.map((a, i) => ({ ...a, color: radarColors[i % 6], glyph: radarGlyphs[i % 6] }))
    : []

  // All metrics for the board
  const rawMetrics: MetricDef[] = [
    { glyph: 'IN', label: 'INPUT', value: inputStr, palette: BONE_P },
    { glyph: 'OUT', label: 'OUTPUT', value: outputStr, palette: GREEN_P },
    { glyph: 'CR', label: 'CACHE R', value: cacheReadStr, palette: GREEN_P },
    { glyph: 'CW', label: 'CACHE W', value: cacheCreateStr, palette: BONE_P },
    { glyph: '∑', label: 'TOTAL', value: totalStr, palette: DIM_P },
  ]
  const derivedMetrics: MetricDef[] = [
    { glyph: 'Υ', label: 'YIELD', value: yieldStr, palette: GOLD_P },
    { glyph: 'SNR', label: 'SNR', value: snrStr, palette: GREEN_P },
    { glyph: 'LEV', label: 'LEVERAG', value: levStr, palette: GREEN_P },
    { glyph: 'VEL', label: 'VELOCTY', value: velStr, palette: BONE_P },
    { glyph: '⚡', label: '10XDEV', value: devStr, palette: GOLD_P },
    { glyph: 'SCL', label: 'SCALE V', value: scaleStr, palette: BONE_P },
    { glyph: 'EFF', label: 'EFFICNC', value: effStr, palette: GREEN_P },
    { glyph: '$', label: 'COST/1M', value: costStr, palette: DIM_P },
  ]

  const GOLD_BG = '#c4923a'
  const GOLD_DARK = '#0a0a0a'

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

        {/* Name — TOP, largest font */}
        <div style={{
          fontSize: '40px', fontWeight: 900, color: GOLD_DARK,
          letterSpacing: '1px', lineHeight: 1.02, wordBreak: 'break-word',
        }}>
          {name.toUpperCase()}
        </div>

        {/* Small brand row under name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: GOLD_DARK, letterSpacing: '3px' }}>SIGRANK</span>
          <span style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '2px' }}>DEPARTURES · MO§ES™</span>
        </div>

        {/* Diamond divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
          <div style={{ width: '7px', height: '7px', background: GOLD_DARK, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.2 }} />
        </div>

        {/* Yield headline */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color: GOLD_DARK }}>Υ</span>
          <span style={{ fontSize: '11px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Yield</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: GOLD_DARK, marginLeft: 'auto' }}>{yieldStr}</span>
        </div>

        {/* Info rows — organized */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            ['CLASS', classTier],
            ['PLATFORM', (platform ?? '—').toUpperCase()],
            ['CASCADE', cascadeStrVal],
            ['OP RATIO', opStr],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.35, letterSpacing: '1.5px', textTransform: 'uppercase', width: '62px', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: '14px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '0.5px' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Radar — BIG, bottom anchored, fills space */}
        {coloredAxes.length >= 3 && (
          <div style={{
            marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          }}>
            <span style={{ fontSize: '9px', color: GOLD_DARK, opacity: 0.35, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Cascade Fingerprint
            </span>
            <div style={{ width: '320px', background: 'rgba(10,10,10,0.08)', borderRadius: '8px', padding: '4px' }}>
              <ColoredRadar axes={coloredAxes} size={320} />
            </div>
          </div>
        )}

        <div style={{ marginTop: '6px', fontSize: '9px', color: GOLD_DARK, opacity: 0.3, letterSpacing: '1px' }}>
          signalaf.com/user/{codename}
        </div>
      </div>

      {/* ═══ RIGHT 2/3 — dark Solari board ═══ */}
      <div style={{
        width: RIGHT_W, height: H, background: '#050605',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box', flexShrink: 0,
      }}>
        {/* Header — split-flap */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 14px 6px', borderBottom: '2px solid #264028',
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

        {/* Board rows — fills the space, no dead space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          {/* Raw token pillars */}
          {rawMetrics.map((m) => (
            <MetricRow key={m.label} glyph={m.glyph} label={m.label} value={m.value} palette={m.palette} />
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: '#264028', margin: '1px 10px' }} />

          {/* Derived metrics */}
          {derivedMetrics.map((m) => (
            <MetricRow key={m.label} glyph={m.glyph} label={m.label} value={m.value} palette={m.palette} />
          ))}
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
