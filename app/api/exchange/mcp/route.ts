/**
 * app/api/exchange/mcp/route.ts — Contribution Exchange MCP endpoint.
 *
 * This is the dedicated MCP server for the Contribution Exchange, separate
 * from the SigRank MCP at /api/mcp. Both routes share the same Exchange
 * handlers and business logic via lib/exchange/mcp-server.ts, but have
 * distinct server identities, tool catalogs, and instructions.
 *
 * Server identity: contribution-exchange
 * Tool catalog: 10 Exchange tools (6 read-only + 4 mutation)
 * Transport: Streamable HTTP (POST-based JSON-RPC)
 *
 * Invariants:
 * - No tool creates a Commitment, authorization, or settlement
 * - Every mutation response includes authoritative_exchange_state_advanced: false
 * - Scope filtering at tools/list AND enforcement at tools/call
 * - All existing SSRF, rate-limit, and idempotency protections preserved
 */

import type { NextRequest } from "next/server";
import {
  PROTOCOL_VERSION,
  SUPPORTED_VERSIONS,
  jsonRpc,
  rpcError,
  allowedOrigin,
  negotiateProtocolVersion,
  type RpcRequest,
} from "@/lib/mcp/protocol";
import {
  EXCHANGE_SERVER_INFO,
  EXCHANGE_INSTRUCTIONS,
  filterExchangeToolsByScope,
  dispatchExchangeTool,
  resolveScopes,
  enforceScopeForCall,
} from "@/lib/exchange/mcp-server";
import {
  recordMcpCall,
  hashIp,
  deriveAgentIdentity,
  deriveAuthTier,
  type McpTransport,
  type McpOperation,
  type McpResult,
} from "@/lib/exchange/mcp-observability";

export const dynamic = "force-dynamic";

function getClientInfo(req: NextRequest): { name?: string; version?: string } {
  const name = req.headers.get("mcp-client-name") ?? undefined;
  const version = req.headers.get("mcp-client-version") ?? undefined;
  return { name, version };
}

