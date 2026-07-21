import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { captureServer } from "@/lib/infra/posthog/server";

/**
 * POST /api/v1/account/delete-data — clear all telemetry and sever devices
 * while keeping the account (D1 decision 2026-07-21).
 *
 * Cookie-session auth'd; operates ONLY on the session operator. Body { confirm }
 * must equal the operator's current codename (re-checked server-side).
 * The clear_operator_data RPC hard-deletes submissions, metrics, devices, etc.
 * and sets data_opt_out = TRUE so future submissions are rejected.
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

  const confirm = typeof body.confirm === "string" ? body.confirm : "";
  if (confirm !== op.codename) {
    return NextResponse.json(
      { error: "Confirmation does not match." },
      { status: 400 },
    );
  }

  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const { error: rpcErr } = await svc.rpc("clear_operator_data", {
    p_operator_id: op.operatorId,
  });
  if (rpcErr) {
    return NextResponse.json(
      { error: rpcErr.message },
      { status: 500 },
    );
  }

  await captureServer(op.codename, "operator_data_cleared", {
    operator_id: op.operatorId,
  });

  return NextResponse.json({ ok: true });
}
