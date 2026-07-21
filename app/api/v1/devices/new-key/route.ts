import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import {
  enrollRateLimit,
  rateLimitedResponse,
  getClientIp,
} from "@/lib/infra/api-gate";
import { generateConnectCode } from "@/lib/identity/connect-code";

/**
 * POST /api/v1/devices/new-key — FIX O: 2FA-style re-key (2026-06-26).
 *
 * Cookie-session auth'd (the session IS the identity proof — no code/revoke
 * dance needed). In ONE call:
 *   1. Revokes ALL prior trusted devices for this operator (auto-retire old keys).
 *   2. Clears any live connect codes (housekeeping).
 *   3. Mints a fresh single-use connect code.
 *   4. Returns the code ONCE (2FA-secret style — copy + paste into the agent).
 *
 * The key IS the code. The agent pastes it → generates a fresh device_id +
 * ed25519 key pair locally → enroll_device binds the new device → trusted.
 * The old device(s) are already revoked by step 1, so there's no
 * `device_already_enrolled` wall (NEW device_id = clean fresh-enroll path).
 *
 * This kills the revoke cycle: lose your key → click New key → paste → back on.
 * No Revoke button, no "enroll" framing, no "connect code" vocabulary on this path.
 */
export const dynamic = "force-dynamic";

const CODE_TTL_MS = 10 * 60_000; // 10 minutes

export async function POST(req: NextRequest) {
  const rl = enrollRateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const op = await getSessionOperator();
  if (!op)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json(
      { error: "Enrollment is not configured." },
      { status: 503 },
    );

  // 1. Auto-revoke ALL prior trusted devices for this operator (the old key dies).
  const { error: revokeErr } = await svc
    .from("devices")
    .update({ trust_status: "revoked" })
    .eq("operator_id", op.operatorId)
    .eq("trust_status", "trusted");
  if (revokeErr) {
    return NextResponse.json({ error: revokeErr.message }, { status: 500 });
  }

  // 2. Clear any live or expired unconsumed codes (housekeeping — one code at a time).
  await svc
    .from("device_enroll_codes")
    .delete()
    .eq("operator_id", op.operatorId)
    .is("consumed_at", null);

  // 3. Mint a fresh connect code (retry on PK collision — vanishingly rare at ~75-bit).
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const createdIp = getClientIp(req);
  let code: string | null = null;
  for (let attempt = 0; attempt < 4 && !code; attempt++) {
    const candidate = generateConnectCode();
    const { error } = await svc.from("device_enroll_codes").insert({
      code: candidate,
      operator_id: op.operatorId,
      expires_at: expiresAt,
      created_ip: createdIp,
    });
    if (!error) code = candidate;
    else if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  if (!code) {
    return NextResponse.json(
      { error: "Could not allocate a code, please retry." },
      { status: 503 },
    );
  }

  // 4. Return the code ONCE — the caller shows it 2FA-secret style (copy + paste).
  return NextResponse.json(
    {
      code,
      expires_at: expiresAt,
      expires_in_seconds: Math.round(CODE_TTL_MS / 1000),
      // Inform the caller how many prior devices were retired (for the UI message).
      revoked_prior: true,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
