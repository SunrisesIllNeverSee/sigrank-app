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

import { redirect } from 'next/navigation'

export default function LeaderboardPage() {
  // Owner 2026-06-24: the board opens on the unfiltered "Everything" view (every
  // operator's every window point), not a single window. Window tabs narrow from there.
  redirect('/board/everything')
}
