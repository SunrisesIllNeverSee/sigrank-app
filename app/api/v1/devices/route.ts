import { NextResponse } from "next/server";
import { getSessionOperator } from "@/lib/supabase/auth-server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * GET /api/v1/devices — the signed-in operator's enrolled devices (D7 §4.4).
 *
 * Cookie-session auth'd; lists ONLY the caller's own devices (filtered by the
 * session-resolved operator_id — equivalent to the RLS
 * `devices WHERE operator_id = private.auth_operator_id()`). Logged out → empty
 * list (the panel renders its signed-out state). Never exposes agent_public_key.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const op = await getSessionOperator();
  if (!op) return NextResponse.json({ devices: [] });

  const svc = getSupabaseService();
  if (!svc) return NextResponse.json({ devices: [] });

  const { data } = await svc
    .from("devices")
    .select(
      "device_id, device_label, agent_version, last_seen, trust_status, created_at",
    )
    .eq("operator_id", op.operatorId)
    .order("created_at", { ascending: false });

  return NextResponse.json(
    { devices: data ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
