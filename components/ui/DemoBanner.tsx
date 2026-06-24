'use client'

import React, { useState } from 'react'
import Link from 'next/link'

/**
 * Dismissible demo-data banner. Client component (local dismiss state).
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex w-full items-center justify-center gap-3 border-b border-bg-border bg-bg-elevated px-4 py-2 text-center">
      <span className="text-xs text-text-secondary">
        Early access — cascade metrics are real (derived from canonical token
        telemetry); the operator field is a curated seed.{' '}
        <Link href="/about" className="text-accent underline">
          Learn more about the data
        </Link>
      </span>
      <button
        type="button"
        aria-label="Dismiss demo banner"
        onClick={() => setDismissed(true)}
        className="ml-2 rounded-sm border border-bg-border px-2 py-0.5 text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        ✕
      </button>
    </div>
  )
}
