'use client'

/**
 * components/signature/SplitFlapCard.tsx — real Solari split-flap board.
 *
 * Uses clackboard for authentic 3D rotateX flip animation — each character
 * is a physical tile that splits horizontally and flips on a hinge, just
 * like the boards at European train stations.
 *
 * Layout: 1/3 + 2/3 split
 *   Left 1/3:  Gold background (TV-station ident style). SIGRANK wordmark,
 *             DEPARTURES, MO§ES™, CLASS, PLATFORM, cascade radar.
 *   Right 2/3: Dark Solari board. Each metric is a row of real split-flap
 *             cells with label + value. Classic variant (scan-line texture,
 *             hinge marks). Board mode (all flaps spin, settle independently).
 */

import { useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { SplitFlap, type Palette } from 'clackboard'
import { track } from '@/lib/posthog/events'
import CascadeRadar from '@/components/charts/CascadeRadar'

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
  radarAxes?: { label: string; value: number; max: number }[]
  showControls?: boolean
}

// ── Palettes ──────────────────────────────────────────────────────────────

// Gold text on dark tiles (yield, 10xDEV)
const GOLD_PALETTE: Palette = {
  text: '#e0b240',
  topBg: '#0c0c0a',
  botBg: '#070706',
  border: '#1a1a16',
  div: '#2a2515',
}

// Green text on dark tiles (SNR, leverage, efficiency, output, cache read)
const GREEN_PALETTE: Palette = {
  text: '#78dc82',
  topBg: '#0c0c0a',
  botBg: '#070706',
  border: '#1a1a16',
  div: '#1a2a1a',
}

// Bone/white text on dark tiles (input, cache write, velocity, scale V)
const BONE_PALETTE: Palette = {
  text: '#dee6d2',
  topBg: '#0c0c0a',
  botBg: '#070706',
  border: '#1a1a16',
  div: '#1a2a1a',
}

// Dim text (total, $/1M)
const DIM_PALETTE: Palette = {
  text: '#6e966e',
  topBg: '#0c0c0a',
  botBg: '#070706',
  border: '#1a1a16',
  div: '#1a2a1a',
}

// ── Format helpers ────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function pad(str: string, len: number): string {
  return str.padEnd(len, ' ')
}

// ── A single metric row: label + split-flap value ─────────────────────────

function MetricRow({
  label,
  value,
  palette,
  valueLen,
  delay,
}: {
  label: string
  value: string
  palette: Palette
  valueLen: number
  delay: number
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '4px 16px',
      borderBottom: '1px solid #152015',
    }}>
      {/* Label — static, dim green */}
      <span style={{
        fontSize: '12px',
        color: '#6e966e',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        width: '110px',
        flexShrink: 0,
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
      }}>
        {label}
      </span>
      {/* Value — real split-flap cells */}
      <SplitFlap
        value={pad(value, valueLen)}
        length={valueLen}
        size="sm"
        variant="classic"
        palette={palette}
        mode="board"
        easing="decelerate"
        flipMs={80}
        stagger={30}
        gap={2}
        perspective={200}
        animateOnMount
        style={{ justifyContent: 'flex-start' }}
      />
    </div>
  )
}

