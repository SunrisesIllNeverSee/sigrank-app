import React from 'react'
import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'
import { getLeaderboard } from '@/lib/data'
import { BOARD_WINDOWS } from '@/lib/data/windows'
import { HallHero } from '@/components/hall/HallHero'
import { ComingSoonMarkers } from '@/components/hall/ComingSoonMarkers'
import { HallContentClient } from '@/components/hall/HallContentClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Hall of Signal',
  description:
    'Triumphus Famae Et Gloriae — the permanent record of peak signal across the SigRank leaderboard.',
  path: '/hall',
})

// ISR: cache the page for 300s. The page no longer reads searchParams
// (which forced dynamic rendering + no-store). All 4 windows' data is
// pre-fetched on the server; the client wrapper filters by class/platform/window.
export const revalidate = 300

/**
 * /hall — Hall of Signal (D15 canonical route; /hall-of-signal redirects here).
 *
 * Server component: fetches data for ALL 4 windows (no class/platform filter)
 * through the @/lib/data facade so it renders on seed data with no Supabase creds.
 * HALL-1: the masthead is the animated <HallHero/>. HALL-2: real platform / window
 * / class dropdowns (<HallHeader/>) drive the page via URL params — the client
 * wrapper (HallContentClient) reads useSearchParams and filters the pre-fetched
 * data. Default window = All time (the Hall is the all-time record book).
 *
 * CACHING (2026-07-02): the page no longer reads searchParams (which forced
 * dynamic rendering + no-store in Next 15). All 4 windows' base data is
 * pre-fetched on the server (limit 30 for filter headroom); the client wrapper
 * filters by class/platform/window + sorts into 15 boards. This keeps the page
 * static + CDN-cacheable (revalidate=300) while preserving filter functionality.
 */
export default async function HallPage() {
  // Pre-fetch base rows for all 4 windows (no class/platform filter).
  // The client wrapper filters by class/platform and sorts into 15 boards.
  // Limit 30 per window gives headroom for platform/class filtering before
  // slicing to the top 10 per metric.
  const windowsData: Record<string, Awaited<ReturnType<typeof getLeaderboard>>> = {}
  await Promise.all(
    BOARD_WINDOWS.map(async (w) => {
      windowsData[w.slug] = await getLeaderboard({
        window: w.enum,
        windowFilter: true,
        limit: 30,
      })
    }),
  )

  return (
    <div>
      <JsonLd data={breadcrumb([
        { name: 'Hall of Signal', path: '/hall' },
      ])} />
      {/* HALL-1: animated masthead. */}
      <HallHero />

      {/* Client wrapper: reads useSearchParams for class/platform/window filter
          state, filters + sorts the pre-fetched data. No API calls. */}
      <HallContentClient windowsData={windowsData} />

      {/* HALL Task 6: coming-soon markers (Eras teaser · Season Leaders · Sessions) —
          the footer "On the horizon" area per HALL_DESIGN §2/§6/§7. Last child of the page. */}
      <div className="mt-12">
        <ComingSoonMarkers />
      </div>
    </div>
  )
}
