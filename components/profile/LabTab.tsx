'use client'

import { useState } from 'react'
import { SandboxClient } from '@/components/sandbox/SandboxClient'

/**
 * components/profile/LabTab.tsx — the Lab tab on the operator profile.
 *
 * Moves the existing /sandbox page into a profile tab. Pre-loads the operator's
 * real pillars instead of starting at zero. The Cascade Genome radar gets the
 * operator's real Core 5 scores.
 *
 * Owner sees full interactive sliders. Visitors see read-only (radar + metrics,
 * no sliders).
 */

export function LabTab({
  pillars,
  isOwner,
}: {
  pillars: { input: number; output: number; cacheCreate: number; cacheRead: number }
  isOwner: boolean
}) {
  const [resetKey, setResetKey] = useState(0)
  const [currentPillars, setCurrentPillars] = useState(pillars)

  const handleReset = () => {
    setCurrentPillars(pillars)
    setResetKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted">
          Cascade Lab
        </h3>
        {isOwner && (
          <button
            type="button"
            onClick={handleReset}
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted hover:text-gold transition-colors"
          >
            Reset to my actual
          </button>
        )}
      </div>

      <div className="rounded-lg border border-bg-border p-4">
        {!isOwner && (
          <p className="mb-3 font-mono text-xs text-text-muted">
            Read-only view — {pillars.input.toLocaleString()} in · {pillars.output.toLocaleString()} out ·{' '}
            {pillars.cacheCreate.toLocaleString()} cw · {pillars.cacheRead.toLocaleString()} cr
          </p>
        )}
        <SandboxClient
          key={resetKey}
          initialPillars={currentPillars}
          readOnly={!isOwner}
        />
      </div>
    </div>
  )
}
