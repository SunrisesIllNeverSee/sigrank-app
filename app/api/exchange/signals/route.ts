import { NextRequest, NextResponse } from "next/server";
import { listSignals, type SignalListFilters } from "@/lib/exchange/signal-server";
import { logEncounter, requestIdentity } from "@/lib/exchange/server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

/**
 * GET /api/exchange/signals — public discovery collection (§10.1).
 *
 * Returns published signals with optional filters. The response includes
 * canonical URLs and revision hashes for each signal.
 */
export async function GET(req: NextRequest) {
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(
    ["signal-discovery", ip],
    { windowMs: 60_000, max: 60 },
    false,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited", retry_after: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-discovery") } },
    );
  }

  const url = req.nextUrl;
  const filters: SignalListFilters = {
    domain: url.searchParams.get("domain") ?? undefined,
    type: url.searchParams.get("type") as SignalListFilters["type"] ?? undefined,
    status: url.searchParams.get("status") as SignalListFilters["status"] ?? undefined,
    label: url.searchParams.get("label") ?? undefined,
    verification_mode: url.searchParams.get("verification_mode") ?? undefined,
    consideration_mode: url.searchParams.get("consideration_mode") ?? undefined,
    accepting_attempts: url.searchParams.get("accepting_attempts") === "true",
    published_after: url.searchParams.get("published_after") ?? undefined,
    expires_before: url.searchParams.get("expires_before") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined,
  };

  try {
    const result = await listSignals(filters);
    await logEncounter({
      targetDomain: "",
      endpoint: "/api/exchange/signals",
      req,
      result: "ok",
      metadata: { count: result.signals.length, filters },
    });

    return NextResponse.json(
      {
        signals: result.signals,
        next_cursor: result.next_cursor,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60",
          ...distributedRateLimitHeaders(rl, "signal-discovery"),
        },
      },
    );
  } catch (error) {
    await logEncounter({
      targetDomain: "",
      endpoint: "/api/exchange/signals",
      req,
      result: "server_error",
    });
    return NextResponse.json(
      { error: "Failed to list signals" },
      { status: 500, headers: distributedRateLimitHeaders(rl, "signal-discovery") },
    );
  }
}

/**
 * POST /api/exchange/signals — publisher administration (§10.5).
 * Creates a new signal in draft status. Only the authenticated publishing
 * domain or authorized Steward may create signals.
 */
export async function POST(req: NextRequest) {
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(
    ["signal-admin", ip],
    { windowMs: 60 * 60 * 1000, max: 20 },
    true, // fail-closed: sensitive write route
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited", retry_after: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-admin") } },
    );
  }

  const domain = req.headers.get("x-exchange-domain");
  const key = req.headers.get("x-exchange-company-key");
  if (!domain || !key) {
    return NextResponse.json(
      { error: "Missing authentication headers (x-exchange-domain + x-exchange-company-key required)" },
      { status: 401, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const { authenticateCompany } = await import("@/lib/exchange/server");
  const authorized = await authenticateCompany(domain, key);
  if (!authorized) {
    return NextResponse.json(
      { error: "Not authorized to publish signals for this domain" },
      { status: 403, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const { ExchangeSignalInputSchema } = await import("@/exchange-gateway/src/signal-schema");
  const parsed = ExchangeSignalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid signal", details: parsed.error.flatten() },
      { status: 400, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  const { createSignal } = await import("@/lib/exchange/signal-server");
  try {
    const result = await createSignal({
      publisherDomain: domain,
      stewardDomain: process.env.EXCHANGE_REFERENCE_DOMAIN ?? "signalaf.com",
      signal: parsed.data,
      keyId: `${domain}#exchange-${new Date().getFullYear()}`,
    });
    return NextResponse.json(
      { signal_id: result.signal_id, status: result.status, revision: result.revision },
      { status: 201, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create signal" },
      { status: 500, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }
}
