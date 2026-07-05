'use client'

/**
 * components/signature/SignalSignature.tsx — the animated signal signature.
 *
 * The operator's identity as a living artifact: a noise field that resolves
 * into the codename, a Υ value that decrypts in, and the cascade radar
 * emerging from the dark. This is the thesis as motion — signal emerging
 * from noise.
 *
 * Three-phase animation (loops):
 *   1. NOISE    — canvas fills with random glyphs, Υ shows scrambled chars
 *   2. RESOLVE  — noise characters align toward the codename, Υ decrypts
 *   3. SIGNAL   — clean state: radar visible, codename resolved, Υ locked in
 * Then it loops back to noise after a hold.
 *
 * No dependencies — pure canvas + React + CSS. Degrades to the resolved
 * state if JS is slow (the canvas just shows the final frame).
 */

import { useEffect, useRef, useState } from 'react'
import CascadeRadar from '@/components/charts/CascadeRadar'

export interface SignalSignatureProps {
  codename: string
  yieldValue: number | null
  rank: number | null
  classTier: string
  radarAxes: { label: string; value: number; max: number }[]
  /** Compact mode for smaller containers. Default false. */
  compact?: boolean
}

// ── Animation phases ──────────────────────────────────────────────────────

const PHASE_NOISE = 0      // pure noise
const PHASE_RESOLVE = 1    // noise → signal transition
const PHASE_SIGNAL = 2     // clean resolved state
const PHASE_HOLD = 3       // holding the signal, then loop

const NOISE_DURATION = 1200    // ms of pure noise
const RESOLVE_DURATION = 1800  // ms of noise → signal transition
const SIGNAL_DURATION = 4000   // ms of clean signal display
const HOLD_DURATION = 800      // ms fade before loop

// Glyph set for the noise field — the "signal" alphabet
const NOISE_GLYPHS = '01░▒▓█▄▀▲▼◆●○§ΥΔΣΩ§│┤┐└┴┬├─┼╫╬┐┘┌├'

// Scramble chars for the Υ decrypt
const SCRAMBLE_CHARS = '0123456789ΥKMB.─'

// ── Noise field canvas ────────────────────────────────────────────────────

function NoiseField({
  codename,
  phase,
  progress,
}: {
  codename: string
  phase: number
  progress: number  // 0..1 within the current phase
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const c = ctx  // non-null alias for closures

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    let raf = 0

    const cellW = 10
    const cellH = 14
    const cols = Math.ceil(w / cellW)
    const rows = Math.ceil(h / cellH)

    // The target text — codename centered, repeated as a grid
    const targetChars = codename.toUpperCase().split('')

    function draw() {
      c.fillStyle = '#0a0a0a'
      c.fillRect(0, 0, w, h)

      c.font = '11px ui-monospace, "SF Mono", Menlo, monospace'
      c.textBaseline = 'top'

      // Flicker during noise phase
      const flicker = phase === PHASE_NOISE ? (Math.random() > 0.92 ? 0.3 : 1) : 1

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Position-based seeding for the codename text
          const charIdx = (col + row * cols) % targetChars.length
          const targetChar = targetChars[charIdx]

          // Distance from center — center resolves first
          const dx = (col - cols / 2) / (cols / 2)
          const dy = (row - rows / 2) / (rows / 2)
          const distFromCenter = Math.sqrt(dx * dx + dy * dy)

          // Resolution threshold — center first, expanding outward
          const resolveThreshold = progress * 1.4 - 0.2
          const isResolved = phase >= PHASE_SIGNAL ||
            (phase === PHASE_RESOLVE && distFromCenter < resolveThreshold)

          const char = isResolved
            ? targetChar
            : NOISE_GLYPHS[Math.floor(Math.random() * NOISE_GLYPHS.length)]

          // Color: resolved = gold, noise = dim
          if (isResolved) {
            // Gold with slight variation
            const goldShift = Math.random() * 20
            c.fillStyle = `rgba(${196 + goldShift}, ${146 + goldShift * 0.5}, ${58 + goldShift * 0.3}, ${flicker * 0.85})`
          } else {
            // Noise: dim gold/grey
            const noiseAlpha = (0.15 + Math.random() * 0.25) * flicker
            c.fillStyle = Math.random() > 0.7
              ? `rgba(196, 146, 58, ${noiseAlpha * 0.5})`
              : `rgba(120, 110, 90, ${noiseAlpha})`
          }

          c.fillText(char, col * cellW, row * cellH)
        }
      }

      if (phase === PHASE_NOISE || phase === PHASE_RESOLVE) {
        raf = requestAnimationFrame(draw)
      }
    }

    draw()

    // For static phases, draw once and stop
    if (phase >= PHASE_SIGNAL) {
      // Already drawn by draw() above
    }

    return () => cancelAnimationFrame(raf)
  }, [codename, phase, progress])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}

