/**
 * lib/exchange/mcp-server.ts — Contribution Exchange MCP server definitions.
 *
 * This module contains the Exchange-specific tool definitions, dispatch logic,
 * scope filtering, and server identity used by the dedicated Contribution
 * Exchange MCP endpoint at /api/exchange/mcp.
 *
 * The handlers themselves live in lib/exchange/mcp-tools.ts and are reused
 * by both the dedicated Exchange MCP route and (temporarily) any compatibility
 * bridge in the SigRank route.
 *
 * Core invariants:
 * - No tool creates a Commitment, authorization, or settlement
 * - Every mutation response includes authoritative_exchange_state_advanced: false
 * - exchange_preflight is read-only (calls evaluateProposal, no DB writes)
 * - Scope filtering at tools/list AND enforcement at tools/call
 */

import type { NextRequest } from "next/server";
import {
  handleDiscoverDomain,
  handleGetPolicy,
  handlePreflight,
  handlePropose,
  handleListSignals,
  handleGetSignal,
  handleGetAttempt,
  handleCreateAttempt,
  handleSubmitAttempt,
  handleCreateProposalFromAttempt,
  resolveScopes,
  enforceScopeForCall,
  type ExchangeScope,
} from "./mcp-tools";
import { textResult } from "@/lib/mcp/protocol";

// ─── Tool definitions ───────────────────────────────────────────────────────

