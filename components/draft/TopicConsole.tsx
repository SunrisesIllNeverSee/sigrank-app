'use client'

/**
 * components/draft/TopicConsole.tsx — DRAFT 1 only.
 *
 * A Google-Search-Console-style two-pane shell: a persistent LEFT COLUMN that
 * lists every topic grouped by source page (Metrics / Submit / Support), and a
 * MAIN PANEL that shows the selected topic's pre-rendered content.
 *
 * RSC discipline: this is a 'use client' shell, so it CANNOT import the real
 * server components. The page (app/wiki/page.tsx, a server component) renders
 * every topic's content into React nodes and passes them in via the `groups`
 * prop; this shell only owns selection state and shows/hides the matching node.
 *
 * Responsive: at >=md the left column is a persistent sidebar; below md it
 * collapses to a top dropdown (native <select>) so the 390px view stays usable.
 *
 * This file is NEW and unlinked — it does not touch any existing component.
 */

import { useId, useMemo, useState } from 'react'

export interface TopicItem {
  /** Stable key + visible label in the left column. */
  label: string
  /** Pre-rendered content node (server-rendered upstream, passed in here). */
  node: React.ReactNode
  /** Optional one-line caption shown under the label in the panel header. */
  hint?: string
}

export interface TopicGroup {
  /** Group heading, e.g. "Metrics", "Submit", "Support". */
  groupLabel: string
  /** Optional source route shown as a mono sub-label. */
  source?: string
  items: TopicItem[]
}

export interface TopicConsoleProps {
  groups: TopicGroup[]
}

/** Deterministic per-(group,item) key so selection survives re-render. */
function keyFor(gi: number, ii: number): string {
  return `${gi}:${ii}`
}

export function TopicConsole({ groups }: TopicConsoleProps) {
  const selectId = useId()

  // Flatten once for lookup + the mobile <select>.
  const flat = useMemo(
    () =>
      groups.flatMap((g, gi) =>
        g.items.map((item, ii) => ({
          key: keyFor(gi, ii),
          gi,
          ii,
          group: g.groupLabel,
          item,
        })),
      ),
    [groups],
  )

  const firstKey = flat[0]?.key ?? ''
  const [selected, setSelected] = useState<string>(firstKey)

  // All groups open by default; clicking a group header collapses it.
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const active = flat.find((f) => f.key === selected) ?? flat[0]

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
      {/* ───────────── MOBILE: top dropdown (≤md) ───────────── */}
      <div className="md:hidden">
        <label
          htmlFor={selectId}
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
        >
          Topic
        </label>
        <select
          id={selectId}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2.5 font-mono text-xs text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          {groups.map((g, gi) => (
            <optgroup key={g.groupLabel} label={`${gi + 1}. ${g.groupLabel}`}>
              {g.items.map((item, ii) => (
                <option key={keyFor(gi, ii)} value={keyFor(gi, ii)}>
                  {gi + 1}.{ii + 1}  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ───────────── DESKTOP: persistent left column (≥md) ───────────── */}
      <nav
        aria-label="Topics"
        className="hidden w-full shrink-0 self-stretch md:block md:w-64 lg:w-72"
      >
        <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-surface/60">
          <div className="border-b border-bg-border-subtle px-3 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">
              ◧ Topics
            </span>
          </div>
          <ul className="flex flex-col py-1">
            {groups.map((g, gi) => {
              const isCollapsed = collapsed[gi] ?? false
              return (
                <li key={g.groupLabel} className="px-1">
                  {/* Group header — collapsible */}
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((c) => ({ ...c, [gi]: !isCollapsed }))
                    }
                    aria-expanded={!isCollapsed}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-bg-hover/60"
                  >
                    <span className="font-mono text-[10px] text-text-dim">
                      {isCollapsed ? '▸' : '▾'}
                    </span>
                    <span className="font-mono text-[11px] font-bold tabular-nums text-text-dim">
                      {gi + 1}
                    </span>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
                      {g.groupLabel}
                    </span>
                    {g.source && (
                      <span className="ml-auto font-mono text-[9px] text-text-dim">
                        {g.source}
                      </span>
                    )}
                  </button>

                  {/* Items */}
                  {!isCollapsed && (
                    <ul className="mb-1 flex flex-col">
                      {g.items.map((item, ii) => {
                        const k = keyFor(gi, ii)
                        const isActive = k === selected
                        return (
                          <li key={k}>
                            <button
                              type="button"
                              onClick={() => setSelected(k)}
                              aria-current={isActive ? 'true' : undefined}
                              className={[
                                'group relative flex w-full items-center gap-2 rounded py-1.5 pl-6 pr-2 text-left transition-colors',
                                isActive
                                  ? 'bg-bg-elevated text-text-primary'
                                  : 'text-text-muted hover:bg-bg-hover/50 hover:text-text-secondary',
                              ].join(' ')}
                            >
                              {/* thin active-state highlight rail */}
                              <span
                                aria-hidden
                                className={[
                                  'absolute left-2 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full transition-colors',
                                  isActive
                                    ? 'bg-gold'
                                    : 'bg-transparent group-hover:bg-bg-border',
                                ].join(' ')}
                              />
                              <span className="shrink-0 font-mono text-[10px] tabular-nums text-text-dim">
                                {gi + 1}.{ii + 1}
                              </span>
                              <span className="truncate font-mono text-[11px] leading-tight">
                                {item.label}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* ───────────── MAIN PANEL ───────────── */}
      <section className="min-w-0 flex-1">
        {/* Panel header — breadcrumb + active topic */}
        <div className="mb-4 flex flex-col gap-1 border-b border-bg-border-subtle pb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
            {(active?.gi ?? 0) + 1}. {active?.group}
            <span className="px-1 text-text-dim">/</span>
            <span className="text-text-accent">
              {(active?.gi ?? 0) + 1}.{(active?.ii ?? 0) + 1} {active?.item.label}
            </span>
          </span>
          <h2 className="font-mono text-base font-bold text-text-primary">
            <span className="text-text-dim">
              {(active?.gi ?? 0) + 1}.{(active?.ii ?? 0) + 1}
            </span>{' '}
            {active?.item.label}
          </h2>
          {active?.item.hint && (
            <p className="font-sans text-xs text-text-muted">{active.item.hint}</p>
          )}
        </div>

        {/* Active content — every node stays mounted (so server data / flip-card
            animation state isn't thrown away on switch); we just hide the
            inactive ones. */}
        <div className="min-w-0">
          {flat.map((f) => (
            <div key={f.key} hidden={f.key !== selected}>
              {f.item.node}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
