import { NextRequest, NextResponse } from "next/server";
import { authenticateCompany } from "@/lib/exchange/server";
import { publishSignal } from "@/lib/exchange/signal-server";
import { ExchangeSignalInputSchema } from "@/exchange-gateway/src/signal-schema";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

/**
 * POST /api/exchange/signals/{signal_id}/publish — publish a signal (§10.5).
 * Creates an immutable revision and makes the signal discoverable.
 * Only the authenticated publishing domain or authorized Steward may publish.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> },
) {
  const { signal_id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkDistributedRateLimit(
    ["signal-admin", ip],
    { windowMs: 60 * 60 * 1000, max: 20 },
    true,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-admin") } },
    );
  }

  const domain = req.headers.get("x-exchange-domain");
  const key = req.headers.get("x-exchange-company-key");
  if (!domain || !key) {
    return NextResponse.json(
      { error: "Missing authentication headers" },
      { status: 401, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const authorized = await authenticateCompany(domain, key);
  if (!authorized) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body — signal content required for publication" },
      { status: 400, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const parsed = ExchangeSignalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid signal content", details: parsed.error.flatten() },
      { status: 400, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  try {
    const result = await publishSignal({
      signalId: signal_id,
      signal: parsed.data,
      publisherDomain: domain,
      stewardDomain: process.env.EXCHANGE_REFERENCE_DOMAIN ?? "signalaf.com",
      keyId: `${domain}#exchange-${new Date().getFullYear()}`,
    });
    return NextResponse.json(
      {
        signal_id: result.signal_id,
        revision: result.revision,
        revision_hash: result.revision_hash,
        canonical_url: result.canonical_url,
        status: "published",
      },
      { status: 201, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish signal" },
      { status: 500, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }
}
