import React from 'react'

/**
 * ComingSoonMarkers — the Hall's "On the horizon" footer (HALL_DESIGN §2/§6/§7).
 * Three teaser markers for wings that have NO pipeline yet, kept out of the live
 * filter row so the filter bar reads as one clean symmetrical set (Task 5 moved
 * the dead "Season Leagues" chip here):
 *  - Eras — a future SEPARATE /eras page (not built; non-navigating teaser).
 *  - Season Leaders — re-homes the old filter-bar "Season Leagues" coming-soon chip.
 *  - Sessions — data-gated, awaiting the session pipeline (session_summaries).
 * Server component; all colors via theme tokens / CSS vars (theme-reactive).
 */

/** One marker: an old-style disabled chip + a small gold "coming soon" pill, so
 * the three read as one uniform/symmetrical set. `subtext` explains the gating. */
function Marker({
  title,
  subtext,
  children,
}: {
  title: string
  subtext: string
  children?: React.ReactNode
}) {
  return (
    <div
      aria-disabled="true"
      className="flex cursor-not-allowed select-none flex-col gap-1.5 rounded-md border border-bg-border bg-bg-surface p-4 text-text-muted opacity-70"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold tracking-wide text-text-primary">
          {title}
        </span>
        <span className="rounded-full border border-gold/30 px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider text-gold">
          coming soon
        </span>
      </div>
      <p className="font-sans text-xs text-text-muted">{subtext}</p>
      {children}
    </div>
  )
}

export function ComingSoonMarkers() {
  return (
    <section>
      <h2 className="mb-1 font-mono text-lg font-bold tracking-wide text-text-primary">
        On the horizon
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        Future wings of the Hall — no pipeline built yet. They light up as the data lands.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* (a) ERAS — a future SEPARATE page. Disabled, non-navigating: aria-disabled +
            no working href + pointer-events-none so it can't actually navigate to /eras
            (which is intentionally NOT built). */}
        <Marker title="Eras" subtext="a separate page — no eras to capture yet">
          <span
            role="link"
            aria-disabled="true"
            className="pointer-events-none cursor-not-allowed font-mono text-[10px] uppercase tracking-wider text-text-dim"
          >
            /eras →
          </span>
        </Marker>

        {/* (b) SEASON LEADERS — re-homes the old "Season Leagues" filter-bar chip. */}
        <Marker title="Season Leaders" subtext="seasonal record holders" />

        {/* (c) SESSIONS — data-gated; reads "awaiting session data" until the pipeline lands. */}
        {/* TODO(SESSION.WIRE): wire to session_summaries when the session pipeline lands */}
        <Marker title="Sessions" subtext="awaiting session data" />
      </div>
    </section>
  )
}
