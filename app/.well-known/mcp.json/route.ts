/**
 * MCP server card for SigRank SignalAF.
 * The same product is available remotely over Streamable HTTP and locally over stdio.
 *
 * Contribution Exchange tools have moved to a dedicated MCP server:
 *   https://signalaf.com/.well-known/exchange-mcp.json
 *   https://signalaf.com/api/exchange/mcp
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";
import { TOOLS } from "@/lib/mcp/tools";
import { SIGRANK_STANDARD_VERSION } from "@/lib/mcp/standard";

export const revalidate = 3600;

export async function GET() {
  const card = {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2026-07-28",
    supportedProtocolVersions: ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"],
    serverInfo: {
      name: "sigrank",
      title: "Upsilon — SignalAF Measurement Engine",
      version: "1.0.0",
    },
    description:
      `Upsilon is SignalAF's commercial measurement engine and the reference implementation for ${SIGRANK_STANDARD_VERSION}. It exposes privacy-preserving operator records and calculations; SigRank is the public leaderboard and proof surface. Use the metrics for operator-layer measurement, not as cognition, model-quality, work-quality, productivity, or business-value claims.`,
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
    tools: TOOLS.map((tool) => tool.name),
    prompts: [
      "benchmark-my-operator",
      "how-do-i-reach-top-10",
      "explain-my-signature",
      "diagnose-inefficiency",
      "field-anomaly-report",
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
