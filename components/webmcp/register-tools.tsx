/**
 * components/webmcp/register-tools.tsx
 *
 * WebMCP — registers site tools with the browser's Model Context API
 * so AI agents running in the browser can invoke them.
 *
 * Per https://webmachinelearning.github.io/webmcp/
 * Detected by isitagentready.com scanner via page load.
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
 */

"use client";

import { useEffect } from "react";

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
          execute: (input: Record<string, unknown>) => Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => Promise<unknown>;
    };
  }
}

export function WebMcpRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.modelContext) return;
    if (typeof window === "undefined") return;

    const controller = new AbortController();
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;

    // ── SigRank tools (registered on all pages) ──

    // Tool: search operators
    navigator.modelContext
      .registerTool({
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
        execute: async (input) => {
          const query = String(input.query || "");
          const limit = Number(input.limit) || 10;
          const res = await fetch(
            `${origin}/api/v1/leaderboard?limit=${limit}`,
          );
          const data = await res.json();
          const entries = (data.entries || []).slice(0, limit);
          if (query) {
            const q = query.toLowerCase();
            return entries.filter(
              (e: Record<string, unknown>) =>
                String(e.display_name || e.codename || "")
                  .toLowerCase()
                  .includes(q) ||
                String(e.platform || "").toLowerCase().includes(q),
            );
          }
          return entries;
        },
      }, { signal: controller.signal })
      .catch(() => {});

    // Tool: get operator detail
    navigator.modelContext
      .registerTool({
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
        execute: async (input) => {
          const codename = String(input.codename || "");
          const res = await fetch(
            `${origin}/api/v1/operators/${encodeURIComponent(codename)}`,
          );
          return await res.json();
        },
      }, { signal: controller.signal })
      .catch(() => {});

    // Tool: get leaderboard
    navigator.modelContext
      .registerTool({
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
        execute: async (input) => {
          const metric = String(input.metric || "yield");
          const window = String(input.window || "30d");
          const limit = Number(input.limit) || 20;
          const res = await fetch(
            `${origin}/api/v1/leaderboard?metric=${metric}&window=${window}&limit=${limit}`,
          );
          return await res.json();
        },
      }, { signal: controller.signal })
      .catch(() => {});

    // Tool: get methodology
    navigator.modelContext
      .registerTool({
        name: "get_methodology",
        description:
          "Get SigRank scoring methodology — the Yield formula, metric definitions, and how operators are evaluated.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        execute: async () => {
          const res = await fetch(`${origin}/llms.txt`);
          return await res.text();
        },
      }, { signal: controller.signal })
      .catch(() => {});

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
      navigator.modelContext
        .registerTool({
          name: "exchange_discover_domain",
          description:
            "Discover the Contribution Exchange profile for this domain. READ-ONLY — no state transition, no proposal insertion. Returns the exchange manifest, policy version, and available surfaces.",
          inputSchema: {
            type: "object",
            properties: {},
          },
          execute: async () => {
            const res = await fetch(`${origin}/.well-known/exchange.json`);
            if (!res.ok) return { outcome: "not_found", domain: hostname };
            const manifest = await res.json();
            return { outcome: "self_hosted", domain: hostname, manifest };
          },
        }, { signal: controller.signal })
        .catch(() => {});

      // Tool: exchange_get_policy (read-only)
      navigator.modelContext
        .registerTool({
          name: "exchange_get_policy",
          description:
            "Get the Contribution Exchange policy for this domain. READ-ONLY — returns policy version, accepted categories, rate limits, and requirements. No state transition.",
          inputSchema: {
            type: "object",
            properties: {},
          },
          execute: async () => {
            const res = await fetch(`${origin}/.well-known/exchange.json`);
            if (!res.ok) return { outcome: "not_found", domain: hostname };
            const manifest = await res.json();
            return {
              outcome: "ok",
              domain: hostname,
              policy: manifest.policy ?? null,
              policy_version: manifest.policy_version ?? null,
            };
          },
        }, { signal: controller.signal })
        .catch(() => {});

      // Tool: exchange_list_signals (read-only)
      navigator.modelContext
        .registerTool({
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
          },
          execute: async (input) => {
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
          },
        }, { signal: controller.signal })
        .catch(() => {});

      // Tool: exchange_get_signal (read-only)
      navigator.modelContext
        .registerTool({
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
          },
          execute: async (input) => {
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
          },
        }, { signal: controller.signal })
        .catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
