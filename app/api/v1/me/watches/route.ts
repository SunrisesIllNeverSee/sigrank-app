import { NextResponse } from "next/server";
import { createServerClient, getSessionUser } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ status: "unauthorized" }, { status: 401, headers });
  const client = await createServerClient();
  if (!client) return NextResponse.json({ status: "unavailable" }, { status: 503, headers });

  // The session's JWT + operator_watches RLS restrict this to the caller.
  const { data: watches, error } = await client
    .from("operator_watches")
    .select("operator_id,created_at")
    .eq("watcher_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ status: "unavailable" }, { status: 503, headers });
  if (!watches?.length) return NextResponse.json({ watches: [] }, { headers });

  // Resolve only public operator identities; private/retired rows never
  // become disclosed merely because someone previously watched them.
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ status: "unavailable" }, { status: 503, headers });
  const ids = watches.map((w) => w.operator_id);
  const { data: operators, error: lookupError } = await sb
    .from("operators_public")
    .select("operator_id,codename,display_name,profile_visibility")
    .in("operator_id", ids)
    .eq("profile_visibility", "public");
  if (lookupError) return NextResponse.json({ status: "unavailable" }, { status: 503, headers });
  const byId = new Map((operators ?? []).map((o) => [o.operator_id, o]));
  const visible = watches.flatMap((w) => {
    const operator = byId.get(w.operator_id);
    if (!operator?.codename) return [];
    return [{
      codename: operator.codename,
      name: operator.display_name?.trim() || operator.codename,
      watchedAt: w.created_at,
    }];
  });
  return NextResponse.json({ watches: visible }, { headers });
}
