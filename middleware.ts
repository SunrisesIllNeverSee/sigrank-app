import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Root middleware — refreshes the Supabase auth session cookie.
 *
 * CRITICAL (AUTH_PROFILE_ROADMAP §2): the matcher is scoped to `/me` + `/settings`
 * ONLY. The public board, API, wiki, and every other route are NEVER processed here,
 * so anonymous board reads stay completely untouched. Do NOT widen the matcher to
 * board/api routes.
 *
 * This only REFRESHES the session (the standard @supabase/ssr pattern); it does not
 * gate/redirect. Server-side gating (redirect unauthenticated users) lives in the
 * `/me` + `/settings` pages via getSessionOperator() (getUser-verified).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // No creds → nothing to refresh; let the request through unchanged.
  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // getUser() validates + refreshes the session. Nothing must run between client
  // creation and this call (@supabase/ssr requirement).
  await supabase.auth.getUser()

  return response
}

export const config = {
  // SCOPED: only the authenticated surfaces. Board/API/public routes stay anon.
  matcher: ['/me/:path*', '/settings/:path*'],
}
