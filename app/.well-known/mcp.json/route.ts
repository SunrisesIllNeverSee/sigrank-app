/**
 * MCP server card for SigRank SignalAF.
 * The same product is available remotely over Streamable HTTP and locally over stdio.
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const card = {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: {
      name: "sigrank",
      title: "SigRank SignalAF — AI Operator Benchmark",
      version: "1.0.0",
    },
    description:
      "SigRank SignalAF exposes AI-operator benchmark data and token-cascade calculations to MCP clients. Use it for operator ranking, comparison, and privacy-preserving telemetry analysis — not as a model-quality benchmark.",
    transports: [
      {
        type: "streamable-http",
        endpoint: `${SITE_ORIGIN}/api/mcp`,
      },
      {
        type: "stdio",
        command: "npx",
        args: ["sigrank"],
      },
    ],
    authentication: {
      required: false,
      documentation: `${SITE_ORIGIN}/auth.md`,
    },
    tools: [
      "rank_paste",
      "get_leaderboard",
      "get_operator",
      "simulate_change",
      "diagnose_cascade",
      "suggest_improvements",
      "self_improve",
      "rank_windows",
      "benchmark_me",
      "rank_if",
      "operator_gap",
      "field_anomaly",
      "who_operates_like_me",
      "compare_to_field",
      "operator_signature",
    ],
    install: "npx sigrank",
    docs: `${SITE_ORIGIN}/developers`,
    homepage: SITE_ORIGIN,
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
