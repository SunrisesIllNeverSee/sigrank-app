/**
 * lib/mcp/protocol.ts — Shared MCP protocol helpers used by both the SigRank
 * and Contribution Exchange MCP routes.
 *
 * Both routes serve the same MCP protocol version but have distinct server
 * identities, tool catalogs, and instructions. These helpers ensure
 * consistent wire-level behavior without coupling the two products.
 *
 * NOTE: The SigRank /api/mcp route delegates protocol negotiation entirely
 * to createMcpHandler in the SDK (modern 2026-07-28 + legacy 2025-era).
 * SUPPORTED_VERSIONS and negotiateProtocolVersion below are retained for
 * the Contribution Exchange route (/api/exchange/mcp), which is a legacy
 * endpoint with its own protocol handling.
 */

import { allowedOrigin } from "@/lib/mcp/security";
export { allowedOrigin };

export const PROTOCOL_VERSION = "2025-06-18";
// Used by the Exchange route only. The SigRank /api/mcp route does NOT
// apply this ceiling — it delegates to the SDK for era classification.
export const SUPPORTED_VERSIONS = new Set(["2025-06-18", "2025-03-26"]);

export type RpcId = string | number | null;

export type RpcRequest = {
  jsonrpc?: string;
  id?: RpcId;
  method?: string;
  params?: Record<string, unknown>;
};

export function jsonRpc(id: RpcId, result: unknown, status = 200) {
  return Response.json(
    { jsonrpc: "2.0", id, result },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
    },
  );
}

export function rpcError(
  id: RpcId,
  code: number,
  message: string,
  data?: unknown,
  status = 200,
) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data === undefined ? {} : { data }) },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
    },
  );
}

export function textResult(value: unknown, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

export function negotiateProtocolVersion(requested: unknown): string {
  return typeof requested === "string" && SUPPORTED_VERSIONS.has(requested)
    ? requested
    : PROTOCOL_VERSION;
}