// ── Decrypt text ──────────────────────────────────────────────────────────

function DecryptText({
  finalText,
  phase,
  progress,
}: {
  finalText: string
  phase: number
  progress: number
}) {
  // During NOISE: show pure scramble
  // During RESOLVE: progressively reveal finalText left-to-right
  // During SIGNAL/HOLD: show finalText

  const chars = finalText.split('')

  const display = chars.map((char, i) => {
    if (phase >= PHASE_SIGNAL) return char
    if (phase === PHASE_RESOLVE) {
      const revealPoint = progress * chars.length
      if (i < revealPoint) return char
      // Scramble the not-yet-revealed chars
      return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    }
    // PHASE_NOISE — full scramble
    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
  })

  return <span>{display.join('')}</span>
}

// ── Main component ────────────────────────────────────────────────────────

export function SignalSignature({
  codename,
  yieldValue,
  rank,
  classTier,
  radarAxes,
  compact = false,
}: SignalSignatureProps) {
  const [phase, setPhase] = useState(PHASE_NOISE)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  const yieldStr = yieldValue !== null
    ? (yieldValue >= 1000 ? `${(yieldValue / 1000).toFixed(1)}K` : yieldValue.toFixed(0))
    : '—'

  // Animation loop
  useEffect(() => {
    startTimeRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - startTimeRef.current

      if (elapsed < NOISE_DURATION) {
        setPhase(PHASE_NOISE)
        setProgress(0)
      } else if (elapsed < NOISE_DURATION + RESOLVE_DURATION) {
        setPhase(PHASE_RESOLVE)
        setProgress((elapsed - NOISE_DURATION) / RESOLVE_DURATION)
      } else if (elapsed < NOISE_DURATION + RESOLVE_DURATION + SIGNAL_DURATION) {
        setPhase(PHASE_SIGNAL)
        setProgress(1)
      } else if (elapsed < NOISE_DURATION + RESOLVE_DURATION + SIGNAL_DURATION + HOLD_DURATION) {
        setPhase(PHASE_HOLD)
        setProgress(1)
      } else {
        // Loop
        startTimeRef.current = now
        setPhase(PHASE_NOISE)
        setProgress(0)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const radarOpacity =
    phase === PHASE_NOISE ? 0 :
    phase === PHASE_RESOLVE ? progress :
    1

  const infoOpacity =
    phase === PHASE_NOISE ? 0.3 :
    phase === PHASE_RESOLVE ? 0.3 + progress * 0.7 :
    1

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-gold/30 bg-[#0a0a0a]"
      style={{ aspectRatio: compact ? '16/9' : '16/10' }}
    >
      {/* Noise field background */}
      <NoiseField codename={codename} phase={phase} progress={progress} />

      {/* Vignette overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.7) 80%, rgba(10,10,10,0.95) 100%)',
        }}
      />

      {/* Content layer */}
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 sm:p-8">
        {/* Top bar: brand + rank */}
        <div
          className="flex w-full items-center justify-between"
          style={{ opacity: infoOpacity, transition: 'opacity 0.3s' }}
        >
          <span className="font-mono text-xs tracking-[0.3em] text-gold">
            ◈ SIGRANK
          </span>
          {rank !== null && (
            <span className="font-mono text-lg font-bold text-gold">
              #{rank}
            </span>
          )}
        </div>

        {/* Center: radar + yield */}
        <div className="flex flex-1 items-center justify-center gap-6">
          {/* Cascade radar */}
          <div
            style={{
              opacity: radarOpacity,
              transition: 'opacity 0.4s',
              filter: phase < PHASE_SIGNAL ? `blur(${(1 - radarOpacity) * 8}px)` : 'none',
            }}
          >
            <CascadeRadar values={radarAxes} size={compact ? 180 : 240} />
          </div>

          {/* Yield display */}
          <div
            className="flex flex-col items-start gap-1"
            style={{ opacity: infoOpacity, transition: 'opacity 0.3s' }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              Yield
            </span>
            <span className="font-mono text-4xl font-bold text-gold sm:text-5xl">
              <DecryptText finalText={yieldStr} phase={phase} progress={progress} />
            </span>
            <span className="font-mono text-sm text-text-secondary">
              {classTier}
            </span>
          </div>
        </div>

        {/* Bottom: codename + url */}
        <div
          className="flex w-full items-end justify-between"
          style={{ opacity: infoOpacity, transition: 'opacity 0.3s' }}
        >
          <span className="font-mono text-xl font-bold tracking-wide text-text-primary sm:text-2xl">
            {codename}
          </span>
          <span className="font-mono text-xs text-text-muted">
            signalaf.com
          </span>
        </div>
      </div>

      {/* Scanline overlay (subtle CRT effect) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)',
          opacity: phase < PHASE_SIGNAL ? 0.6 : 0.2,
          transition: 'opacity 0.5s',
        }}
      />
    </div>
  )
}
