'use client'

import { useState } from 'react'

/**
 * components/profile/ProfileTabs.tsx — the operator-profile workspace tab bar.
 *
 * AUTH_LAUNCH_DIRECTIVES D6: the profile is a multi-tab workspace — Stats (view-only
 * cascade metrics), Report (cascade report — mode, badges, DNA, health), Lab
 * (interactive sandbox with operator's real pillars), Submissions (manual
 * project/build showcase — D9, not yet built), and Social (self-promo identity:
 * handle, location, bio, links). Each panel is server-rendered upstream and passed
 * in as a node; this client island only toggles which one is mounted, so the heavy
 * chart islands in inactive tabs never hydrate.
 */
type TabKey = 'stats' | 'report' | 'lab' | 'submissions' | 'social'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'stats', label: 'Stats' },
  { key: 'report', label: 'Report' },
  { key: 'lab', label: 'Lab' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'social', label: 'Social' },
]

export function ProfileTabs({
  stats,
  report,
  lab,
  submissions,
  social,
  initial = 'stats',
}: {
  stats: React.ReactNode
  report?: React.ReactNode
  lab?: React.ReactNode
  submissions: React.ReactNode
  social: React.ReactNode
  initial?: TabKey
}) {
  const [tab, setTab] = useState<TabKey>(initial)

  // Filter tabs: only show Report and Lab if they have content
  const visibleTabs = TABS.filter((t) => {
    if (t.key === 'report') return report != null
    if (t.key === 'lab') return lab != null
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Profile sections" className="flex gap-1 border-b border-bg-border">
        {visibleTabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative -mb-px px-4 py-2 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                active
                  ? 'border-b-2 border-gold text-text-primary'
                  : 'border-b-2 border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        {tab === 'stats' && stats}
        {tab === 'report' && report}
        {tab === 'lab' && lab}
        {tab === 'submissions' && submissions}
        {tab === 'social' && social}
      </div>
    </div>
  )
}
