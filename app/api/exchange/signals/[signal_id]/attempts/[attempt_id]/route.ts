import { NextRequest, NextResponse } from "next/server";
import { getAttempt } from "@/lib/exchange/signal-server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";
import { createHash } from "node:crypto";

/**
 * GET /api/exchange/signals/{signal_id}/attempts/{attempt_id} — get attempt (§10.2).
 * Actors may only read their own private attempts. The actor ID is derived
 * from the validated credential, NOT from a caller-supplied header.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string; attempt_id: string }> },
) {
  const { signal_id, attempt_id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkDistributedRateLimit(["signal-attempt-read", ip], { windowMs: 60_000, max: 60 }, false);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-attempt-read") } });

  const actorKey = req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key");
  const actorId = actorKey ? `actor:${createHash("sha256").update(actorKey).digest("hex").slice(0, 16)}` : `anonymous:${ip}`;
  const attempt = await getAttempt(signal_id, attempt_id, actorId);
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-attempt-read") });
  }

  return NextResponse.json(attempt, { headers: { "Cache-Control": "private, no-store", ...distributedRateLimitHeaders(rl, "signal-attempt-read") } });
}
