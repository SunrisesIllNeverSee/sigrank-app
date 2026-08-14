/**
 * app/.well-known/mcp.json/route.ts — MCP server descriptor.
 *
 * Tells AI agents where the SigRank MCP server lives and how to connect.
 * Follows the MCP server card schema.
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
      title: "SigRank — AI Operator Leaderboard",
      version: "1.0.0",
    },
    description:
      "SigRank MCP server gives AI agents 15 tools to measure, rank, and improve token efficiency. The yield cascade metric and live leaderboard as MCP tools. Install with `npx sigrank`.",
    transport: {
      type: "streamable-http",
      endpoint: `${SITE_ORIGIN}/api/v1`,
    },
    authentication: {
      required: false,
    },
    tools: [
      "get_leaderboard",
      "get_operator",
      "get_metric_leaders",
      "compare_operators",
      "get_metrics_info",
      "get_operator_history",
      "get_hall_of_signal",
      "get_operator_records",
      "search_operators",
      "get_submissions",
    ],
    install: "npx sigrank",
    docs: `${SITE_ORIGIN}/mcp`,
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