export const EXCHANGE_TOOL_DEFINITIONS = [
  {
    name: "exchange_discover_domain",
    title: "Exchange Discover Domain — Contribution Exchange Profile Lookup",
    description:
      "Determine whether a domain publishes a Contribution Exchange profile. Returns the canonical Exchange manifest, policy URLs, signal URLs, and whether the domain is self-hosted or delegated to a Steward. Read-only — does not propose, commit, or authorize anything. Enforces HTTPS, redirect limits, timeouts, and SSRF protections (blocks loopback, link-local, private-network, and metadata-service targets).",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["domain"],
      properties: {
        domain: { type: "string", minLength: 3, maxLength: 253, description: "Domain name or HTTPS URL to check (e.g. 'signalaf.com' or 'https://signalaf.com'). Normalized to hostname." },
      },
    },
  },
  {
    name: "exchange_get_policy",
    title: "Exchange Get Policy — Domain Exchange Policy",
    description:
      "Fetch the canonical Contribution Exchange policy for a domain or its delegated Steward. Returns authority ceilings, consideration limits, human-review requirements, and supported behavior. Read-only — does not mutate state or perform preflight evaluation. Distinguishes a missing policy from an unavailable service.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["domain"],
      properties: {
        domain: { type: "string", minLength: 3, maxLength: 253, description: "Domain name to fetch policy for." },
      },
    },
  },
  {
    name: "exchange_preflight",
    title: "Exchange Preflight — Advisory Proposal Policy Evaluation",
    description:
      "Evaluate a proposed contribution against the same policy logic used by the real proposal flow. Returns whether the proposal is likely to be auto-engaged, accepted for review, escalated to a human, or rejected as invalid. READ-ONLY: performs no proposal insertion, notification, event creation, or state transition. The result is advisory and time-bound — a favorable preflight does NOT guarantee engagement, Commitment, authorization, payment, or execution. Uses the same evaluateProposal function as the canonical proposal route.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["domain", "category"],
      properties: {
        domain: { type: "string", minLength: 3, maxLength: 253, description: "Target domain for the proposed contribution." },
        category: { type: "string", description: "Contribution category (e.g. 'technical', 'accessibility', 'documentation', 'research')." },
        consideration: { type: "array", description: "Requested consideration (cash, royalty, reciprocal_access, attribution, referral, other). Advertised consideration is NOT binding until accepted through Commitment.", items: { type: "object" } },
        required_authorization: { type: "object", description: "Authority requested (inspect_public, sandbox_test, repository_write, private_data, credential_access, production_modify, deploy, penetration_testing).", properties: { inspect_public: { type: "boolean" }, sandbox_test: { type: "boolean" }, repository_read: { type: "boolean" }, repository_write: { type: "boolean" }, private_data: { type: "boolean" }, credential_access: { type: "boolean" }, production_modify: { type: "boolean" }, deploy: { type: "boolean" }, penetration_testing: { type: "boolean" }, other: { type: "array", items: { type: "string" } } } },
        confidence: { type: "object", description: "Confidence in the observation (score 0-1 and basis).", properties: { score: { type: "number", minimum: 0, maximum: 1 }, basis: { type: "string" } } },
      },
    },
  },
  {
    name: "exchange_propose",
    title: "Exchange Propose — Unsolicited Contribution Proposal",
    description:
      "Submit an unsolicited Contribution Proposal through the existing Exchange flow. Creates a NON-BINDING proposal in state 'proposed'. Does NOT create a Commitment, authorization, or payment obligation. The domain agent evaluates the proposal against policy and may auto-engage, escalate to a human, or decline. Commitment requires separate bilateral acceptance of byte-identical terms. Requires an idempotency key — retries with the same key return the original result. Preserves unsolicited-origin lineage.",
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["target_domain", "title", "observation", "proposed_contribution", "idempotency_key"],
      properties: {
        target_domain: { type: "string", minLength: 3, maxLength: 253, description: "Domain to propose to." },
        title: { type: "string", minLength: 1, maxLength: 200, description: "Proposal title." },
        observation: { type: "string", minLength: 10, maxLength: 20000, description: "What was discovered." },
        proposed_contribution: { type: "string", minLength: 10, maxLength: 20000, description: "What value will be created." },
        category: { type: "string", default: "other", description: "Contribution category." },
        desired_outcome: { type: "string", maxLength: 4000, description: "Expected outcome if accepted." },
        evidence_uris: { type: "array", items: { type: "string" }, description: "Evidence URLs." },
        consideration: { type: "array", items: { type: "object" }, description: "Requested consideration. NOT binding until Commitment." },
        required_authorization: { type: "object", description: "Authority requested." },
        confidence: { type: "object", description: "Confidence in the observation." },
        impact: { type: "object", description: "Expected impact." },
        verification: { type: "object", description: "How success can be determined." },
        effort: { type: "object", description: "Estimated effort." },
        agent_id: { type: "string", description: "Registered agent ID (optional)." },
        agent_name: { type: "string", description: "Agent display name." },
        agent_did: { type: "string", description: "Agent DID." },
        contact_email: { type: "string", description: "Contact email." },
        referral_code: { type: "string", description: "Referral code." },
        idempotency_key: { type: "string", minLength: 1, maxLength: 200, description: "Idempotency key. Retry with same key + same content returns the original result." },
      },
    },
  },
  {
    name: "exchange_list_signals",
    title: "Exchange List Signals — Domain-Published Work Signals",
    description:
      "List domain-published Exchange Signals (problems, requests, challenges, bounties, verification tasks, discoveries, experiments). Read-only. Returns canonical URLs, signal revision, revision hash, and status. Signal status is DISTINCT from exchange status — a signal does not create a Commitment or authorize execution. Supports the same filters and pagination as the HTTP API.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        domain: { type: "string", description: "Filter by publisher domain." },
        type: { type: "string", enum: ["problem", "request", "challenge", "bounty", "verification", "discovery", "experiment"], description: "Filter by signal type." },
        status: { type: "string", enum: ["published", "paused", "closed", "expired", "withdrawn"], description: "Filter by signal status." },
        label: { type: "string", description: "Filter by label." },
        verification_mode: { type: "string", enum: ["deterministic", "hybrid", "manual"], description: "Filter by verification mode." },
        consideration_mode: { type: "string", enum: ["fixed", "maximum", "negotiable"], description: "Filter by consideration mode." },
        accepting_attempts: { type: "boolean", description: "Only return signals currently accepting attempts." },
        published_after: { type: "string", description: "ISO 8601 timestamp — only signals published after this." },
        expires_before: { type: "string", description: "ISO 8601 timestamp — only signals expiring before this." },
        cursor: { type: "string", description: "Pagination cursor from a previous response." },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 50, description: "Maximum signals to return (1-100, default 50)." },
      },
    },
  },
  {
    name: "exchange_get_signal",
    title: "Exchange Get Signal — Signal Detail by ID",
    description:
      "Get full detail for a single Exchange Signal by ID. Read-only. Returns the complete signal including constraints, participation rules, verification configuration, consideration declaration, and follow-on behavior. A signal does NOT create a Commitment, authorize execution, or guarantee payment.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["signal_id"],
      properties: {
        signal_id: { type: "string", minLength: 1, maxLength: 200, description: "Signal ID." },
      },
    },
  },
  {
    name: "exchange_get_attempt",
    title: "Exchange Get Attempt — Signal Attempt Detail",
    description:
      "Get detail for a signal attempt. Read-only. Enforces attempt visibility — actors may only read their own private attempts. Returns attempt status and verification result if available. Attempt status is NOT an exchange state. Verification is Steward-controlled and cannot be self-asserted.",
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["signal_id", "attempt_id"],
      properties: {
        signal_id: { type: "string", minLength: 1, maxLength: 200, description: "Signal ID." },
        attempt_id: { type: "string", minLength: 1, maxLength: 200, description: "Attempt ID." },
      },
    },
  },
  {
    name: "exchange_create_attempt",
    title: "Exchange Create Attempt — Signal Attempt Creation",
    description:
      "Create an attempt on a published Exchange Signal. Binds to the exact published signal revision. Requires authentication unless the signal explicitly permits anonymous attempts. Requires an idempotency key. Enforces maximum and concurrent attempt limits. Does NOT verify a contribution, create a Commitment, or advance exchange state. Submit work via exchange_submit_attempt after creation.",
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["signal_id", "idempotency_key"],
      properties: {
        signal_id: { type: "string", minLength: 1, maxLength: 200, description: "Signal ID to attempt." },
        idempotency_key: { type: "string", minLength: 1, maxLength: 200, description: "Idempotency key. Same key + same content returns the original result." },
        declarations: { type: "object", description: "Attempt declarations (constraints_observed, unauthorized_actions_taken, requested_consideration)." },
      },
    },
  },
  {
    name: "exchange_submit_attempt",
    title: "Exchange Submit Attempt — Signal Work Submission",
    description:
      "Submit work for a signal attempt. Enforces accepted media types and maximum body size. Computes a SHA-256 body digest. Does NOT verify the contribution or advance exchange state. Verification is Steward-controlled and cannot be self-asserted. Requires an idempotency key — retries with the same key and identical body return the original result.",
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["signal_id", "attempt_id", "body", "idempotency_key"],
      properties: {
        signal_id: { type: "string", minLength: 1, maxLength: 200, description: "Signal ID." },
        attempt_id: { type: "string", minLength: 1, maxLength: 200, description: "Attempt ID from exchange_create_attempt." },
        body: { type: "string", description: "Submission body (text or JSON string)." },
        media_type: { type: "string", description: "Media type of the submission (e.g. 'application/json', 'text/plain'). Must be in the signal's accepted_media_types." },
        artifact_references: { type: "array", items: { type: "object", properties: { uri: { type: "string" }, digest: { type: "string" } } }, description: "Artifact references with URI and digest." },
        idempotency_key: { type: "string", minLength: 1, maxLength: 200, description: "Idempotency key. Same key + same body returns the original result. Reuse with different body returns a conflict." },
      },
    },
  },
  {
    name: "exchange_create_proposal_from_attempt",
    title: "Exchange Create Proposal from Attempt — Signal Follow-On Proposal",
    description:
      "Create an ordinary Contribution Proposal from a verified signal attempt. Requires a verified attempt. Respects the signal's follow-on mode. Requires and validates qualification when configured. Creates an ordinary contribution_proposal in state 'proposed' with signal lineage. Does NOT create a Commitment, authorization, or settlement. Bilateral terms-hash acceptance is still required. Advertised consideration is copied as proposed terms only — NOT binding. Requires an idempotency key — retries with the same key return the original result.",
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["signal_id", "attempt_id", "idempotency_key"],
      properties: {
        signal_id: { type: "string", minLength: 1, maxLength: 200, description: "Signal ID." },
        attempt_id: { type: "string", minLength: 1, maxLength: 200, description: "Verified attempt ID." },
        qualification_id: { type: "string", description: "Qualification ID (required if signal's follow-on policy requires qualification)." },
        title: { type: "string", description: "Proposal title (defaults to signal title)." },
        proposed_contribution: { type: "string", description: "Proposed contribution (defaults to signal description)." },
        consideration: { type: "array", items: { type: "object" }, description: "Proposed consideration. Copied from signal advertised consideration as terms only — NOT binding." },
        idempotency_key: { type: "string", minLength: 1, maxLength: 200, description: "Idempotency key. Same key + same content returns the original result." },
      },
    },
  },
] as const;

