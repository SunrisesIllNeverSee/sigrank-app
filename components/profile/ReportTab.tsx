'use client'

import { useState } from 'react'
import type { OperatorReport } from '@/lib/data'
import { BadgeCollection } from './BadgeCollection'
import { HealthScore } from './HealthScore'
import { DnaCard } from './DnaCard'

/**
 * components/profile/ReportTab.tsx — the Cascade Report tab on the operator profile.
 *
 * 3 layers (from CASCADE_REPORT_DESIGN.md §5):
 *   Layer 1: Mode card (current mode + weekly distribution + mode-weighted yield)
 *   Layer 2: Badges + DNA + Health score
 *   Layer 3: Trend (yield 7d/30d/90d)
 *
 * Privacy: the Report tab is opt-in, off by default. When report_visible=false,
 * only the operator sees their own Report tab (when logged in). Visitors see
 * Stats / Submissions / Social only — no Report tab.
 *
 * Owner sees a privacy toggle that POSTs to /api/profile/report-visibility.
 */
export function ReportTab({
  report,
  isOwner,
}: {
  report: OperatorReport | null
  isOwner: boolean
}) {
  const [visible, setVisible] = useState(report?.report_visible ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggleVisibility() {
    const next = !visible
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/report-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.reason || `http_${res.status}`)
      }
      setVisible(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed')
    } finally {
      setSaving(false)
    }
  }

  if (!report) {
    return (
      <div className="rounded-lg border border-bg-border p-6 text-center">
        <p className="font-mono text-sm text-text-muted">
          No report yet. Update your MCP to{' '}
          <code className="text-gold">sigrank@0.16.0</code> and run{' '}
          <code className="text-gold">sigrank submit</code> to generate your cascade report.
        </p>
      </div>
    )
  }

  const r = report.report
  const modePct = Math.round(r.mode_confidence * 100)

  // Mode distribution formatting
  const distEntries = Object.entries(r.mode_distribution).sort((a, b) => b[1] - a[1])
  const distText = distEntries
    .map(([mode, pct]) => `${Math.round(pct * 100)}% ${mode}`)
    .join(', ')

  return (
    <div className="flex flex-col gap-4">
      {/* Privacy toggle (owner only) */}
      {isOwner && (
        <div className="flex items-center justify-end gap-3">
          {error && (
            <span className="font-mono text-xs text-red-400">Failed: {error}</span>
          )}
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={saving}
            className="font-mono text-xs uppercase tracking-[0.06em] text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : visible ? 'Make private 🔒' : 'Make public ◐'}
          </button>
        </div>
      )}

      {/* Layer 1: Mode Card */}
      <div className="rounded-lg border border-bg-border p-4">
        <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.06em] text-text-muted">
          Mode Card
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-gold">
              {r.current_mode}
            </span>
            <span className="font-mono text-sm text-text-muted">
              {modePct}% confidence
            </span>
          </div>
          <p className="font-mono text-sm text-text-secondary">
            This week: {distText}
          </p>
          <p className="font-mono text-sm text-text-secondary">
            Mode-weighted yield: <span className="text-text-primary">{r.mode_weighted_yield.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Layer 2: Badges + DNA + Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <BadgeCollection badges={r.badges} />
        <div className="flex flex-col gap-4">
          <HealthScore score={r.health_score} yield_={r.peak_yield} />
          <DnaCard modeDistribution={r.mode_distribution} badges={r.badges} />
        </div>
      </div>

      {/* Layer 3: Trend */}
      {r.weekly_snapshots && r.weekly_snapshots.length > 0 && (
        <div className="rounded-lg border border-bg-border p-4">
          <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.06em] text-text-muted">
            Trend
          </h3>
          <div className="flex gap-6 font-mono text-sm">
            <div>
              <span className="text-text-muted">7d: </span>
              <span className="text-text-primary">{r.peak_yield.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-text-muted">30d: </span>
              <span className="text-text-primary">{r.mode_weighted_yield.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-text-muted">Peak: </span>
              <span className="text-text-primary">{r.peak_yield.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
