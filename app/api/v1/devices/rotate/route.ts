import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { isValidAgentPublicKey } from "@/lib/ingest/signature";
import { captureServer } from "@/lib/infra/posthog/server";

/**
 * POST /api/v1/devices/rotate — re-enroll a new device key after revocation (D7 §4.6 follow-up).
 *
 * Cookie-session auth'd. The operator's old device is marked trust_status='revoked'
 * (audit trail intact), and a NEW device row is inserted with trust_status='trusted'
 * bound to the same operator_id. The operator must re-run `sigrank init` with the new
 * key on their agent.
 *
 * This closes the gap noted in revoke/route.ts:12 ("Key rotation / re-enroll is deferred
 * (§9); revoke is the only kill-switch this slice"). Now revoke + rotate together form
 * a complete key-lifecycle: revoke kills the old key, rotate births the new one.
 *
 * Body: { device_id: string (old), new_public_key: string, device_label?: string }
 * The new device_id is generated server-side (uuid v4) so the caller can't predict it.
 */
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const oldDeviceId = typeof body.device_id === "string" ? body.device_id : "";
  const newPublicKey =
    typeof body.new_public_key === "string" ? body.new_public_key : "";
  const deviceLabel =
    typeof body.device_label === "string"
      ? body.device_label.trim().slice(0, 120)
      : null;

  if (!oldDeviceId || !UUID_RE.test(oldDeviceId)) {
    return NextResponse.json(
      { error: "A valid device_id (uuid) for the old device is required." },
      { status: 400 },
    );
  }
  if (!newPublicKey || !isValidAgentPublicKey(newPublicKey)) {
    return NextResponse.json(
      { error: "A valid new_public_key (ed25519) is required." },
      { status: 400 },
    );
  }

  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json({ error: "Not configured." }, { status: 503 });

  // 1. Verify the old device belongs to this operator + revoke it.
  const { data: oldDevice, error: oldError } = await svc
    .from("devices")
    .select("device_id, operator_id, trust_status")
    .eq("device_id", oldDeviceId)
    .eq("operator_id", op.operatorId) // you can only rotate your own device
    .maybeSingle();

  if (oldError)
    return NextResponse.json({ error: oldError.message }, { status: 500 });
  if (!oldDevice) {
    return NextResponse.json(
      { error: "Device not found or not yours." },
      { status: 404 },
    );
  }

  // Revoke the old device (never delete — audit trail).
  const { error: revokeError } = await svc
    .from("devices")
    .update({ trust_status: "revoked" })
    .eq("device_id", oldDeviceId)
    .eq("operator_id", op.operatorId);

  if (revokeError)
    return NextResponse.json({ error: revokeError.message }, { status: 500 });

  // 2. Generate a new device_id (crypto-uuid via crypto.randomUUID).
  const newDeviceId = crypto.randomUUID();

  // 3. Insert the new device row with trust_status='trusted'.
  const { data: newDevice, error: insertError } = await svc
    .from("devices")
    .insert({
      device_id: newDeviceId,
      operator_id: op.operatorId,
      agent_public_key: newPublicKey,
      trust_status: "trusted",
      device_label: deviceLabel,
    })
    .select("device_id, agent_public_key")
    .single();

  if (insertError) {
    // Attempt to restore the old device's trust_status (best-effort rollback).
    await svc
      .from("devices")
      .update({ trust_status: oldDevice.trust_status })
      .eq("device_id", oldDeviceId);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await captureServer(op.codename ?? op.operatorId, "device_rotated", {
    old_device_id: oldDeviceId,
    new_device_id: newDeviceId,
  });

  return NextResponse.json(
    {
      status: "rotated",
      old_device_id: oldDeviceId,
      new_device_id: newDeviceId,
      new_public_key: newDevice.agent_public_key,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