// ─── Server identity ────────────────────────────────────────────────────────

export const EXCHANGE_SERVER_INFO = {
  name: "contribution-exchange",
  title: "Contribution Exchange MCP",
  version: "1.0.0",
  description:
    "Contribution Exchange — discover domain profiles, published Exchange Signals, and submit non-binding Contribution Proposals. No tool creates a Commitment, authorization, or settlement.",
};

export const EXCHANGE_INSTRUCTIONS =
  "Contribution Exchange MCP — discover and act on Contribution Exchange opportunities. " +
  "Read-only tools: exchange_discover_domain (check if a domain has an Exchange profile), " +
  "exchange_get_policy (fetch domain policy), exchange_preflight (advisory policy evaluation — no state change), " +
  "exchange_list_signals (domain-published work signals), exchange_get_signal, exchange_get_attempt. " +
  "Mutation tools (require auth): exchange_propose (unsolicited proposal — creates a non-binding proposal, NOT a Commitment), " +
  "exchange_create_attempt, exchange_submit_attempt, exchange_create_proposal_from_attempt. " +
  "IMPORTANT: No Exchange tool creates a Commitment, authorization, or payment obligation. " +
  "Signals and proposals are invitational, not binding. " +
  "Bilateral terms-hash acceptance is required for Commitment formation.";

