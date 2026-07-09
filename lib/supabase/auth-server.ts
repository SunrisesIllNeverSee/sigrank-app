import "server-only";

/**
 * lib/supabase/auth-server.ts — SERVER-side auth client (@supabase/ssr, cookie-based).
 *
 * `server-only` + imports `next/headers`, so this is split from the browser module
 * (`./auth`) which client components import. This client carries the user's session
 * via cookies (anon key) — it is NOT the service-role data client (`./server`); the
 * two coexist: `getSupabaseServer()` does privileged data reads, this does auth.
 *
 * Gating ALWAYS uses getUser() (which verifies the JWT with Supabase), never
 * getSession() (which trusts the cookie unverified) — per the security checklist.
 */

import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Cookie-bound server client (route handlers / server components), or null if unconfigured. */
export async function createServerClient(): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return null;
  const cookieStore = await cookies();
  return createSsrServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where the cookie store is read-only.
          // The root middleware refreshes the session cookie instead — safe to ignore.
        }
      },
    },
  });
}

/** The VERIFIED auth user (getUser asks Supabase to validate the JWT), or null. */
export async function getSessionUser(): Promise<User | null> {
  const sb = await createServerClient();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user ?? null;
}

export interface SessionOperator {
  userId: string;
  operatorId: string;
  codename: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** The verified auth email — PRIVATE (P5): shown only to the user (e.g. /settings),
   *  read live from auth.users; never stored in or read from a public operator column. */
  email: string | null;
}

/**
 * Resolve the verified user → their linked operator via `operator_accounts`.
 * Null when not signed in OR signed in but not yet linked (no claim). Uses the
 * service-role client for the lookup (trusted server read; the link is also
 * readable by the user under the operator_accounts self-SELECT RLS policy).
 */
export async function getSessionOperator(): Promise<SessionOperator | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const svc = getSupabaseServer();
  if (!svc) return null;
  const { data } = await svc
    .from("operator_accounts")
    .select(
      "operator_id, operators:operator_id ( codename, display_name, avatar_url )",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const row = data as {
    operator_id: string;
    operators: {
      codename: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  if (!row?.operator_id) return null;
  return {
    userId: user.id,
    operatorId: row.operator_id,
    codename: row.operators?.codename ?? "",
    displayName: row.operators?.display_name ?? null,
    avatarUrl: row.operators?.avatar_url ?? null,
    email: user.email ?? null,
  };
}
