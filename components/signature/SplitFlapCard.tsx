'use client'

/**
 * components/signature/SplitFlapCard.tsx — real Solari split-flap board.
 *
 * Uses clackboard for authentic 3D rotateX flip animation. Both labels
 * AND values are split-flap cells. The board scales to fit its container
 * (1200×630 design surface, CSS transform scale for display).
 *
 * Layout: 1/3 + 2/3 split
 *   Left 1/3:  Gold background. Operator name (largest), class, platform,
 *             cascade string, op ratio, yield headline, radar with colored axes.
 *   Right 2/3: Dark Solari board. Header + 13 metric rows, all split-flap.
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

// ── Palettes ──────────────────────────────────────────────────────────────

const GOLD_PALETTE: Palette = { text: '#e0b240', topBg: '#0c0c0a', botBg: '#070706', border: '#1a1a16', div: '#2a2515' }
const GREEN_PALETTE: Palette = { text: '#78dc82', topBg: '#0c0c0a', botBg: '#070706', border: '#1a1a16', div: '#1a2a1a' }
const BONE_PALETTE: Palette = { text: '#dee6d2', topBg: '#0c0c0a', botBg: '#070706', border: '#1a1a16', div: '#1a2a1a' }
const DIM_PALETTE: Palette = { text: '#6e966e', topBg: '#0c0c0a', botBg: '#070706', border: '#1a1a16', div: '#1a2a1a' }

// Label palette — smaller, dim
const LABEL_PALETTE: Palette = { text: '#6e966e', topBg: '#080808', botBg: '#050505', border: '#141414', div: '#1a2a1a' }

// ── Format helpers ────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

// ── Colored radar (inline SVG, per-axis colors) ───────────────────────────

interface RadarAxis {
  label: string
  value: number
  max: number
  color: string
}

function ColoredRadar({ axes, size }: { axes: RadarAxis[]; size: number }) {
  const n = axes.length
  if (n < 3) return null
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 32
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
      {/* rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => point(i, ring * radius).map((v) => v.toFixed(1)).join(',')).join(' ')}
          fill="none"
          stroke="rgba(10,10,10,0.2)"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {axes.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={`s-${i}`} x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgba(10,10,10,0.15)" strokeWidth={1} />
      })}
      {/* polygon fill */}
      <path d={polyPath} fill="rgba(10,10,10,0.2)" stroke="#0a0a0a" strokeWidth={2} strokeLinejoin="round" />
      {/* vertices — colored per axis */}
      {axes.map((ax, i) => {
        const [x, y] = point(i, norm(ax.value, ax.max) * radius)
        return <circle key={`v-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={4} fill={ax.color} />
      })}
      {/* axis labels — colored per metric */}
      {axes.map((ax, i) => {
        const [lx, ly] = point(i, radius + 18)
        const cos = Math.cos(angleAt(i))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text
            key={`l-${i}`}
            x={lx.toFixed(1)}
            y={ly.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={700}
            fill={ax.color}
            style={{ fontFamily: 'ui-monospace, monospace' }}
          >
            {ax.label}
          </text>
        )
      })}
    </svg>
  )
}

// ── A metric row: split-flap label + split-flap value ─────────────────────

function MetricRow({
  label,
  value,
  palette,
  labelLen,
  valueLen,
}: {
  label: string
  value: string
  palette: Palette
  labelLen: number
  valueLen: number
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 12px',
      borderBottom: '1px solid #152015',
    }}>
      {/* Label — split-flap */}
      <SplitFlap
        value={label.padEnd(labelLen, ' ')}
        length={labelLen}
        size="sm"
        variant="classic"
        palette={LABEL_PALETTE}
        mode="board"
        easing="decelerate"
        flipMs={60}
        stagger={20}
        gap={1}
        perspective={150}
        animateOnMount
        style={{ flexShrink: 0 }}
      />
      {/* Value — split-flap */}
      <SplitFlap
        value={value.padEnd(valueLen, ' ')}
        length={valueLen}
        size="sm"
        variant="classic"
        palette={palette}
        mode="board"
        easing="decelerate"
        flipMs={80}
        stagger={25}
        gap={2}
        perspective={200}
        animateOnMount
        style={{ justifyContent: 'flex-start' }}
      />
    </div>
  )
}

// ── The board (1200×630 design surface) ───────────────────────────────────

function Board({
  cardRef,
  codename,
  name,
  yieldValue,
  classTier,
  platform,
  inputTokens,
  outputTokens,
  cacheRead,
  cacheCreate,
  snr,
  leverage,
  velocity,
  dev10x,
  scaleV,
  efficiency,
  costPerMillion,
  opRatio,
  cascadeStr,
  radarAxes,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>
} & Omit<SplitFlapCardProps, 'showControls'>) {
  const W = 1200
  const H = 630
  const LEFT_W = 400
  const RIGHT_W = W - LEFT_W

  // Format values
  const yieldStr = yieldValue !== null
    ? (yieldValue >= 1000 ? `${(yieldValue / 1000).toFixed(1)}K` : yieldValue.toFixed(0))
    : '—'
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
  const totalStr = (inputTokens && outputTokens && cacheRead && cacheCreate)
    ? fmtTokens(inputTokens + outputTokens + cacheRead + cacheCreate) : '—'
  const opStr = opRatio ?? '—'
  const cascadeStrVal = cascadeStr ?? '—'

  // Radar axes with per-metric colors
  const coloredAxes: RadarAxis[] = radarAxes && radarAxes.length >= 3
    ? radarAxes.map((a, i) => ({
        ...a,
        color: ['#e0b240', '#78dc82', '#78dc82', '#e0b240', '#dee6d2', '#78dc82'][i % 6],
      }))
    : []

  const GOLD_BG = '#c4923a'
  const GOLD_DARK = '#0a0a0a'

  return (
    <div
      ref={cardRef}
      style={{
        width: W,
        height: H,
        background: '#050605',
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
      }}
    >
      {/* ═══════════ LEFT 1/3 — gold background ═══════════ */}
      <div style={{
        width: LEFT_W,
        height: H,
        background: GOLD_BG,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 24px',
        boxSizing: 'border-box',
        position: 'relative',
        flexShrink: 0,
      }}>
        {/* Texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 3px)',
        }} />

        {/* Top: SIGRANK + DEPARTURES small */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: GOLD_DARK, letterSpacing: '3px' }}>SIGRANK</span>
          <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.5, letterSpacing: '2px' }}>DEPARTURES</span>
        </div>

        {/* MO§ES™ */}
        <div style={{ fontSize: '11px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '2px', marginTop: '2px' }}>MO§ES™</div>

        {/* Diamond divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
          <div style={{ width: '8px', height: '8px', background: GOLD_DARK, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.2 }} />
        </div>

        {/* Operator name — THE LARGEST FONT on the left */}
        <div style={{
          marginTop: '16px',
          fontSize: '42px',
          fontWeight: 900,
          color: GOLD_DARK,
          letterSpacing: '1px',
          lineHeight: 1.05,
          wordBreak: 'break-word',
        }}>
          {name.toUpperCase()}
        </div>

        {/* Yield headline — big number under name */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: GOLD_DARK, opacity: 0.5, letterSpacing: '1px' }}>Υ YIELD</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: GOLD_DARK }}>{yieldStr}</span>
        </div>

        {/* Class + Platform + Cascade + Op Ratio */}
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase', width: '64px' }}>Class</span>
            <span style={{ fontSize: '15px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '1px' }}>{classTier}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase', width: '64px' }}>Platform</span>
            <span style={{ fontSize: '15px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '1px' }}>{(platform ?? '—').toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase', width: '64px' }}>Cascade</span>
            <span style={{ fontSize: '15px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '0.5px' }}>{cascadeStrVal}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase', width: '64px' }}>Op Ratio</span>
            <span style={{ fontSize: '15px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '0.5px' }}>{opStr}</span>
          </div>
        </div>

        {/* Radar — enlarged, colored axes, bottom anchored */}
        {coloredAxes.length >= 3 && (
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}>
            <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Cascade Fingerprint
            </span>
            <div style={{ width: '260px', background: 'rgba(10,10,10,0.1)', borderRadius: '8px', padding: '6px' }}>
              <ColoredRadar axes={coloredAxes} size={260} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '8px', fontSize: '10px', color: GOLD_DARK, opacity: 0.35, letterSpacing: '1px' }}>
          signalaf.com/user/{codename}
        </div>
      </div>

      {/* ═══════════ RIGHT 2/3 — dark Solari board ═══════════ */}
      <div style={{
        width: RIGHT_W,
        height: H,
        background: '#050605',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}>
        {/* Board header — split-flap */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px 8px',
          borderBottom: '2px solid #264028',
        }}>
          <SplitFlap
            value="CASCADE TELEMETRY"
            size="sm"
            variant="classic"
            palette={GOLD_PALETTE}
            mode="board"
            easing="decelerate"
            flipMs={60}
            stagger={25}
            gap={2}
            perspective={200}
            animateOnMount
          />
          <SplitFlap
            value="LIVE"
            size="sm"
            variant="classic"
            palette={DIM_PALETTE}
            mode="board"
            flipMs={60}
            animateOnMount
          />
        </div>

        {/* Board rows — all split-flap labels + values */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Raw token pillars */}
          <MetricRow label="INPUT" value={inputStr} palette={BONE_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="OUTPUT" value={outputStr} palette={GREEN_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="CACHE R" value={cacheReadStr} palette={GREEN_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="CACHE W" value={cacheCreateStr} palette={BONE_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="TOTAL" value={totalStr} palette={DIM_PALETTE} labelLen={8} valueLen={10} />

          {/* Divider */}
          <div style={{ height: 1, background: '#264028', margin: '2px 12px' }} />

          {/* Derived cascade metrics */}
          <MetricRow label="YIELD Υ" value={yieldStr} palette={GOLD_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="SNR" value={snrStr} palette={GREEN_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="LEVERAGE" value={levStr} palette={GREEN_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="VELOCITY" value={velStr} palette={BONE_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="10XDEV" value={devStr} palette={GOLD_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="SCALE V" value={scaleStr} palette={BONE_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="EFFICIENC" value={effStr} palette={GREEN_PALETTE} labelLen={8} valueLen={10} />
          <MetricRow label="$/1M" value={costStr} palette={DIM_PALETTE} labelLen={8} valueLen={10} />
        </div>
      </div>

      {/* Scanline texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
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

  // Responsive scaling: measure container, scale the 1200×630 board to fit
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      const w = container.clientWidth
      setScale(w / 1200)
    }
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
    } catch { /* clipboard blocked */ }
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
    } finally {
      setBusy(false)
    }
  }

  const btn =
    'rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50'

  return (
    <div className="flex flex-col gap-3">
      {showControls && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={replay} className={btn}>↻ Replay</button>
          <button type="button" onClick={shareLink} className={btn}>{copied ? 'Copied ✓' : 'Share'}</button>
          <button type="button" onClick={download} disabled={busy} className={btn}>{busy ? 'Rendering…' : 'Download card'}</button>
        </div>
      )}

      {/* Container — measures width, scales the board */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border border-[#264028]"
        style={{ width: '100%', height: 630 * scale }}
      >
        <div
          key={replayKey}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: 1200,
            height: 630,
          }}
        >
          <Board cardRef={cardRef} {...props} />
        </div>
      </div>
    </div>
  )
}
