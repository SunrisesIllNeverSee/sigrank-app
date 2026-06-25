import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionOperator } from '@/lib/supabase/auth-server'

/**
 * app/me/page.tsx — "My Profile" resolver.
 *
 * Reads the signed-in operator (getUser-verified) and redirects to their public
 * profile at /user/[codename]. Logged-out → /login?next=/me. Never invents a session.
 *
 * Replaces the 2026-06-22 TEMP seed-preview redirect that bounced EVERY visitor to the
 * "static seed · all" operator — i.e. the "after I sign in + fill my profile it shows
 * one of the seed profiles" bug (AUTH_LAUNCH_DIRECTIVES D5).
 */
// Auth-dependent redirect — must read the live session cookie on every request, never
// be prerendered (a static prerender would bake the logged-out → /login branch).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Profile · SigRank',
  description: 'Your SigRank operator profile.',
}

export default async function MyProfilePage() {
  const op = await getSessionOperator()
  if (!op) redirect('/login?next=/me')
  // A freshly-claimed operator with no codename yet → finish the profile fill-out.
  if (!op.codename) redirect('/me/edit')
  redirect(`/user/${encodeURIComponent(op.codename)}`)
}
