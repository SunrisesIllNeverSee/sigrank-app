/**
 * app/.well-known/mcp.json/route.ts — MCP server descriptor.
 *
 * Tells AI agents where the SigRank MCP server lives and how to connect.
 * Follows the MCP server card schema.
 *
 * The server exposes two transports:
 * 1. stdio (primary) — `npx sigrank` or `bunx sigrank` (local process)
 * 2. streamable-http — Supabase Edge Function at
 *    https://<project>.supabase.co/functions/v1/sigrank-mcp
 *
 * The /api/v1 route on signalaf.com is a REST API, NOT an MCP transport.
 * The /mcp route is a documentation landing page, NOT an MCP endpoint.
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  // Supabase Edge Function URL for the streamable-http MCP transport.
  // Falls back to the stdio-only descriptor when the env var is absent.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const httpEndpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/sigrank-mcp`
    : null;

  const card: Record<string, unknown> = {
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
    // Primary transport: stdio via the npm package. This is how the /mcp
    // page instructs users to connect ("npx sigrank or bunx sigrank").
    transports: [
      {
        type: "stdio",
        command: "npx",
        args: ["sigrank"],
      },
    ],
    authentication: {
      required: false,
    },
    // Tool names match the canonical list on /mcp (app/mcp/page.tsx TOOLS).
    // Keep this array in sync with that page if tools are added/removed.
    tools: [
      "rank_paste",
      "get_leaderboard",
      "get_operator",
      "submit_paste",
      "submit_verified",
      "tokenpull",
      "tokenpull_submit",
      "watch_tokenpull",
      "rank_windows",
      "tokenpull_compare",
      "enroll",
      "simulate_change",
      "diagnose_cascade",
      "suggest_improvements",
      "self_improve",
    ],
    install: "npx sigrank",
    docs: `${SITE_ORIGIN}/mcp`,
  };

  // Add the streamable-http transport when the Edge Function URL is
  // configured. This lets remote agents connect without a local install.
  if (httpEndpoint) {
    (card.transports as Array<Record<string, unknown>>).push({
      type: "streamable-http",
      endpoint: httpEndpoint,
    });
  }

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
