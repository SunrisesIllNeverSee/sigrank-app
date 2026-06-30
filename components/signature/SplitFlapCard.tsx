'use client'

/**
 * components/signature/SplitFlapCard.tsx — the split-flap departures board.
 *
 * Inspired by Solari boards at European train stations. Each character
 * flips through glyphs and lands on its final value. The resolved state
 * IS the card — a mechanical data board with the operator's stats.
 *
 * Two surfaces:
 *   1. Live animated version on the profile page (plays on mount, loops)
 *   2. Static download card (the resolved state, captured to PNG)
 *
 * Style: glyph-cycle (text swap) — mobile-safe, ships clean, no 3D overhead.
 * The aesthetic is the departures board: green numbers, gold rank, dark bg,
 * each cell a mechanical flap that settled on its value.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { track } from '@/lib/posthog/events'

export interface SplitFlapCardProps {
  codename: string
  name: string
  yieldValue: number | null
  rank: number | null
  classTier: string
  snr: number | null
  leverage: number | null
  velocity: number | null
  platform: string | null
  /** Show download/share buttons. Default true. */
  showControls?: boolean
}

// Glyph set — the flap alphabet (what characters cycle through before landing)
const FLAP_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#§◈Υ▲▼░▒'.split('')
const NUM_GLYPHS = '0123456789KMB.▲'.split('')

function randomGlyph(numeric: boolean): string {
  const pool = numeric ? NUM_GLYPHS : FLAP_GLYPHS
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Single flap cell ──────────────────────────────────────────────────────

interface FlapCellProps {
  finalChar: string
  numeric: boolean
  delay: number
  duration: number
  className: string
  playKey: number  // increments to replay
}

function FlapCell({ finalChar, numeric, delay, duration, className, playKey }: FlapCellProps) {
  const [display, setDisplay] = useState(finalChar)
  const [settled, setSettled] = useState(true)

  useEffect(() => {
    setSettled(false)
    const ticks = 6 + Math.floor(Math.random() * 5)
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
        setDisplay(finalChar === ' ' ? ' ' : randomGlyph(numeric))
        i++
      }, step)
      // Cleanup on unmount or replay
      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [finalChar, numeric, delay, duration, playKey])

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        minWidth: '0.62em',
        textAlign: 'center',
        transition: settled ? 'none' : 'none',
        opacity: settled ? 1 : 0.85,
      }}
    >
      {display}
    </span>
  )
}

// ── A row of flap cells spelling a word ────────────────────────────────────

function FlapRow({
  text,
  numeric,
  delay,
  duration,
  className,
  playKey,
}: {
  text: string
  numeric: boolean
  delay: number
  duration: number
  className: string
  playKey: number
}) {
  return (
    <>
      {text.split('').map((ch, i) => (
        <FlapCell
          key={`${i}-${ch}`}
          finalChar={ch}
          numeric={numeric}
          delay={delay + i * 50}
          duration={duration}
          className={className}
          playKey={playKey}
        />
      ))}
    </>
  )
}

// ── The board layout ──────────────────────────────────────────────────────

