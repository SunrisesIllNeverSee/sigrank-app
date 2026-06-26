'use client'

import React, { useEffect, useState } from 'react'

/**
 * RotatingWordmark — the landing hero wordmark, EXAGGERATED.
 *
 * "SIGRANK" rendered letter-by-letter, each letter independently cycling
 * through a small font pool (mono → grotesk → serif → archivo-black) on a
 * per-letter stagger, so the word visibly morphs across faces without changing
 * in unison. Driven by the `.wordmark-letter` / `@keyframes wordmark-rotate`
 * rule in globals.css; per-letter delay is set inline via the --wm-delay var.
 *
 * Hero-scale: clamped huge (up to ~9rem), heavy weight, tight tracking. The §
 * coin sits after the word. Reduced-motion locks every letter to the mono face.
 *
 * Self-gates: renders null when data-theme === 'terminal' (the TerminalWordmark
 * takes over the hero under that theme). Watches data-theme via MutationObserver.
 */
const WORD = 'SIGRANK'.split('')

export function RotatingWordmark() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const check = () => {
      setHidden(document.documentElement.getAttribute('data-theme') === 'terminal')
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  if (hidden) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      <h1
        aria-label="SIGRANK"
        className="flex select-none items-baseline text-[clamp(3.5rem,13vw,9rem)] font-bold leading-none tracking-[0.04em] text-gold"
      >
        {WORD.map((ch, i) => (
          <span
            key={i}
            aria-hidden
            // i===0 is the S — gets the extra wordmark-letter-s class so it
            // briefly swaps to § (the MO§ES™ glyph) on the serif keyframe slot.
            className={i === 0 ? 'wordmark-letter wordmark-letter-s' : 'wordmark-letter'}
            style={{ ['--wm-delay' as string]: `${i * 0.55}s` }}
          >
            {ch}
          </span>
        ))}
      </h1>
      <span className="flex h-[clamp(2.5rem,7vw,5rem)] w-[clamp(2.5rem,7vw,5rem)] items-center justify-center rounded-full border-[3px] border-gold font-mono text-[clamp(1.25rem,3.5vw,2.5rem)] text-gold">
        §
      </span>
    </div>
  )
}