// ─── Scope filtering ────────────────────────────────────────────────────────

/**
 * Filter the Exchange tool list by the caller's scopes.
 * Read-only tools are always visible. Mutation tools require their scope.
 */
export function filterExchangeToolsByScope(scopes: Set<ExchangeScope>) {
  return EXCHANGE_TOOL_DEFINITIONS.filter((tool) => {
    if (tool.annotations?.readOnlyHint) return true;
    if (tool.name === "exchange_propose") return scopes.has("exchange:propose");
    if (tool.name === "exchange_create_attempt" || tool.name === "exchange_submit_attempt") return scopes.has("exchange:attempt");
    if (tool.name === "exchange_create_proposal_from_attempt") return scopes.has("exchange:propose");
    return false;
  });
}

// ─── Tool dispatch ──────────────────────────────────────────────────────────

/**
 * Dispatch an Exchange tool call. Returns a standard MCP tool-call result
 * (content + optional isError). Throws are not expected — handlers return
 * structured error objects.
 */
export async function dispatchExchangeTool(
  name: string,
  args: Record<string, unknown>,
  req: NextRequest,
) {
  if (name === "exchange_discover_domain") {
    const domain = typeof args.domain === "string" ? args.domain : "";
    if (!domain) return textResult({ code: "invalid_arguments", message: "domain is required" }, true);
    const result = await handleDiscoverDomain({ domain });
    return textResult(result);
  }

  if (name === "exchange_get_policy") {
    const domain = typeof args.domain === "string" ? args.domain : "";
    if (!domain) return textResult({ code: "invalid_arguments", message: "domain is required" }, true);
    const result = await handleGetPolicy({ domain });
    return textResult(result);
  }

  if (name === "exchange_preflight") {
    const domain = typeof args.domain === "string" ? args.domain : "";
    const category = typeof args.category === "string" ? args.category : "";
    if (!domain || !category) return textResult({ code: "invalid_arguments", message: "domain and category are required" }, true);
    const result = await handlePreflight({
      domain,
      category,
      consideration: Array.isArray(args.consideration) ? args.consideration : undefined,
      required_authorization: typeof args.required_authorization === "object" && args.required_authorization !== null ? args.required_authorization as Record<string, unknown> : undefined,
      confidence: typeof args.confidence === "object" && args.confidence !== null ? args.confidence as Record<string, unknown> : undefined,
    });
    return textResult(result);
  }

  if (name === "exchange_propose") {
    const target_domain = typeof args.target_domain === "string" ? args.target_domain : "";
    const title = typeof args.title === "string" ? args.title : "";
    const observation = typeof args.observation === "string" ? args.observation : "";
    const proposed_contribution = typeof args.proposed_contribution === "string" ? args.proposed_contribution : "";
    const idempotency_key = typeof args.idempotency_key === "string" ? args.idempotency_key : "";
    if (!target_domain || !title || !observation || !proposed_contribution || !idempotency_key) {
      return textResult({ code: "invalid_arguments", message: "target_domain, title, observation, proposed_contribution, and idempotency_key are required" }, true);
    }
    const result = await handlePropose(req, {
      target_domain,
      title,
      observation,
      proposed_contribution,
      category: typeof args.category === "string" ? args.category : undefined,
      desired_outcome: typeof args.desired_outcome === "string" ? args.desired_outcome : undefined,
      evidence_uris: Array.isArray(args.evidence_uris) ? args.evidence_uris as string[] : undefined,
      consideration: Array.isArray(args.consideration) ? args.consideration : undefined,
      required_authorization: typeof args.required_authorization === "object" && args.required_authorization !== null ? args.required_authorization as Record<string, unknown> : undefined,
      confidence: typeof args.confidence === "object" && args.confidence !== null ? args.confidence as Record<string, unknown> : undefined,
      impact: typeof args.impact === "object" && args.impact !== null ? args.impact as Record<string, unknown> : undefined,
      verification: typeof args.verification === "object" && args.verification !== null ? args.verification as Record<string, unknown> : undefined,
      effort: typeof args.effort === "object" && args.effort !== null ? args.effort as Record<string, unknown> : undefined,
      agent_id: typeof args.agent_id === "string" ? args.agent_id : undefined,
      agent_name: typeof args.agent_name === "string" ? args.agent_name : undefined,
      agent_did: typeof args.agent_did === "string" ? args.agent_did : undefined,
      contact_email: typeof args.contact_email === "string" ? args.contact_email : undefined,
      referral_code: typeof args.referral_code === "string" ? args.referral_code : undefined,
      idempotency_key,
    });
    return textResult(result);
  }

  if (name === "exchange_list_signals") {
    const result = await handleListSignals({
      domain: typeof args.domain === "string" ? args.domain : undefined,
      type: typeof args.type === "string" ? args.type : undefined,
      status: typeof args.status === "string" ? args.status : undefined,
      label: typeof args.label === "string" ? args.label : undefined,
      verification_mode: typeof args.verification_mode === "string" ? args.verification_mode : undefined,
      consideration_mode: typeof args.consideration_mode === "string" ? args.consideration_mode : undefined,
      accepting_attempts: typeof args.accepting_attempts === "boolean" ? args.accepting_attempts : undefined,
      published_after: typeof args.published_after === "string" ? args.published_after : undefined,
      expires_before: typeof args.expires_before === "string" ? args.expires_before : undefined,
      cursor: typeof args.cursor === "string" ? args.cursor : undefined,
      limit: typeof args.limit === "number" ? args.limit : undefined,
    });
    return textResult(result);
  }

  if (name === "exchange_get_signal") {
    const signal_id = typeof args.signal_id === "string" ? args.signal_id : "";
    if (!signal_id) return textResult({ code: "invalid_arguments", message: "signal_id is required" }, true);
    const result = await handleGetSignal({ signal_id });
    return textResult(result);
  }

  if (name === "exchange_get_attempt") {
    const signal_id = typeof args.signal_id === "string" ? args.signal_id : "";
    const attempt_id = typeof args.attempt_id === "string" ? args.attempt_id : "";
    if (!signal_id || !attempt_id) return textResult({ code: "invalid_arguments", message: "signal_id and attempt_id are required" }, true);
    const result = await handleGetAttempt(req, { signal_id, attempt_id });
    return textResult(result);
  }

  if (name === "exchange_create_attempt") {
    const signal_id = typeof args.signal_id === "string" ? args.signal_id : "";
    const idempotency_key = typeof args.idempotency_key === "string" ? args.idempotency_key : "";
    if (!signal_id || !idempotency_key) return textResult({ code: "invalid_arguments", message: "signal_id and idempotency_key are required" }, true);
    const result = await handleCreateAttempt(req, {
      signal_id,
      idempotency_key,
      declarations: typeof args.declarations === "object" && args.declarations !== null ? args.declarations as Record<string, unknown> : undefined,
    });
    return textResult(result);
  }

  if (name === "exchange_submit_attempt") {
    const signal_id = typeof args.signal_id === "string" ? args.signal_id : "";
    const attempt_id = typeof args.attempt_id === "string" ? args.attempt_id : "";
    const body = typeof args.body === "string" ? args.body : "";
    const idempotency_key = typeof args.idempotency_key === "string" ? args.idempotency_key : "";
    if (!signal_id || !attempt_id || !body || !idempotency_key) return textResult({ code: "invalid_arguments", message: "signal_id, attempt_id, body, and idempotency_key are required" }, true);
    const result = await handleSubmitAttempt(req, {
      signal_id,
      attempt_id,
      body,
      idempotency_key,
      media_type: typeof args.media_type === "string" ? args.media_type : undefined,
      artifact_references: Array.isArray(args.artifact_references) ? args.artifact_references as Array<{ uri: string; digest: string }> : undefined,
    });
    return textResult(result);
  }

  if (name === "exchange_create_proposal_from_attempt") {
    const signal_id = typeof args.signal_id === "string" ? args.signal_id : "";
    const attempt_id = typeof args.attempt_id === "string" ? args.attempt_id : "";
    const idempotency_key = typeof args.idempotency_key === "string" ? args.idempotency_key : "";
    if (!signal_id || !attempt_id || !idempotency_key) return textResult({ code: "invalid_arguments", message: "signal_id, attempt_id, and idempotency_key are required" }, true);
    const result = await handleCreateProposalFromAttempt(req, {
      signal_id,
      attempt_id,
      idempotency_key,
      qualification_id: typeof args.qualification_id === "string" ? args.qualification_id : undefined,
      title: typeof args.title === "string" ? args.title : undefined,
      proposed_contribution: typeof args.proposed_contribution === "string" ? args.proposed_contribution : undefined,
      consideration: Array.isArray(args.consideration) ? args.consideration : undefined,
    });
    return textResult(result);
  }

  return textResult({ code: "tool_not_found", message: `Unknown tool: ${name}` }, true);
}

/**
 * Check whether a tool name is an Exchange tool.
 * Used by the SigRank route's compatibility bridge to dispatch legacy calls.
 */
export function isExchangeTool(name: string): boolean {
  return EXCHANGE_TOOL_DEFINITIONS.some((t) => t.name === name);
}

// Re-export scope helpers for route-level use
export { resolveScopes, enforceScopeForCall, type ExchangeScope };
