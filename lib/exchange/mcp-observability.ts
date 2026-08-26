/**
 * lib/exchange/mcp-observability.ts — Durable MCP call recording.
 *
 * Records every MCP operation (initialize, tools/list, tools/call) to the
 * exchange_mcp_calls table. This is the protocol-level analytics layer.
 *
 * Separation of concerns:
 * - This module records the MCP/Site Tool call (transport analytics)
 * - exchange_events and exchange_encounters record business events
 * - They are correlated by request_id
 * - A single MCP call is recorded ONCE here, even if it also triggers
 *   a business event
 *
 * Privacy:
 * - No raw authorization headers, API keys, or admin secrets
 * - No full prompts or unnecessary request bodies
 * - IP is hashed (SHA-256, first 16 hex chars) if present
 * - Agent identity is the actor ID or a hash of the agent key
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { captureServer } from "@/lib/infra/posthog/server";

export type McpServerId = "sigrank" | "contribution-exchange";
export type McpTransport = "remote_mcp" | "webmcp" | "direct_http";
export type McpOperation = "initialize" | "tools_list" | "tools_call";
export type McpResult = "success" | "error" | "denied" | "rate_limited" | "invalid_request";
export type McpAuthTier = "anonymous" | "actor" | "agent" | "proposer" | "admin";

export interface McpCallRecord {
  request_id?: string;
  server_id: McpServerId;
  transport: McpTransport;
  operation: McpOperation;
  tool_name?: string;
  target_domain?: string;
  agent_identity?: string;
  auth_tier?: McpAuthTier;
  scopes?: string[];
  client_name?: string;
  client_version?: string;
  result: McpResult;
  error_code?: string;
  duration_ms?: number;
  idempotent_replay?: boolean;
  signal_id?: string;
  attempt_id?: string;
  proposal_id?: string;
  ip_hash?: string;
  metadata?: Record<string, unknown>;
}

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}

/**
 * Hash an IP address for privacy-safe storage.
 * Returns SHA-256 first 16 hex chars, or undefined if no IP.
 */
export function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Derive a privacy-safe agent identity from request headers.
 * Never stores raw keys — uses actor ID or hashed agent key.
 */
export function deriveAgentIdentity(
  actorId: string | null | undefined,
  agentKey: string | null | undefined,
): string | undefined {
  if (actorId) return actorId;
  if (agentKey) {
    return "key_" + createHash("sha256").update(agentKey).digest("hex").slice(0, 12);
  }
  return undefined;
}

/**
 * Derive auth tier from scopes.
 */
export function deriveAuthTier(scopes: Set<string>): McpAuthTier {
  if (scopes.has("exchange:propose")) return "proposer";
  if (scopes.has("exchange:attempt")) return "actor";
  return "anonymous";
}

/**
 * Record an MCP call to the durable observability table.
 * Failures are non-fatal — observability should never break the request.
 */
export async function recordMcpCall(record: McpCallRecord): Promise<void> {
  try {
    const client = getAdminClient();
    if (!client) return; // No Supabase configured — skip silently

    const insertPayload = {
      request_id: record.request_id ?? null,
      server_id: record.server_id,
      transport: record.transport,
      operation: record.operation,
      tool_name: record.tool_name ?? null,
      target_domain: record.target_domain ?? null,
      agent_identity: record.agent_identity ?? null,
      auth_tier: record.auth_tier ?? "anonymous",
      scopes: record.scopes ?? null,
      client_name: record.client_name ?? null,
      client_version: record.client_version ?? null,
      result: record.result,
      error_code: record.error_code ?? null,
      duration_ms: record.duration_ms ?? null,
      idempotent_replay: record.idempotent_replay ?? false,
      signal_id: record.signal_id ?? null,
      attempt_id: record.attempt_id ?? null,
      proposal_id: record.proposal_id ?? null,
      ip_hash: record.ip_hash ?? null,
      metadata: record.metadata ?? {},
    };
    const { error } = await (client.from("exchange_mcp_calls") as unknown as {
      insert: (payload: typeof insertPayload) => Promise<{ error: { message: string } | null }>;
    }).insert(insertPayload);

    if (error) {
      // Log but don't throw — observability is non-blocking
      console.error("[mcp-observability] insert failed:", error.message);
    }

    // Emit a privacy-safe PostHog event for behavioral analytics.
    // Supabase is the durable source; PostHog is behavioral analytics.
    // No secrets, no full payloads — only enum-like properties.
    const durationBucket = record.duration_ms == null
      ? "unknown"
      : record.duration_ms < 50 ? "<50ms"
      : record.duration_ms < 200 ? "50-200ms"
      : record.duration_ms < 1000 ? "200ms-1s"
      : ">1s";
    await captureServer(
      record.agent_identity ?? "mcp-anonymous",
      "exchange_mcp_call",
      {
        server_id: record.server_id,
        transport: record.transport,
        operation: record.operation,
        tool_name: record.tool_name ?? null,
        target_domain: record.target_domain ?? null,
        auth_tier: record.auth_tier ?? "anonymous",
        result: record.result,
        error_code: record.error_code ?? null,
        duration_bucket: durationBucket,
        idempotent_replay: record.idempotent_replay ?? false,
        client_name: record.client_name ?? null,
      },
    ).catch(() => {
      // PostHog failure must never break the request
    });
  } catch (err) {
    // Never let observability break the actual request
    console.error("[mcp-observability] recordMcpCall error:", err);
  }
}

/**
 * Get aggregate observability summary for the owner dashboard.
 * Returns aggregated counts, not raw rows.
 */
