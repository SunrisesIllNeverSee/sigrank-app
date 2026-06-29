/**
 * app/board/[window]/page.tsx — the 730 per-window leaderboard.
 *
 * One shareable route per window (/board/7d · /board/30d · /board/90d · /board/all).
 * Each is a board hero heading (LB-1) + the window switcher + the full
 * LeaderboardTable (which carries the Metrics ↔ Raw-pillars view toggle). The
 * window slug maps to a DB window_type enum; getLeaderboard applies the window
 * filter + buffer (lib/data/windows.ts). RSC; ISR-cached 300s (D19).
 *
 * LB-2 (owner 2026-06-20): the headline Υ-yield bar chart (BoardYieldBars) was
 * removed — the table already shows Υ with per-row species heat, so the big chart
 * was redundant. LB-1: a real page heading now leads the board (was none).
 *
 * The four windows are statically generated. An unknown slug → 404.
 */

import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getLeaderboard } from '@/lib/data'
import { toEntry } from '@/lib/leaderboard/to-entry'
import { boardWindowBySlug, BOARD_WINDOWS } from '@/lib/data/windows'
import { PLATFORM_DOMAIN_MAP, type PlatformUI } from '@/lib/constants'
import { LeaderboardTable } from '@/components/sigrank'
import { WaveHero } from '@/components/ui/WaveHero'
import { LeaderboardKey } from '@/components/leaderboard/LeaderboardKey'
import { withOG } from '@/lib/seo'

/**
 * Normalize a ?platform= search param to a `primary_domain` filter value (lowercase)
 * the facade understands, or null when absent / 'all' / unrecognized. Accepts both
 * the domain value ('claude') and the UI label ('Claude'). Keeps the board's platform
 * filter URL-driven (BOARD redesign, 2026-06-27) without trusting arbitrary input.
 */
function normalizePlatform(raw: string | undefined): string | null {
  if (!raw) return null
  const v = raw.trim().toLowerCase()
  if (!v || v === 'all') return null
  // Accept any known primary_domain value from the UI→domain map.
  const domains = new Set(
    (Object.values(PLATFORM_DOMAIN_MAP).filter(Boolean) as string[]).map((d) => d.toLowerCase()),
  )
  return domains.has(v) ? v : null
}

/** Resolve the ?platform= filter back to its UI label so the table dropdown reflects it. */
function platformLabelFor(domain: string | null): PlatformUI {
  if (!domain) return 'All'
  const entry = (Object.entries(PLATFORM_DOMAIN_MAP) as [PlatformUI, string | null][]).find(
    ([, d]) => d?.toLowerCase() === domain,
  )
  return entry ? entry[0] : 'All'
}

// D19: cache leaderboard reads for 300s (Cache-Control max-age=300 equivalent).
export const revalidate = 300

/** Statically render the four known windows + the "off" (filter-off) board. */
export function generateStaticParams() {
  return [...BOARD_WINDOWS.map((w) => ({ window: w.slug })), { window: 'off' }]
}

/** Per-window OG metadata. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ window: string }>
}): Promise<Metadata> {
  const { window: slug } = await params
  const isOff = slug === 'off'
  const win = isOff ? null : boardWindowBySlug(slug)
  if (!isOff && !win) return { title: 'Board not found' }
  const label = isOff ? 'All-time' : win!.label
  return withOG({
    title: `${label} Leaderboard`,
    description: `The SigRank ${label.toLowerCase()} leaderboard — AI operators ranked by Υ Yield (token cascade efficiency).`,
    path: `/board/${slug}`,
  })
}

export default async function BoardWindowPage({
  params,
  searchParams,
}: {
  params: Promise<{ window: string }>
  searchParams: Promise<{ window?: string; platform?: string; view?: string }>
}) {
  const { window: slug } = await params
  const sp = await searchParams

  // Legacy alias (owner 2026-06-25): the old "everything" firehose was removed. Any
  // surviving /board/everything link forwards to the new default so it never 404s.
  if (slug === 'everything') redirect('/board/off')

  // "off" board (owner 2026-06-26 — FIX F): filters off shows ALL of an operator's
  // submissions broken out by (platform × window) — every snapshot point, no collapse —
  // each row LABELED (codename · platform · window) so the breakouts read as intentional,
  // not the old unlabeled "everything" firehose. allSnapshots keeps every row; the window
  // label (LeaderboardTable, win==='off') + platform column disambiguate the duplicates.
  const isOff = slug === 'off'
  // The route slug is the primary WINDOW selector (default board = /board/all = all_time).
  const win = isOff ? null : boardWindowBySlug(slug)
  if (!isOff && !win) notFound()

  // BOARD redesign (2026-06-27): the DEFAULT board is one operator-TOTAL row per
  // operator — preferring the operator's 'multi' snapshot (which already SUMS every
  // platform, so we never re-sum claude+codex+multi), all_time window. The breakdowns
  // are driven by URL searchParams, NOT hardcoded:
  //   ?platform=claude|codex|…  → filter the board to one platform
  //   ?view=platforms           → flip to the per-platform breakdown (one row per
  //                               (operator, platform); the old perPlatform behaviour)
  // The route slug still picks the window; with no params the slug board is the clean
  // single-total-row default. /board/off (allSnapshots) is unchanged.
  const platformFilter = normalizePlatform(sp.platform)
  const viewPlatforms = sp.view === 'platforms'

  const rows = isOff
    ? await getLeaderboard({ allSnapshots: true })
    : await getLeaderboard({
        window: win!.enum,
        windowFilter: true,
        // ?view=platforms → per-platform breakdown; default → one operator-total row.
        ...(viewPlatforms ? { perPlatform: true } : { operatorTotal: true }),
        // ?platform=… narrows to a single platform's rows (matched on primary_domain /
        // the per-row platform); 'all'/absent leaves the board unfiltered.
        ...(platformFilter ? { platform: platformFilter } : {}),
      })
  const entries = rows.map(toEntry)

  return (
    <div className="flex flex-col gap-6">
      {/* LB-1 + shared wave hero (owner 2026-06-21): the board masthead now uses the
          same animated <WaveHero/> as the Hall, with board-specific copy. */}
      <WaveHero
        eyebrow="The SigRank Leaderboard"
        terminalText="LEADERBOARD"
        title={
          <>
            Builders, Burners &amp;{' '}
            <span className="bg-gradient-to-r from-gold to-text-accent bg-clip-text text-transparent">
              10×ers
            </span>
          </>
        }
        subtitle={
          <>
            Every operator scored from four raw token counts and ranked by{' '}
            <strong className="text-text-primary">Υ Yield</strong> — the architecture of the cascade,
            not raw spend. Volume is noise; yield is signal.
          </>
        }
      />

      {/* Window switcher removed (owner 2026-06-24): the window selector now lives INSIDE
          the leaderboard box (LeaderboardTable's Window dropdown, incl. the "off" view).
          BOARD redesign (2026-06-27): the Platform dropdown + the "by platform" toggle now
          DRIVE the URL (?platform / ?view=platforms); their initial value reflects the URL. */}
      <LeaderboardTable
        entries={entries}
        totalUsers={rows.length}
        window={isOff ? 'off' : win!.slug}
        platform={platformLabelFor(platformFilter)}
        view={viewPlatforms ? 'platforms' : 'total'}
      />

      {/* Key popup (owner 2026-06-24): metrics + the nine classes — moved to the END
          of the board (after the table) per owner. */}
      <LeaderboardKey />
    </div>
  )
}