function getRequestId(req: NextRequest): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  const startTime = Date.now();
  const requestId = getRequestId(req);
  const clientInfo = getClientInfo(req);
  const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim());
  const transport: McpTransport = "remote_mcp";

  let message: RpcRequest;
  try {
    message = (await req.json()) as RpcRequest;
  } catch {
    await recordMcpCall({
      request_id: requestId,
      server_id: "contribution-exchange",
      transport,
      operation: "tools_call",
      result: "invalid_request",
      error_code: "parse_error",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientInfo.name,
      client_version: clientInfo.version,
    });
    return rpcError(null, -32700, "Parse error", undefined, 400);
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    await recordMcpCall({
      request_id: requestId,
      server_id: "contribution-exchange",
      transport,
      operation: "tools_call",
      result: "invalid_request",
      error_code: "invalid_request",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientInfo.name,
      client_version: clientInfo.version,
    });
    return rpcError(message.id ?? null, -32600, "Invalid Request", undefined, 400);
  }

  const id = message.id ?? null;
  const method = message.method;

  if (method === "initialize") {
    const negotiated = negotiateProtocolVersion(message.params?.protocolVersion);
    await recordMcpCall({
      request_id: requestId,
      server_id: "contribution-exchange",
      transport,
      operation: "initialize",
      result: "success",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientInfo.name,
      client_version: clientInfo.version,
    });
    return jsonRpc(id, {
      protocolVersion: negotiated,
      capabilities: { tools: {} },
      serverInfo: EXCHANGE_SERVER_INFO,
      instructions: EXCHANGE_INSTRUCTIONS,
    });
  }

  if (method === "notifications/initialized") {
    return new Response(null, {
      status: 202,
      headers: { "MCP-Protocol-Version": PROTOCOL_VERSION },
    });
  }

  const version = req.headers.get("mcp-protocol-version");
  if (version && !SUPPORTED_VERSIONS.has(version)) {
    await recordMcpCall({
      request_id: requestId,
      server_id: "contribution-exchange",
      transport,
      operation: "tools_call",
      result: "error",
      error_code: "unsupported_protocol",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientInfo.name,
      client_version: clientInfo.version,
    });
    return rpcError(id, -32602, "Unsupported protocol version", {
      supported: [...SUPPORTED_VERSIONS],
      requested: version,
    }, 400);
  }

  if (method === "ping") return jsonRpc(id, {});

  if (method === "tools/list") {
    const scopes = await resolveScopes(req);
    const scopedTools = filterExchangeToolsByScope(scopes);
    const authTier = deriveAuthTier(scopes);
    const agentIdentity = deriveAgentIdentity(
      req.headers.get("x-exchange-actor-id"),
      req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key"),
    );
    await recordMcpCall({
      request_id: requestId,
      server_id: "contribution-exchange",
      transport,
      operation: "tools_list",
      auth_tier: authTier,
      scopes: [...scopes],
      agent_identity: agentIdentity,
      result: "success",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientInfo.name,
      client_version: clientInfo.version,
    });
    return jsonRpc(id, { tools: scopedTools });
  }

  if (method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments;
    if (typeof name !== "string") {
      await recordMcpCall({
        request_id: requestId,
        server_id: "contribution-exchange",
        transport,
        operation: "tools_call",
        result: "invalid_request",
        error_code: "missing_tool_name",
        duration_ms: Date.now() - startTime,
        ip_hash: ipHash,
        client_name: clientInfo.name,
        client_version: clientInfo.version,
      });
      return rpcError(id, -32602, "Invalid params", { required: "params.name" });
    }
    // Enforce scopes at call time
    const scopes = await resolveScopes(req);
    const scopeError = enforceScopeForCall(name, scopes);
    if (scopeError) {
      const authTier = deriveAuthTier(scopes);
      await recordMcpCall({
        request_id: requestId,
        server_id: "contribution-exchange",
        transport,
        operation: "tools_call",
        tool_name: name,
        auth_tier: authTier,
        scopes: [...scopes],
        result: "denied",
        error_code: "missing_scope",
        duration_ms: Date.now() - startTime,
        ip_hash: ipHash,
        client_name: clientInfo.name,
        client_version: clientInfo.version,
      });
      return jsonRpc(id, scopeError);
    }
    const result = await dispatchExchangeTool(
      name,
      args && typeof args === "object" && !Array.isArray(args)
        ? (args as Record<string, unknown>)
        : {},
      req,
    );
    const authTier = deriveAuthTier(scopes);
    const agentIdentity = deriveAgentIdentity(
      req.headers.get("x-exchange-actor-id"),
      req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key"),
    );
    // Extract target_domain from args for domain-scoped tools
    const argsRecord = (args && typeof args === "object" && !Array.isArray(args)) ? args as Record<string, unknown> : {};
    const targetDomain = typeof argsRecord.target_domain === "string" ? argsRecord.target_domain
      : typeof argsRecord.domain === "string" ? argsRecord.domain
      : undefined;
    // Determine result status from the tool result
    const isError = result && typeof result === "object" && "isError" in result
      ? (result as { isError: boolean }).isError
      : false;
    const callResult: McpResult = isError ? "error" : "success";
    await recordMcpCall({
      request_id: requestId,
      server_id: "contribution-exchange",
      transport,
      operation: "tools_call",
      tool_name: name,
      target_domain: targetDomain,
      auth_tier: authTier,
      scopes: [...scopes],
      agent_identity: agentIdentity,
      result: callResult,
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientInfo.name,
      client_version: clientInfo.version,
    });
    return jsonRpc(id, result);
  }

  await recordMcpCall({
    request_id: requestId,
    server_id: "contribution-exchange",
    transport,
    operation: "tools_call",
    result: "error",
    error_code: "method_not_found",
    duration_ms: Date.now() - startTime,
    ip_hash: ipHash,
    client_name: clientInfo.name,
    client_version: clientInfo.version,
  });
  return rpcError(id, -32601, "Method not found", { method });
}

export async function GET() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function DELETE() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
