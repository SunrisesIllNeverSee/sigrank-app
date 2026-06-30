'use client'

/**
 * components/signature/SplitFlapCard.tsx — dot-matrix tractor-feed printout.
 *
 * Right panel: green-bar computer paper with sprocket holes, large black
 * monospace text, print-head scan animation. Left panel: gold SigRank
 * identity with radar. No split-flap — just printed text, fully readable.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
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

// ── Print animation CSS ───────────────────────────────────────────────────

const PRINT_CSS = `
@keyframes printFeed {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes printHead {
  0% { top: 0; opacity: 0.9; }
  85% { opacity: 0.7; }
  100% { top: 100%; opacity: 0; }
}
@keyframes paperFeed {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
`

// ── A printed line ────────────────────────────────────────────────────────

interface PrintLine {
  glyph: string
  label: string
  value: string
  color: string
}

function PrintRow({ line, index }: { line: PrintLine; index: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: '40px',
      padding: '0 20px 0 16px', gap: '12px',
      animation: `printFeed 0.25s ease-out ${index * 55}ms both`,
    }}>
      {/* Glyph — colored, bold */}
      <span style={{
        width: '52px', flexShrink: 0,
        fontSize: '26px', fontWeight: 800, color: line.color,
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        textShadow: '0.5px 0.5px 0 rgba(0,0,0,0.08)',
      }}>
        {line.glyph}
      </span>
      {/* Label — dark gray */}
      <span style={{
        width: '180px', flexShrink: 0,
        fontSize: '18px', fontWeight: 600, color: '#2a3a1a',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        letterSpacing: '0.5px',
      }}>
        {line.label}
      </span>
      {/* Value — black, bold, right-aligned */}
      <span style={{
        flex: 1, textAlign: 'right',
        fontSize: '24px', fontWeight: 800, color: '#0a0a0a',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        textShadow: '0.5px 0.5px 0 rgba(0,0,0,0.06)',
      }}>
        {line.value}
      </span>
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

  // Dark, readable colors for glyphs on green-bar paper
  const C_GOLD = '#7a5a1a'
  const C_GREEN = '#1a4a2a'
  const C_BONE = '#2a2a2a'
  const C_DIM = '#4a5a3a'

  // All printed lines — raw first, then derived
  const rawLines: PrintLine[] = [
    { glyph: 'IN', label: 'INPUT', value: inputStr, color: C_BONE },
    { glyph: 'OUT', label: 'OUTPUT', value: outputStr, color: C_GREEN },
    { glyph: 'CR', label: 'CACHE R', value: cacheReadStr, color: C_GREEN },
    { glyph: 'CW', label: 'CACHE W', value: cacheCreateStr, color: C_BONE },
    { glyph: '\u2211', label: 'TOTAL', value: totalStr, color: C_DIM },
  ]
  const derivedLines: PrintLine[] = [
    { glyph: '\u03a5', label: 'YIELD', value: yieldStr, color: C_GOLD },
    { glyph: 'SNR', label: 'SNR', value: snrStr, color: C_GREEN },
    { glyph: 'LEV', label: 'LEVERAGE', value: levStr, color: C_GREEN },
    { glyph: 'VEL', label: 'VELOCITY', value: velStr, color: C_BONE },
    { glyph: '\u26a1', label: '10X DEV', value: devStr, color: C_GOLD },
    { glyph: 'SCL', label: 'SCALE V', value: scaleStr, color: C_BONE },
    { glyph: 'EFF', label: 'EFFICIENCY', value: effStr, color: C_GREEN },
    { glyph: '$', label: 'COST/1M', value: costStr, color: C_DIM },
  ]

  // Sprocket hole pattern — small dark circles on a gray strip
  const sprocketBg = {
    backgroundColor: '#c8d4b8',
    backgroundImage: 'radial-gradient(circle at center, #a8b498 3px, transparent 3.5px)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 10px',
  }

  // Green-bar paper stripes — alternating green/white, 40px each
  const paperBg = {
    backgroundColor: '#eef4e4',
    backgroundImage: 'repeating-linear-gradient(0deg, #d8e6c8 0px, #d8e6c8 40px, #eef4e4 40px, #eef4e4 80px)',
  }

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

        {/* Name — TOP, largest */}
        <div style={{
          fontSize: '42px', fontWeight: 900, color: GOLD_DARK,
          letterSpacing: '1px', lineHeight: 1.02, wordBreak: 'break-word',
        }}>
          {name.toUpperCase()}
        </div>

        {/* Brand row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: GOLD_DARK, letterSpacing: '3px' }}>&#9670; SIGRANK</span>
          <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '2px' }}>DEPARTURES &middot; MO&sect;ES&#8482;</span>
        </div>

        {/* Diamond divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <div style={{ width: '7px', height: '7px', background: GOLD_DARK, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.2 }} />
        </div>

        {/* Yield headline */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '30px', fontWeight: 900, color: GOLD_DARK }}>&#933;</span>
          <span style={{ fontSize: '11px', color: GOLD_DARK, opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Yield</span>
          <span style={{ fontSize: '30px', fontWeight: 800, color: GOLD_DARK, marginLeft: 'auto' }}>{yieldStr}</span>
        </div>

        {/* Info rows */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            ['CLASS', classTier],
            ['PLATFORM', (platform ?? '\u2014').toUpperCase()],
            ['CASCADE', cascadeStrVal],
            ['OP RATIO', opStr],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: GOLD_DARK, opacity: 0.35, letterSpacing: '1.5px', textTransform: 'uppercase', width: '68px', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: '15px', color: GOLD_DARK, fontWeight: 700, letterSpacing: '0.5px' }}>{val}</span>
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

      {/* ═══ RIGHT 2/3 — tractor-feed printout ═══ */}
      <div style={{
        width: RIGHT_W, height: H, display: 'flex',
        boxSizing: 'border-box', flexShrink: 0,
        animation: 'paperFeed 0.4s ease-out both',
      }}>
        {/* Left sprocket strip */}
        <div style={{ width: '24px', height: '100%', ...sprocketBg, flexShrink: 0 }} />

        {/* Paper — green-bar with printed content */}
        <div style={{
          flex: 1, height: '100%', position: 'relative', overflow: 'hidden',
          ...paperBg,
        }}>
          {/* Print head — scans down on mount */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '3px',
            background: 'linear-gradient(to bottom, rgba(10,10,10,0.6), rgba(10,10,10,0.1))',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            zIndex: 5, pointerEvents: 'none',
            animation: 'printHead 1.1s ease-in 0.1s both',
          }} />

          {/* Printed header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 20px 4px 16px', height: '36px',
            borderBottom: '1px solid #b8c4a8',
            animation: 'printFeed 0.25s ease-out both',
          }}>
            <span style={{
              fontSize: '16px', fontWeight: 800, color: '#1a2a0a',
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              letterSpacing: '1px',
            }}>
              CASCADE TELEMETRY
            </span>
            <span style={{
              fontSize: '14px', fontWeight: 700, color: '#4a5a3a',
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            }}>
              *** LIVE ***
            </span>
          </div>

          {/* Raw token lines */}
          {rawLines.map((line, i) => (
            <PrintRow key={`raw-${line.glyph}`} line={line} index={i + 1} />
          ))}

          {/* Perforation divider */}
          <div style={{
            height: '20px', display: 'flex', alignItems: 'center',
            borderTop: '2px dashed #b8c4a8', borderBottom: '2px dashed #b8c4a8',
            margin: '0 12px',
            animation: `printFeed 0.25s ease-out ${(rawLines.length + 1) * 55}ms both`,
          }}>
            <span style={{
              flex: 1, textAlign: 'center',
              fontSize: '10px', color: '#8a9a7a', letterSpacing: '3px',
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            }}>
              - - - DERIVED - - -
            </span>
          </div>

          {/* Derived metric lines */}
          {derivedLines.map((line, i) => (
            <PrintRow key={`der-${line.glyph}`} line={line} index={i + rawLines.length + 2} />
          ))}
        </div>

        {/* Right sprocket strip */}
        <div style={{ width: '24px', height: '100%', ...sprocketBg, flexShrink: 0 }} />
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
          <button type="button" onClick={replay} className={btn}>&#8635; Replay</button>
          <button type="button" onClick={shareLink} className={btn}>{copied ? 'Copied \u2713' : 'Share'}</button>
          <button type="button" onClick={download} disabled={busy} className={btn}>{busy ? 'Rendering\u2026' : 'Download card'}</button>
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
