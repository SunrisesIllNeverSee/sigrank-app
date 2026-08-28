/**
 * app/.well-known/agent-card.json/route.ts — A2A Protocol Agent Card.
 *
 * Agent identity card for AI agents discovering SigRank via the
 * A2A Protocol (https://a2a-protocol.org/). Tells agents what SigRank
 * is, what it can do, and how to interact with it.
 *
 * Interface bindings point to actual endpoints, not documentation pages:
 * - HTTP+JSON → /api/v1 (the REST API)
 * - MCP → /api/mcp (streamable-http transport)
 *   The /mcp route remains the documentation landing page.
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";
import { SIGRANK_STANDARD_VERSION } from "@/lib/mcp/standard";

export const revalidate = 3600;

export async function GET() {
  const supportedInterfaces: Array<Record<string, unknown>> = [
    {
      url: `${SITE_ORIGIN}/api/mcp`,
      protocolBinding: "MCP",
      protocolVersion: "2025-06-18",
    },
  ];

  const card = {
    name: "Upsilon by SignalAF — AI Operator Measurement Engine",
    version: "1.0.0",
    description:
      "Upsilon is SignalAF's privacy-preserving AI operator measurement engine. It computes Yield from four token counts; SigRank is the public leaderboard and proof surface. It does not read prompts or code.",
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
        description: "Get definitions and formulas for SigRank core and product metrics",
      },
      {
        id: "standard-record",
        name: "Portable Upsilon Measurement Record",
        description:
          `Create a ${SIGRANK_STANDARD_VERSION} record from I/O/W/R telemetry. The base record excludes Construction, Build Archetypes, and RS05.`,
        inputSchema: {
          input: "non-negative integer",
          output: "non-negative integer",
          cache_write: "non-negative integer or null",
          cache_read: "non-negative integer or null",
        },
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
      {
        id: "discover-peers",
        name: "Discover Peers and Mentors",
        description:
          "Find mentors (1-2 class tiers above with similar cascade shapes + pillar deltas), peers (same tier), and complementary operators (whose strength is your weakness). Uses enrolled device identity — no codename needed.",
        inputSchema: { platform: "string", n: "number" },
      },
      {
        id: "contribution-exchange",
        name: "Contribution Exchange",
        description:
          "Discover domain-published signals or propose useful unsolicited contributions. Signals describe problems, requests, challenges, bounties, verification tasks, discoveries, and experiments. Neither a signal nor a proposal grants execution authority or creates a payment obligation — Commitments require separate bilateral acceptance.",
        tags: ["contributions", "exchange", "agent-work", "signals"],
      },
    ],
    provider: {
      name: "SignalAF",
      url: SITE_ORIGIN,
    },
    privacy: {
      dataCollected: "Token counts only (input, output, cache_read, cache_write)",
      dataNotCollected: "Prompts, code, file contents, personal data",
      storage: "Signed, server-verifiable snapshots",
    },
    // AP2 (Agent Payments Protocol) extension — declares SigRank's role in
    // agentic commerce so AI agents can securely transact payments using
    // cryptographically-signed mandates.
    // Spec: https://ap2-protocol.org/
    extensions: [
      {
        uri: "https://github.com/google-agentic-commerce/AP2/tree/v0.1.0",
        description:
          "Agent Payments Protocol — SigRank acts as a merchant, accepting payments for premium API access and operator scoring services.",
        required: true,
        params: {
          roles: ["merchant"],
        },
      },
      {
        uri: "https://signalaf.com/spec/contribution-exchange",
        description:
          "Contribution Exchange discovery and proposal support. Agents can discover domain-published signals, submit bounded attempts, and propose unsolicited contributions. Neither a signal nor a proposal grants execution authority or creates a payment obligation.",
        required: false,
        params: {
          profile: `${SITE_ORIGIN}/.well-known/exchange.json`,
          agentGuide: `${SITE_ORIGIN}/agents.md`,
          steward: `${SITE_ORIGIN}/api/exchange/steward/${new URL(SITE_ORIGIN).hostname}`,
          signals: `${SITE_ORIGIN}/api/exchange/signals`,
        },
      },
    ],
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
