'use client'

/**
 * components/draft/TopicConsole.tsx — the wiki scrolling accordion.
 *
 * A single-column scrolling page: every group is a collapsible section.
 * Click a group header → it expands and scrolls to it, showing all the
 * group's sub-topics in sequence. Multiple groups can be open at once.
 * All content stays mounted (server data / animation state preserved);
 * collapsed groups are hidden via CSS but not unmounted.
 *
 * RSC discipline: this is a 'use client' shell, so it CANNOT import the real
 * server components. The page (app/wiki/page.tsx, a server component) renders
 * every topic's content into React nodes and passes them in via the `groups`
 * prop; this shell only owns expansion state.
 */

import { useId, useRef, useState } from 'react'

export interface TopicItem {
  /** Stable key + visible label for the sub-topic heading. */
  label: string
  /** Pre-rendered content node (server-rendered upstream, passed in here). */
  node: React.ReactNode
  /** Optional one-line caption shown under the sub-topic heading. */
  hint?: string
}

export interface TopicGroup {
  /** Group heading, e.g. "Metrics", "Submit", "Support". */
  groupLabel: string
  /** Optional source route shown as a mono sub-label. */
  source?: string
  /** Optional group-level description shown when the group is expanded. */
  description?: string
  items: TopicItem[]
}

export interface TopicConsoleProps {
  groups: TopicGroup[]
}

export function TopicConsole({ groups }: TopicConsoleProps) {
  const selectId = useId()

  // First group open by default; rest collapsed.
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({ 0: true })

  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  function toggleGroup(gi: number) {
    setOpenGroups((prev) => {
      const isOpen = prev[gi] ?? false
      const next = { ...prev, [gi]: !isOpen }
      // If opening, scroll to the section header
      if (!isOpen && sectionRefs.current[gi]) {
        setTimeout(() => {
          sectionRefs.current[gi]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }, 50)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ───────────── MOBILE: quick-jump dropdown (≤md) ───────────── */}
      <div className="mb-2 md:hidden">
        <label
          htmlFor={selectId}
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
        >
          Jump to topic
        </label>
        <select
          id={selectId}
          defaultValue=""
          onChange={(e) => {
            const gi = Number(e.target.value)
            if (!isNaN(gi)) {
              setOpenGroups((prev) => ({ ...prev, [gi]: true }))
              setTimeout(() => {
                sectionRefs.current[gi]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }, 50)
            }
          }}
          className="w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2.5 font-mono text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <option value="">Choose a section…</option>
          {groups.map((g, gi) => (
            <option key={g.groupLabel} value={gi}>
              {gi + 1}. {g.groupLabel}
            </option>
          ))}
        </select>
      </div>

      {/* ───────────── SCROLLING ACCORDION ───────────── */}
      <div className="flex flex-col gap-2">
        {groups.map((g, gi) => {
          const isOpen = openGroups[gi] ?? false
          return (
            <div
              key={g.groupLabel}
              ref={(el) => { sectionRefs.current[gi] = el }}
              className="overflow-hidden rounded-lg border border-bg-border bg-bg-surface/40"
            >
              {/* Group header — click to expand/collapse + scroll */}
              <button
                type="button"
                onClick={() => toggleGroup(gi)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-bg-hover/40"
              >
                <span className="font-mono text-[10px] text-text-dim">
                  {isOpen ? '▾' : '▸'}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-text-dim">
                  {gi + 1}
                </span>
                <span className="font-mono text-sm font-bold uppercase tracking-[0.08em] text-text-primary">
                  {g.groupLabel}
                </span>
                {g.source && (
                  <span className="ml-auto font-mono text-[9px] text-text-dim">
                    {g.source}
                  </span>
                )}
              </button>

              {/* Group content — all items rendered in sequence */}
              {isOpen && (
                <div className="flex flex-col gap-6 border-t border-bg-border-subtle px-4 py-5">
                  {g.description && (
                    <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
                      {g.description}
                    </p>
                  )}
                  {g.items.map((item, ii) => (
                    <div key={`${gi}:${ii}`} className="flex flex-col gap-2">
                      {/* Sub-topic heading */}
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
                          {gi + 1}.{ii + 1}
                        </span>
                        <h3 className="font-mono text-base font-bold text-text-primary">
                          {item.label}
                        </h3>
                        {item.hint && (
                          <p className="font-sans text-xs text-text-muted">{item.hint}</p>
                        )}
                      </div>
                      {/* Sub-topic content */}
                      <div className="min-w-0">
                        {item.node}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
