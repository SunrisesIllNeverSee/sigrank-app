import { NextRequest, NextResponse } from "next/server";
import { getSignal } from "@/lib/exchange/signal-server";
import { logEncounter } from "@/lib/exchange/server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

/**
 * GET /api/exchange/signals/{signal_id} — public signal detail (§10.1).
 * Returns the current published revision of a signal.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string }> },
) {
  const { signal_id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkDistributedRateLimit(
    ["signal-detail", ip],
    { windowMs: 60_000, max: 60 },
    false,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited", retry_after: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-detail") } },
    );
  }

  try {
    const signal = await getSignal(signal_id);
    if (!signal) {
      await logEncounter({
        targetDomain: "",
        endpoint: `/api/exchange/signals/${signal_id}`,
        req,
        result: "not_found",
      });
      return NextResponse.json(
        { error: "Signal not found" },
        { status: 404, headers: distributedRateLimitHeaders(rl, "signal-detail") },
      );
    }

    await logEncounter({
      targetDomain: signal.publisher.domain,
      endpoint: `/api/exchange/signals/${signal_id}`,
      req,
      result: "ok",
      metadata: { type: signal.type, status: signal.status },
    });

    return NextResponse.json(signal, {
      headers: {
        "Cache-Control": "public, max-age=60",
        ...distributedRateLimitHeaders(rl, "signal-detail"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch signal" },
      { status: 500, headers: distributedRateLimitHeaders(rl, "signal-detail") },
    );
  }
}

/**
 * PATCH /api/exchange/signals/{signal_id} — update signal (creates new revision).
 * Only the authenticated publishing domain or authorized Steward may update.
 */
export async function PATCH(
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

  const { authenticateCompany } = await import("@/lib/exchange/server");
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

  // For draft signals, PATCH publishes (draft → published). For already-
  // published/paused signals, PATCH creates a new immutable revision without
  // changing the status (§3.3). Terminal states (closed/withdrawn/expired)
  // are rejected inside publishSignal/createRevision.
  //
  // We use getSignalMeta (not getSignal) because getSignal returns null for
  // drafts (no revision 0 exists), which would make the draft → published
  // branch unreachable. getSignalMeta reads the raw exchange_signals row.
  const { getSignalMeta } = await import("@/lib/exchange/signal-server");
  const meta = await getSignalMeta(signal_id);
  if (!meta) {
    return NextResponse.json(
      { error: "Signal not found" },
      { status: 404, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }

  try {
    const { publishSignal, createRevision } = await import("@/lib/exchange/signal-server");
    // draft → published uses publishSignal; published/paused → new revision
    // uses createRevision. expired/closed/withdrawn are terminal and will
    // throw inside createRevision (current_revision > 0 but status is terminal)
    // or publishSignal (isValidTransition returns false).
    const usePublish = meta.status === "draft";
    const result = usePublish
      ? await publishSignal({
          signalId: signal_id,
          signal: parsed.data,
          publisherDomain: domain,
          stewardDomain: process.env.EXCHANGE_REFERENCE_DOMAIN ?? "signalaf.com",
          keyId: `${domain}#exchange-${new Date().getFullYear()}`,
        })
      : await createRevision({
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
      },
      { headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update signal";
    const status = message.includes("not found") ? 404 : message.includes("authorized") ? 403 : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: distributedRateLimitHeaders(rl, "signal-admin") },
    );
  }
}
