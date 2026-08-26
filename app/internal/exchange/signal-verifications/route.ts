import { NextRequest, NextResponse } from "next/server";
import { recordVerification } from "@/lib/exchange/signal-server";
import { authenticateCompany } from "@/lib/exchange/server";

/**
 * POST /internal/exchange/signal-verifications — internal verification route (§10.3).
 *
 * This route is NOT exposed as an unauthenticated agent-callable authority endpoint.
 * It is only callable by the Steward (authenticated publishing domain) or
 * internal verifier workers.
 *
 * A verification result is authoritative for the signal attempt ONLY.
 * It can NEVER advance exchange state.
 */
export async function POST(req: NextRequest) {
  const domain = req.headers.get("x-exchange-domain");
  const key = req.headers.get("x-exchange-company-key");
  if (!domain || !key) {
    return NextResponse.json({ error: "Missing authentication headers" }, { status: 401 });
  }

  const authorized = await authenticateCompany(domain, key);
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized — Steward credentials required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  // Validate verification status before hitting the DB (Minor 3).
  // Invalid values would hit the DB CHECK constraint and return 500
  // instead of a clear 400.
  const allowedStatuses = ["passed", "failed", "inconclusive", "verifier_error"];
  if (!allowedStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid verification status. Must be one of: ${allowedStatuses.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const result = await recordVerification({
      attemptId: body.attempt_id,
      signalRevisionHash: body.signal_revision_hash,
      verifierId: body.verifier?.verifier_id ?? "unknown",
      verifierVersion: body.verifier?.version ?? "0.0.0",
      verifierDigest: body.verifier?.digest ?? "",
      status: body.status,
      resultJson: body.result ?? {},
      resultDigest: body.result_digest ?? "",
      environmentDigest: body.environment_digest ?? "",
      issuerKeyId: `${domain}#exchange-${new Date().getFullYear()}`,
      issuerSignature: body.signature ?? "",
      startedAt: body.execution?.started_at ?? new Date().toISOString(),
      completedAt: body.execution?.completed_at ?? new Date().toISOString(),
    });

    return NextResponse.json(
      {
        verification_id: result.verification_id,
        status: result.status,
        authoritative_for_signal: true,
        authoritative_for_exchange_state: false,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record verification" },
      { status: 500 },
    );
  }
}
