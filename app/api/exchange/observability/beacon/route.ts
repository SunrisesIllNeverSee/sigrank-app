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
 * Rate limiting: beacons are throttled per-IP to prevent abuse. The
 * existing mutation rate limiter is not applicable here (this is a
 * telemetry write, not a business mutation), so we use a simple
 * in-memory check. Distributed enforcement is not critical for
 * telemetry — duplicate beacons are deduplicated by request_id.
 */

import { NextResponse, type NextRequest } from "next/server";
import { recordMcpCall, hashIp, type McpResult } from "@/lib/exchange/mcp-observability";

export const dynamic = "force-dynamic";

// Simple in-memory rate limit for beacons (per IP, per minute).
// Telemetry-only — not a security boundary. The observability table
// enforces its own constraints.
const beaconWindow = new Map<string, { count: number; resetAt: number }>();
const BEACON_MAX = 60; // 60 beacons/min per IP — generous for agent use
const BEACON_WINDOW_MS = 60_000;

function beaconRateLimited(ipHash: string | undefined): boolean {
  if (!ipHash) return false;
  const now = Date.now();
  const entry = beaconWindow.get(ipHash);
  if (!entry || now > entry.resetAt) {
    beaconWindow.set(ipHash, { count: 1, resetAt: now + BEACON_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > BEACON_MAX;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const toolName = typeof body.tool_name === "string" ? body.tool_name : undefined;
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

  const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim());

  // Rate limit beacons (telemetry-only throttle)
  if (beaconRateLimited(ipHash)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // Record to durable observability table
  // server_id is inferred from the tool name prefix
  const serverId = toolName.startsWith("exchange_") ? "contribution-exchange" : "sigrank";
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  await recordMcpCall({
    request_id: requestId,
    server_id: serverId as "sigrank" | "contribution-exchange",
    transport: "webmcp",
    operation: "tools_call",
    tool_name: toolName,
    target_domain: typeof body.target_domain === "string" ? body.target_domain : undefined,
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
