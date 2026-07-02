'use client'

import React, { useEffect, useState } from 'react'
import { TerminalBlockText } from '@/components/home/TerminalBlockText'

/**
 * TerminalWordmark — the terminal-theme hero wordmark (Layer 3, FIX O-adjacent).
 *
 * Ports the TUI block-letter SIGRANK splash art (SPLASH_ART from
 * sigrank-mcp/tui.mjs lines 1093–1097) as a centered <pre>, with a continuous
 * color-cycle through the TUI MOSES_PAL palette (warm golds/ambers). The cycle
 * is driven by `.terminal-wordmark-line` in globals.css (background-clip:text
 * gradient that animates background-position). Per-line stagger via --tw-delay
 * so the sweep reads as flowing down the wordmark.
 *
 * Rendered ONLY when data-theme === 'terminal' (reads the attribute client-side,
 * same pattern as ThemeToggle). Other themes keep the existing RotatingWordmark.
 * The caller (Draft2Hero) switches between the two.
 *
 * Responsive: the art is 52 chars wide — clamp the font-size so it fits mobile
 * width without horizontal scroll. Reduced-motion: the CSS slows the cycle to a
 * 30s drift (never freezes — owner's a11y call).
 *
 * Optional nicety (included — reads clean): the ◈ ─── ◈ rule (SPLASH_RULE).
 */

const SPLASH_RULE = '◈  ───────────────────────────────────────────  ◈'

export function TerminalWordmark() {
  const [isTerminal, setIsTerminal] = useState(false)

  useEffect(() => {
    const check = () => {
      const t = document.documentElement.getAttribute('data-theme')
      setIsTerminal(t === 'terminal')
    }
    check()
    // Watch for theme changes (the ThemeToggle sets data-theme on <html>).
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  if (!isTerminal) return null

  return (
    <div className="flex flex-col items-center gap-3" aria-label="SIGRANK">
      {/* Block-letter art via the shared engine. SIGRANK's glyphs reproduce the
          original SPLASH_ART byte-for-byte. Responsive font-size so the 52-char
          width fits mobile without a horizontal-scroll gutter (overflow-x-clip). */}
      <TerminalBlockText
        text="SIGRANK"
        label="SIGRANK"
        fontClassName="text-[clamp(0.6rem,3.2vw,1.7rem)]"
      />

      {/* ◈ rule (SPLASH_RULE) — tagline removed per owner 2026-07-02 */}
      <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-dim sm:text-[11px]">
        <span>{SPLASH_RULE}</span>
      </div>
    </div>
  )
}
