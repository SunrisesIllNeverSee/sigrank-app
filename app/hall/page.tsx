import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'
import { getLeaderboard } from '@/lib/data'
import { sortValue } from '@/lib/data/fallback'
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  CLASS_FILTER,
  type PlatformUI,
} from '@/lib/constants'
import { boardWindowBySlug } from '@/lib/data/windows'
import { DISPLAY_RAW, DISPLAY_METRICS } from '@/lib/canon/ids'
import { recordValue } from '@/lib/hall/record-value'
import { HallHero } from '@/components/hall/HallHero'
import { HallHeader } from '@/components/hall/HallHeader'
import { MetricTopTen } from '@/components/hall/MetricTopTen'
import { RecordTicker } from '@/components/hall/RecordTicker'
import { ComingSoonMarkers } from '@/components/hall/ComingSoonMarkers'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Hall of Signal',
  description:
    'Triumphus Famae Et Gloriae — the permanent record of peak signal across the SigRank leaderboard.',
  path: '/hall',
})

// ISR: cache the static shell for 300s. The filter-driven content inside
// <Suspense> streams dynamically; the shell (hero + coming-soon) is CDN-cached.
export const revalidate = 300

/**
 * Two record galleries, driven by the canonical display set (lib/canon/ids.ts) so
 * the Hall can't drift from the rest of the surfaces:
 *  - CASCADE_BOARDS — the 9 TOKEN cascade metrics (Y.01–Y.09), the live ranking
 *    canon (owner 2026-06-21: "token based metrics not the word"). Each board
 *    sorts by its cascade key; non-compounding operators read "—" on the
 *    compounding metrics (yield/leverage/10xDEV/op-ratio).
 *  - RAW_BOARDS — the 6 raw token pillars (T.xx + $/1M), sorted off telemetry.
 * Each board's `sort` is the display key — for cascade these hit the SAME sortValue
 * cases as before ('yield_' aliases 'yield'); raw keys hit the new T.xx cases.
 */
const CASCADE_BOARDS = DISPLAY_METRICS.map((d) => ({ canonId: d.id, sort: d.key }))
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({ canonId: d.id, sort: d.key }))
const ALL_BOARDS = [...CASCADE_BOARDS, ...RAW_BOARDS]

/** canonId → display def, for resolving a board's ticker glyph (Υ/SNR/IN/…) in
 * the RecordTicker. Built from the SAME canonical display set the boards use, so
 * the ticker can't drift from the galleries. ($/1M's Y.07 lives in both groups;
 * either entry resolves to the same ticker, so a flat merge is safe.) */
const DISPLAY_BY_ID: Record<string, (typeof DISPLAY_METRICS)[number]> =
  Object.fromEntries([...DISPLAY_RAW, ...DISPLAY_METRICS].map((d) => [d.id, d]))

interface PageProps {
  searchParams: Promise<{ class?: string; platform?: string; window?: string }>
}

/** Coerce a raw search param to a known union member, else the fallback. */
function coerce<T extends string>(raw: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback
}

/**
 * /hall — Hall of Signal (D15 canonical route; /hall-of-signal redirects here).
 *
 * Server component: fetches every board through the @/lib/data facade so it
 * renders on seed data with no Supabase creds. HALL-1: the masthead is now the
 * animated <HallHero/>. HALL-2: real platform / window / class dropdowns
 * (<HallHeader/>, reusing the leaderboard selectors) drive the page via URL
 * params — the page reads them back and passes platform/classScope/window into
 * getLeaderboard. Default window = All time (the Hall is the all-time record
 * book). (Points/circles + SubmitSnapshotModal were retired 2026-06-19 →
 * archived out of the tree 2026-06-20.)
 */
export default async function HallPage({ searchParams }: PageProps) {
  return (
    <div>
      <JsonLd data={breadcrumb([
        { name: 'Hall of Signal', path: '/hall' },
      ])} />
      {/* HALL-1: animated masthead. */}
      <HallHero />

      {/* Filter-driven content (searchParams) isolated behind <Suspense> so the
          shell stays static + CDN-cacheable. revalidate=300 applies to the shell. */}
      <Suspense fallback={
        <div className="mb-8 animate-pulse">
          <div className="mb-6 h-8 rounded bg-bg-surface" />
          <div className="mb-8 h-10 rounded bg-bg-surface" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-40 rounded bg-bg-surface" />
            ))}
          </div>
        </div>
      }>
        <HallContent searchParams={searchParams} />
      </Suspense>

      {/* HALL Task 6: coming-soon markers (Eras teaser · Season Leaders · Sessions) —
          the footer "On the horizon" area per HALL_DESIGN §2/§6/§7. Last child of the page. */}
      <div className="mt-12">
        <ComingSoonMarkers />
      </div>
    </div>
  )
}

