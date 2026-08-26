/**
 * components/webmcp/register-tools.tsx
 *
 * WebMCP — registers site tools with the browser's Model Context API
 * so AI agents running in the browser can invoke them.
 *
 * API: per the current official WebMCP/Site Tools documentation
 *   https://learn.chatgpt.com/docs/webmcp
 *   https://webmachinelearning.github.io/webmcp/
 *
 * The current API is `document.modelContext.registerTool(...)`.
 * A compatibility fallback to the older `navigator.modelContext` draft
 * is included, feature-detected and isolated. The primary path is
 * `document.modelContext`.
 *
 * Page-aware tool registration:
 * - SigRank tools: registered globally (all pages)
 * - Exchange tools: registered only on /exchange* pages
 *
 * Security:
 * - Domain is derived from window.location (trusted page context),
 *   never from untrusted tool input.
 * - Only read-only Exchange tools are exposed via WebMCP.
 *   Mutation tools (propose, create_attempt, submit_attempt) require
 *   authentication and must go through the dedicated MCP endpoint.
 * - Uses relative URLs to stay origin-safe.
 * - No client secrets are embedded — all calls go to public APIs.
 *
 * Lifecycle:
 * - AbortController prevents duplicate registration across route
 *   transitions, hydration, hot reload, and remounts.
 * - The current WebMCP API does not provide an unregister method;
 *   aborting the signal is the supported lifecycle hook.
 * - The application operates normally in browsers without WebMCP.
 */

"use client";

import { useEffect } from "react";

// ─── Type declarations for both API surfaces ───────────────────────────────

interface ModelContextApi {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations?: Record<string, unknown>;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
}

declare global {
  // Current official API (per learn.chatgpt.com/docs/webmcp)
  interface Document {
    modelContext?: ModelContextApi;
  }
  // Older draft API — kept as a compatibility fallback only
  interface Navigator {
    modelContext?: ModelContextApi;
  }
}

// ─── Telemetry helper ──────────────────────────────────────────────────────
// Records a privacy-safe WebMCP call beacon to the observability endpoint.
// This is fire-and-forget — never blocks tool execution or breaks the page.
// Identifies the call as transport: "webmcp" so the owner dashboard can
// distinguish Site Tool usage from remote MCP usage.

function beaconWebmcpCall(toolName: string, result: string, durationMs: number): void {
  try {
    const body = JSON.stringify({
      tool_name: toolName,
      result,
      duration_ms: durationMs,
      transport: "webmcp",
    });
    // Use sendBeacon when available for reliability during page unload;
    // fall back to fetch with keepalive.
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/exchange/observability/beacon", blob);
      return;
    }
    void fetch("/api/exchange/observability/beacon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Telemetry must never break the page
  }
}

// ─── Resolve the Model Context API ─────────────────────────────────────────
// Primary: document.modelContext (current official API)
// Fallback: navigator.modelContext (older draft, feature-detected)

