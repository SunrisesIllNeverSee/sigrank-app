import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { captureServer } from "@/lib/infra/posthog/server";

/**
 * POST /api/v1/account/data-opt-out — pause or resume telemetry collection.
 *
 * Cookie-session auth'd; operates ONLY on the session operator.
 * Body: { opt_out: boolean }
 * Sets operators.data_opt_out and data_opt_out_at.
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

  const optOut = body.opt_out === true;
  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const { error } = await svc
    .from("operators")
    .update({
      data_opt_out: optOut,
      data_opt_out_at: optOut ? new Date().toISOString() : null,
    })
    .eq("operator_id", op.operatorId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  await captureServer(op.codename, "operator_data_opt_toggled", {
    opt_out: optOut,
  });

  return NextResponse.json({ ok: true, opt_out: optOut });
}
