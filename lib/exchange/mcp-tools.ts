import "server-only";

/**
 * lib/exchange/mcp-tools.ts — MCP tool handlers for the Contribution Exchange.
 *
 * These tools expose the EXISTING Exchange to MCP clients. They do NOT create
 * a second transaction protocol. Every handler delegates to the canonical
 * Exchange services (proposal route, Steward policy, signal-server) and never
 * duplicates business logic.
 *
 * Core invariants enforced here:
 * - exchange_propose creates only a non-binding Contribution Proposal
 * - exchange_preflight is read-only and performs no persistent state mutation
 * - signal tools cannot advance authoritative exchange state
 * - no MCP result can create a Commitment, authorization, or settlement
 * - every mutation response includes authoritative_exchange_state_advanced: false
 */

import { NextRequest } from "next/server";
import {
  appendExchangeEvent,
  findCompany,
  getExchangeAdmin,
  hashSecret,
  logEncounter,
  newPublicId,
  newSecret,
  normalizeDomain,
  requestIdentity,
  safeEqual,
} from "./server";
import { companyPolicy } from "./steward";
import { evaluateProposal } from "@/exchange-gateway/src/policy";
import {
  ProposalSchema,
  ConsiderationSchema,
  ProposalAuthoritySchema,
} from "@/exchange-gateway/src/schema";
import {
  listSignals,
  getSignal,
  getAttempt,
  getVerification,
  isAcceptingAttempts,
  countActorAttempts,
  countConcurrentAttempts,
  createAttempt,
  submitAttempt,
} from "./signal-server";
import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";
import { rateLimitAllowAsync } from "./rate-limit";
import { createHash } from "node:crypto";

// ─── Authorization scopes ────────────────────────────────────────────────────

export type ExchangeScope = "exchange:read" | "exchange:attempt" | "exchange:propose";

/**
 * Resolve the caller's authorization scopes from request headers.
 *
 * The current Exchange auth model uses shared company keys and proposer keys.
 * There is no formal OAuth scope system. We derive scopes from the credentials
 * present:
 * - exchange:read is always granted (public discovery)
 * - exchange:attempt is granted when an actor identity is present
 * - exchange:propose is granted when an agent key or proposer key is present
 *
 * This is a best-effort mapping. The canonical proposal route enforces its own
 * validation independently — MCP tools never bypass it.
 */
export function resolveScopes(req: NextRequest): Set<ExchangeScope> {
  const scopes = new Set<ExchangeScope>(["exchange:read"]);
  const actorId = req.headers.get("x-exchange-actor-id");
  if (actorId) scopes.add("exchange:attempt");
  const agentKey = req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key");
  if (agentKey) scopes.add("exchange:propose");
  return scopes;
}

/**
 * Map an MCP tool name to the scope it requires. Read-only tools return null
 * (always allowed). Mutation tools return the scope that must be present.
 * Used by the tools/call handler to enforce scopes at call time, not just at
 * list time.
 */
export function requiredScopeForTool(toolName: string): ExchangeScope | null {
  if (toolName === "exchange_propose" || toolName === "exchange_create_proposal_from_attempt") {
    return "exchange:propose";
  }
  if (toolName === "exchange_create_attempt" || toolName === "exchange_submit_attempt") {
    return "exchange:attempt";
  }
  return null;
}

/**
 * Check that the caller has the scope required to invoke a tool. Returns an
 * error result object if the scope is missing, or null if the call is allowed.
 * This enforces scope at tools/call time — a caller who knows a tool name
 * cannot bypass the scope filter that tools/list applies.
 */
export function enforceScopeForCall(
  toolName: string,
  scopes: Set<ExchangeScope>,
): Record<string, unknown> | null {
  const required = requiredScopeForTool(toolName);
  if (required === null) return null; // read-only tool
  if (!scopes.has(required)) {
    return {
      error: `Missing required scope: ${required}`,
      required_scope: required,
      available_scopes: [...scopes],
      authoritative_exchange_state_advanced: false,
    };
  }
  return null;
}

// ─── Rate limiting helpers ───────────────────────────────────────────────────

/**
 * Rate-limit result representing a rejected request. Returned by the
 * mutation handlers when the rate limit is exceeded. The MCP route converts
 * this into a JSON-RPC error response.
 */
export interface RateLimitedResult {
  rate_limited: true;
  error: string;
  retry_after: number;
  authoritative_exchange_state_advanced: false;
  [key: string]: unknown;
}

/**
 * Check the proposal rate limit (mirrors POST /api/exchange/proposals).
 * Uses the same `exchange_proposal` action and 20/hour limit.
 */
async function checkProposalRateLimit(ip: string): Promise<RateLimitedResult | null> {
  const allowed = await rateLimitAllowAsync(ip, "exchange_proposal");
  if (!allowed) {
    return {
      rate_limited: true,
      error: "Rate limited — too many proposals. Retry after the rate limit window resets.",
      retry_after: 3600,
      authoritative_exchange_state_advanced: false,
    };
  }
  return null;
}

/**
 * Check the signal-attempt rate limit (mirrors POST /api/exchange/signals/{id}/attempts).
 * Uses the same `signal-attempt` dimension and 30/hour limit, fail-closed.
 */
async function checkSignalAttemptRateLimit(ip: string): Promise<RateLimitedResult | null> {
  const rl = await checkDistributedRateLimit(
    ["signal-attempt", ip],
    { windowMs: 60 * 60 * 1000, max: 30 },
    true, // fail-closed: sensitive write route
  );
  if (!rl.ok) {
    return {
      rate_limited: true,
      error: "Rate limited — too many signal attempts. Retry after the rate limit window resets.",
      retry_after: rl.retryAfter,
      authoritative_exchange_state_advanced: false,
    };
  }
  return null;
}

/**
 * Check the signal-submit rate limit (mirrors POST .../submit).
 * Uses the same `signal-submit` dimension and 30/hour limit, fail-closed.
 */
