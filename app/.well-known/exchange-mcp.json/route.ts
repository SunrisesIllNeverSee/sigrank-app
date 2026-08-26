/**
 * MCP server card for the Contribution Exchange.
 *
 * This is a separate MCP server from SigRank, with its own endpoint,
 * identity, and tool catalog. It exposes the Contribution Exchange
 * discovery and ingress layer.
 *
 * Endpoint: https://signalaf.com/api/exchange/mcp
 * Server identity: contribution-exchange
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
      name: "contribution-exchange",
      title: "Contribution Exchange MCP",
      version: "1.0.0",
    },
    description:
      "The Contribution Exchange MCP exposes domain profiles, published Exchange Signals, and unsolicited Contribution Proposal submission to MCP clients. No tool creates a Commitment, authorization, or settlement. Signals and proposals are invitational, not binding. Bilateral terms-hash acceptance is required for Commitment formation.",
    transports: [
      {
        type: "streamable-http",
        endpoint: `${SITE_ORIGIN}/api/exchange/mcp`,
      },
    ],
    authentication: {
      required: false,
      documentation: `${SITE_ORIGIN}/exchange`,
      scopes: [
        { name: "exchange:read", description: "Read-only Exchange discovery: domain profiles, policy, signals, attempts. Always granted." },
        { name: "exchange:attempt", description: "Create and submit signal attempts. Requires x-exchange-actor-id header." },
        { name: "exchange:propose", description: "Submit unsolicited proposals and create proposals from verified attempts. Requires x-exchange-agent-key or x-exchange-proposer-key header." },
      ],
      userControl:
        "State-changing tools (exchange_propose, exchange_create_attempt, exchange_submit_attempt, exchange_create_proposal_from_attempt) require authentication headers. " +
        "Read-only tools are always available. No tool can create a Commitment, authorization, or settlement. " +
        "Every mutation response includes authoritative_exchange_state_advanced: false.",
    },
    tools: [
      "exchange_discover_domain",
      "exchange_get_policy",
      "exchange_preflight",
      "exchange_list_signals",
      "exchange_get_signal",
      "exchange_get_attempt",
      "exchange_create_attempt",
      "exchange_submit_attempt",
      "exchange_propose",
      "exchange_create_proposal_from_attempt",
    ],
    toolBehavior: {
      readOnly: [
        "exchange_discover_domain",
        "exchange_get_policy",
        "exchange_preflight",
        "exchange_list_signals",
        "exchange_get_signal",
        "exchange_get_attempt",
      ],
      mutation: [
        "exchange_propose",
        "exchange_create_attempt",
        "exchange_submit_attempt",
        "exchange_create_proposal_from_attempt",
      ],
      authoritativeStateBoundary:
        "No MCP tool advances authoritative Exchange state. Every mutation response includes authoritative_exchange_state_advanced: false. " +
        "Commitment formation requires separate bilateral terms-hash acceptance outside this MCP server.",
    },
    links: {
      exchangeProfile: `${SITE_ORIGIN}/.well-known/exchange.json`,
      agentGuide: `${SITE_ORIGIN}/agents.md`,
      exchangePage: `${SITE_ORIGIN}/exchange`,
      signalsPage: `${SITE_ORIGIN}/exchange/signals`,
      schema: `${SITE_ORIGIN}/exchange.schema.json`,
    },
    homepage: SITE_ORIGIN,
  };

  return new NextResponse(JSON.stringify(card, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
