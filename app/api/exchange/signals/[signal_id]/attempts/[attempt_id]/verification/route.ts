import { NextRequest, NextResponse } from "next/server";
import { getVerification, getAttempt } from "@/lib/exchange/signal-server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";
import { createHash } from "node:crypto";

/**
 * GET /api/exchange/signals/{signal_id}/attempts/{attempt_id}/verification (§10.3).
 *
 * Agents may request verification status but may NOT assert an authoritative
 * verification result. Verification execution is Steward-controlled.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string; attempt_id: string }> },
) {
  const { signal_id, attempt_id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkDistributedRateLimit(["signal-verification-read", ip], { windowMs: 60_000, max: 60 }, false);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-verification-read") } });

  // Verify the caller owns this attempt. Actor ID is derived from the
  // validated credential, NOT from a caller-supplied header.
  const actorKey = req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key");
  const actorId = actorKey ? `actor:${createHash("sha256").update(actorKey).digest("hex").slice(0, 16)}` : `anonymous:${ip}`;
  const attempt = await getAttempt(signal_id, attempt_id, actorId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-verification-read") });
  }

  const verification = await getVerification(attempt_id);
  if (!verification) {
    return NextResponse.json(
      {
        attempt_id,
        status: "pending",
        note: "Verification has not been performed yet. Verification is Steward-controlled and cannot be self-asserted.",
      },
      { headers: { "Cache-Control": "private, no-store", ...distributedRateLimitHeaders(rl, "signal-verification-read") } },
    );
  }

  return NextResponse.json(
    {
      ...verification,
      authoritative_for_signal: true,
      authoritative_for_exchange_state: false,
    },
    { headers: { "Cache-Control": "private, no-store", ...distributedRateLimitHeaders(rl, "signal-verification-read") } },
  );
}
