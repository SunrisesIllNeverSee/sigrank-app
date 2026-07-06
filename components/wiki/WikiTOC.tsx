'use client'

/**
 * components/wiki/WikiTOC.tsx — sticky table-of-contents nav for the wiki.
 *
 * Client component: renders a sticky sidebar of anchor links to every wiki
 * section. Scrollspy highlights the current section as you scroll. On mobile
 * it collapses to a sticky top bar with a dropdown.
 *
 * The section IDs must match the IDs rendered by WikiDoc in the page.
 */

import { useEffect, useState } from 'react'

export interface TocItem {
  id: string
  label: string
  subItems?: { id: string; label: string }[]
}

export interface WikiTOCProps {
  items: TocItem[]
}

export function WikiTOC({ items }: WikiTOCProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Scrollspy: highlight the section currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        // Trigger when the section's top crosses ~30% from the top of the viewport
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0,
      },
    )

    // Observe all section + sub-section elements
    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
      item.subItems?.forEach((sub) => {
        const subEl = document.getElementById(sub.id)
        if (subEl) observer.observe(subEl)
      })
    })

    return () => observer.disconnect()
  }, [items])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Offset for the sticky header — adjust if header height changes
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
    setMobileOpen(false)
  }

  return (
    <>
      {/* ─── Mobile: sticky dropdown bar (≤lg) ─── */}
      <div className="lg:hidden sticky top-0 z-30 bg-bg-base/95 backdrop-blur border-b border-bg-border-subtle">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
            Contents
          </span>
          <span className="font-mono text-sm font-bold text-text-primary truncate">
            {items.find((i) => i.id === activeId)?.label ?? 'Navigate…'}
          </span>
          <span className="ml-auto font-mono text-xs text-text-dim">
            {mobileOpen ? '▴' : '▾'}
          </span>
        </button>
        {mobileOpen && (
          <nav className="absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-bg-border bg-bg-base px-4 py-3 shadow-lg">
            <TocList items={items} activeId={activeId} onNavigate={scrollTo} />
          </nav>
        )}
      </div>

      {/* ─── Desktop: sticky sidebar (≥lg) ─── */}
      <aside className="hidden lg:block sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto self-start">
        <nav className="flex flex-col gap-1 pr-4">
          <span className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
            Contents
          </span>
          <TocList items={items} activeId={activeId} onNavigate={scrollTo} />
        </nav>
      </aside>
    </>
  )
}

function TocList({
  items,
  activeId,
  onNavigate,
}: {
  items: TocItem[]
  activeId: string
  onNavigate: (id: string) => void
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = activeId === item.id
        const subActive = item.subItems?.some((s) => s.id === activeId)
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left font-mono text-xs leading-relaxed transition-colors ${
                isActive
                  ? 'font-bold text-gold'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {item.label}
            </button>
            {item.subItems && (isActive || subActive) && (
              <ul className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-bg-border-subtle pl-2">
                {item.subItems.map((sub) => {
                  const subIsActive = activeId === sub.id
                  return (
                    <li key={sub.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(sub.id)}
                        className={`w-full text-left font-sans text-[11px] leading-relaxed transition-colors ${
                          subIsActive
                            ? 'font-semibold text-text-accent'
                            : 'text-text-dim hover:text-text-muted'
                        }`}
                      >
                        {sub.label}
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
  )
}
