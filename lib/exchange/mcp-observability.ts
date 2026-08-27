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
 *
 * Uses the `mcp_observability_summary` Postgres RPC (migration 0043) to
 * aggregate SQL-side. This replaced the previous approach of fetching up to
 * 10K rows and aggregating in JavaScript (issue #75).
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
  const emptyResult = {
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
  if (!client) return emptyResult;

  // Calculate time filter
  const periodHours = filters.period === "24h" ? 24
    : filters.period === "7d" ? 168
    : filters.period === "30d" ? 720
    : 168; // default 7d
  const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

  // SQL-side aggregation via RPC — no raw rows transferred
  const { data, error } = await (client.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  }>)("mcp_observability_summary", {
    p_since: since,
    p_domain: filters.domain ?? null,
    p_transport: filters.transport ?? null,
    p_tool: filters.tool ?? null,
    p_result: filters.result ?? null,
  });

  if (error || !data) {
    console.error("[mcp-observability] summary RPC failed:", error?.message);
    return emptyResult;
  }

  // RPC returns a JSONB object matching our summary shape
  const summary = data as unknown as {
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
  };

  return summary;
}
