'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

/**
 * AccountMenu — right-side account / profile entry point. Renders a "Sign in"
 * trigger that opens a dropdown panel holding auth actions plus the theme
 * controls. Closes on outside click or Escape.
 *
 * Positioning (fix 2026-06-25): the panel is rendered via a PORTAL to
 * document.body with `position: fixed`, anchored under the trigger. The Nav is
 * `sticky top-0 ... backdrop-blur-md`, and a `backdrop-filter` ancestor becomes
 * the containing block for absolutely-positioned descendants — which made the
 * old `absolute mt-2` panel resolve UPWARD relative to the thin nav bar and
 * clip off the top of the screen (the "dropUP, half off-screen" bug). A fixed
 * portal escapes the nav's containing block entirely so it always drops down.
 *
 * Login route note: /api/auth/github does not exist yet, so the GitHub action
 * points at '/login' for now (placeholder, swap when the route lands).
 */
export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  // Anchor the fixed panel under the trigger (right-aligned). Recompute on open,
  // and on resize/scroll while open so it tracks the sticky nav.
  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const t = triggerRef.current
      if (!t) return
      const r = t.getBoundingClientRect()
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      const inRoot = rootRef.current?.contains(target)
      const inMenu = menuRef.current?.contains(target)
      if (!inRoot && !inMenu) setOpen(false)
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
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-bg-border bg-bg-elevated px-2.5 py-1.5 font-sans text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
      >
        <span className="text-gold">◎</span> Sign in
      </button>

      {open && pos !== null && typeof document !== 'undefined' &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          style={{ position: 'fixed', top: pos.top, right: pos.right }}
          className="z-50 w-56 rounded-md border border-bg-border bg-bg-elevated p-1 font-sans text-sm shadow-lg"
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
        </div>,
        document.body,
      )}
    </div>
  )
}
