/**
 * lib/mcp/telemetry.ts — Telemetry wrapper for MCP tool calls.
 *
 * Extracted from app/api/mcp/route.ts as Phase 2 of the MCP structural
 * renovation. Provides a recordToolCall wrapper that pre-fills standard
 * fields (server_id, transport) so the route handler doesn't repeat them.
 */

import { recordMcpCall } from "@/lib/exchange/mcp-observability";

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
