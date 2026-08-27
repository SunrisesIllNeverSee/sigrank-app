/**
 * app/api/mcp/route.ts — SignalAF MCP Streamable HTTP endpoint.
 *
 * Uses the official MCP SDK v2 (createMcpHandler) for protocol negotiation,
 * capability declaration, and Streamable HTTP transport. The SDK handles
 * initialize, ping, tools/list, tools/call, resources/list, resources/read,
 * prompts/list, prompts/get, and JSON-RPC error framing.
 *
 * Transport-level concerns retained in this route:
 *   - Origin validation (allowedOrigin)
 *   - Exchange compatibility bridge (legacy tool dispatch + deprecation metadata)
 *   - Observability (recordMcpCall for initialize/tools_list + Exchange bridge;
 *     SigRank tools/call observability is recorded in lib/mcp/server.ts after
 *     callTool returns, with the actual result and duration)
 *   - Protocol version header validation
 *
 * Domain logic lives in:
 *   - lib/mcp/server.ts (McpServer factory + tool/resource/prompt registration)
 *   - lib/mcp/tools/index.ts (15 tool definitions + callTool dispatcher)
 *   - lib/mcp/resources/index.ts (6 resource definitions + readResource)
 *   - lib/mcp/prompts/index.ts (5 prompt definitions + getPrompt)
 */

import type { NextRequest } from "next/server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import {
  PROTOCOL_VERSION,
  SUPPORTED_VERSIONS,
  jsonRpc,
  rpcError,
  allowedOrigin,
  type RpcRequest,
} from "@/lib/mcp/protocol";
import { createSigrankServer } from "@/lib/mcp/server";
// Compatibility bridge: legacy Exchange tool calls through /api/mcp are
// dispatched to the shared Exchange dispatcher. Exchange tools are NOT
// advertised in tools/list — callers should migrate to /api/exchange/mcp.
import {
  dispatchExchangeTool,
  isExchangeTool,
  resolveScopes,
  enforceScopeForCall,
} from "@/lib/exchange/mcp-server";
import {
  recordMcpCall,
  hashIp,
  deriveAuthTier,
} from "@/lib/exchange/mcp-observability";
import { captureServer } from "@/lib/infra/posthog/server";

// ── SDK handler ─────────────────────────────────────────────────────────────
// createMcpHandler returns an object with a .fetch(request) method that
// handles both modern (2026-07-28) and legacy (2025-era) protocol traffic.
// The factory receives { era, authInfo?, requestInfo } — we use requestInfo
// to pass the request context to callTool for shareable URL generation.
const mcpHandler = createMcpHandler(({ requestInfo }) => {
  // requestInfo is the standard Request object; cast to NextRequest for
  // callTool which may use req.nextUrl or headers.
  return createSigrankServer(requestInfo as NextRequest);
});