async function checkSignalSubmitRateLimit(ip: string): Promise<RateLimitedResult | null> {
  const rl = await checkDistributedRateLimit(
    ["signal-submit", ip],
    { windowMs: 60 * 60 * 1000, max: 30 },
    true,
  );
  if (!rl.ok) {
    return {
      rate_limited: true,
      error: "Rate limited — too many submissions. Retry after the rate limit window resets.",
      retry_after: rl.retryAfter,
      authoritative_exchange_state_advanced: false,
    };
  }
  return null;
}

/**
 * Check the signal-proposal rate limit (mirrors POST .../proposal).
 * Uses the same `signal-proposal` dimension and 10/hour limit, fail-closed.
 */
async function checkSignalProposalRateLimit(ip: string): Promise<RateLimitedResult | null> {
  const rl = await checkDistributedRateLimit(
    ["signal-proposal", ip],
    { windowMs: 60 * 60 * 1000, max: 10 },
    true,
  );
  if (!rl.ok) {
    return {
      rate_limited: true,
      error: "Rate limited — too many signal proposals. Retry after the rate limit window resets.",
      retry_after: rl.retryAfter,
      authoritative_exchange_state_advanced: false,
    };
  }
  return null;
}

// ─── SSRF protection ─────────────────────────────────────────────────────────

/**
 * Prohibited destination hosts for domain discovery fetches.
 * Prevents SSRF attacks against loopback, link-local, private networks,
 * and cloud metadata services.
 */
function isProhibitedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  // Loopback
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]") return true;
  if (h.endsWith(".localhost")) return true;
  // Link-local
  if (h.startsWith("169.254.")) return true;
  if (h === "metadata.google.internal") return true;
  // Cloud metadata
  if (h === "169.254.169.254") return true;
  if (h === "fd00:ec2::254" || h === "[fd00:ec2::254]") return true;
  // Private network ranges (RFC 1918)
  if (h.startsWith("10.")) return true;
  if (h.startsWith("172.")) {
    const parts = h.split(".");
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (h.startsWith("192.168.")) return true;
  // Carrier-grade NAT
  if (h.startsWith("100.64.") || h.startsWith("100.65.") || h.startsWith("100.66.") || h.startsWith("100.67.") ||
      h.startsWith("100.68.") || h.startsWith("100.69.") || h.startsWith("100.7") || h.startsWith("100.8") ||
      h.startsWith("100.9") || h.startsWith("100.1") || h.startsWith("100.2")) {
    // 100.64.0.0/10 — check more precisely
    const parts = h.split(".");
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    if (first === 100 && second >= 64 && second <= 127) return true;
  }
  // IPv6 unique local
  if (h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv6 link-local
  if (h.startsWith("fe80:")) return true;
  return false;
}

/**
 * Normalize a domain or URL input for discovery.
 * Accepts "example.com", "https://example.com", "https://example.com/.well-known/exchange.json"
 * Returns the canonical domain (hostname, lowercase, no path/port).
 */
export function normalizeDomainInput(input: string): { domain: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { domain: "", error: "empty input" };
  if (trimmed.length > 253) return { domain: "", error: "input too long" };

  let hostname: string;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      hostname = url.hostname;
    } catch {
      return { domain: "", error: "invalid URL" };
    }
  } else {
    // Strip any path
    hostname = trimmed.split("/")[0].split(":")[0];
  }
  hostname = hostname.toLowerCase();
  // Basic domain validation: must contain a dot, only valid chars
  if (!hostname.includes(".")) return { domain: "", error: "not a valid domain (no dot)" };
  if (!/^[a-z0-9.-]+$/.test(hostname)) return { domain: "", error: "invalid characters in domain" };
  if (hostname.startsWith(".") || hostname.endsWith(".") || hostname.startsWith("-") || hostname.endsWith("-")) {
    return { domain: "", error: "invalid domain format" };
  }
  if (isProhibitedHost(hostname)) return { domain: "", error: "prohibited host (private/loopback/metadata)" };
  return { domain: hostname };
}

// ─── exchange_discover_domain ────────────────────────────────────────────────

export async function handleDiscoverDomain(args: {
  domain: string;
}): Promise<Record<string, unknown>> {
  const { domain, error } = normalizeDomainInput(args.domain);
  if (error) {
    return { outcome: "invalid", domain: args.domain, error };
  }

  const manifestUrl = `https://${domain}/.well-known/exchange.json`;
  try {
    // Use redirect: "manual" to inspect each redirect target against the
    // SSRF blocklist before following. A malicious domain could publish a
    // manifest that 301-redirects to an internal address (e.g.
    // http://169.254.169.254/latest/meta-data/). If fetch were configured
    // to auto-follow redirects, it would silently follow to the internal
    // target. We manually follow up to 3 redirects, checking each Location
    // header's hostname against isProhibitedHost.
    let currentUrl = manifestUrl;
    let response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { "accept": "application/json", "user-agent": "Contribution-Exchange-MCP/1.0" },
    });

    let redirectsFollowed = 0;
    while (response.status >= 300 && response.status < 400 && redirectsFollowed < 3) {
      const location = response.headers.get("location");
      if (!location) break;
      let resolvedUrl: string;
      try {
        resolvedUrl = new URL(location, currentUrl).toString();
      } catch {
        return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "invalid redirect Location" };
      }
      let redirectHost: string;
      try {
        redirectHost = new URL(resolvedUrl).hostname.toLowerCase();
      } catch {
        return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "invalid redirect URL" };
      }
      if (isProhibitedHost(redirectHost)) {
        return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "redirect to prohibited host blocked (SSRF protection)" };
      }
      // Enforce HTTPS on the final destination
      if (!resolvedUrl.startsWith("https://")) {
        return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "redirect to non-HTTPS URL blocked" };
      }
      currentUrl = resolvedUrl;
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "accept": "application/json", "user-agent": "Contribution-Exchange-MCP/1.0" },
      });
      redirectsFollowed++;
    }

    if (response.status >= 300 && response.status < 400) {
      return { outcome: "unavailable", domain, manifest_url: manifestUrl, error: "redirect limit exceeded" };
    }

    if (response.status === 404) {
      return { outcome: "not_found", domain, manifest_url: manifestUrl };
    }
    if (!response.ok) {
      return { outcome: "unavailable", domain, manifest_url: manifestUrl, status: response.status };
    }

    const text = await response.text();
    if (text.length > 256_000) {
      return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "manifest exceeds 256KB size limit" };
    }

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(text);
    } catch {
      return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "manifest is not valid JSON" };
    }

    // Validate the manifest has the expected top-level structure
    if (manifest.protocol !== "Contribution Exchange") {
      return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "manifest protocol is not 'Contribution Exchange'" };
    }
    if (typeof manifest.domain !== "string") {
      return { outcome: "invalid", domain, manifest_url: manifestUrl, error: "manifest missing 'domain' field" };
    }

    const manifestDomain = normalizeDomain(manifest.domain as string);
    const stewardDomain = manifest.counterparty_agent && typeof manifest.counterparty_agent === "object"
      ? normalizeDomain((manifest.counterparty_agent as Record<string, unknown>).endpoint as string ?? domain)
      : domain;

    // Determine self-hosted vs delegated
    const stewardEndpoint = manifest.counterparty_agent && typeof manifest.counterparty_agent === "object"
      ? (manifest.counterparty_agent as Record<string, unknown>).endpoint as string | undefined
      : undefined;
    const isSelfHosted = stewardEndpoint
      ? new URL(stewardEndpoint).hostname === manifestDomain
      : true;

    return {
      outcome: isSelfHosted ? "self_hosted" : "delegated",
      domain: manifestDomain,
      steward_domain: isSelfHosted ? manifestDomain : stewardDomain,
      manifest_url: manifestUrl,
      manifest,
      retrieved_at: new Date().toISOString(),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    if (message.includes("aborted") || message.includes("timeout")) {
      return { outcome: "unavailable", domain, manifest_url: manifestUrl, error: "timeout" };
    }
    return { outcome: "unavailable", domain, manifest_url: manifestUrl, error: message };
  }
}