// ── The board ─────────────────────────────────────────────────────────────

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
  radarAxes,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>
} & Omit<SplitFlapCardProps, 'showControls'>) {
  const W = 1200
  const H = 630
  const LEFT_W = 380
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

  // Gold for the left panel
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
      {/* ═══════════ LEFT 1/3 — gold background, TV ident style ═══════════ */}
      <div style={{
        width: LEFT_W,
        height: H,
        background: GOLD_BG,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 28px',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        {/* Subtle texture overlay on gold */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 3px)',
        }} />

        {/* SIGRANK wordmark — big, dark on gold */}
        <div style={{
          fontSize: '36px',
          fontWeight: 800,
          color: GOLD_DARK,
          letterSpacing: '4px',
          lineHeight: 1,
        }}>
          SIGRANK
        </div>

        {/* Diamond divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px',
        }}>
          <div style={{ width: '10px', height: '10px', background: GOLD_DARK, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: '2px', background: GOLD_DARK, opacity: 0.3 }} />
        </div>

        {/* DEPARTURES + MO§ES™ */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            fontSize: '16px',
            color: GOLD_DARK,
            letterSpacing: '3px',
            fontWeight: 700,
            opacity: 0.8,
          }}>
            DEPARTURES
          </div>
          <div style={{
            fontSize: '14px',
            color: GOLD_DARK,
            letterSpacing: '2px',
            fontWeight: 600,
            opacity: 0.6,
          }}>
            MO§ES™
          </div>
        </div>

        {/* Operator name — the "destination" */}
        <div style={{
          marginTop: '20px',
          fontSize: '22px',
          fontWeight: 700,
          color: GOLD_DARK,
          letterSpacing: '1px',
          lineHeight: 1.15,
          wordBreak: 'break-word',
        }}>
          {name.toUpperCase()}
        </div>

        {/* Class + Platform */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '10px',
              color: GOLD_DARK,
              opacity: 0.5,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              width: '70px',
            }}>
              Class
            </span>
            <span style={{
              fontSize: '14px',
              color: GOLD_DARK,
              fontWeight: 700,
              letterSpacing: '1px',
            }}>
              {classTier}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '10px',
              color: GOLD_DARK,
              opacity: 0.5,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              width: '70px',
            }}>
              Platform
            </span>
            <span style={{
              fontSize: '14px',
              color: GOLD_DARK,
              fontWeight: 700,
              letterSpacing: '1px',
            }}>
              {(platform ?? '—').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Radar at bottom — dark on gold */}
        {radarAxes && radarAxes.length >= 3 && (
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              fontSize: '10px',
              color: GOLD_DARK,
              opacity: 0.5,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}>
              Cascade
            </span>
            <div style={{
              background: 'rgba(10,10,10,0.15)',
              borderRadius: '8px',
              padding: '8px',
            }}>
              <CascadeRadar values={radarAxes} size={180} />
            </div>
          </div>
        )}

        {/* Footer on gold */}
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: GOLD_DARK,
          opacity: 0.4,
          letterSpacing: '1px',
        }}>
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
      }}>
        {/* Board header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px 10px',
          borderBottom: '2px solid #264028',
        }}>
          <span style={{
            fontSize: '14px',
            color: '#e0b240',
            letterSpacing: '2px',
            fontWeight: 700,
          }}>
            CASCADE TELEMETRY
          </span>
          <span style={{
            fontSize: '11px',
            color: '#6e966e',
            letterSpacing: '2px',
          }}>
            LIVE
          </span>
        </div>

        {/* Board rows — raw data + derived metrics */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Raw token pillars */}
          <MetricRow label="Input" value={inputStr} palette={BONE_PALETTE} valueLen={10} delay={0} />
          <MetricRow label="Output" value={outputStr} palette={GREEN_PALETTE} valueLen={10} delay={100} />
          <MetricRow label="Cache R" value={cacheReadStr} palette={GREEN_PALETTE} valueLen={10} delay={200} />
          <MetricRow label="Cache W" value={cacheCreateStr} palette={BONE_PALETTE} valueLen={10} delay={300} />
          <MetricRow label="Total" value={totalStr} palette={DIM_PALETTE} valueLen={10} delay={400} />

          {/* Divider */}
          <div style={{ height: 1, background: '#264028', margin: '2px 16px' }} />

          {/* Derived cascade metrics */}
          <MetricRow label="Yield Υ" value={yieldStr} palette={GOLD_PALETTE} valueLen={10} delay={500} />
          <MetricRow label="SNR" value={snrStr} palette={GREEN_PALETTE} valueLen={10} delay={600} />
          <MetricRow label="Leverage" value={levStr} palette={GREEN_PALETTE} valueLen={10} delay={700} />
          <MetricRow label="Velocity" value={velStr} palette={BONE_PALETTE} valueLen={10} delay={800} />
          <MetricRow label="10xDEV" value={devStr} palette={GOLD_PALETTE} valueLen={10} delay={900} />
          <MetricRow label="Scale V" value={scaleStr} palette={BONE_PALETTE} valueLen={10} delay={1000} />
          <MetricRow label="Efficiency" value={effStr} palette={GREEN_PALETTE} valueLen={10} delay={1100} />
          <MetricRow label="$/1M" value={costStr} palette={DIM_PALETTE} valueLen={10} delay={1200} />
        </div>
      </div>

      {/* Scanline texture over the whole card */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
      }} />
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────

export function SplitFlapCard(props: SplitFlapCardProps) {
  const { showControls = true } = props
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [replayKey, setReplayKey] = useState(0)

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
          <button type="button" onClick={replay} className={btn}>
            ↻ Replay
          </button>
          <button type="button" onClick={shareLink} className={btn}>
            {copied ? 'Copied ✓' : 'Share'}
          </button>
          <button type="button" onClick={download} disabled={busy} className={btn}>
            {busy ? 'Rendering…' : 'Download card'}
          </button>
        </div>
      )}

      {/* Visible board */}
      <div key={replayKey} className="overflow-hidden rounded-lg border border-[#264028]" style={{ aspectRatio: '1200/630' }}>
        <Board cardRef={cardRef} {...props} />
      </div>
    </div>
  )
}