function getModelContext(): ModelContextApi | null {
  if (typeof document !== "undefined" && document.modelContext) {
    return document.modelContext;
  }
  if (typeof navigator !== "undefined" && navigator.modelContext) {
    return navigator.modelContext;
  }
  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function WebMcpRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mc = getModelContext();
    if (!mc) return; // Browser doesn't support WebMCP — operate normally

    const controller = new AbortController();
    const { signal } = controller;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;

    // Helper: wrap execute to add telemetry beacon
    const withTelemetry = (
      name: string,
      execute: (input: Record<string, unknown>) => Promise<unknown>,
    ) => async (input: Record<string, unknown>): Promise<unknown> => {
      const start = Date.now();
      try {
        const result = await execute(input);
        beaconWebmcpCall(name, "success", Date.now() - start);
        return result;
      } catch (err) {
        beaconWebmcpCall(name, "error", Date.now() - start);
        throw err;
      }
    };

    // ── SigRank tools (registered on all pages) ──

    // Tool: search operators
    mc.registerTool({
      name: "search_operators",
      description:
        "Search the SigRank leaderboard for operators by name, platform, or metric. Returns ranked operators with Yield, class tier, and platform.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Operator name, platform (claude, codex, multi), or metric",
          },
          limit: {
            type: "number",
            description: "Max results (default 10)",
          },
        },
        required: ["query"],
      },
      execute: withTelemetry("search_operators", async (input) => {
        const query = String(input.query || "");
        const limit = Number(input.limit) || 10;
        const res = await fetch(`${origin}/api/v1/leaderboard?limit=${limit}`);
        const data = await res.json();
        const entries = (data.entries || []).slice(0, limit);
        if (query) {
          const q = query.toLowerCase();
          return entries.filter(
            (e: Record<string, unknown>) =>
              String(e.display_name || e.codename || "").toLowerCase().includes(q) ||
              String(e.platform || "").toLowerCase().includes(q),
          );
        }
        return entries;
      }),
    }, { signal }).catch(() => {});

    // Tool: get operator detail
    mc.registerTool({
      name: "get_operator",
      description:
        "Get detailed stats for a specific SigRank operator by codename or display name, including Yield, archetype, class tier, and history.",
      inputSchema: {
        type: "object",
        properties: {
          codename: {
            type: "string",
            description: "Operator codename or handle",
          },
        },
        required: ["codename"],
      },
      execute: withTelemetry("get_operator", async (input) => {
        const codename = String(input.codename || "");
        const res = await fetch(`${origin}/api/v1/operators/${encodeURIComponent(codename)}`);
        return await res.json();
      }),
    }, { signal }).catch(() => {});

    // Tool: get leaderboard
    mc.registerTool({
      name: "get_leaderboard",
      description:
        "Fetch the current SigRank leaderboard ranked by Yield (token-cascade efficiency). Returns top operators with metrics.",
      inputSchema: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            description: "Metric to rank by (yield, compression_ratio, snr, leverage, velocity, efficiency)",
          },
          window: {
            type: "string",
            description: "Time window (7d, 30d, all)",
          },
          limit: {
            type: "number",
            description: "Max results (default 20)",
          },
        },
      },
      execute: withTelemetry("get_leaderboard", async (input) => {
        const metric = String(input.metric || "yield");
        const window = String(input.window || "30d");
        const limit = Number(input.limit) || 20;
        const res = await fetch(`${origin}/api/v1/leaderboard?metric=${metric}&window=${window}&limit=${limit}`);
        return await res.json();
      }),
    }, { signal }).catch(() => {});

    // Tool: get methodology
    mc.registerTool({
      name: "get_methodology",
      description:
        "Get SigRank scoring methodology — the Yield formula, metric definitions, and how operators are evaluated.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: withTelemetry("get_methodology", async () => {
        const res = await fetch(`${origin}/llms.txt`);
        return await res.text();
      }),
    }, { signal }).catch(() => {});

    // ── Exchange Site Tools (registered only on /exchange* pages) ──
    // Only read-only tools are exposed via WebMCP.
    // Mutation tools (propose, create_attempt, submit_attempt) require
    // authentication and must go through the dedicated MCP endpoint at
    // /api/exchange/mcp. The domain is derived from the trusted page
    // context (window.location.hostname), never from tool input.

    const isExchangePage = pathname === "/exchange" || pathname.startsWith("/exchange/");

    if (isExchangePage) {
      // Tool: exchange_discover_domain (read-only)
      // Uses the current page's domain from trusted context.
      mc.registerTool({
        name: "exchange_discover_domain",
        description:
          "Discover the Contribution Exchange profile for this domain. READ-ONLY — no state transition, no proposal insertion. Returns the exchange manifest, policy version, and available surfaces.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: withTelemetry("exchange_discover_domain", async () => {
          const res = await fetch(`${origin}/.well-known/exchange.json`);
          if (!res.ok) return { outcome: "not_found", domain: hostname };
          const manifest = await res.json();
          return { outcome: "self_hosted", domain: hostname, manifest };
        }),
      }, { signal }).catch(() => {});

      // Tool: exchange_get_policy (read-only)
      mc.registerTool({
        name: "exchange_get_policy",
        description:
          "Get the Contribution Exchange policy for this domain. READ-ONLY — returns policy version, accepted categories, rate limits, and requirements. No state transition.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: withTelemetry("exchange_get_policy", async () => {
          const res = await fetch(`${origin}/.well-known/exchange.json`);
          if (!res.ok) return { outcome: "not_found", domain: hostname };
          const manifest = await res.json();
          return {
            outcome: "ok",
            domain: hostname,
            policy: manifest.policy ?? null,
            policy_version: manifest.policy_version ?? null,
          };
        }),
      }, { signal }).catch(() => {});

      // Tool: exchange_list_signals (read-only)
      mc.registerTool({
        name: "exchange_list_signals",
        description:
          "List published Contribution Exchange Signals for this domain. READ-ONLY — returns signal summaries with categories, deadlines, and status. No state transition.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Filter by signal status (open, closed, paused). Default: open.",
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: withTelemetry("exchange_list_signals", async (input) => {
          const status = String(input.status || "open");
          const res = await fetch(`${origin}/api/exchange/signals?status=${encodeURIComponent(status)}`);
          if (!res.ok) return { outcome: "error", domain: hostname, signals: [] };
          const data = await res.json();
          return {
            outcome: "ok",
            domain: hostname,
            signals: data.signals ?? [],
            authoritative_exchange_state_advanced: false,
          };
        }),
      }, { signal }).catch(() => {});

      // Tool: exchange_get_signal (read-only)
      mc.registerTool({
        name: "exchange_get_signal",
        description:
          "Get details for a specific Contribution Exchange Signal by ID. READ-ONLY — returns the signal definition, submission requirements, and deadline. No state transition.",
        inputSchema: {
          type: "object",
          properties: {
            signal_id: {
              type: "string",
              description: "The signal ID to retrieve",
            },
          },
          required: ["signal_id"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: withTelemetry("exchange_get_signal", async (input) => {
          const signalId = String(input.signal_id || "");
          if (!signalId) return { outcome: "error", message: "signal_id is required" };
          const res = await fetch(`${origin}/api/exchange/signals/${encodeURIComponent(signalId)}`);
          if (!res.ok) return { outcome: "not_found", signal_id: signalId };
          const data = await res.json();
          return {
            outcome: "ok",
            domain: hostname,
            signal: data,
            authoritative_exchange_state_advanced: false,
          };
        }),
      }, { signal }).catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
