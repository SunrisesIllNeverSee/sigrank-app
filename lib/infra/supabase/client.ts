"use client";

/**
 * lib/supabase/client.ts — browser-side Supabase client.
 *
 * Returns null when the public env vars are missing, so the app builds and
 * renders with no creds present. Browser code that needs Supabase must
 * null-check the return value and fall back to mock data via the lib/data
 * facade (server-side) rather than calling Supabase directly here.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both public Supabase env vars are present. */
export const SUPABASE_CONFIGURED = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

/**
 * getSupabaseBrowser — memoized browser client, or null if unconfigured.
 * Safe to call during render; never throws on missing creds.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  if (cached) return cached;
  cached = createClient(url as string, anonKey as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}
