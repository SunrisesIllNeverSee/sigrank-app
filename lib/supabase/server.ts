import 'server-only'

/**
 * lib/supabase/server.ts — server-side Supabase client.
 *
 * `'server-only'` guards against accidental client import. Prefers the service
 * role key when present (full-access reads for the scoring/data layer), falling
 * back to the anon key. Returns null when no usable creds exist, so the data
 * facade can transparently fall back to mock data.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** The key the server client will use: service role if present, else anon. */
const activeKey = serviceKey || anonKey

/** True when the server has a URL and at least one usable key. */
export const SUPABASE_CONFIGURED = Boolean(url && activeKey)

let cached: SupabaseClient | null = null

/**
 * getSupabaseServer — memoized server client, or null if unconfigured.
 * Never throws on missing creds; callers fall back to mock data.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null
  if (cached) return cached
  cached = createClient(url as string, activeKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
