'use client'

import React, { useEffect, useState } from 'react'

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
 * Optional nicety (included — reads clean): the ◈ ─── ◈ rule (SPLASH_RULE) +
 * "For all builders, burners and 10xers" tagline under the wordmark.
 */

// Exact copy of SPLASH_ART from sigrank-mcp/tui.mjs (lines 1093–1097).
const SPLASH_ART = [
  '███████ ██  ██████  ██████   █████  ███    ██ ██   ██',
  '██      ██ ██       ██   ██ ██   ██ ████   ██ ██  ██ ',
  '███████ ██ ██   ███ ██████  ███████ ██ ██  ██ █████  ',
  '     ██ ██ ██    ██ ██   ██ ██   ██ ██  ██ ██ ██  ██ ',
  '███████ ██  ██████  ██   ██ ██   ██ ██   ████ ██   ██',
]

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
      {/* Block-letter art — <pre> preserves the exact spacing. Responsive font-size
          so the 52-char width fits mobile without horizontal scroll. */}
      <pre
        aria-hidden
        className="select-none overflow-x-auto font-mono leading-[1.1] text-[clamp(0.45rem,1.8vw,0.95rem)] tracking-tight"
        style={{ margin: 0 }}
      >
        {SPLASH_ART.map((line, i) => (
          <div
            key={i}
            className="terminal-wordmark-line"
            style={{ ['--tw-delay' as string]: `${i * 0.4}s` }}
          >
            {line}
          </div>
        ))}
      </pre>

      {/* ◈ rule + tagline (SPLASH_RULE + "For all builders, burners and 10xers") */}
      <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-dim sm:text-[11px]">
        <span>{SPLASH_RULE}</span>
        <span className="text-text-secondary">For all builders, burners and 10xers</span>
      </div>
    </div>
  )
}
