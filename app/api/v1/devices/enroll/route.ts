import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { enrollRateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";
import { normalizeConnectCode } from "@/lib/identity/connect-code";
import { isValidAgentPublicKey } from "@/lib/ingest/signature";
import { captureServer } from "@/lib/infra/posthog/server";

/**
 * POST /api/v1/devices/enroll — redeem a connect code + bind a device (D7 §4.3).
 *
 * NO session required — the code IS the bearer. The atomic redeem+bind+consume runs
 * in the enroll_device RPC (0014, SELECT ... FOR UPDATE serializes concurrent
 * redeems). operator_id is taken FROM THE CODE ROW only, never from the body.
 * The error message never distinguishes expired/consumed/unknown (no oracle).
 */
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const rl = enrollRateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { reason: "bad_request", detail: "Invalid JSON." },
      { status: 400 },
    );
  }

  const code =
    typeof body.code === "string" ? normalizeConnectCode(body.code) : "";
  const deviceId = typeof body.device_id === "string" ? body.device_id : "";
  const publicKey = typeof body.public_key === "string" ? body.public_key : "";
  const deviceLabel =
    typeof body.device_label === "string"
      ? body.device_label.trim().slice(0, 120)
      : null;
  const agentVersion =
    typeof body.agent_version === "string"
      ? body.agent_version.trim().slice(0, 60)
      : null;
  const consentAcknowledged = body.consent_acknowledged === true;
  const termsVersion =
    typeof body.terms_version === "string"
      ? body.terms_version.trim().slice(0, 40)
      : null;
  const privacyVersion =
    typeof body.privacy_version === "string"
      ? body.privacy_version.trim().slice(0, 40)
      : null;

  if (
    !code ||
    !UUID_RE.test(deviceId) ||
    !publicKey ||
    !isValidAgentPublicKey(publicKey)
  ) {
    return NextResponse.json(
      {
        reason: "bad_request",
        detail:
          "code, device_id (uuid), and a valid ed25519 public_key are required.",
      },
      { status: 400 },
    );
  }

  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json(
      { reason: "persistence_unavailable" },
      { status: 503 },
    );

  const { data, error } = await svc.rpc("enroll_device", {
    p_code: code,
    p_device_id: deviceId,
    p_public_key: publicKey,
    p_device_label: deviceLabel,
    p_agent_version: agentVersion,
  });

  // Record consent on successful enrollment (D1: consent tracking).
  if (!error) {
    const row = Array.isArray(data)
      ? (data[0] as { status?: string; operator_id?: string } | undefined)
      : null;
    if (row?.status === "enrolled" && row?.operator_id) {
      await svc
        .from("operators")
        .update({
          consented_at: new Date().toISOString(),
          terms_version: termsVersion,
          privacy_version: privacyVersion,
          data_opt_out: false,
          data_opt_out_at: null,
        })
        .eq("operator_id", row.operator_id);
    }
  }
  if (error) {
    return NextResponse.json(
      { reason: "enroll_failed", detail: error.message },
      { status: 500 },
    );
  }

  const row = Array.isArray(data)
    ? (data[0] as
        | {
            status: string;
            operator_id: string | null;
            codename: string | null;
          }
        | undefined)
    : null;
  switch (row?.status) {
    case "enrolled":
      // operator_enrolled — activation captured server-side at the API boundary (the
      // signed enroll request already arrives here; the CLI never phones home).
      await captureServer(
        row.codename ?? row.operator_id ?? "",
        "operator_enrolled",
        {
          agent_version: agentVersion ?? undefined,
        },
      );
      return NextResponse.json(
        {
          status: "enrolled",
          device_id: deviceId,
          operator_id: row.operator_id,
          codename: row.codename,
          trust_status: "trusted",
        },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    case "code_invalid":
      return NextResponse.json({ reason: "code_invalid" }, { status: 410 });
    case "device_already_enrolled":
      return NextResponse.json(
        { reason: "device_already_enrolled" },
        { status: 409 },
      );
    default:
      return NextResponse.json({ reason: "enroll_failed" }, { status: 500 });
  }
}
