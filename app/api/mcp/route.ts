import type { NextRequest } from "next/server";
import {
  PROTOCOL_VERSION,
  SUPPORTED_VERSIONS,
  jsonRpc,
  rpcError,
  allowedOrigin,
  negotiateProtocolVersion,
  type RpcId,
  type RpcRequest,
} from "@/lib/mcp/protocol";
import { TOOLS, callTool } from "@/lib/mcp/tools";
import { RESOURCES, readResource } from "@/lib/mcp/resources";
import { PROMPTS, getPrompt } from "@/lib/mcp/prompts";
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

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  const startTime = Date.now();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const clientName = req.headers.get("mcp-client-name") ?? undefined;
  const clientVersion = req.headers.get("mcp-client-version") ?? undefined;
  const ipHash = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim());

  let message: RpcRequest;
  try {
    message = (await req.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", undefined, 400);
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request", undefined, 400);
  }

  const id = message.id ?? null;
  const method = message.method;

  if (method === "initialize") {
    const negotiated = negotiateProtocolVersion(message.params?.protocolVersion);
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
    return jsonRpc(id, {
      protocolVersion: negotiated,
      capabilities: { tools: {}, resources: { listChanged: false }, prompts: { listChanged: false } },
      serverInfo: {
        name: "sigrank",
        title: "SigRank SignalAF",
        version: "1.0.0",
        description: "AI operator benchmark measuring token-cascade efficiency from privacy-preserving telemetry.",
        websiteUrl: "https://signalaf.com",
      },
      instructions:
        "Use SignalAF to benchmark AI operators from privacy-preserving token telemetry. Benchmark tools: rank_paste (compute cascade from 4 token counts), get_leaderboard (public rankings), get_operator (operator profile by codename). Analytical tools (pure math): simulate_change, diagnose_cascade, suggest_improvements, self_improve, rank_windows. Field-relative tools: benchmark_me, rank_if, operator_gap, field_anomaly, who_operates_like_me, compare_to_field, operator_signature. Contribution Exchange tools are now available at a dedicated MCP endpoint: https://signalaf.com/api/exchange/mcp. Do not treat benchmark metrics as a model-quality or downstream-productivity benchmark.",
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
    return rpcError(id, -32602, "Unsupported protocol version", {
      supported: [...SUPPORTED_VERSIONS],
      requested: version,
    }, 400);
  }

  if (method === "ping") return jsonRpc(id, {});
  if (method === "tools/list") {
    // SigRank-only: all 15 tools are read-only and always visible.
    // Exchange tools have moved to /api/exchange/mcp.
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
    return jsonRpc(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments;
    if (typeof name !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.name" });
    }
    // Scope enforcement for legacy Exchange tool calls (compatibility bridge).
    // SigRank tools are all read-only and need no scope check.
    // Exchange tools require exchange:attempt or exchange:propose for mutations.
    if (isExchangeTool(name)) {
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
    }
    const toolArgs = args && typeof args === "object" && !Array.isArray(args)
      ? (args as Record<string, unknown>)
      : {};
    // ── Compatibility bridge: legacy Exchange tool calls ───────────────────
    // Exchange tools are no longer advertised in this server's tools/list.
    // Clients calling /api/mcp with a known exchange_* tool name are dispatched
    // through the shared Exchange dispatcher with a deprecation notice.
    // Migration target: https://signalaf.com/api/exchange/mcp
    // Removal date: 2026-12-31 (6 months after separation). After this date,
    // legacy Exchange calls through /api/mcp will return method-not-found.
    let result: unknown;
    if (isExchangeTool(name)) {
      result = await dispatchExchangeTool(name, toolArgs, req);
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
            // If JSON parse fails, append a note
            content[0].text += '\n\n[DEPRECATED] Exchange tools have moved to /api/exchange/mcp (bridge removed 2026-12-31)';
          }
        }
      }
    } else {
      result = await callTool(name, toolArgs, req);
    }
    // Record the call (SigRank tools or legacy Exchange bridge)
    const isExchange = isExchangeTool(name);
    const scopes = isExchange ? resolveScopes(req) : new Set<string>();
    const authTier = isExchange ? deriveAuthTier(scopes) : "anonymous" as const;
    const isError = result && typeof result === "object" && "isError" in result
      ? (result as { isError: boolean }).isError
      : false;
    await recordMcpCall({
      request_id: requestId,
      server_id: "sigrank",
      transport: "remote_mcp",
      operation: "tools_call",
      tool_name: name,
      auth_tier: authTier,
      scopes: isExchange ? [...scopes] : undefined,
      result: isError ? "error" : "success",
      duration_ms: Date.now() - startTime,
      ip_hash: ipHash,
      client_name: clientName,
      client_version: clientVersion,
      metadata: isExchange ? { legacy_bridge: true } : undefined,
    });
    // Emit a distinct migration telemetry event for legacy Exchange bridge
    // calls so the owner can track migration progress independently from
    // the standard call record. This event is only emitted when a client
    // calls an Exchange tool through the SigRank endpoint.
    if (isExchange) {
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
    }
    return jsonRpc(id, result);
  }

  // ── resources/list ──
  if (method === "resources/list") {
    return jsonRpc(id, {
      resources: RESOURCES,
    });
  }

  // ── resources/read ──
  if (method === "resources/read") {
    const uri = message.params?.uri;
    if (typeof uri !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.uri" });
    }
    const resourceResult = await readResource(uri);
    if (!resourceResult) {
      return rpcError(id, -32602, "Unknown resource", { uri });
    }
    return jsonRpc(id, resourceResult);
  }

  // ── prompts/list ──
  if (method === "prompts/list") {
    return jsonRpc(id, {
      prompts: PROMPTS,
    });
  }

  // ── prompts/get ──
  if (method === "prompts/get") {
    const promptName = message.params?.name;
    const promptArgs = (message.params?.arguments ?? {}) as Record<string, string | number>;
    if (typeof promptName !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.name" });
    }
    const prompt = getPrompt(promptName, promptArgs);
    if (!prompt) {
      return rpcError(id, -32602, "Unknown prompt", { name: promptName });
    }
    return jsonRpc(id, prompt);
  }

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