// ─── exchange_get_policy ─────────────────────────────────────────────────────

export async function handleGetPolicy(args: {
  domain: string;
}): Promise<Record<string, unknown>> {
  const { domain, error } = normalizeDomainInput(args.domain);
  if (error) {
    return { outcome: "invalid", domain: args.domain, error };
  }

  const normalized = normalizeDomain(domain);
  const company = await findCompany(normalized);
  if (!company || company.verification_status !== "verified") {
    // Check if the domain publishes a manifest pointing to a steward
    const discoverResult = await handleDiscoverDomain({ domain });
    if (discoverResult.outcome === "not_found" || discoverResult.outcome === "invalid") {
      return { outcome: "not_found", domain: normalized };
    }
    if (discoverResult.outcome === "unavailable") {
      return { outcome: "unavailable", domain: normalized, error: discoverResult.error };
    }
    // The domain delegates to a steward — fetch policy from the steward
    const stewardDomain = discoverResult.steward_domain as string;
    if (stewardDomain && stewardDomain !== normalized) {
      const stewardCompany = await findCompany(stewardDomain);
      if (stewardCompany && stewardCompany.verification_status === "verified") {
        const policy = companyPolicy(stewardCompany);
        return {
          outcome: "delegated",
          domain: normalized,
          steward_domain: stewardDomain,
          policy,
          policy_version: policy.version,
          retrieved_at: new Date().toISOString(),
        };
      }
    }
    return { outcome: "not_found", domain: normalized };
  }

  const policy = companyPolicy(company);
  return {
    outcome: "self_hosted",
    domain: normalized,
    steward_domain: normalized,
    policy,
    policy_version: policy.version,
    retrieved_at: new Date().toISOString(),
  };
}

// ─── exchange_preflight ──────────────────────────────────────────────────────
//
// Read-only policy evaluation. Uses the SAME evaluateProposal function as the
// real proposal flow. Performs NO database write, NO proposal insertion, NO
// notification, NO event creation, NO state transition.

