/**
 * app/api/exchange/observability/beacon/route.ts
 *
 * Receives fire-and-forget WebMCP/Site Tool telemetry beacons from the
 * browser. These are sent by the WebMCP registrar's withTelemetry wrapper
 * after each Site Tool execution.
 *
 * The beacon records a row in exchange_mcp_calls with transport: "webmcp"
 * so the owner dashboard can distinguish Site Tool usage from remote MCP
 * usage. This endpoint is unauthenticated by design — it only accepts
 * the tool name, result, duration, and transport. No secrets, no user
 * identifiers beyond a hashed IP (privacy-safe).
 *
 * Rate limiting: beacons are throttled per client via the distributed limiter.
 * Requests with no resolvable client IP share a single "noip" bucket instead
 * of bypassing the limit. Inputs (tool_name, target_domain, x-request-id) are
 * length- and charset-capped.
 */

import { NextResponse, type NextRequest } from "next/server";
import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";
import { recordMcpCall, hashIp, type McpResult } from "@/lib/exchange/mcp-observability";

export const dynamic = "force-dynamic";

const BEACON_MAX = 60; // 60 beacons/min per client — generous for agent use
const BEACON_WINDOW_MS = 60_000;

const MAX_TOOL_NAME = 128;
const MAX_TARGET_DOMAIN = 253;
const MAX_REQUEST_ID = 128;
const TOOL_NAME_RE = /^[A-Za-z0-9_.:-]+$/;
const DOMAIN_RE = /^[A-Za-z0-9.-]+$/;
const REQUEST_ID_RE = /^[A-Za-z0-9_.:-]+$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const rawTool = typeof body.tool_name === "string" ? body.tool_name : undefined;
  if (rawTool !== undefined && (rawTool.length > MAX_TOOL_NAME || (rawTool.length > 0 && !TOOL_NAME_RE.test(rawTool)))) {
    return NextResponse.json({ ok: false, error: "invalid_tool_name" }, { status: 400 });
  }
  const toolName = rawTool;
  const rawDomain = typeof body.target_domain === "string" ? body.target_domain : undefined;
  if (rawDomain !== undefined && (rawDomain.length > MAX_TARGET_DOMAIN || !DOMAIN_RE.test(rawDomain))) {
    return NextResponse.json({ ok: false, error: "invalid_target_domain" }, { status: 400 });
  }
  const result = typeof body.result === "string" ? body.result : "success";
  const durationMs = typeof body.duration_ms === "number" ? body.duration_ms : undefined;
  const transport = typeof body.transport === "string" ? body.transport : "webmcp";

  // Only accept "webmcp" transport from beacons — prevent spoofing
  if (transport !== "webmcp") {
    return NextResponse.json({ ok: false, error: "invalid_transport" }, { status: 400 });
  }

  // Require a tool_name — don't record empty beacons
  if (!toolName) {
    return NextResponse.json({ ok: false, error: "missing_tool_name" }, { status: 400 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || undefined;
  const ipHash = hashIp(clientIp);

  // Distributed rate limit. No client IP → shared "noip" bucket (never skipped).
  const rl = await checkDistributedRateLimit(
    ["exchange-beacon", ipHash ?? "noip"],
    { windowMs: BEACON_WINDOW_MS, max: BEACON_MAX },
    false, // telemetry: fall back to per-instance memory rather than dropping on store outage
  );
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  // Record to durable observability table
  // server_id is inferred from the tool name prefix
  const serverId = toolName.startsWith("exchange_") ? "contribution-exchange" : "sigrank";
  const headerRequestId = req.headers.get("x-request-id");
  const requestId = headerRequestId && headerRequestId.length <= MAX_REQUEST_ID && REQUEST_ID_RE.test(headerRequestId)
    ? headerRequestId
    : crypto.randomUUID();

  await recordMcpCall({
    request_id: requestId,
    server_id: serverId as "sigrank" | "contribution-exchange",
    transport: "webmcp",
    operation: "tools_call",
    tool_name: toolName,
    target_domain: rawDomain,
    result: (["success", "error", "denied", "rate_limited", "invalid_request"].includes(result)
      ? result
      : "success") as McpResult,
    duration_ms: durationMs,
    ip_hash: ipHash,
    client_name: req.headers.get("mcp-client-name") ?? undefined,
    client_version: req.headers.get("mcp-client-version") ?? undefined,
    metadata: { source: "webmcp_beacon" },
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
