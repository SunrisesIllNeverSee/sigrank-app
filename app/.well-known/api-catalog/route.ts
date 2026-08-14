/**
 * app/.well-known/api-catalog/route.ts — API catalog for AI agents.
 *
 * Lists all public API endpoints so AI agents can discover and use them
 * without crawling the site. Follows the API catalog pattern from the
 * AEO plan.
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const catalog = {
    name: "SigRank API",
    version: "1.0.0",
    baseUrl: `${SITE_ORIGIN}/api/v1`,
    description:
      "Public API for AI operator leaderboard data. No authentication required for read endpoints.",
    endpoints: [
      {
        path: "/api/v1/leaderboard",
        method: "GET",
        description: "Get the operator leaderboard with optional window/platform/limit filters",
        params: { window: "7d|30d|90d|all_time", limit: "number (default 30, max 1000)", platform: "string" },
      },
      {
        path: "/api/v1/operators/:codename",
        method: "GET",
        description: "Get a single operator's profile, metrics, and rank",
      },
      {
        path: "/api/v1/operators/:codename/history",
        method: "GET",
        description: "Get an operator's rank history over time",
      },
      {
        path: "/api/v1/metrics",
        method: "GET",
        description: "Get definitions and formulas for all SigRank metrics",
      },
      {
        path: "/api/v1/hall-of-signal",
        method: "GET",
        description: "Get all-time records and badge holders",
      },
      {
        path: "/api/v1/submissions",
        method: "GET",
        description: "Get raw snapshot submissions",
      },
      {
        path: "/api/v1/stats/compare-bump",
        method: "POST",
        description: "Increment the comparisons_ran site counter",
      },
      {
        path: "/api/v1/snapshots",
        method: "POST",
        description: "Submit a new token telemetry snapshot (requires auth)",
      },
      {
        path: "/api/v1/ingest-paste",
        method: "POST",
        description: "Parse pasted token stats and compute yield (no auth)",
      },
      {
        path: "/api/v1/ingest-parse",
        method: "POST",
        description: "Parse a raw telemetry file and extract token counts (no auth)",
      },
    ],
    mcp: {
      endpoint: `${SITE_ORIGIN}/mcp`,
      tools: 15,
      install: "npx sigrank",
    },
    privacy: "Token counts only. Never prompts. No personal data collected.",
  };

  return new NextResponse(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
