/**
 * components/ui/WaveHero.tsx — the shared animated wave masthead.
 *
 * Generalized from the Hall hero (owner 2026-06-21: "I like that hero a lot, use it
 * on other pages like leaderboard and compare"). Same look — a centered title over a
 * flowing 3-wave SVG backdrop (gold / accent / seeker) on the `.cascade-pulse`
 * keyframe, staggered speeds — now prop-driven so each page supplies its own copy.
 *
 * Pure CSS/SVG, theme-reactive (strokes resolve rgb(var(--token)) at paint), and
 * reduced-motion safe (`.cascade-pulse` → animation:none under prefers-reduced-motion,
 * globals.css). No data deps; a presentational masthead.
 */

import React from 'react'
import { WaveHeroTitle } from '@/components/ui/WaveHeroTitle'

// Three sine-ish crests across the band, each its own pulse speed + phase so the
// field shimmers rather than marching in lockstep.
const WAVES = [
  { d: 'M0,46 C120,18 240,74 360,46 C480,18 600,74 720,46 C840,18 960,74 1080,46 C1140,32 1170,40 1200,46', stroke: 'rgb(var(--gold))', opacity: 0.55, dur: '7s', delay: '0s', width: 2 },
  { d: 'M0,52 C140,80 280,24 420,52 C560,80 700,24 840,52 C980,80 1120,24 1200,52', stroke: 'rgb(var(--accent))', opacity: 0.4, dur: '9s', delay: '-2s', width: 1.5 },
  { d: 'M0,40 C100,30 220,58 340,40 C460,22 580,58 700,40 C820,22 940,58 1060,40 C1120,31 1160,36 1200,40', stroke: 'rgb(var(--class-seeker))', opacity: 0.3, dur: '11s', delay: '-4s', width: 1.5 },
]

export interface WaveHeroProps {
  /** Small uppercase kicker above the title (e.g. "Hall of Signal"). */
  eyebrow: React.ReactNode
  /** The H1. Pass a string, or JSX for accenting (e.g. a gradient span). */
  title: React.ReactNode
  /** Optional one-line description below the title. */
  subtitle?: React.ReactNode
  /**
   * Plain-string hero word for the terminal theme. When set AND the terminal
   * theme is active, the title renders as block-letter art (matching the landing
   * SIGRANK wordmark). Omit → the styled <h1> renders in every theme as before.
   */
  terminalText?: string
}

export function WaveHero({ eyebrow, title, subtitle, terminalText }: WaveHeroProps) {
  return (
    // w-full so the masthead exactly fills its max-w-6xl page container (the same
    // box the table sits in) — hero and table share one width + centering, no
    // scrollbar-gutter drift between them.
    <header className="relative mb-8 w-full overflow-hidden rounded-xl border border-bg-border bg-bg-surface">
      {/* Animated signal-wave backdrop */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 92"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {WAVES.map((w, i) => (
          <path
            key={i}
            className="cascade-pulse"
            d={w.d}
            fill="none"
            stroke={w.stroke}
            strokeWidth={w.width}
            strokeLinecap="round"
            opacity={w.opacity}
            pathLength={1}
            style={{ ['--dur' as string]: w.dur, ['--delay' as string]: w.delay }}
          />
        ))}
      </svg>

      {/* Title content */}
      <div className="relative flex flex-col items-center gap-2 px-6 py-12 text-center sm:py-16">
        <span className="font-mono text-xs uppercase tracking-[0.4em] text-text-gold">
          {eyebrow}
        </span>
        <WaveHeroTitle title={title} terminalText={terminalText} />
        {subtitle ? (
          <p className="max-w-xl font-sans text-sm text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
    </header>
  )
}
