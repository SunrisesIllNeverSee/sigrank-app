'use client'

/**
 * components/signature/SplitFlapCard.tsx — the split-flap departures board.
 *
 * Solari-style board split in thirds:
 *   Left 1/3:  Vertical SIGRANK wordmark · DEPARTURES · MO§ES™ ·
 *              CLASS (vertical) · PLATFORM (vertical) · radar map
 *   Right 2/3: Full Solari board — raw token pillars + derived metrics,
 *              each row a departures line with label + value cells.
 *
 * Animation: starts with ALL random glyphs, then progressively flips
 * and settles — left panel first, then right panel top-to-bottom.
 * Each character cycles through random glyphs, stops on its final value.
 * Loops every 14s.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { track } from '@/lib/posthog/events'
import CascadeRadar from '@/components/charts/CascadeRadar'

export interface SplitFlapCardProps {
  codename: string
  name: string
  yieldValue: number | null
  classTier: string
  platform: string | null
  /** Raw token pillars */
  inputTokens?: number | null
  outputTokens?: number | null
  cacheRead?: number | null
  cacheCreate?: number | null
  /** Derived cascade metrics */
  snr?: number | null
  leverage?: number | null
  velocity?: number | null
  dev10x?: number | null
  scaleV?: number | null
  efficiency?: number | null
  costPerMillion?: number | null
  opRatio?: string | null
  /** Radar axes */
  radarAxes?: { label: string; value: number; max: number }[]
  showControls?: boolean
}

// ── Glyph pools ───────────────────────────────────────────────────────────

const ALPHA_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ@#§◈Υ▲▼░▒'.split('')
const NUM_GLYPHS = '0123456789KMB.▲▼░'.split('')
const ALL_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#§◈Υ▲▼░▒'.split('')

function rnd(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

function isNumericChar(ch: string): boolean {
  return /[0-9.KMB%×x]/.test(ch)
}

// ── Flap cell — starts on random, cycles, settles ─────────────────────────

interface FlapCellProps {
  finalChar: string
  delay: number
  duration: number
  playKey: number
  className?: string
  style?: React.CSSProperties
}

function FlapCell({ finalChar, delay, duration, playKey, className, style }: FlapCellProps) {
  const numeric = isNumericChar(finalChar)
  const pool = numeric ? NUM_GLYPHS : ALPHA_GLYPHS
  // Start on a RANDOM glyph — never the final value
  const [display, setDisplay] = useState(() => finalChar === ' ' ? ' ' : rnd(pool))
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    // Reset to random on every play
    setSettled(false)
    setDisplay(finalChar === ' ' ? ' ' : rnd(pool))

    const ticks = 8 + Math.floor(Math.random() * 6)
    const step = duration / ticks
    let i = 0

    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i >= ticks) {
          clearInterval(interval)
          setDisplay(finalChar)
          setSettled(true)
          return
        }
        setDisplay(finalChar === ' ' ? ' ' : rnd(pool))
        i++
      }, step)
    }, delay)

    return () => {
      clearTimeout(startTimer)
    }
  }, [finalChar, delay, duration, playKey])

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        minWidth: '0.6em',
        textAlign: 'center',
        opacity: settled ? 1 : 0.7,
        ...style,
      }}
    >
      {display}
    </span>
  )
}

// ── Flap row — a string rendered as individual flap cells ─────────────────

function FlapRow({
  text,
  delay,
  duration,
  playKey,
  className,
  style,
  charDelay = 40,
}: {
  text: string
  delay: number
  duration: number
  playKey: number
  className?: string
  style?: React.CSSProperties
  charDelay?: number
}) {
  return (
    <>
      {text.split('').map((ch, i) => (
        <FlapCell
          key={`${i}-${ch}`}
          finalChar={ch}
          delay={delay + i * charDelay}
          duration={duration}
          playKey={playKey}
          className={className}
          style={style}
        />
      ))}
    </>
  )
}

// ── Vertical text — each letter stacked ───────────────────────────────────

function VerticalFlap({
  text,
  delay,
  duration,
  playKey,
  color,
  fontSize,
}: {
  text: string
  delay: number
  duration: number
  playKey: number
  color: string
  fontSize: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
      {text.split('').map((ch, i) => (
        <FlapCell
          key={`${i}-${ch}`}
          finalChar={ch}
          delay={delay + i * 60}
          duration={duration}
          playKey={playKey}
          style={{ color, fontSize, fontWeight: 700, lineHeight: 1.05 }}
        />
      ))}
    </div>
  )
}

