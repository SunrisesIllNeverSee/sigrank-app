/**
 * components/webmcp/register-tools.ts
 *
 * WebMCP — registers site tools with the browser's Model Context API
 * so AI agents running in the browser can invoke them.
 *
 * Per https://webmachinelearning.github.io/webmcp/
 * Detected by isitagentready.com scanner via page load.
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

    const controller = new AbortController();

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
            `https://signalaf.com/api/v1/leaderboard?limit=${limit}`,
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
            `https://signalaf.com/api/v1/operators/${encodeURIComponent(codename)}`,
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
            `https://signalaf.com/api/v1/leaderboard?metric=${metric}&window=${window}&limit=${limit}`,
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
          const res = await fetch("https://signalaf.com/llms.txt");
          return await res.text();
        },
      }, { signal: controller.signal })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return null;
}
