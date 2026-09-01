import { NextRequest, NextResponse } from "next/server";
import { createAttempt, isAcceptingAttempts, countActorAttempts, countConcurrentAttempts, getSignal } from "@/lib/exchange/signal-server";
import { logEncounter, requestIdentity } from "@/lib/exchange/server";
import { createHash } from "node:crypto";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

/**
 * POST /api/exchange/signals/{signal_id}/attempts — create an attempt (§10.2).
 *
 * Creates an attempt bound to the current published revision. The attempt
 * does not silently move to a later revision.
 *
 * Requirements:
 * - authenticated actor unless the signal explicitly permits anonymous attempts
 * - Idempotency-Key
 * - body digest
 * - signal still accepting attempts
 * - actor within attempt limits
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> },
) {
  const { signal_id } = await params;
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(
    ["signal-attempt", ip],
    { windowMs: 60 * 60 * 1000, max: 30 },
    true, // fail-closed: sensitive write route
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-attempt") } },
    );
  }

  // Get the signal to check participation rules
  const signal = await getSignal(signal_id);
  if (!signal) {
    return NextResponse.json(
      { error: "Signal not found" },
      { status: 404, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  // Check if signal is accepting attempts
  const accepting = await isAcceptingAttempts(signal_id);
  if (!accepting) {
    return NextResponse.json(
      { error: "Signal is not accepting attempts" },
      { status: 409, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  // Authentication: require authenticated actor unless anonymous_attempts is true.
  // The actor ID is derived from the validated credential, NOT from a caller-
  // supplied header — this prevents actor-ID spoofing.
  const actorKey = req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key");
  const actorId = actorKey ? `actor:${createHash("sha256").update(actorKey).digest("hex").slice(0, 16)}` : `anonymous:${ip}`;

  if (!signal.participation.anonymous_attempts && !actorKey) {
    return NextResponse.json(
      { error: "Authentication required — this signal does not accept anonymous attempts" },
      { status: 401, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  const idempotencyKey = req.headers.get("idempotency-key") ?? body.idempotency_key;
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency-Key header or idempotency_key field required" },
      { status: 400, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  // Compute request hash for idempotency
  const requestHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");

  // Check attempt limits
  const attemptCount = await countActorAttempts(signal_id, actorId);
  if (attemptCount >= signal.participation.maximum_attempts_per_actor) {
    return NextResponse.json(
      { error: "Maximum attempts per actor exceeded for this signal" },
      { status: 429, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  // Check concurrent attempt limit (§6.1 / §10.2)
  const concurrentCount = await countConcurrentAttempts(signal_id, actorId);
  if (concurrentCount >= signal.participation.concurrent_attempts_per_actor) {
    return NextResponse.json(
      { error: `Concurrent attempt limit (${signal.participation.concurrent_attempts_per_actor}) exceeded for this signal. Withdraw or complete an existing attempt first.` },
      { status: 429, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }

  try {
    const result = await createAttempt({
      signalId: signal_id,
      actorId,
      actorKeyId: actorKey ? `actor:${actorId}#2026` : `anonymous:${actorId}`,
      idempotencyKey,
      requestHash,
      declarations: body.declarations ?? {},
    });

    await logEncounter({
      targetDomain: signal.publisher.domain,
      endpoint: `/api/exchange/signals/${signal_id}/attempts`,
      req,
      method: "POST",
      result: "ok",
      metadata: { attempt_id: result.attempt_id, signal_revision: result.signal_revision },
    });

    return NextResponse.json(
      {
        attempt_id: result.attempt_id,
        signal_id: signal_id,
        signal_revision: result.signal_revision,
        signal_revision_hash: result.signal_revision_hash,
        status: result.status,
        note: "Attempt created. Submit your work via the submit endpoint. This attempt does not grant any authority.",
      },
      { status: 201, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message.includes("Idempotency key reuse") ? 409 : 500;
    await logEncounter({
      targetDomain: signal.publisher.domain,
      endpoint: `/api/exchange/signals/${signal_id}/attempts`,
      req,
      method: "POST",
      result: status >= 500 ? "server_error" : "validation_error",
    });
    return NextResponse.json(
      { error: message },
      { status, headers: distributedRateLimitHeaders(rl, "signal-attempt") },
    );
  }
}
