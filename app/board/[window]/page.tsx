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
import { getLeaderboard } from '@/lib/data'
import { toEntry } from '@/lib/leaderboard/to-entry'
import { boardWindowBySlug, BOARD_WINDOWS } from '@/lib/data/windows'
import { LeaderboardTable } from '@/components/sigrank'
import { WaveHero } from '@/components/ui/WaveHero'
import { LeaderboardKey } from '@/components/leaderboard/LeaderboardKey'

// D19: cache leaderboard reads for 300s (Cache-Control max-age=300 equivalent).
export const revalidate = 300

/** Statically render the four known windows + the "off" (filter-off) board. */
export function generateStaticParams() {
  return [...BOARD_WINDOWS.map((w) => ({ window: w.slug })), { window: 'off' }]
}

export default async function BoardWindowPage({
  params,
}: {
  params: Promise<{ window: string }>
}) {
  const { window: slug } = await params

  // Legacy alias (owner 2026-06-25): the old "everything" firehose was removed. Any
  // surviving /board/everything link forwards to the new default so it never 404s.
  if (slug === 'everything') redirect('/board/off')

  // "off" board (owner 2026-06-26 — FIX F): filters off shows ALL of an operator's
  // submissions broken out by (platform × window) — every snapshot point, no collapse —
  // each row LABELED (codename · platform · window) so the breakouts read as intentional,
  // not the old unlabeled "everything" firehose. allSnapshots keeps every row; the window
  // label (LeaderboardTable, win==='off') + platform column disambiguate the duplicates.
  const isOff = slug === 'off'
  const win = isOff ? null : boardWindowBySlug(slug)
  if (!isOff && !win) notFound()

  // off → allSnapshots (every operator×platform×window row, no collapse).
  // Windowed → windowFilter on its enum + perPlatform (one row per operator×platform
  // WITHIN the window, FIX H — claude/codex/multi shown separately). Sort defaults to Υ.
  const rows = isOff
    ? await getLeaderboard({ allSnapshots: true })
    : await getLeaderboard({ window: win!.enum, windowFilter: true, perPlatform: true })
  const entries = rows.map(toEntry)

  return (
    <div className="flex flex-col gap-6">
      {/* LB-1 + shared wave hero (owner 2026-06-21): the board masthead now uses the
          same animated <WaveHero/> as the Hall, with board-specific copy. */}
      <WaveHero
        eyebrow="The SigRank Leaderboard"
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
          the leaderboard box (LeaderboardTable's Window dropdown, incl. the "off" view). */}
      <LeaderboardTable
        entries={entries}
        totalUsers={rows.length}
        window={isOff ? 'off' : win!.slug}
      />

      {/* Key popup (owner 2026-06-24): metrics + the nine classes — moved to the END
          of the board (after the table) per owner. */}
      <LeaderboardKey />
    </div>
  )
}
