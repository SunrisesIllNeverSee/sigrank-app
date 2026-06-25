'use client'

/**
 * lib/supabase/auth.ts — BROWSER-side auth client (@supabase/ssr, cookie-based).
 *
 * Client-only on purpose: this module must NEVER import `next/headers` or any
 * server-only code, because client components (LoginButtons) import it. The
 * server-side cookie client lives in `./auth-server` (server-only).
 *
 * Returns null when the public Supabase env is missing, so the login UI degrades
 * to an honest "auth not configured" state and never throws. Both providers from
 * the locked decision are wired: GitHub OAuth (primary) + email magic-link.
 */

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** True when the public Supabase env vars are present. */
export const SUPABASE_AUTH_CONFIGURED = Boolean(url && anonKey)

let cached: SupabaseClient | null = null

/** Memoized cookie-based browser client, or null if unconfigured. */
export function createBrowserClient(): SupabaseClient | null {
  if (!SUPABASE_AUTH_CONFIGURED) return null
  if (cached) return cached
  cached = createSsrBrowserClient(url as string, anonKey as string)
  return cached
}

/** Build the same-origin callback URL, carrying an optional same-origin `next` hop. */
function callbackUrl(next?: string): string {
  const base = `${location.origin}/auth/callback`
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return `${base}?next=${encodeURIComponent(next)}`
  }
  return base
}

/** Start the GitHub OAuth flow (primary provider). Returns an error message on failure. */
export async function signInWithGitHub(next?: string): Promise<{ error?: string }> {
  const sb = createBrowserClient()
  if (!sb) return { error: 'Sign-in is not configured yet.' }
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: callbackUrl(next) },
  })
  return error ? { error: error.message } : {}
}

/** Send an email magic-link (second provider). Returns an error message on failure. */
export async function signInWithEmail(email: string, next?: string): Promise<{ error?: string }> {
  const sb = createBrowserClient()
  if (!sb) return { error: 'Sign-in is not configured yet.' }
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(next) },
  })
  return error ? { error: error.message } : {}
}

/** Sign the current user out (clears the session cookie). */
export async function signOut(): Promise<void> {
  const sb = createBrowserClient()
  if (sb) await sb.auth.signOut()
}