export async function handlePreflight(args: {
  domain: string;
  category: string;
  consideration?: unknown[];
  required_authorization?: Record<string, unknown>;
  confidence?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const { domain, error } = normalizeDomainInput(args.domain);
  if (error) {
    return { outcome: "invalid", domain: args.domain, error };
  }

  const normalized = normalizeDomain(domain);
  const company = await findCompany(normalized);

  // For delegated domains, resolve the steward
  let policyCompany = company;
  if (!policyCompany || policyCompany.verification_status !== "verified") {
    const discoverResult = await handleDiscoverDomain({ domain });
    if (discoverResult.outcome === "self_hosted" || discoverResult.outcome === "delegated") {
      const stewardDomain = discoverResult.steward_domain as string;
      if (stewardDomain && stewardDomain !== normalized) {
        policyCompany = await findCompany(stewardDomain);
      }
    }
  }

  if (!policyCompany || policyCompany.verification_status !== "verified") {
    return { outcome: "not_found", domain: normalized };
  }

  const policy = companyPolicy(policyCompany);

  // Validate consideration + authority using the same schemas as the proposal route
  const consideration = Array.isArray(args.consideration) ? args.consideration : [];
  const validatedConsideration = [];
  for (const item of consideration) {
    const parsed = ConsiderationSchema.safeParse(item);
    if (!parsed.success) {
      return {
        outcome: "invalid",
        domain: normalized,
        error: `invalid consideration: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
      };
    }
    validatedConsideration.push(parsed.data);
  }

  const authParsed = ProposalAuthoritySchema.safeParse(args.required_authorization ?? {});
  if (!authParsed.success) {
    return {
      outcome: "invalid",
      domain: normalized,
      error: `invalid required_authorization: ${authParsed.error.issues[0]?.message ?? "validation failed"}`,
    };
  }

  // Use the SAME policy evaluation as the real proposal flow
  const decision = evaluateProposal({
    policy,
    category: args.category,
    consideration: validatedConsideration,
    requiredAuthorization: authParsed.data,
  });

  return {
    outcome: "evaluated",
    domain: normalized,
    disposition: decision.disposition,
    reasons: decision.reasons,
    human_required: decision.human_required,
    response: decision.response,
    policy_version: policy.version,
    advisory: true,
    note: "A preflight decision is advisory and time-bound. It creates no agreement, authorization, reservation, or payment obligation. A favorable preflight does not guarantee engagement, commitment, authorization, or payment.",
    authoritative_exchange_state_advanced: false,
    evaluated_at: new Date().toISOString(),
  };
}

// ─── exchange_propose ────────────────────────────────────────────────────────
//
// Submits an unsolicited Contribution Proposal through the existing Exchange
// flow. Delegates to the canonical proposal service logic (same validation,
// policy evaluation, notification, lineage). Does NOT bypass any boundary.

export async function handlePropose(
  req: NextRequest,
  args: {
    target_domain: string;
    title: string;
    observation: string;
    proposed_contribution: string;
    category?: string;
    desired_outcome?: string;
    evidence_uris?: string[];
    consideration?: unknown[];
    required_authorization?: Record<string, unknown>;
    confidence?: Record<string, unknown>;
    impact?: Record<string, unknown>;
    verification?: Record<string, unknown>;
    effort?: Record<string, unknown>;
    agent_id?: string;
    agent_name?: string;
    agent_did?: string;
    contact_email?: string;
    referral_code?: string;
    idempotency_key: string;
  },
): Promise<Record<string, unknown>> {
  // Rate limit — mirrors POST /api/exchange/proposals (exchange_proposal action, 20/hr).
  // Prevents the MCP endpoint from being used to bypass the HTTP API's rate limits.
  const ip = requestIdentity(req);
  const rateLimited = await checkProposalRateLimit(ip);
  if (rateLimited) {
    await logEncounter({
      targetDomain: "",
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "rate_limited",
      metadata: { tool: "exchange_propose" },
    });
    return rateLimited;
  }

  const { domain: target_domain, error } = normalizeDomainInput(args.target_domain);
  if (error) {
    return {
      operation: "proposal_created",
      outcome: "invalid",
      error,
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
    };
  }

  const normalized = normalizeDomain(target_domain);
  const company = await findCompany(normalized);
  if (!company || company.verification_status !== "verified" || !company.accepts_unsolicited) {
    await logEncounter({
      targetDomain: normalized,
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "not_found",
      metadata: { tool: "exchange_propose" },
    });
    return {
      operation: "proposal_created",
      outcome: "not_found",
      error: "Target domain is not accepting unsolicited contributions",
      target_domain: normalized,
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
    };
  }

  // Build the proposal payload using the same schema as the HTTP route
  const proposalPayload: Record<string, unknown> = {
    targetDomain: normalized,
    title: args.title,
    observation: args.observation,
    proposedContribution: args.proposed_contribution,
    category: args.category ?? "other",
    desiredOutcome: args.desired_outcome,
    evidenceUris: args.evidence_uris ?? [],
    consideration: args.consideration ?? [],
    requiredAuthorization: args.required_authorization ?? {},
    confidence: args.confidence,
    impact: args.impact,
    verification: args.verification,
    effort: args.effort,
    agentId: args.agent_id,
    agentName: args.agent_name,
    agentDid: args.agent_did,
    contactEmail: args.contact_email,
    referralCode: args.referral_code,
  };

  // Validate using the canonical ProposalSchema
  const parsed = ProposalSchema.safeParse(proposalPayload);
  if (!parsed.success) {
    await logEncounter({
      targetDomain: normalized,
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "validation_error",
      metadata: { tool: "exchange_propose" },
    });
    return {
      operation: "proposal_created",
      outcome: "invalid",
      error: "Proposal validation failed",
      details: parsed.error.flatten(),
      target_domain: normalized,
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
    };
  }

  const p = parsed.data;
  if (p.honeypot) {
    return {
      operation: "proposal_created",
      outcome: "rejected",
      error: "Rejected",
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
    };
  }

  // Authenticate agent if agent_id is provided (same logic as HTTP route)
  const admin = getExchangeAdmin();
  let agentId: string | null = null;
  if (p.agentId) {
    const agentKey = req.headers.get("x-exchange-agent-key");
    const { data: agent } = await admin.from("exchange_agents").select("id,agent_key_hash").eq("id", p.agentId).maybeSingle();
    if (!agent || !agentKey || !safeEqual(hashSecret(agentKey), agent.agent_key_hash)) {
      await logEncounter({
        targetDomain: normalized,
        endpoint: "/api/mcp",
        req,
        method: "POST",
        result: "auth_error",
        metadata: { tool: "exchange_propose" },
      });
      return {
        operation: "proposal_created",
        outcome: "auth_error",
        error: "Invalid registered-agent credential",
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
      };
    }
    agentId = agent.id;
  }

  // Idempotency: check if a proposal with this idempotency key already exists
  // for this target domain. The exchange_records table does not have an
  // idempotency_key column, so we use a deterministic approach: hash the
  // idempotency key + target domain and check the proposal_detail.idempotency_hash.
  const idempotencyHash = createHash("sha256").update(`${args.idempotency_key}:${normalized}`).digest("hex");
  const { data: existing } = await admin.from("exchange_records")
    .select("id, public_id, state, title, created_at")
    .eq("kind", "contribution_proposal")
    .eq("target_domain", normalized)
    .filter("proposal_detail->>idempotency_hash", "eq", idempotencyHash)
    .maybeSingle();

  if (existing) {
    return {
      operation: "proposal_created",
      outcome: "idempotent_replay",
      resource_id: existing.public_id,
      idempotent_replay: true,
      exchange: existing,
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
      human_review_required: existing.state === "proposed",
      signal_state_advanced: false,
    };
  }

  // Create the proposal (same logic as the HTTP route)
  const proposerKey = newSecret("proposal");
  const publicId = newPublicId();
  const initiator = {
    type: "agent",
    id: p.agentDid || agentId || `guest:${publicId}`,
    displayName: p.agentName,
    email: p.contactEmail,
    did: p.agentDid,
  };
  const proposalDetail = {
    category: p.category,
    confidence: p.confidence ?? null,
    impact: p.impact ? { expected_change: p.impact.expectedChange, assumptions: p.impact.assumptions } : null,
    required_authorization: p.requiredAuthorization,
    verification: p.verification ?? null,
    effort: p.effort ? { agent_minutes: p.effort.agentMinutes, human_minutes: p.effort.humanMinutes, elapsed_hours: p.effort.elapsedHours } : null,
    idempotency_hash: idempotencyHash,
    origin: "mcp",
  };

  const { data, error: insertError } = await admin.from("exchange_records").insert({
    public_id: publicId,
    kind: "contribution_proposal",
    state: "proposed",
    target_domain: p.targetDomain,
    company_id: company.id,
    initiator_agent_id: agentId,
    initiator_identity: initiator,
    title: p.title,
    observation: p.observation,
    proposed_contribution: p.proposedContribution,
    desired_outcome: p.desiredOutcome || null,
    evidence: p.evidenceUris,
    proposed_consideration: p.consideration,
    proposal_detail: proposalDetail,
    proposer_key_hash: hashSecret(proposerKey),
    referral_code: p.referralCode || null,
  }).select("id, public_id, state, target_domain, title, created_at").single();

  if (insertError) {
    await logEncounter({
      targetDomain: normalized,
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "server_error",
      metadata: { tool: "exchange_propose" },
    });
    return {
      operation: "proposal_created",
      outcome: "server_error",
      error: "Proposal creation failed",
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
    };
  }

  // Race-safe idempotency: the pre-insert check is a read-then-write that
  // two concurrent requests can both pass. After insert, re-query for all
  // rows with this idempotency_hash. If more than one exists, a concurrent
  // request won the race. We identify the winner (earliest by created_at)
  // and if it's not us, delete our just-inserted row and return the winner
  // as an idempotent replay. This is safe because:
  // - The winner sees only itself → proceeds normally
  // - The loser sees both → deletes its own row → returns the winner
  const { data: duplicates } = await admin.from("exchange_records")
    .select("id, public_id, state, title, created_at")
    .eq("kind", "contribution_proposal")
    .eq("target_domain", normalized)
    .filter("proposal_detail->>idempotency_hash", "eq", idempotencyHash)
    .order("created_at", { ascending: true });

  if (duplicates && duplicates.length > 1) {
    const winner = duplicates[0];
    if (winner.id !== data.id) {
      // We lost the race — delete our just-inserted row and return the winner
      await admin.from("exchange_records").delete().eq("id", data.id);
      return {
        operation: "proposal_created",
        outcome: "idempotent_replay",
        resource_id: winner.public_id,
        idempotent_replay: true,
        exchange: winner,
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
        human_review_required: winner.state === "proposed",
        signal_state_advanced: false,
        note: "A concurrent request with the same idempotency key already created this proposal.",
      };
    }
    // We won the race — our row is the earliest, proceed normally
  }

  // Record the proposal_created event in the exchange event log — same as
  // the HTTP proposal route (line 64 of app/api/exchange/proposals/route.ts).
  // Without this, MCP-originated proposals are invisible to the audit trail.
  await appendExchangeEvent({
    exchangeId: data.id,
    eventType: "proposal_created",
    actor: initiator,
    fromState: null,
    toState: "proposed",
    payload: { title: p.title, category: p.category, proposal_detail: proposalDetail },
  });

  // Record lineage: unsolicited origin
  await admin.from("contribution_proposal_origins").insert({
    proposal_id: data.id,
    origin_kind: "unsolicited_opportunity",
  }).then(() => null, () => null); // best-effort — table may not exist yet

  // Dispatch to domain agent (same logic as HTTP route)
  const { dispatchToDomainAgent } = await import("./steward");
  const counterparty = await dispatchToDomainAgent({
    company,
    exchange: data,
    triage: {
      category: p.category,
      consideration: p.consideration,
      requiredAuthorization: p.requiredAuthorization,
    },
    eventType: "proposal_received",
  });

  const finalState = counterparty.decision?.disposition === "engage" ? "negotiating" : "proposed";
  const humanReviewRequired = finalState === "proposed";

  // Log the successful encounter — same as the HTTP proposal route.
  await logEncounter({
    targetDomain: normalized,
    endpoint: "/api/mcp",
    req,
    method: "POST",
    result: "ok",
    agentIdentity: initiator,
    metadata: { tool: "exchange_propose", category: p.category, public_id: data.public_id },
  });

  return {
    operation: "proposal_created",
    outcome: "created",
    resource_id: data.public_id,
    idempotent_replay: false,
    exchange: { ...data, state: finalState },
    counterparty,
    proposer_key: proposerKey,
    human_review_required: humanReviewRequired,
    authoritative_exchange_state_advanced: false,
    commitment_created: false,
    authorization_granted: false,
    signal_state_advanced: false,
    warning: "Save this proposal key. It authenticates the proposing agent to this exchange. A proposal or engagement never grants execution authority. No Commitment has been created.",
  };
}

// ─── Signal discovery tools (read-only) ──────────────────────────────────────

export async function handleListSignals(args: {
  domain?: string;
  type?: string;
  status?: string;
  label?: string;
  verification_mode?: string;
  consideration_mode?: string;
  accepting_attempts?: boolean;
  published_after?: string;
  expires_before?: string;
  cursor?: string;
  limit?: number;
}): Promise<Record<string, unknown>> {
  const result = await listSignals({
    domain: args.domain,
    type: args.type as never,
    status: args.status as never,
    label: args.label,
    verification_mode: args.verification_mode,
    consideration_mode: args.consideration_mode,
    accepting_attempts: args.accepting_attempts,
    published_after: args.published_after,
    expires_before: args.expires_before,
    cursor: args.cursor,
    limit: args.limit,
  });

  return {
    signals: result.signals.map((s) => ({
      signal_id: s.signal_id,
      revision: s.revision,
      revision_hash: s.revision_hash,
      canonical_url: s.canonical_url,
      type: s.type,
      status: s.status,
      title: s.title,
      summary: s.summary,
      publisher_domain: s.publisher.domain,
      verification_mode: s.verification.mode,
      consideration_mode: s.consideration.mode,
      consideration_creates_obligation: s.consideration.creates_obligation,
      follow_on_mode: s.follow_on.mode,
      follow_on_qualification_required: s.follow_on.qualification_required,
      accepting_attempts: s.status === "published",
      expires_at: s.timestamps.expires_at ?? null,
      labels: s.labels ?? [],
    })),
    next_cursor: result.next_cursor,
    note: "Signal status is distinct from exchange status. A signal does not create a Commitment or authorize execution.",
    authoritative_exchange_state_advanced: false,
  };
}

export async function handleGetSignal(args: {
  signal_id: string;
}): Promise<Record<string, unknown>> {
  const signal = await getSignal(args.signal_id);
  if (!signal) {
    return { outcome: "not_found", signal_id: args.signal_id };
  }
  return {
    signal,
    authoritative_exchange_state_advanced: false,
    note: "A signal describes potential work. It is not an agreement to perform or pay. Verification of a signal attempt cannot advance exchange state.",
  };
}

export async function handleGetAttempt(
  req: NextRequest,
  args: {
    signal_id: string;
    attempt_id: string;
  },
): Promise<Record<string, unknown>> {
  const ip = requestIdentity(req);
  const actorId = req.headers.get("x-exchange-actor-id") ?? `anonymous:${ip}`;
  const attempt = await getAttempt(args.signal_id, args.attempt_id, actorId);
  if (!attempt) {
    return { outcome: "not_found", signal_id: args.signal_id, attempt_id: args.attempt_id };
  }
  const verification = await getVerification(args.attempt_id);
  return {
    attempt,
    verification: verification ?? null,
    authoritative_exchange_state_advanced: false,
    note: "Attempt visibility is enforced. An attempt status is not an exchange state.",
  };
}

// ─── Signal mutation tools ───────────────────────────────────────────────────

export async function handleCreateAttempt(
  req: NextRequest,
  args: {
    signal_id: string;
    idempotency_key: string;
    declarations?: Record<string, unknown>;
  },
): Promise<Record<string, unknown>> {
  const ip = requestIdentity(req);
  // Rate limit — mirrors POST /api/exchange/signals/{id}/attempts
  // (signal-attempt dimension, 30/hr, fail-closed).
  const rateLimited = await checkSignalAttemptRateLimit(ip);
  if (rateLimited) {
    await logEncounter({
      targetDomain: "",
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "rate_limited",
      metadata: { tool: "exchange_create_attempt", signal_id: args.signal_id },
    });
    return rateLimited;
  }

  const actorId = req.headers.get("x-exchange-actor-id") ?? `anonymous:${ip}`;
  const actorKey = req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key");

  const signal = await getSignal(args.signal_id);
  if (!signal) {
    return { outcome: "not_found", signal_id: args.signal_id };
  }

  if (!signal.participation.anonymous_attempts && !actorKey) {
    return {
      outcome: "auth_required",
      error: "Authentication required — this signal does not accept anonymous attempts",
      authoritative_exchange_state_advanced: false,
    };
  }

  const accepting = await isAcceptingAttempts(args.signal_id);
  if (!accepting) {
    return { outcome: "not_accepting", signal_id: args.signal_id, authoritative_exchange_state_advanced: false };
  }

  // Check attempt limits
  const attemptCount = await countActorAttempts(args.signal_id, actorId);
  if (attemptCount >= signal.participation.maximum_attempts_per_actor) {
    return {
      outcome: "limit_exceeded",
      error: "Maximum attempts per actor exceeded",
      authoritative_exchange_state_advanced: false,
    };
  }

  const concurrentCount = await countConcurrentAttempts(args.signal_id, actorId);
  if (concurrentCount >= signal.participation.concurrent_attempts_per_actor) {
    return {
      outcome: "concurrent_limit_exceeded",
      error: `Concurrent attempt limit (${signal.participation.concurrent_attempts_per_actor}) exceeded`,
      authoritative_exchange_state_advanced: false,
    };
  }

  const requestHash = createHash("sha256").update(JSON.stringify(args)).digest("hex");

  try {
    const result = await createAttempt({
      signalId: args.signal_id,
      actorId,
      actorKeyId: actorKey ? `actor:${actorId}#2026` : `anonymous:${actorId}`,
      idempotencyKey: args.idempotency_key,
      requestHash,
      declarations: args.declarations ?? {},
    });
    await logEncounter({
      targetDomain: signal.publisher.domain,
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "ok",
      metadata: { tool: "exchange_create_attempt", signal_id: args.signal_id, attempt_id: result.attempt_id },
    });
    return {
      operation: "attempt_created",
      outcome: result.idempotent_replay ? "idempotent_replay" : "created",
      resource_id: result.attempt_id,
      idempotent_replay: result.idempotent_replay,
      signal_revision: result.signal_revision,
      signal_revision_hash: result.signal_revision_hash,
      attempt_status: result.status,
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
      signal_state_advanced: false,
      note: "Attempt created. Submit your work via exchange_submit_attempt. This attempt does not grant any authority.",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    const isIdempotentReplay = message.includes("Idempotency key reuse");
    if (isIdempotentReplay) {
      // Re-read to check if it's a true replay or a conflict
      return {
        operation: "attempt_created",
        outcome: "conflict",
        error: message,
        authoritative_exchange_state_advanced: false,
      };
    }
    return {
      operation: "attempt_created",
      outcome: "error",
      error: message,
      authoritative_exchange_state_advanced: false,
    };
  }
}

export async function handleSubmitAttempt(
  req: NextRequest,
  args: {
    signal_id: string;
    attempt_id: string;
    body: string;
    idempotency_key: string;
    media_type?: string;
    artifact_references?: Array<{ uri: string; digest: string }>;
  },
): Promise<Record<string, unknown>> {
  const ip = requestIdentity(req);
  // Rate limit — mirrors POST /api/exchange/signals/{id}/attempts/{id}/submit
  // (signal-submit dimension, 30/hr, fail-closed).
  const rateLimited = await checkSignalSubmitRateLimit(ip);
  if (rateLimited) {
    await logEncounter({
      targetDomain: "",
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "rate_limited",
      metadata: { tool: "exchange_submit_attempt", signal_id: args.signal_id, attempt_id: args.attempt_id },
    });
    return rateLimited;
  }

  const actorId = req.headers.get("x-exchange-actor-id") ?? `anonymous:${ip}`;

  const signal = await getSignal(args.signal_id);
  if (!signal) {
    return { outcome: "not_found", signal_id: args.signal_id };
  }

  const mediaType = args.media_type ?? "application/json";
  if (!signal.submission.accepted_media_types.some((mt) => mediaType.includes(mt))) {
    return {
      outcome: "unsupported_media_type",
      error: `Accepted: ${signal.submission.accepted_media_types.join(", ")}`,
      authoritative_exchange_state_advanced: false,
    };
  }

  const body = args.body ?? "";
  if (body.length > signal.submission.maximum_bytes) {
    return {
      outcome: "payload_too_large",
      error: `Submission exceeds maximum size of ${signal.submission.maximum_bytes} bytes`,
      authoritative_exchange_state_advanced: false,
    };
  }

  // Validate required_fields (§10.2) — same as the HTTP submit route.
  // The signal declares which fields must be present in the submission body.
  // For JSON submissions, we parse the body and check that each required
  // field is present. For non-JSON media types, required_fields validation
  // is skipped (the verifier will check content semantics).
  if (mediaType.includes("application/json") && signal.submission.required_fields.length > 0) {
    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return {
        operation: "attempt_submitted",
        outcome: "invalid",
        idempotent_replay: false,
        error: "Submission body is not valid JSON despite application/json media type",
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
      };
    }
    if (typeof parsedBody !== "object" || parsedBody === null || Array.isArray(parsedBody)) {
      return {
        operation: "attempt_submitted",
        outcome: "invalid",
        idempotent_replay: false,
        error: "Submission body must be a JSON object",
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
      };
    }
    const missing = signal.submission.required_fields.filter((f) => !(f in parsedBody));
    if (missing.length > 0) {
      return {
        operation: "attempt_submitted",
        outcome: "invalid",
        idempotent_replay: false,
        error: `Submission missing required fields: ${missing.join(", ")}`,
        missing_fields: missing,
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
      };
    }
  }

  const bodyHash = `sha256:${createHash("sha256").update(body).digest("hex")}`;

  // Idempotency check: if the attempt is already submitted, check whether
  // the body hash matches. Same body = idempotent replay. Different body =
  // conflict. This handles the common retry case without requiring a
  // separate idempotency table — the attempt_id is the natural boundary.
  const existingAttempt = await getAttempt(args.signal_id, args.attempt_id, actorId);
  if (existingAttempt && (existingAttempt.status === "submitted" ||
      existingAttempt.status === "verification_pending" ||
      existingAttempt.status === "verified" ||
      existingAttempt.status === "failed" ||
      existingAttempt.status === "inconclusive" ||
      existingAttempt.status === "verifier_error")) {
    const existingHash = existingAttempt.submission_body_hash as string | undefined;
    if (existingHash === bodyHash) {
      return {
        operation: "attempt_submitted",
        outcome: "idempotent_replay",
        resource_id: args.attempt_id,
        idempotent_replay: true,
        attempt_status: existingAttempt.status as string,
        body_hash: bodyHash,
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
        signal_state_advanced: false,
        note: "Submission already received. This is an idempotent replay of the original submission.",
      };
    }
    return {
      operation: "attempt_submitted",
      outcome: "conflict",
      idempotent_replay: false,
      error: "Idempotency key reuse with different submission body",
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
    };
  }

  try {
    const result = await submitAttempt({
      signalId: args.signal_id,
      attemptId: args.attempt_id,
      actorId,
      mediaType,
      bodyHash,
      body,
      artifactReferences: args.artifact_references,
    });
    await logEncounter({
      targetDomain: signal.publisher.domain,
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "ok",
      metadata: { tool: "exchange_submit_attempt", signal_id: args.signal_id, attempt_id: args.attempt_id, body_hash: bodyHash },
    });
    return {
      operation: "attempt_submitted",
      outcome: "submitted",
      resource_id: result.attempt_id,
      idempotent_replay: false,
      attempt_status: result.status,
      body_hash: bodyHash,
      authoritative_exchange_state_advanced: false,
      commitment_created: false,
      authorization_granted: false,
      signal_state_advanced: false,
      note: "Submission received. Verification is Steward-controlled. This does not verify a Contribution or advance exchange state.",
    };
  } catch (e) {
    return {
      operation: "attempt_submitted",
      outcome: "error",
      idempotent_replay: false,
      error: e instanceof Error ? e.message : "Failed",
      authoritative_exchange_state_advanced: false,
    };
  }
}

// ─── exchange_create_proposal_from_attempt ───────────────────────────────────
//
// Creates an ordinary Contribution Proposal from a verified signal attempt.
// Delegates to the canonical signal-server proposal flow. Does NOT create a
// Commitment. The proposal enters the existing bilateral terms-hash acceptance
// flow.

export async function handleCreateProposalFromAttempt(
  req: NextRequest,
  args: {
    signal_id: string;
    attempt_id: string;
    idempotency_key: string;
    qualification_id?: string;
    title?: string;
    proposed_contribution?: string;
    consideration?: unknown[];
  },
): Promise<Record<string, unknown>> {
  const ip = requestIdentity(req);
  // Rate limit — mirrors POST /api/exchange/signals/{id}/attempts/{id}/proposal
  // (signal-proposal dimension, 10/hr, fail-closed).
  const rateLimited = await checkSignalProposalRateLimit(ip);
  if (rateLimited) {
    await logEncounter({
      targetDomain: "",
      endpoint: "/api/mcp",
      req,
      method: "POST",
      result: "rate_limited",
      metadata: { tool: "exchange_create_proposal_from_attempt", signal_id: args.signal_id, attempt_id: args.attempt_id },
    });
    return rateLimited;
  }

  const actorId = req.headers.get("x-exchange-actor-id") ?? `anonymous:${ip}`;

  const signal = await getSignal(args.signal_id);
  if (!signal) {
    return { outcome: "not_found", signal_id: args.signal_id };
  }

  if (signal.follow_on.mode === "none") {
    return {
      outcome: "not_allowed",
      error: "Signal does not allow proposal follow-on",
      authoritative_exchange_state_advanced: false,
    };
  }

  const attempt = await getAttempt(args.signal_id, args.attempt_id, actorId);
  if (!attempt) {
    return { outcome: "not_found", attempt_id: args.attempt_id };
  }

  if (attempt.status !== "verified") {
    return {
      outcome: "not_verified",
      error: "Attempt must be verified before creating a proposal",
      attempt_status: attempt.status,
      authoritative_exchange_state_advanced: false,
    };
  }

  const verification = await getVerification(args.attempt_id);
  if (!verification) {
    return {
      outcome: "no_verification",
      error: "No verification found for attempt",
      authoritative_exchange_state_advanced: false,
    };
  }

  // Idempotency check: an attempt can only yield one proposal. If a
  // proposal already exists from this attempt (via contribution_proposal_origins),
  // return it as an idempotent replay. The idempotency_key is required by
  // the spec, but the natural replay boundary is the attempt_id — you
  // cannot create two proposals from the same verified attempt.
  const admin = getExchangeAdmin();
  const { data: existingOrigin } = await admin.from("contribution_proposal_origins")
    .select("proposal_id")
    .eq("attempt_id", args.attempt_id)
    .maybeSingle();

  if (existingOrigin) {
    const { data: existingProposal } = await admin.from("exchange_records")
      .select("id, public_id, state, title, created_at")
      .eq("id", existingOrigin.proposal_id)
      .maybeSingle();
    if (existingProposal) {
      return {
        operation: "proposal_created",
        outcome: "idempotent_replay",
        resource_id: existingProposal.public_id,
        idempotent_replay: true,
        exchange: existingProposal,
        origin: {
          kind: "exchange_signal",
          signal_id: args.signal_id,
          attempt_id: args.attempt_id,
        },
        human_review_required: true,
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
        signal_state_advanced: false,
        note: "Proposal already created from this attempt. This is an idempotent replay.",
      };
    }
  }

  // Check qualification if required
  let qualificationId: string | undefined;
  if (signal.follow_on.qualification_required) {
    const qualId = args.qualification_id ?? req.headers.get("x-qualification-id");
    if (!qualId || typeof qualId !== "string") {
      return {
        outcome: "qualification_required",
        error: "Qualification ID required for this signal's follow-on policy",
        authoritative_exchange_state_advanced: false,
      };
    }
    const { getQualification } = await import("./signal-server");
    const qual = await getQualification(qualId);
    if (!qual) {
      return { outcome: "not_found", qualification_id: qualId };
    }
    if (qual.subject_actor_id !== actorId) {
      return { outcome: "forbidden", error: "Qualification does not belong to this actor" };
    }
    if (qual.status !== "qualified") {
      return { outcome: "conflict", error: `Qualification is ${qual.status}` };
    }
    qualificationId = qualId;
  }

  // Create the proposal (same logic as the HTTP proposal route)
  const proposerKey = newSecret("proposal");
  const publicId = newPublicId();

  const { data: proposal, error } = await admin.from("exchange_records").insert({
    public_id: publicId,
    kind: "contribution_proposal",
    state: "proposed",
    target_domain: signal.publisher.domain,
    title: args.title ?? signal.title,
    observation: signal.summary,
    proposed_contribution: args.proposed_contribution ?? signal.description,
    desired_outcome: signal.desired_outcome.description,
    evidence: signal.evidence?.map((e) => e.uri) ?? [],
    proposed_consideration: Array.isArray(args.consideration) ? args.consideration : [],
    proposal_detail: {
      category: signal.follow_on.proposal_template?.contribution_kind ?? "other",
      required_authorization: {
        inspect_public: !signal.constraints.private_data_access,
        sandbox_test: false,
        repository_read: false,
        repository_write: signal.constraints.repository_write,
        private_data: signal.constraints.private_data_access,
        credential_access: false,
        production_modify: signal.constraints.production_write,
        deploy: false,
        penetration_testing: false,
      },
      origin: "exchange_signal",
    },
    proposer_key_hash: hashSecret(proposerKey),
  }).select("id, public_id, state, title, created_at").single();

  if (error) {
    return {
      operation: "proposal_created",
      outcome: "server_error",
      error: "Failed to create proposal",
      authoritative_exchange_state_advanced: false,
    };
  }

  // Record origin linkage
  const { recordProposalOrigin } = await import("./signal-server");
  await recordProposalOrigin({
    proposalId: proposal.id,
    originKind: "exchange_signal",
    signalId: args.signal_id,
    signalRevision: signal.revision,
    signalRevisionHash: signal.revision_hash,
    attemptId: args.attempt_id,
    verificationId: verification.id as string,
    qualificationId,
  });

  // Consume qualification if present (with compensating delete on failure)
  if (qualificationId) {
    const { consumeQualification } = await import("./signal-server");
    try {
      await consumeQualification(qualificationId, actorId);
    } catch (e) {
      // Compensating delete — don't leave an orphaned proposal
      await admin.from("exchange_records").delete().eq("id", proposal.id);
      return {
        operation: "proposal_created",
        outcome: "qualification_consumption_failed",
        idempotent_replay: false,
        error: "Qualification consumption failed — proposal not created",
        detail: e instanceof Error ? e.message : "unknown",
        authoritative_exchange_state_advanced: false,
        commitment_created: false,
        authorization_granted: false,
      };
    }
  }

  // Log the successful encounter — same as the HTTP proposal-from-attempt route.
  await logEncounter({
    targetDomain: signal.publisher.domain,
    endpoint: "/api/mcp",
    req,
    method: "POST",
    result: "ok",
    metadata: { tool: "exchange_create_proposal_from_attempt", signal_id: args.signal_id, attempt_id: args.attempt_id, proposal_id: proposal.public_id },
  });

  return {
    operation: "proposal_created",
    outcome: "created",
    resource_id: proposal.public_id,
    idempotent_replay: false,
    exchange: proposal,
    proposer_key: proposerKey,
    origin: {
      kind: "exchange_signal",
      signal_id: args.signal_id,
      signal_revision: signal.revision,
      signal_revision_hash: signal.revision_hash,
      attempt_id: args.attempt_id,
      verification_id: verification.id,
      qualification_id: qualificationId,
    },
    human_review_required: true,
    authoritative_exchange_state_advanced: false,
    commitment_created: false,
    authorization_granted: false,
    signal_state_advanced: false,
    warning: "Save this proposal key. This is an ordinary Contribution Proposal. No Commitment has been created. Bilateral terms-hash acceptance is still required.",
  };
}
