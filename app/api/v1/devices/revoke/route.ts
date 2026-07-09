import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/supabase/auth-server";
import { getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/v1/devices/revoke — kill-switch for a leaked device key (D7 §4.6).
 *
 * Cookie-session auth'd. Sets trust_status='revoked' (never deletes the row → audit
 * trail intact). The UPDATE is scoped to operator_id = the session operator, so you
 * can only revoke YOUR OWN device. The verify path requires trust_status='trusted',
 * so a revoked device's submissions immediately drop to unverified (stored, unranked).
 * Key rotation / re-enroll is deferred (§9); revoke is the only kill-switch this slice.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const op = await getSessionOperator();
  if (!op)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const deviceId = typeof body.device_id === "string" ? body.device_id : "";
  if (!deviceId)
    return NextResponse.json(
      { error: "device_id is required." },
      { status: 400 },
    );

  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const { data, error } = await svc
    .from("devices")
    .update({ trust_status: "revoked" })
    .eq("device_id", deviceId)
    .eq("operator_id", op.operatorId) // you can only revoke your own device
    .select("device_id");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Device not found." }, { status: 404 });
  }

  return NextResponse.json(
    { status: "revoked", device_id: deviceId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
