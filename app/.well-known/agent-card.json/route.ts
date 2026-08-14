/**
 * app/.well-known/agent-card.json/route.ts — A2A Protocol Agent Card.
 *
 * Agent identity card for AI agents discovering SigRank via the
 * A2A Protocol (https://a2a-protocol.org/). Tells agents what SigRank
 * is, what it can do, and how to interact with it.
 *
 * Interface bindings point to actual endpoints, not documentation pages:
 * - HTTP+JSON → /api/v1 (the REST API)
 * - MCP → Supabase Edge Function (streamable-http transport)
 *   The /mcp route is a documentation landing page, not an MCP endpoint.
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  // Supabase Edge Function URL for the MCP streamable-http transport.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mcpEndpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/sigrank-mcp`
    : null;

  const supportedInterfaces: Array<Record<string, unknown>> = [
    {
      url: `${SITE_ORIGIN}/api/v1`,
      protocolBinding: "HTTP+JSON",
      protocolVersion: "0.3.0",
    },
  ];

  // Only advertise the MCP binding when the Edge Function URL is
  // configured. Without it, the only MCP transport is stdio (npx sigrank),
  // which is not an HTTP endpoint and doesn't belong in supportedInterfaces.
  if (mcpEndpoint) {
    supportedInterfaces.push({
      url: mcpEndpoint,
      protocolBinding: "MCP",
      protocolVersion: "2025-06-18",
    });
  }

  const card = {
    name: "SigRank — AI Operator Leaderboard",
    version: "1.0.0",
    description:
      "SigRank ranks AI operators by Yield (Υ = cache_read × output / input²) — token-cascade efficiency, not raw spend. Run `npx sigrank` to measure your efficiency. Privacy-preserving: token counts only, never prompts.",
    url: SITE_ORIGIN,
    protocolVersion: "0.3.0",
    supportedInterfaces,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    skills: [
      {
        id: "leaderboard",
        name: "AI Operator Leaderboard",
        description: "Get the current top-N AI operator rankings by Yield (Υ)",
        inputSchema: { window: "string", limit: "number", platform: "string" },
      },
      {
        id: "operator",
        name: "Operator Profile",
        description: "Get a single operator's full profile, metrics, and rank",
        inputSchema: { codename: "string" },
      },
      {
        id: "metrics",
        name: "Metric Definitions",
        description: "Get definitions and formulas for all SigRank metrics",
      },
      {
        id: "hall-of-signal",
        name: "Hall of Signal",
        description: "Get all-time records and badge holders",
      },
      {
        id: "compare",
        name: "Compare Operators",
        description: "Head-to-head comparison of two operators",
        inputSchema: { a: "string", b: "string" },
      },
    ],
    provider: {
      name: "SigRank",
      url: SITE_ORIGIN,
    },
    privacy: {
      dataCollected: "Token counts only (input, output, cache_read, cache_write)",
      dataNotCollected: "Prompts, code, file contents, personal data",
      storage: "Signed, server-verifiable snapshots",
    },
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
