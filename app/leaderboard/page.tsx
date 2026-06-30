/**
 * app/leaderboard/page.tsx — the leaderboard entry URL.
 *
 * Owner 2026-06-22: renamed /operators → /leaderboard so the URL matches the
 * "Leaderboard" nav label. The 730 conversion put the board on per-window routes
 * (app/board/[window] — the shareable per-window permalinks); /leaderboard
 * redirects to the default window. Old /operators links redirect here via
 * next.config; the per-operator profile route moved to /user/[codename].
 *
 * TODO(BOARD.LEADERBOARD_REDIRECT): platform/class/sort query params are not
 * forwarded through the redirect (the board route doesn't surface those filters
 * yet — FilterBar was already removed). Re-add if/when the board grows filters.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { withOG } from '@/lib/seo'

export const metadata: Metadata = withOG({
  title: 'Leaderboard',
  description:
    'The SigRank leaderboard — rank AI operators by token-cascade yield (Υ = cache_read × output / input²). Browse by platform, time window, or signal class.',
  path: '/leaderboard',
})

export default function LeaderboardPage() {
  // Owner 2026-06-27: the board now opens on the operator-TOTAL view at /board/all —
  // ONE entry per operator (their cross-platform 'multi' total, all-time), with the
  // per-platform / per-window breakdowns as URL filters (?view=platforms, ?platform=…).
  // (Was /board/off, the allSnapshots firehose — every operator×platform×window row.)
  redirect('/board/all')
}
