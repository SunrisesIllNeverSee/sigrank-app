import { NextRequest, NextResponse } from "next/server";
import { withdrawAttempt } from "@/lib/exchange/signal-server";
import { requestIdentity } from "@/lib/exchange/server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string; attempt_id: string }> },
) {
  const { signal_id, attempt_id } = await params;
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(["signal-attempt", ip], { windowMs: 60 * 60 * 1000, max: 30 }, true);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-attempt") } });

  const actorId = req.headers.get("x-exchange-actor-id") ?? `anonymous:${ip}`;
  try {
    const result = await withdrawAttempt({ signalId: signal_id, attemptId: attempt_id, actorId });
    return NextResponse.json({ attempt_id: result.attempt_id, status: result.status }, { headers: distributedRateLimitHeaders(rl, "signal-attempt") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message.includes("not found") ? 404 : message.includes("authorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status, headers: distributedRateLimitHeaders(rl, "signal-attempt") });
  }
}
