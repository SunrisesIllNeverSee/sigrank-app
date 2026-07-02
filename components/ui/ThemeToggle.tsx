'use client'

import { useEffect, useState } from 'react'

/**
 * ThemeToggle — sharp segmented theme switcher. Sets data-theme on <html> and
 * persists to localStorage (read back by the no-flash init in layout.tsx).
 * Initializes from whatever the init script already applied to avoid a flash.
 */

const THEMES = [
  { id: 'carbon', label: 'Carbon' },
  { id: 'paper', label: 'Paper' },
  { id: 'railway', label: 'Railway' },
  { id: 'terminal', label: 'Terminal' },
] as const

type ThemeId = (typeof THEMES)[number]['id']

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeId>('terminal')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if (current === 'carbon' || current === 'paper' || current === 'railway' || current === 'terminal') {
      setTheme(current)
    }
  }, [])

  function apply(id: ThemeId) {
    document.documentElement.setAttribute('data-theme', id)
    try {
      localStorage.setItem('sigrank-theme', id)
    } catch {
      /* private mode / storage disabled — theme still applies for the session */
    }
    setTheme(id)
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="grid grid-cols-2 gap-0.5 rounded-md border border-bg-border bg-bg-elevated p-0.5"
    >
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={theme === t.id}
          onClick={() => apply(t.id)}
          className={
            'rounded px-2 py-1 font-mono text-[11px] tracking-tight transition-colors ' +
            (theme === t.id
              ? 'bg-bg-hover text-text-primary'
              : 'text-text-muted hover:text-text-secondary')
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
