/**
 * app/.well-known/acp.json/route.ts — ACP Discovery Document.
 *
 * Publishes an Agentic Commerce Protocol (ACP) discovery document so AI
 * agents can discover SigRank's commerce implementation.
 * Spec: https://agenticcommerce.dev
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const mcpEndpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/sigrank-mcp`
    : `${SITE_ORIGIN}/mcp`;

  const doc = {
    protocol: {
      name: "acp",
      version: "0.1.0",
    },
    api_base_url: `${SITE_ORIGIN}/api/v1`,
    transports: ["HTTP+JSON", "MCP"],
    capabilities: {
      services: [
        {
          id: "leaderboard",
          name: "AI Operator Leaderboard",
          description:
            "Get the current top-N AI operator rankings by Yield (Υ)",
          endpoint: `${SITE_ORIGIN}/api/v1/leaderboard`,
          methods: ["GET"],
        },
        {
          id: "operator-profile",
          name: "Operator Profile",
          description:
            "Get a single operator's full profile, metrics, and rank",
          endpoint: `${SITE_ORIGIN}/api/v1/operators/{codename}`,
          methods: ["GET"],
        },
        {
          id: "metrics",
          name: "Metric Definitions",
          description:
            "Get definitions and formulas for all SigRank metrics (Yield, SNR, Leverage, Velocity, 10xDEV)",
          endpoint: `${SITE_ORIGIN}/api/v1/metrics`,
          methods: ["GET"],
        },
        {
          id: "hall-of-signal",
          name: "Hall of Signal",
          description: "Get all-time records and badge holders",
          endpoint: `${SITE_ORIGIN}/api/v1/hall-of-signal`,
          methods: ["GET"],
        },
        {
          id: "submit-snapshot",
          name: "Submit Token Telemetry Snapshot",
          description:
            "Submit a new token telemetry snapshot for operator scoring (requires auth)",
          endpoint: `${SITE_ORIGIN}/api/v1/snapshots`,
          methods: ["POST"],
        },
        {
          id: "mcp-tools",
          name: "MCP Tool Suite",
          description:
            "15 MCP tools for measuring, ranking, and improving token efficiency",
          endpoint: mcpEndpoint,
          methods: ["MCP"],
        },
        {
          id: "peer-discovery",
          name: "Peer and Mentor Discovery",
          description:
            "Find mentors (1-2 class tiers above with similar cascade shapes), peers (same tier), and complementary operators. Returns pillar deltas that explain yield gaps. Available via sigrank-mcp (discover_peers tool) and bestuser-router-mcp.",
          endpoint: `${SITE_ORIGIN}/api/v1/leaderboard`,
          methods: ["GET"],
        },
      ],
    },
    authentication: {
      type: "oauth2",
      description:
        "Read endpoints are public. Snapshot submission requires Supabase auth.",
      public_endpoints: ["/api/v1/leaderboard", "/api/v1/operators", "/api/v1/metrics", "/api/v1/hall-of-signal"],
    },
    provider: {
      name: "SigRank SignalAF",
      url: SITE_ORIGIN,
    },
  };

  return new NextResponse(JSON.stringify(doc, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
