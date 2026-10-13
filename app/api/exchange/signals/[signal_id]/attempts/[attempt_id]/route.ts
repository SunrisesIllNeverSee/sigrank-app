import { NextRequest, NextResponse } from "next/server";
import { getAttempt } from "@/lib/exchange/signal-server";
import { requestIdentity } from "@/lib/exchange/server";
import { resolveValidatedActor } from "@/lib/exchange/mcp-tools";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

/**
 * GET /api/exchange/signals/{signal_id}/attempts/{attempt_id} — get attempt (§10.2).
 * Actors may only read their own private attempts. The actor ID is derived
 * from a credential validated via validateAgentKey (invalid key → 401).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string; attempt_id: string }> },
) {
  const { signal_id, attempt_id } = await params;
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(["signal-attempt-read", ip], { windowMs: 60_000, max: 60 }, false);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-attempt-read") } });

  const actor = await resolveValidatedActor(req, ip);
  if (!actor.ok) return NextResponse.json({ error: actor.error }, { status: actor.status, headers: distributedRateLimitHeaders(rl, "signal-attempt-read") });
  const { actorId } = actor;
  const attempt = await getAttempt(signal_id, attempt_id, actorId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-attempt-read") });
  }

  return NextResponse.json(attempt, { headers: { "Cache-Control": "private, no-store", ...distributedRateLimitHeaders(rl, "signal-attempt-read") } });
}
