/**
 * app/.well-known/ucp/route.ts — Universal Commerce Protocol discovery.
 *
 * Publishes a UCP discovery document so AI agents can discover SigRank's
 * commerce services and capabilities.
 * Spec: https://ucp.dev/specification/overview/
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const doc = {
    protocol_version: "0.1.0",
    spec: "https://ucp.dev/specification/overview/",
    services: [
      {
        id: "leaderboard",
        name: "AI Operator Leaderboard",
        type: "data",
        description:
          "Get the current top-N AI operator rankings by Yield (Υ) — token-cascade efficiency",
        endpoint: `${SITE_ORIGIN}/api/v1/leaderboard`,
        method: "GET",
        pricing: {
          model: "free",
        },
      },
      {
        id: "operator-profile",
        name: "Operator Profile",
        type: "data",
        description:
          "Get a single operator's full profile, metrics, and rank",
        endpoint: `${SITE_ORIGIN}/api/v1/operators/{codename}`,
        method: "GET",
        pricing: {
          model: "free",
        },
      },
      {
        id: "metrics",
        name: "Metric Definitions",
        type: "data",
        description:
          "Get definitions and formulas for all SigRank metrics (Yield, SNR, Leverage, Velocity, 10xDEV)",
        endpoint: `${SITE_ORIGIN}/api/v1/metrics`,
        method: "GET",
        pricing: {
          model: "free",
        },
      },
      {
        id: "hall-of-signal",
        name: "Hall of Signal",
        type: "data",
        description: "Get all-time records and badge holders",
        endpoint: `${SITE_ORIGIN}/api/v1/hall-of-signal`,
        method: "GET",
        pricing: {
          model: "free",
        },
      },
      {
        id: "premium-insights",
        name: "Premium Operator Insights",
        type: "data",
        description:
          "Deep-dive analytics: cascade analysis, archetype distribution, and efficiency projections",
        endpoint: `${SITE_ORIGIN}/api/v1/premium/insights`,
        method: "GET",
        pricing: {
          model: "per-request",
          amount: "0.01",
          currency: "USDC",
          payment_protocol: "x402",
        },
      },
      {
        id: "cascade-report",
        name: "Cascade Analysis Report",
        type: "data",
        description:
          "Full token-cascade analysis report with bottleneck identification and optimization recommendations",
        endpoint: `${SITE_ORIGIN}/api/v1/premium/cascade-report`,
        method: "GET",
        pricing: {
          model: "per-request",
          amount: "0.05",
          currency: "USDC",
          payment_protocol: "x402",
        },
      },
      {
        id: "submit-snapshot",
        name: "Submit Token Telemetry Snapshot",
        type: "action",
        description:
            "Submit a new token telemetry snapshot for operator scoring (requires auth)",
        endpoint: `${SITE_ORIGIN}/api/v1/snapshots`,
        method: "POST",
        pricing: {
          model: "free",
        },
      },
      {
        id: "peer-discovery",
        name: "Peer and Mentor Discovery",
        type: "data",
        description:
          "Find mentors (1-2 class tiers above with similar cascade shapes + pillar deltas), peers (same tier), and complementary operators (whose strength is your weakness). Available via sigrank-mcp discover_peers tool and bestuser-router-mcp. Also available as a WebMCP browser tool on sigeconomy.com.",
        endpoint: `${SITE_ORIGIN}/api/v1/leaderboard`,
        method: "GET",
        pricing: {
          model: "free",
        },
      },
    ],
    capabilities: {
      payment_protocols: ["x402", "stripe"],
      currencies: ["USDC", "USD"],
      authentication: ["oauth2", "bearer"],
      streaming: false,
      rate_limiting: true,
      privacy: "Token counts only. Never prompts. No personal data collected.",
    },
    endpoints: {
      discovery: {
        acp: `${SITE_ORIGIN}/.well-known/acp.json`,
        openapi: `${SITE_ORIGIN}/openapi.json`,
        agent_card: `${SITE_ORIGIN}/.well-known/agent-card.json`,
        mcp: `${SITE_ORIGIN}/.well-known/mcp.json`,
        ucp: `${SITE_ORIGIN}/.well-known/ucp`,
      },
      api: {
        base: `${SITE_ORIGIN}/api/v1`,
        openapi_spec: `${SITE_ORIGIN}/openapi.json`,
      },
      payment: {
        x402_facilitator: "https://facilitator.x402.org",
        stripe_checkout: `${SITE_ORIGIN}/api/v1/billing/create-checkout-session`,
        stripe_portal: `${SITE_ORIGIN}/api/v1/billing/portal`,
      },
      documentation: {
        api_catalog: `${SITE_ORIGIN}/.well-known/api-catalog`,
        mcp_docs: `${SITE_ORIGIN}/mcp`,
        methodology: `${SITE_ORIGIN}/wiki/four-degrees`,
        faq: `${SITE_ORIGIN}/faq`,
      },
    },
    schemas: {
      leaderboard: `${SITE_ORIGIN}/openapi.json#/components/schemas/Leaderboard`,
      operator: `${SITE_ORIGIN}/openapi.json#/components/schemas/Operator`,
      snapshot: `${SITE_ORIGIN}/openapi.json#/components/schemas/Snapshot`,
    },
    provider: {
      name: "SigRank SignalAF",
      url: SITE_ORIGIN,
      contact: `${SITE_ORIGIN}/contact`,
    },
  };

  return new NextResponse(JSON.stringify(doc, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
