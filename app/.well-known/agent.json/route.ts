/**
 * app/.well-known/agent.json/route.ts — Agent metadata.
 *
 * Lightweight agent metadata for AI engines that check .well-known/agent.json
 * for site identity and capabilities. Complements agent-card.json (A2A Protocol).
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN, SITE_NAME } from "@/lib/seo";
import { TOOLS } from "@/lib/mcp/tools";
import {
  SIGRANK_STANDARD_SCHEMA_URL,
  SIGRANK_STANDARD_URL,
  SIGRANK_STANDARD_VERSION,
} from "@/lib/mcp/standard";

export const revalidate = 3600;

export async function GET() {
  const meta = {
    name: SITE_NAME,
    type: "leaderboard",
    description:
      "SigRank SignalAF ranks AI operators by Yield (Υ) — token-cascade efficiency. Privacy-preserving: token counts only, never prompts.",
    url: SITE_ORIGIN,
    api: {
      v1: `${SITE_ORIGIN}/api/v1`,
      docs: `${SITE_ORIGIN}/mcp`,
    },
    mcp: {
      endpoint: `${SITE_ORIGIN}/api/mcp`,
      discovery: `${SITE_ORIGIN}/.well-known/mcp.json`,
      tools: TOOLS.length,
    },
    standard: {
      version: SIGRANK_STANDARD_VERSION,
      status: "proposed_open_standard",
      url: SIGRANK_STANDARD_URL,
      schema: SIGRANK_STANDARD_SCHEMA_URL,
      record_tool: "get_sigrank_standard_record",
      core_metrics: ["Yield", "Leverage", "Velocity", "SNR", "10xDEV"],
    },
    product_metrics: ["Scale V", "Efficiency", "Cost per 1M", "Op Ratio"],
    install: "npx sigrank",
    privacy: "Token counts only. Never prompts.",
    links: {
      leaderboard: `${SITE_ORIGIN}/board/all`,
      hall: `${SITE_ORIGIN}/hall`,
      score: `${SITE_ORIGIN}/score`,
      methodology: `${SITE_ORIGIN}/wiki/four-degrees`,
      faq: `${SITE_ORIGIN}/faq`,
      blog: `${SITE_ORIGIN}/blog`,
      research: `${SITE_ORIGIN}/research`,
    },
  };

  return new NextResponse(JSON.stringify(meta, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