/** Filter-driven content — reads searchParams (dynamic API) inside <Suspense>
 * so the page shell stays static. This is the Next 15 pattern for keeping
 * filterable pages ISR-cacheable. */
async function HallContent({ searchParams }: PageProps) {
  const { class: classParam, platform: platformParam, window: windowParam } = await searchParams
  const activeClass = classParam ?? 'all'
  const platform = coerce<PlatformUI>(platformParam, PLATFORM_UI, PLATFORM_DEFAULT)
  // Window uses the canonical 730 BOARD_WINDOWS (7d/30d/90d/all) — the SAME set the
  // board route uses — keyed by slug. Unknown/absent slug → All time (the Hall is the
  // all-time record book). (Was the legacy WINDOW_UI 'Daily/30/90/All time', whose
  // inconsistent labels + mislabeled 'Daily'=7d made the dropdown render unevenly.)
  const win = boardWindowBySlug(windowParam ?? '') ?? boardWindowBySlug('all')!
  const windowSlug = win.slug
  const windowEnum = win.enum

  // Each metric board fetches its own sorted top-ten, scoped by the active
  // platform/class/window. windowFilter:true makes the window control real (not
  // decorative) — picking a window narrows each record board to that window's
  // holders. TODO(HALL.WINDOW): owner may prefer the Hall to stay all-time-only
  // regardless of window; if so, drop windowFilter and treat window as a label.
  // One base fetch, N in-memory sorts: every board shares the same scope
  // (class/platform/window) and getLeaderboard sorts in JS anyway, so 15
  // parallel calls were 15x identical DB work. Fetch the scoped field once
  // and derive each record board with sortValue (the same comparator
  // getLeaderboard uses), re-ranking per board.
  const baseRows = await getLeaderboard({
    classScope: activeClass,
    platform: platform === PLATFORM_DEFAULT ? null : platform,
    window: windowEnum,
    windowFilter: true,
  })
  const metricRows = ALL_BOARDS.map((b) =>
    [...baseRows]
      .sort((a, z) => sortValue(z, b.sort) - sortValue(a, b.sort))
      .slice(0, 10)
      .map((r, i) => ({ ...r, global_rank: i + 1 })),
  )

  // HALL-4: record-highlights ticker — the #1 holder of every board (cascade +
  // raw), one pill each. Boards whose record reads "—" (non-compounding holder)
  // or that have no rows are dropped, so the marquee shows only real records.
  // metricRows[i] lines up with ALL_BOARDS[i]; [0] is each board's top holder.
  const tickerItems = ALL_BOARDS.map((b, i) => {
    const top = metricRows[i]?.[0]
    if (!top) return null
    const v = recordValue(top, b.canonId)
    if (v === '—') return null
    return {
      board: DISPLAY_BY_ID[b.canonId]?.ticker ?? b.canonId,
      holder: top.operator.codename,
      value: v,
      href: `/user/${top.operator.codename}`,
    }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  return (
    <>
      {/* HALL-4: record-highlights ticker (under the hero, above the filter block). */}
      <div className="mb-6">
        <RecordTicker items={tickerItems} />
      </div>

      {/* HALL-2: real platform / window / class dropdowns (URL-param driven). */}
      <div className="mb-8">
        <HallHeader platform={platform} windowSlug={windowSlug} classScope={activeClass} />
      </div>

      {/* Cascade Records — peak holders on every cascade metric (Y.01–Y.09).
          This IS the Hall now (no points/circles). Static records, not a live board.
          metricRows[0..8] line up with CASCADE_BOARDS. */}
      <h2 className="mb-1 font-mono text-lg font-bold tracking-wide text-text-primary">
        Cascade Records
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        The peak holders on every cascade metric. As the 730 windows fill, these become
        the all-time record book — who held the highest Υ, the deepest sessions, the
        cleanest signal.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CASCADE_BOARDS.map((b, i) => (
          <MetricTopTen key={b.canonId} canonId={b.canonId} rows={metricRows[i]} />
        ))}
      </div>

      {/* Raw Records — peak holders on the raw token pillars (T.xx + $/1M).
          metricRows[9..14] line up with RAW_BOARDS (after the 9 cascade boards). */}
      <h2 className="mb-1 mt-10 font-mono text-lg font-bold tracking-wide text-text-primary">
        Raw Records
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        The biggest raw token throughput — who pushed the most input, output, and cache,
        and who runs the cheapest wallet ($/1M).
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RAW_BOARDS.map((b, i) => (
          <MetricTopTen key={b.canonId} canonId={b.canonId} rows={metricRows[CASCADE_BOARDS.length + i]} />
        ))}
      </div>
    </>
  )
}
