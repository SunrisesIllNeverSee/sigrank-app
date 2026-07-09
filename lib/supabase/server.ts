import "server-only";

/**
 * lib/supabase/server.ts — server-side Supabase client.
 *
 * `'server-only'` guards against accidental client import. Prefers the service
 * role key when present (full-access reads for the scoring/data layer), falling
 * back to the anon key. Returns null when no usable creds exist, so the data
 * facade can transparently fall back to mock data.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serviceKeyOrNull } from "./service-config.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** The key the server client will use: service role if present, else anon. */
const activeKey = serviceKey || anonKey;

/** True when the server has a URL and at least one usable key. */
export const SUPABASE_CONFIGURED = Boolean(url && activeKey);

let cached: SupabaseClient | null = null;

/**
 * getSupabaseServer — memoized server client, or null if unconfigured.
 * Never throws on missing creds; callers fall back to mock data.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (!SUPABASE_CONFIGURED) return null;
  if (cached) return cached;
  cached = createClient(url as string, activeKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** True when a real SERVICE-ROLE key is present (privileged writes are possible). */
export const SUPABASE_SERVICE_CONFIGURED =
  serviceKeyOrNull(url, serviceKey) !== null;

let cachedService: SupabaseClient | null = null;

/**
 * getSupabaseService — the SERVICE-ROLE-ONLY client for privileged WRITES
 * (device enrollment, snapshot persistence, materialization). D7 §4.3 / §6.2.
 *
 * Unlike getSupabaseServer(), it NEVER falls back to the anon key. An anon-key
 * write to an RLS-protected table (metric_snapshots / snapshot_submissions /
 * devices / device_enroll_codes) is silently rejected by RLS while the request
 * still returns 2xx — a phantom write that makes the acceptance demo "pass" on a
 * row that never landed. The Vercel CLI has previously BLANKED this key (see the
 * project memory), so this guard returns null when SUPABASE_SERVICE_ROLE_KEY is
 * unset/blank and write routes MUST 503 on null rather than proceed — making the
 * failure loud instead of silent.
 */
export function getSupabaseService(): SupabaseClient | null {
  const key = serviceKeyOrNull(url, serviceKey);
  if (!key) return null;
  if (cachedService) return cachedService;
  cachedService = createClient(url as string, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedService;
}