// ── POST handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Origin validation
  if (!allowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  const startTime = Date.now();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const clientName = req.headers.get("mcp-client-name") ?? undefined;
  const clientVersion = req.headers.get("mcp-client-version") ?? undefined;
  const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim());

  // 2. Parse the request body to check for Exchange tool calls and record telemetry
  let message: RpcRequest;
  let rawBody: string;
  try {
    rawBody = await req.text();
    message = JSON.parse(rawBody) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", undefined, 400);
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request", undefined, 400);
  }

  const id = message.id ?? null;
  const method = message.method;

  // 3. Protocol version header check
  const version = req.headers.get("mcp-protocol-version");
  if (version && !SUPPORTED_VERSIONS.has(version)) {
    return rpcError(id, -32602, "Unsupported protocol version", {
      supported: [...SUPPORTED_VERSIONS],
      requested: version,
    }, 400);
  }

  // 4. Observability for initialize and tools/list
  if (method === "initialize") {
    await recordMcpCall({
      request_id: requestId,
      server_id: "sigrank",
      transport: "remote_mcp",
      operation: "initialize",
      result: "success",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientName,
      client_version: clientVersion,
    });
  }

  if (method === "tools/list") {
    await recordMcpCall({
      request_id: requestId,
      server_id: "sigrank",
      transport: "remote_mcp",
      operation: "tools_list",
      auth_tier: "anonymous",
      result: "success",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientName,
      client_version: clientVersion,
    });
  }

  // 5. Exchange compatibility bridge for tools/call
  if (method === "tools/call") {
    const name = message.params?.name;
    if (typeof name === "string" && isExchangeTool(name)) {
      const args = message.params?.arguments;
      const toolArgs = args && typeof args === "object" && !Array.isArray(args)
        ? (args as Record<string, unknown>)
        : {};

      // Scope enforcement for Exchange tools
      const scopes = resolveScopes(req);
      const scopeError = enforceScopeForCall(name, scopes);
      if (scopeError) {
        const authTier = deriveAuthTier(scopes);
        await recordMcpCall({
          request_id: requestId,
          server_id: "sigrank",
          transport: "remote_mcp",
          operation: "tools_call",
          tool_name: name,
          auth_tier: authTier,
          scopes: [...scopes],
          result: "denied",
          error_code: "missing_scope",
          duration_ms: Date.now() - startTime,
          ip_hash: ipHash,
          client_name: clientName,
          client_version: clientVersion,
          metadata: { legacy_bridge: true },
        });
        return jsonRpc(id, scopeError);
      }

      // Dispatch to Exchange handler
      let result: unknown;
      try {
        result = await dispatchExchangeTool(name, toolArgs, req);
      } catch {
        await recordMcpCall({
          request_id: requestId,
          server_id: "sigrank",
          transport: "remote_mcp",
          operation: "tools_call",
          tool_name: name,
          auth_tier: deriveAuthTier(scopes),
          scopes: [...scopes],
          result: "error",
          duration_ms: Date.now() - startTime,
          ip_hash: ipHash,
          client_name: clientName,
          client_version: clientVersion,
          metadata: { legacy_bridge: true },
        });
        return rpcError(id, -32603, "Internal error", { tool: name });
      }

      // Attach deprecation metadata to the text content
      if (result && typeof result === "object" && "content" in result) {
        const content = (result as { content: Array<{ type: string; text: string }> }).content;
        if (content[0]?.text) {
          try {
            const parsed = JSON.parse(content[0].text);
            parsed._deprecated_endpoint = true;
            parsed._migration_target = "https://signalaf.com/api/exchange/mcp";
            parsed._deprecation_notice = "Exchange tools have moved to the dedicated Contribution Exchange MCP at /api/exchange/mcp. This compatibility bridge will be removed on 2026-12-31.";
            parsed._removal_date = "2026-12-31";
            content[0].text = JSON.stringify(parsed, null, 2);
          } catch {
            content[0].text += '\n\n[DEPRECATED] Exchange tools have moved to /api/exchange/mcp (bridge removed 2026-12-31)';
          }
        }
      }

      // Record the legacy bridge call
      const isError = result && typeof result === "object" && "isError" in result
        ? (result as { isError: boolean }).isError
        : false;
      await recordMcpCall({
        request_id: requestId,
        server_id: "sigrank",
        transport: "remote_mcp",
        operation: "tools_call",
        tool_name: name,
        auth_tier: deriveAuthTier(scopes),
        scopes: [...scopes],
        result: isError ? "error" : "success",
        duration_ms: Date.now() - startTime,
        ip_hash: ipHash,
        client_name: clientName,
        client_version: clientVersion,
        metadata: { legacy_bridge: true },
      });

      // Emit distinct migration telemetry event
      await captureServer(
        "mcp-legacy-bridge",
        "exchange_mcp_legacy_bridge_call",
        {
          tool_name: name,
          migration_target: "https://signalaf.com/api/exchange/mcp",
          removal_date: "2026-12-31",
          client_name: clientName ?? null,
        },
      ).catch(() => {
        // Telemetry must never break the request
      });

      return jsonRpc(id, result);
    }

    // SigRank tool-call observability is recorded inside the tool handler in
    // lib/mcp/server.ts (after callTool returns) so it captures the ACTUAL
    // result and ACTUAL duration. The route stamps the per-request context
    // onto the forwarded request via headers below.
  }

  // 6. Delegate to the SDK handler for standard MCP protocol methods
  // Reconstruct the request with the original body (we consumed it above).
  // Stamp observability context onto the forwarded request so the server
  // factory / tool handler can record accurate result + duration.
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set("x-mcp-start-time", String(startTime));
  if (requestId) forwardedHeaders.set("x-request-id", requestId);

  const sdkRequest = new Request(req.url, {
    method: "POST",
    headers: forwardedHeaders,
    body: rawBody,
  });

  return mcpHandler.fetch(sdkRequest);
}

// ── GET handler ─────────────────────────────────────────────────────────────
// GET is used for SSE streams in legacy (2025-era) protocol mode
export async function GET(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  return mcpHandler.fetch(req as unknown as Request);
}

// ── DELETE handler ──────────────────────────────────────────────────────────
// DELETE is used for session cleanup in legacy (2025-era) protocol mode
export async function DELETE(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  return mcpHandler.fetch(new Request(req.url, { method: "DELETE", headers: req.headers }));
}
