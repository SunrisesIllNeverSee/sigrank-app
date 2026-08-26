import { NextRequest, NextResponse } from "next/server";
import { authenticateCompany } from "@/lib/exchange/server";
import { transitionSignalStatus } from "@/lib/exchange/signal-server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> },
) {
  const { signal_id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkDistributedRateLimit(["signal-admin", ip], { windowMs: 60 * 60 * 1000, max: 20 }, true);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-admin") } });

  const domain = req.headers.get("x-exchange-domain");
  const key = req.headers.get("x-exchange-company-key");
  if (!domain || !key) return NextResponse.json({ error: "Missing authentication headers" }, { status: 401, headers: distributedRateLimitHeaders(rl, "signal-admin") });

  if (!(await authenticateCompany(domain, key))) return NextResponse.json({ error: "Not authorized" }, { status: 403, headers: distributedRateLimitHeaders(rl, "signal-admin") });

  try {
    const result = await transitionSignalStatus({ signalId: signal_id, toStatus: "withdrawn", publisherDomain: domain, keyId: `${domain}#exchange-${new Date().getFullYear()}` });
    return NextResponse.json({ signal_id: result.signal_id, status: result.status }, { headers: distributedRateLimitHeaders(rl, "signal-admin") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message.includes("not found") ? 404 : message.includes("authorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status, headers: distributedRateLimitHeaders(rl, "signal-admin") });
  }
}
