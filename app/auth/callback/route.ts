import { type NextRequest, NextResponse } from 'next/server'

/**
 * GET /auth/callback — OAuth / magic-link return point.
 *
 * The callback URL is LOCKED to https://signalaf.com/auth/callback
 * (AUTH_PROFILE_ROADMAP.md §2, owner-ratified 2026-06-22). Auth is UI-stubbed with
 * zero backend today (@supabase/ssr is not installed), so this handler does NOT
 * fake a session — it carries the connectable seam and routes the user onward.
 * Per the roadmap, login flows straight into the profile fill-out, so it forwards
 * to /me/edit (the fill-out surface); a ?next hop is honored when same-origin.
 *
 * TODO(AUTH.WIRE): once lib/supabase/auth.ts exists, exchange the code for a
 * session BEFORE redirecting (and pick the destination by whether the profile is
 * new):
 *   import { createServerClient } from '@/lib/supabase/auth'
 *   const code = req.nextUrl.searchParams.get('code')
 *   if (code) await createServerClient().auth.exchangeCodeForSession(code)
 *   // new operator → '/me/edit' (fill-out); returning → '/me'
 */
export async function GET(req: NextRequest) {
  // Preserve a same-origin ?next hop if present; otherwise land on the profile
  // surface. Reject off-site/relative-escaping values (open-redirect guard).
  const next = req.nextUrl.searchParams.get('next')
  const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/me/edit'
  return NextResponse.redirect(new URL(dest, req.nextUrl.origin))
}
