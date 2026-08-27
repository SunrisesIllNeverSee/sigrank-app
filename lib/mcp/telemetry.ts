/**
 * lib/mcp/telemetry.ts — Telemetry wrapper for MCP tool calls.
 *
 * Extracted from app/api/mcp/route.ts as Phase 2 of the MCP structural
 * renovation. Provides a recordToolCall wrapper that pre-fills standard
 * fields (server_id, transport) so the route handler doesn't repeat them.
 *
 * After the SDK v2 migration, tools/call is dispatched inside the SDK handler
 * rather than in the route. The route stamps per-request observability context
 * onto the forwarded request via headers (x-mcp-start-time, x-request-id), and
 * the server factory extracts that context so the tool handler can record the
 * ACTUAL result (error vs success) and ACTUAL duration (including tool
 * execution) — preserving the pre-migration observability semantics required
 * by spec Section 24.
 */

import type { NextRequest } from "next/server";
import { recordMcpCall, hashIp } from "@/lib/exchange/mcp-observability";

/**
 * Record a SigRank MCP tool call with standard fields pre-filled.
 * The caller provides the operation-specific fields; server_id and transport
 * are always "sigrank" and "remote_mcp" respectively.
 */
export async function recordToolCall(
  fields: Omit<Parameters<typeof recordMcpCall>[0], "server_id" | "transport">,
): Promise<void> {
  await recordMcpCall({
    server_id: "sigrank",
    transport: "remote_mcp",
    ...fields,
  });
}

/**
 * Per-request observability context extracted from the incoming request.
 * The route stamps x-mcp-start-time (and a generated x-request-id when the
 * client didn't supply one) onto the request forwarded to the SDK handler so
 * the tool handler can record accurate duration and correlation id.
 */
export interface ToolCallObservability {
  request_id: string;
  ip_hash: string | undefined;
  client_name: string | undefined;
  client_version: string | undefined;
  start_time: number;
}

/**
 * Extract observability context from a request. Used by the server factory
 * (called per-request by createMcpHandler) to pass context into tool handlers.
 */
export function observabilityFromRequest(req: NextRequest): ToolCallObservability {
  const startTimeHeader = req.headers.get("x-mcp-start-time");
  return {
    request_id: req.headers.get("x-request-id") ?? crypto.randomUUID(),
    ip_hash: hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()),
    client_name: req.headers.get("mcp-client-name") ?? undefined,
    client_version: req.headers.get("mcp-client-version") ?? undefined,
    start_time: startTimeHeader ? Number(startTimeHeader) : Date.now(),
  };
}

/**
 * Record a tools/call result with the ACTUAL success/failure and ACTUAL
 * duration (measured from the request start time through tool execution).
 * Called from the tool handler in lib/mcp/server.ts after callTool returns.
 */
export async function recordToolCallResult(
  obs: ToolCallObservability,
  toolName: string,
  result: unknown,
): Promise<void> {
  const isError =
    result && typeof result === "object" && "isError" in result
      ? (result as { isError: boolean }).isError
      : false;
  await recordToolCall({
    request_id: obs.request_id,
    operation: "tools_call",
    tool_name: toolName,
    auth_tier: "anonymous",
    result: isError ? "error" : "success",
    duration_ms: Date.now() - obs.start_time,
    ip_hash: obs.ip_hash,
    client_name: obs.client_name,
    client_version: obs.client_version,
  });
}
