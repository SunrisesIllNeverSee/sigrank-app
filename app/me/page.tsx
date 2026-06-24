import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

/**
 * app/me/page.tsx — "My Profile" resolver.
 *
 * When sessions land (terminal auth lane), this reads the signed-in operator and
 * `redirect()`s to /user/[their-codename] — or to /login when logged out.
 * Until the auth client exists, it renders a logged-out prompt (never invents a
 * session). AccountMenu → My Profile routes here.
 *
 * INTEGRATION (terminal): at the top of the component, once auth lands:
 *   import { getSessionOperator } from '@/lib/supabase/auth'
 *   const op = await getSessionOperator()
 *   if (!op) redirect('/login?next=/me')
 *   redirect(`/user/${op.codename}`)
 */

// TODO(TEMP, owner 2026-06-22): auth isn't wired, but owner wants to REVIEW the
// profile page. Until the sign-in gate is real, "My Profile" previews the
// "static seed · all" operator (the clean all-time seed — review it against its
// "static seed · all ✱mem" claude-mem-inflated twin, the observer-contamination demo)
// instead of the logged-out prompt. Delete this block when auth lands — the
// logged-out prompt below is the real fallback.
const PROFILE_PREVIEW_CODENAME = 'static seed · all'

export const metadata: Metadata = {
  title: 'My Profile · SigRank',
  description: 'Your SigRank operator profile.',
}

export default function MyProfilePage() {
  // TEMP profile-review redirect (see TODO above). Remove when auth wires in.
  redirect(`/user/${PROFILE_PREVIEW_CODENAME}`)

  // TODO(AUTH.WIRE): resolve the signed-in operator and redirect to their
  // profile (or /login). Logged-out prompt until the auth client lands.
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
      <span className="font-mono text-2xl font-bold tracking-[0.1em] text-gold">
        ◈
      </span>
      <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">
        Sign in to see your profile
      </h1>
      <p className="font-sans text-sm leading-relaxed text-text-secondary">
        Your operator profile — cascade fingerprint, rank, and class — lives
        behind your account. Sign in to claim your leaderboard row.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Sign in →
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-md border border-bg-border px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          Browse the board
        </Link>
      </div>
    </div>
  )
}
