import "server-only";

/**
 * lib/infra/route-rate-limit.ts — thin per-route wrapper over the distributed
 * limiter. Returns a ready 429 NextResponse when the budget is exhausted, or
 * null when the request may proceed.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/infra/api-gate";
import {
  checkDistributedRateLimit,
  distributedRateLimitHeaders,
} from "@/lib/infra/distributed-rate-limit";

export async function enforceRouteLimit(
  req: NextRequest,
  name: string,
  config: { windowMs: number; max: number },
  opts: { failClosed?: boolean; actor?: string } = {},
): Promise<NextResponse | null> {
  const dims = [name, ...(opts.actor ? [opts.actor] : []), getClientIp(req)];
  const rl = await checkDistributedRateLimit(dims, config, opts.failClosed ?? false);
  if (rl.ok) return null;
  return NextResponse.json(
    { error: "rate_limited", detail: "Too many requests. Try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(rl.retryAfter),
        ...distributedRateLimitHeaders(rl, name),
      },
    },
  );
}