// ── Solari board row — label + value cells ────────────────────────────────

function BoardRow({
  label,
  value,
  delay,
  duration,
  playKey,
  valueColor,
}: {
  label: string
  value: string
  delay: number
  duration: number
  playKey: number
  valueColor: string
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '140px 1fr auto',
      gap: '10px',
      padding: '6px 16px',
      borderBottom: '1px solid #152015',
      alignItems: 'center',
    }}>
      {/* Label */}
      <span style={{ fontSize: '12px', color: '#6e966e', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        <FlapRow text={label} delay={delay} duration={duration * 0.6} playKey={playKey} charDelay={25} />
      </span>
      {/* Value — the big flap numbers */}
      <span style={{ fontSize: '24px', fontWeight: 700, color: valueColor, letterSpacing: '1px' }}>
        <FlapRow text={value} delay={delay + 100} duration={duration} playKey={playKey} charDelay={35} />
      </span>
      {/* Status dot */}
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: valueColor, opacity: 0.6,
      }} />
    </div>
  )
}

// ── Format helpers ────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
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
  opRatio,
  radarAxes,
  playKey,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>
} & Omit<SplitFlapCardProps, 'showControls'> & { playKey: number }) {
  const W = 1200
  const H = 630
  const LEFT_W = 380
  const RIGHT_W = W - LEFT_W

  // Format all values
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
  const opStr = opRatio ?? '—'
  const inputStr = inputTokens != null ? fmtTokens(inputTokens) : '—'
  const outputStr = outputTokens != null ? fmtTokens(outputTokens) : '—'
  const cacheReadStr = cacheRead != null ? fmtTokens(cacheRead) : '—'
  const cacheCreateStr = cacheCreate != null ? fmtTokens(cacheCreate) : '—'
  const totalStr = (inputTokens && outputTokens && cacheRead && cacheCreate)
    ? fmtTokens(inputTokens + outputTokens + cacheRead + cacheCreate) : '—'

  // Animation delays — left panel first, then right panel top-to-bottom
  const D = {
    wordmark: 0, departures: 400, moses: 500, class: 600, platform: 700, radar: 900,
    row1: 800, row2: 900, row3: 1000, row4: 1100, row5: 1200,
    row6: 1300, row7: 1400, row8: 1500, row9: 1600, row10: 1700,
    row11: 1800, row12: 1900, row13: 2000, row14: 2100,
    footer: 2300,
  }
  const DUR = 600

  const GOLD = '#e0b240'
  const GREEN = '#78dc82'
  const DIM = '#6e966e'
  const TEXT = '#dee6d2'

  return (
    <div
      ref={cardRef}
      style={{
        width: W,
        height: H,
        background: '#050605',
        color: TEXT,
        fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ═══════════ LEFT 1/3 ═══════════ */}
      <div style={{
        width: LEFT_W,
        height: H,
        borderRight: '2px solid #264028',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 24px',
        boxSizing: 'border-box',
        background: '#070907',
      }}>
        {/* Vertical SIGRANK wordmark */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <VerticalFlap text="SIGRANK" delay={D.wordmark} duration={DUR} playKey={playKey} color={GOLD} fontSize={28} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            {/* DEPARTURES */}
            <div style={{ fontSize: '13px', color: DIM, letterSpacing: '2px' }}>
              <FlapRow text="DEPART" delay={D.departures} duration={DUR * 0.7} playKey={playKey} charDelay={30} />
              <FlapRow text="URES" delay={D.departures + 180} duration={DUR * 0.7} playKey={playKey} charDelay={30} />
            </div>
            {/* MO§ES™ */}
            <div style={{ fontSize: '14px', color: GOLD, letterSpacing: '1px' }}>
              <FlapRow text="MO§ES™" delay={D.moses} duration={DUR * 0.7} playKey={playKey} charDelay={35} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1a2a1a', margin: '20px 0 16px' }} />

        {/* CLASS (vertical) + label */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: DIM, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Class</span>
          </div>
          <VerticalFlap
            text={classTier.length > 6 ? classTier.slice(0, 6) : classTier}
            delay={D.class}
            duration={DUR}
            playKey={playKey}
            color={GREEN}
            fontSize={18}
          />
        </div>

        {/* PLATFORM (vertical) + label */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: DIM, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Platform</span>
          </div>
          <VerticalFlap
            text={(platform ?? '—').toUpperCase().slice(0, 8)}
            delay={D.platform}
            duration={DUR}
            playKey={playKey}
            color={TEXT}
            fontSize={18}
          />
        </div>

        {/* Radar map — bottom of left panel */}
        {radarAxes && radarAxes.length >= 3 && (
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            opacity: 1,
          }}>
            <span style={{ fontSize: '10px', color: DIM, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Cascade
            </span>
            <div style={{
              opacity: 1,
              transition: 'opacity 0.6s',
            }}>
              <CascadeRadar values={radarAxes} size={180} />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ RIGHT 2/3 — the Solari board ═══════════ */}
      <div style={{
        width: RIGHT_W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {/* Board header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px 12px',
          borderBottom: '2px solid #264028',
        }}>
          <span style={{ fontSize: '16px', color: GOLD, letterSpacing: '2px' }}>
            <FlapRow text={name.toUpperCase()} delay={D.row1} duration={DUR} playKey={playKey} charDelay={30} />
          </span>
          <span style={{ fontSize: '12px', color: DIM, letterSpacing: '2px' }}>
            <FlapRow text="LIVE" delay={D.row1 + 200} duration={400} playKey={playKey} />
          </span>
        </div>

        {/* Board rows — raw data + derived metrics, as many as fit */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Raw token pillars */}
          <BoardRow label="Input" value={inputStr} delay={D.row2} duration={DUR} playKey={playKey} valueColor={TEXT} />
          <BoardRow label="Output" value={outputStr} delay={D.row3} duration={DUR} playKey={playKey} valueColor={GREEN} />
          <BoardRow label="Cache R" value={cacheReadStr} delay={D.row4} duration={DUR} playKey={playKey} valueColor={GREEN} />
          <BoardRow label="Cache W" value={cacheCreateStr} delay={D.row5} duration={DUR} playKey={playKey} valueColor={TEXT} />
          <BoardRow label="Total" value={totalStr} delay={D.row6} duration={DUR} playKey={playKey} valueColor={DIM} />

          {/* Divider between raw and derived */}
          <div style={{ height: 1, background: '#264028', margin: '2px 0' }} />

          {/* Derived cascade metrics */}
          <BoardRow label="Yield Υ" value={yieldStr} delay={D.row7} duration={DUR} playKey={playKey} valueColor={GOLD} />
          <BoardRow label="SNR" value={snrStr} delay={D.row8} duration={DUR} playKey={playKey} valueColor={GREEN} />
          <BoardRow label="Leverage" value={levStr} delay={D.row9} duration={DUR} playKey={playKey} valueColor={GREEN} />
          <BoardRow label="Velocity" value={velStr} delay={D.row10} duration={DUR} playKey={playKey} valueColor={TEXT} />
          <BoardRow label="10xDEV" value={devStr} delay={D.row11} duration={DUR} playKey={playKey} valueColor={GOLD} />
          <BoardRow label="Scale V" value={scaleStr} delay={D.row12} duration={DUR} playKey={playKey} valueColor={TEXT} />
          <BoardRow label="Efficiency" value={effStr} delay={D.row13} duration={DUR} playKey={playKey} valueColor={GREEN} />
          <BoardRow label="$/1M" value={costStr} delay={D.row14} duration={DUR} playKey={playKey} valueColor={DIM} />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderTop: '2px solid #264028',
          fontSize: '14px',
        }}>
          <span style={{ color: GOLD }}>
            <FlapRow text="signalaf.com" delay={D.footer} duration={DUR * 0.6} playKey={playKey} charDelay={20} />
          </span>
          <span style={{ color: DIM, fontSize: '12px' }}>
            <FlapRow text={`/user/${codename}`} delay={D.footer + 200} duration={DUR * 0.6} playKey={playKey} charDelay={15} />
          </span>
        </div>
      </div>

      {/* Scanline texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
      }} />
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────

export function SplitFlapCard(props: SplitFlapCardProps) {
  const { showControls = true } = props
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  // Auto-play on mount + loop every 14s
  useEffect(() => {
    setPlayKey(1)
    const loop = setInterval(() => setPlayKey((k) => k + 1), 14000)
    return () => clearInterval(loop)
  }, [])

  const replay = useCallback(() => setPlayKey((k) => k + 1), [])

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

      {/* Visible board — responsive scaling */}
      <div className="overflow-hidden rounded-lg border border-[#264028]" style={{ aspectRatio: '1200/630' }}>
        <Board
          cardRef={cardRef}
          {...props}
          playKey={playKey}
        />
      </div>
    </div>
  )
}
