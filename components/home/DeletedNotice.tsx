'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * components/home/DeletedNotice.tsx — one-time "your account was deleted" banner
 * (owner 2026-06-27). Reads ?deleted=1 (set by the DangerZone redirect) on the CLIENT
 * so the homepage stays statically rendered/cached — a server searchParams read would
 * force it dynamic. Dismissible; renders nothing without the param.
 */
function Banner() {
  const params = useSearchParams()
  const [show, setShow] = useState(true)
  if (!show || params.get('deleted') !== '1') return null
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
      <span className="font-sans text-sm text-text-secondary">
        Your account was permanently deleted. Thanks for stopping by.
      </span>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Dismiss"
        className="shrink-0 font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        ✕
      </button>
    </div>
  )
}

export function DeletedNotice() {
  // useSearchParams requires a Suspense boundary in statically-rendered pages.
  return (
    <Suspense fallback={null}>
      <Banner />
    </Suspense>
  )
}