export async function getObservabilitySummary(filters: {
  period?: string;    // e.g. "24h", "7d", "30d"
  domain?: string;
  transport?: McpTransport;
  tool?: string;
  result?: McpResult;
}): Promise<{
  total_calls: number;
  by_server: Record<string, number>;
  by_transport: Record<string, number>;
  by_operation: Record<string, number>;
  by_tool: Record<string, number>;
  by_domain: Record<string, number>;
  by_result: Record<string, number>;
  by_auth_tier: Record<string, number>;
  avg_duration_ms: number | null;
  idempotent_replays: number;
  funnel: {
    initializations: number;
    tool_list_requests: number;
    tool_calls: number;
    signals_viewed: number;
    attempts_created: number;
    submissions_received: number;
    proposals_created: number;
  };
}> {
  const client = getAdminClient();
  if (!client) {
    return {
      total_calls: 0,
      by_server: {},
      by_transport: {},
      by_operation: {},
      by_tool: {},
      by_domain: {},
      by_result: {},
      by_auth_tier: {},
      avg_duration_ms: null,
      idempotent_replays: 0,
      funnel: {
        initializations: 0,
        tool_list_requests: 0,
        tool_calls: 0,
        signals_viewed: 0,
        attempts_created: 0,
        submissions_received: 0,
        proposals_created: 0,
      },
    };
  }

  // Calculate time filter
  const periodHours = filters.period === "24h" ? 24
    : filters.period === "7d" ? 168
    : filters.period === "30d" ? 720
    : 168; // default 7d
  const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

  const queryBuilder = client.from("exchange_mcp_calls").select("*").gte("occurred_at", since) as unknown as {
    eq: (col: string, val: string) => typeof queryBuilder;
    limit: (n: number) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
  };
  let query: typeof queryBuilder = queryBuilder;
  if (filters.domain) query = query.eq("target_domain", filters.domain);
  if (filters.transport) query = query.eq("transport", filters.transport);
  if (filters.tool) query = query.eq("tool_name", filters.tool);
  if (filters.result) query = query.eq("result", filters.result);

  const { data, error } = await query.limit(10000);

  if (error || !data) {
    console.error("[mcp-observability] summary query failed:", error?.message);
    return {
      total_calls: 0,
      by_server: {},
      by_transport: {},
      by_operation: {},
      by_tool: {},
      by_domain: {},
      by_result: {},
      by_auth_tier: {},
      avg_duration_ms: null,
      idempotent_replays: 0,
      funnel: {
        initializations: 0,
        tool_list_requests: 0,
        tool_calls: 0,
        signals_viewed: 0,
        attempts_created: 0,
        submissions_received: 0,
        proposals_created: 0,
      },
    };
  }

  // Aggregate in JS (avoids complex SQL for cross-database compatibility)
  const byServer: Record<string, number> = {};
  const byTransport: Record<string, number> = {};
  const byOperation: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  const byResult: Record<string, number> = {};
  const byAuthTier: Record<string, number> = {};
  let totalDuration = 0;
  let durationCount = 0;
  let idempotentReplays = 0;

  for (const row of data) {
    const r = row as Record<string, unknown>;
    const sid = r.server_id as string;
    const tid = r.transport as string;
    const oid = r.operation as string;
    const res = r.result as string;
    const tier = r.auth_tier as string;
    byServer[sid] = (byServer[sid] ?? 0) + 1;
    byTransport[tid] = (byTransport[tid] ?? 0) + 1;
    byOperation[oid] = (byOperation[oid] ?? 0) + 1;
    if (r.tool_name) byTool[r.tool_name as string] = (byTool[r.tool_name as string] ?? 0) + 1;
    if (r.target_domain) byDomain[r.target_domain as string] = (byDomain[r.target_domain as string] ?? 0) + 1;
    byResult[res] = (byResult[res] ?? 0) + 1;
    byAuthTier[tier] = (byAuthTier[tier] ?? 0) + 1;
    if (r.duration_ms != null) {
      totalDuration += r.duration_ms as number;
      durationCount++;
    }
    if (r.idempotent_replay) idempotentReplays++;
  }

  // Funnel
  const funnel = {
    initializations: data.filter((r) => (r as Record<string, unknown>).operation === "initialize").length,
    tool_list_requests: data.filter((r) => (r as Record<string, unknown>).operation === "tools_list").length,
    tool_calls: data.filter((r) => (r as Record<string, unknown>).operation === "tools_call").length,
    signals_viewed: data.filter((r) => {
      const t = (r as Record<string, unknown>).tool_name;
      return t === "exchange_get_signal" || t === "exchange_list_signals";
    }).length,
    attempts_created: data.filter((r) => (r as Record<string, unknown>).tool_name === "exchange_create_attempt").length,
    submissions_received: data.filter((r) => (r as Record<string, unknown>).tool_name === "exchange_submit_attempt").length,
    proposals_created: data.filter((r) => {
      const t = (r as Record<string, unknown>).tool_name;
      return t === "exchange_propose" || t === "exchange_create_proposal_from_attempt";
    }).length,
  };

  return {
    total_calls: data.length,
    by_server: byServer,
    by_transport: byTransport,
    by_operation: byOperation,
    by_tool: byTool,
    by_domain: byDomain,
    by_result: byResult,
    by_auth_tier: byAuthTier,
    avg_duration_ms: durationCount > 0 ? Math.round(totalDuration / durationCount) : null,
    idempotent_replays: idempotentReplays,
    funnel,
  };
}
