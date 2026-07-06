/**
 * components/wiki/WikiDoc.tsx — the wiki scrolling document.
 *
 * Server component: renders every group and its items in sequence as a
 * single scrolling document. Each group gets an <h2> with an id (for TOC
 * anchor links), each item gets an <h3> with an id. No collapsing — all
 * content is visible, the TOC nav handles navigation.
 *
 * Replaces the old TopicConsole accordion. The group/item structure is
 * preserved so the page's content definitions don't change.
 */

import React from 'react'

export interface WikiDocItem {
  /** Stable slug for the anchor id. */
  id: string
  /** Visible label for the sub-topic heading. */
  label: string
  /** Pre-rendered content node (server-rendered upstream). */
  node: React.ReactNode
  /** Optional one-line caption shown under the sub-topic heading. */
  hint?: string
}

export interface WikiDocGroup {
  /** Stable slug for the anchor id. */
  id: string
  /** Group heading, e.g. "Metrics", "Submit". */
  groupLabel: string
  /** Optional source route shown as a mono sub-label. */
  source?: string
  /** Optional group-level description. */
  description?: string
  items: WikiDocItem[]
}

export interface WikiDocProps {
  groups: WikiDocGroup[]
}

export function WikiDoc({ groups }: WikiDocProps) {
  return (
    <div className="flex flex-col gap-12">
      {groups.map((g, gi) => (
        <section
          key={g.id}
          id={g.id}
          className="flex scroll-mt-20 flex-col gap-6"
        >
          {/* Group header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl font-bold tabular-nums text-text-dim">
                {gi + 1}
              </span>
              <h2 className="font-mono text-xl font-bold uppercase tracking-[0.06em] text-text-primary">
                {g.groupLabel}
              </h2>
              {g.source && (
                <span className="font-mono text-[10px] text-text-dim">
                  {g.source}
                </span>
              )}
            </div>
            {g.description && (
              <p className="max-w-2xl pl-9 font-sans text-sm leading-relaxed text-text-secondary">
                {g.description}
              </p>
            )}
          </div>

          {/* Group items */}
          <div className="flex flex-col gap-8 pl-9">
            {g.items.map((item) => (
              <div
                key={item.id}
                id={item.id}
                className="flex scroll-mt-20 flex-col gap-3"
              >
                {/* Sub-topic heading */}
                <div className="flex flex-col gap-0.5">
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
        </section>
      ))}
    </div>
  )
}
