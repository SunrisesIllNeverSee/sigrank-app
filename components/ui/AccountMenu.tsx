'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

/**
 * AccountMenu — right-side account / profile entry point. Renders a "Login"
 * trigger that opens an absolutely-positioned dropdown panel holding auth
 * actions plus the theme controls. Closes on outside click or Escape.
 *
 * Login route note: /api/auth/github does not exist yet, so the GitHub action
 * points at '#' for now (placeholder, swap when the route lands).
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      {/* Get ranked — the primary conversion CTA, a filled gold button. A clear gap
          then the Sign in dropdown trigger (owner 2026-06-24: keep them separate). */}
      <Link
        href="/login"
        className="rounded-md bg-gold px-3 py-1.5 font-sans text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90"
      >
        Get ranked →
      </Link>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-bg-border bg-bg-elevated px-2.5 py-1.5 font-sans text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
      >
        <span className="text-gold">◎</span> Sign in
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-bg-border bg-bg-elevated p-1 font-sans text-sm shadow-lg"
        >
          <Link
            href="/login"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Login with GitHub
          </Link>
          <Link
            href="/me"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            My Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Settings
          </Link>

          <div className="my-1 border-t border-bg-border" />

          {/* Submit + Support removed (owner 2026-06-24 sweep). Contact stays — a real link. */}
          <Link
            href="/wiki#contact"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            Contact
          </Link>

          <div className="my-1 border-t border-bg-border" />

          <div className="px-2.5 py-1.5">
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-tight text-text-muted">
              Theme
            </div>
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  )
}