function Board({
  cardRef,
  codename,
  name,
  yieldValue,
  rank,
  classTier,
  snr,
  leverage,
  velocity,
  platform,
  playKey,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>
} & Omit<SplitFlapCardProps, 'showControls'> & { playKey: number }) {
  const yieldStr = yieldValue !== null
    ? (yieldValue >= 1000 ? `${(yieldValue / 1000).toFixed(1)}K` : yieldValue.toFixed(0))
    : '—'
  const rankStr = rank !== null ? `#${rank}` : '—'
  const snrStr = snr !== null ? `${(snr * 100).toFixed(0)}%` : '—'
  const levStr = leverage !== null ? `${leverage.toFixed(0)}x` : '—'
  const velStr = velocity !== null ? velocity.toFixed(1) : '—'

  // Board dimensions — 1200×630 for OG/share card compatibility
  const W = 1200
  const H = 630

  // Cell styles
  const cellStyle: React.CSSProperties = {
    fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
  }

  return (
    <div
      ref={cardRef}
      style={{
        width: W,
        height: H,
        background: '#050605',
        color: '#dee6d2',
        fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 64px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #264028',
      }}
    >
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '18px',
        borderBottom: '1px solid #1a2a1a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#e0b240', letterSpacing: '4px' }}>
          <div style={{ width: '12px', height: '12px', background: '#e0b240', transform: 'rotate(45deg)' }} />
          <FlapRow text="SIGRANK" numeric={false} delay={0} duration={500} className="" playKey={playKey} />
        </div>
        <div style={{ fontSize: '14px', color: '#6e966e', letterSpacing: '2px', textTransform: 'uppercase' }}>
          <FlapRow text="DEPARTURES" numeric={false} delay={200} duration={400} className="" playKey={playKey} />
        </div>
      </div>

      {/* Operator name — the big headline */}
      <div style={{
        fontSize: '64px',
        fontWeight: 700,
        lineHeight: 1.1,
        marginTop: '28px',
        color: '#e0b240',
        letterSpacing: '2px',
      }}>
        <FlapRow text={name.toUpperCase()} numeric={false} delay={300} duration={700} className="" playKey={playKey} />
      </div>

      {/* Class + platform row */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginTop: '14px',
        fontSize: '22px',
        color: '#78dc82',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6e966e', letterSpacing: '1px', textTransform: 'uppercase' }}>Class</span>
          <FlapRow text={classTier} numeric={false} delay={600} duration={500} className="" playKey={playKey} />
        </span>
        {platform && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6e966e', letterSpacing: '1px', textTransform: 'uppercase' }}>Platform</span>
            <FlapRow text={platform.toUpperCase()} numeric={false} delay={700} duration={500} className="" playKey={playKey} />
          </span>
        )}
      </div>

      {/* Stats grid — the departures board rows */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '0',
        marginTop: 'auto',
        marginBottom: '24px',
        borderTop: '1px solid #1a2a1a',
        borderBottom: '1px solid #1a2a1a',
      }}>
        {/* Yield */}
        <div style={{ padding: '18px 16px', borderRight: '1px solid #1a2a1a' }}>
          <div style={{ fontSize: '11px', color: '#6e966e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Yield
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#e0b240' }}>
            <FlapRow text={yieldStr} numeric={true} delay={800} duration={600} className="" playKey={playKey} />
          </div>
        </div>
        {/* Rank */}
        <div style={{ padding: '18px 16px', borderRight: '1px solid #1a2a1a' }}>
          <div style={{ fontSize: '11px', color: '#6e966e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Rank
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#e0b240' }}>
            <FlapRow text={rankStr} numeric={true} delay={900} duration={600} className="" playKey={playKey} />
          </div>
        </div>
        {/* SNR */}
        <div style={{ padding: '18px 16px', borderRight: '1px solid #1a2a1a' }}>
          <div style={{ fontSize: '11px', color: '#6e966e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            SNR
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#78dc82' }}>
            <FlapRow text={snrStr} numeric={true} delay={1000} duration={600} className="" playKey={playKey} />
          </div>
        </div>
        {/* Leverage */}
        <div style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: '11px', color: '#6e966e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Leverage
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700, color: '#78dc82' }}>
            <FlapRow text={levStr} numeric={true} delay={1100} duration={600} className="" playKey={playKey} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '18px',
      }}>
        <span style={{ color: '#e0b240' }}>signalaf.com</span>
        <span style={{ color: '#6e966e', fontSize: '14px', letterSpacing: '1px' }}>
          <FlapRow text="/user/" numeric={false} delay={1200} duration={300} className="" playKey={playKey} />
          {codename}
        </span>
      </div>

      {/* Subtle scanline texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
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

  // Auto-play on mount + loop every 12s
  useEffect(() => {
    setPlayKey(1)
    const loop = setInterval(() => setPlayKey((k) => k + 1), 12000)
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

      {/* Visible board — scaled to fit the page */}
      <div className="overflow-hidden rounded-lg border border-[#264028]" style={{ aspectRatio: '1200/630' }}>
        <div style={{ transform: 'scale(1)', transformOrigin: 'top left', width: '100%' }}>
          {/* We render at full 1200×630 and let CSS scale it down */}
          <div style={{ width: '100%', aspectRatio: '1200/630' }}>
            <Board
              cardRef={cardRef}
              {...props}
              playKey={playKey}
            />
          </div>
        </div>
      </div>

      {/* Hidden full-res capture target for html-to-image */}
      <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <Board
          cardRef={cardRef}
          {...props}
          playKey={playKey}
        />
      </div>
    </div>
  )
}
