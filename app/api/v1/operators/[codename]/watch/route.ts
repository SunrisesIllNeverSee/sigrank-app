/**
 * /api/v1/operators/{codename}/watch — the board's WATCH pin, server side.
 *
 *   GET  → { watching, count }  — count is the public aggregate; watching
 *          is the CALLER's state (false when signed out). Anonymous reads
 *          are fine: watcher identity is never exposed, only the number.
 *   POST → toggle the caller's watch → { watching, count } — requires a
 *          verified session (SSR anon-key client + getUser); writes run
 *          under that user's JWT so RLS (watcher_user_id = auth.uid())
 *          does the authorization.
 *
 * Counts + codename resolution go through the service-role client —
 * operator_watches grants no SELECT to anon at all, so the aggregate is
 * computed server-side by design (migration 0051).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, getSessionUser } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

/* per-user state — never cache */
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** codename → operators.operator_id, via the public view. null = unknown. */
async function resolveOperatorId(codename: string): Promise<string | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;
  const { data } = await sb
    .from("operators_public")
    .select("operator_id")
    .eq("codename", codename)
    .maybeSingle();
  return (data?.operator_id as string | undefined) ?? null;
}

async function watchCount(operatorId: string): Promise<number> {
  const sb = getSupabaseServer();
  if (!sb) return 0;
  const { count } = await sb
    .from("operator_watches")
    .select("operator_id", { count: "exact", head: true })
    .eq("operator_id", operatorId);
  return count ?? 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const { codename } = await params;
  const operatorId = await resolveOperatorId(codename);
  if (!operatorId) return json({ status: "not_found", detail: `No operator "${codename}".` }, 404);

  const count = await watchCount(operatorId);

  /* watching = the caller's own mark — only when signed in, looked up
     under their JWT so RLS scopes to their rows. */
  const user = await getSessionUser();
  let watching = false;
  if (user) {
    const sb = await createServerClient();
    const { data } = await sb!
      .from("operator_watches")
      .select("operator_id")
      .eq("operator_id", operatorId)
      .maybeSingle();
    watching = !!data;
  }
  return json({ watching, count });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const { codename } = await params;
  const user = await getSessionUser();
  if (!user) return json({ status: "unauthorized", detail: "Sign in to watch an operator." }, 401);

  const operatorId = await resolveOperatorId(codename);
  if (!operatorId) return json({ status: "not_found", detail: `No operator "${codename}".` }, 404);

  /* writes go through the session-scoped client — auth.uid() = user.id,
     RLS enforces watcher_user_id = caller. */
  const sb = await createServerClient();
  if (!sb) return json({ status: "unavailable", detail: "Auth is not configured." }, 503);

  const { data: existing } = await sb
    .from("operator_watches")
    .select("operator_id")
    .eq("operator_id", operatorId)
    .maybeSingle();

  const { error } = existing
    ? await sb
        .from("operator_watches")
        .delete()
        .eq("operator_id", operatorId)
    : await sb
        .from("operator_watches")
        .insert({ watcher_user_id: user.id, operator_id: operatorId });

  if (error) return json({ status: "error", detail: error.message }, 500);

  const count = await watchCount(operatorId);
  return json({ watching: !existing, count });
}
