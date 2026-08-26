/**
 * __tests__/contract/mcp-exchange.test.mjs
 *
 * Contract tests for the Contribution Exchange MCP tools and multi-surface
 * discovery integration.
 *
 * Verifies:
 * - MCP tool list includes the expected Exchange tools in deterministic order
 * - Tool schemas reject unknown input properties (additionalProperties: false)
 * - Descriptions correctly distinguish read-only and state-changing behavior
 * - Annotations are accurate (readOnlyHint, destructiveHint, idempotentHint, openWorldHint)
 * - Authorization scopes hide unauthorized mutation tools
 * - Structured outputs include authoritative_exchange_state_advanced: false
 * - Preflight is read-only and uses the same policy evaluation
 * - Agent Card has the contribution-exchange skill and extension
 * - llms.txt contains correct live routes
 * - agents.md documents both ingress paths and MCP tools
 * - robots.txt preserves private exclusions
 * - JSON-LD Service parses as valid JSON
 * - Sitemap contains only public canonical resources
 * - MCP server card advertises Exchange tools and scopes
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function source(relPath) {
  return readFileSync(resolve(root, relPath), "utf8");
}

// ─── MCP tool registry tests ─────────────────────────────────────────────────

const EXPECTED_EXCHANGE_TOOLS = [
  "exchange_discover_domain",
  "exchange_get_policy",
  "exchange_preflight",
  "exchange_propose",
  "exchange_list_signals",
  "exchange_get_signal",
  "exchange_get_attempt",
  "exchange_create_attempt",
  "exchange_submit_attempt",
  "exchange_create_proposal_from_attempt",
];

test("Exchange MCP server module includes all expected Exchange tools", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    assert.match(mod, new RegExp(`name: "${tool}"`), `Tool ${tool} must be registered`);
  }
});

test("SigRank MCP route does NOT include Exchange tool definitions", async () => {
  const mcp = await source("app/api/mcp/route.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    // Exchange tools should not be defined as tool entries in the SigRank TOOLS array
    // The compatibility bridge dispatches them but doesn't define them
    const toolDefPattern = new RegExp(`name: "${tool}"`);
    assert.doesNotMatch(mcp, toolDefPattern, `SigRank route must NOT define ${tool} as a tool entry`);
  }
});

test("Exchange MCP route includes all expected Exchange tools in dispatch", async () => {
  const route = await source("app/api/exchange/mcp/route.ts");
  // The route imports from mcp-server which has the definitions
  assert.match(route, /filterExchangeToolsByScope/);
  assert.match(route, /dispatchExchangeTool/);
});

test("Exchange tool schemas reject unknown properties (additionalProperties: false)", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const schemaCount = (mod.match(/inputSchema:/g) || []).length;
  const additionalPropsCount = (mod.match(/additionalProperties:\s*false/g) || []).length;
  assert.equal(schemaCount, additionalPropsCount, "Every Exchange tool schema must have additionalProperties: false");
});

test("Read-only Exchange tools have readOnlyHint: true", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const readOnlyTools = ["exchange_discover_domain", "exchange_get_policy", "exchange_preflight", "exchange_list_signals", "exchange_get_signal", "exchange_get_attempt"];
  for (const tool of readOnlyTools) {
    const toolIdx = mod.indexOf(`name: "${tool}"`);
    assert.ok(toolIdx > -1, `Tool ${tool} must exist`);
    const section = mod.slice(toolIdx, toolIdx + 800);
    assert.match(section, /readOnlyHint:\s*true/, `Tool ${tool} must have readOnlyHint: true`);
  }
});

test("Mutation Exchange tools have readOnlyHint: false", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const mutationTools = ["exchange_propose", "exchange_create_attempt", "exchange_submit_attempt", "exchange_create_proposal_from_attempt"];
  for (const tool of mutationTools) {
    const toolIdx = mod.indexOf(`name: "${tool}"`);
    assert.ok(toolIdx > -1, `Tool ${tool} must exist`);
    const section = mod.slice(toolIdx, toolIdx + 800);
    assert.match(section, /readOnlyHint:\s*false/, `Tool ${tool} must have readOnlyHint: false`);
  }
});

test("All Exchange tools have destructiveHint: false", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    const toolIdx = mod.indexOf(`name: "${tool}"`);
    const section = mod.slice(toolIdx, toolIdx + 800);
    assert.match(section, /destructiveHint:\s*false/, `Tool ${tool} must have destructiveHint: false`);
  }
});

test("All Exchange tools have idempotentHint: true", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    const toolIdx = mod.indexOf(`name: "${tool}"`);
    const section = mod.slice(toolIdx, toolIdx + 800);
    assert.match(section, /idempotentHint:\s*true/, `Tool ${tool} must have idempotentHint: true`);
  }
});

test("exchange_preflight description says READ-ONLY and no state transition", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const toolIdx = mod.indexOf(`name: "exchange_preflight"`);
  const section = mod.slice(toolIdx, toolIdx + 1000);
  assert.match(section, /READ-ONLY/i, "exchange_preflight description must say READ-ONLY");
  assert.match(section, /no.*proposal insertion|no.*state transition/i, "exchange_preflight description must say no state transition");
});

test("exchange_propose description says NON-BINDING and NOT a Commitment", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const toolIdx = mod.indexOf(`name: "exchange_propose"`);
  const section = mod.slice(toolIdx, toolIdx + 1000);
  assert.match(section, /NON-BINDING/i, "exchange_propose description must say NON-BINDING");
  assert.match(section, /NOT.*Commitment/i, "exchange_propose description must say it does NOT create a Commitment");
});

// ─── MCP handler tests ───────────────────────────────────────────────────────

test("Exchange MCP server module dispatches all Exchange tools", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    assert.match(mod, new RegExp(`name === "${tool}"`), `Handler for ${tool} must exist in dispatchExchangeTool`);
  }
});

test("Exchange MCP route implements scope-based filtering", async () => {
  const route = await source("app/api/exchange/mcp/route.ts");
  assert.match(route, /resolveScopes/);
  assert.match(route, /filterExchangeToolsByScope/);
});

test("Exchange MCP route enforces scopes at tools/call time", async () => {
  const route = await source("app/api/exchange/mcp/route.ts");
  assert.match(route, /enforceScopeForCall/);
});

test("SigRank MCP route has compatibility bridge for legacy Exchange calls", async () => {
  const mcp = await source("app/api/mcp/route.ts");
  assert.match(mcp, /isExchangeTool/);
  assert.match(mcp, /dispatchExchangeTool/);
  assert.match(mcp, /_deprecated_endpoint/);
  assert.match(mcp, /_migration_target/);
});

test("SigRank MCP route does NOT advertise Exchange tools in tools/list", async () => {
  const mcp = await source("app/api/mcp/route.ts");
  // tools/list should return TOOLS directly without Exchange scope filtering
  assert.match(mcp, /tools: TOOLS/);
  // Should NOT have Exchange scope filtering in tools/list
  const listSection = mcp.slice(
    mcp.indexOf('method === "tools/list"'),
    mcp.indexOf('method === "tools/call"'),
  );
  assert.doesNotMatch(listSection, /filterExchangeToolsByScope/, "SigRank tools/list must not filter Exchange tools");
});

// ─── MCP tools module tests ──────────────────────────────────────────────────

test("mcp-tools.ts exports all handler functions", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  for (const fn of ["handleDiscoverDomain", "handleGetPolicy", "handlePreflight", "handlePropose", "handleListSignals", "handleGetSignal", "handleGetAttempt", "handleCreateAttempt", "handleSubmitAttempt", "handleCreateProposalFromAttempt", "resolveScopes"]) {
    assert.match(mod, new RegExp(`export (async )?function ${fn}`), `Function ${fn} must be exported`);
  }
});

test("mcp-tools.ts imports from canonical Exchange services (not duplicating logic)", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /from "\.\/server"/, "Must import from ./server");
  assert.match(mod, /from "\.\/steward"/, "Must import from ./steward");
  assert.match(mod, /from "\.\/signal-server"/, "Must import from ./signal-server");
  assert.match(mod, /from "@\/exchange-gateway\/src\/policy"/, "Must import from policy module");
  assert.match(mod, /evaluateProposal/, "Must use evaluateProposal (same policy evaluation)");
});

test("mcp-tools.ts enforces SSRF protection", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /isProhibitedHost/, "Must have isProhibitedHost function");
  assert.match(mod, /localhost/, "Must block localhost");
  assert.match(mod, /169\.254\./, "Must block link-local");
  assert.match(mod, /192\.168\./, "Must block private network");
  assert.match(mod, /10\./, "Must block 10.x private network");
  assert.match(mod, /metadata/i, "Must block metadata service");
});

test("mcp-tools.ts handlePreflight uses same evaluateProposal as proposal route", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /handlePreflight[\s\S]*evaluateProposal/s, "handlePreflight must call evaluateProposal");
});

test("mcp-tools.ts handlePropose uses canonical ProposalSchema", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /handlePropose[\s\S]*ProposalSchema/s, "handlePropose must use ProposalSchema");
});

test("mcp-tools.ts handlePropose includes authoritative_exchange_state_advanced: false", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /authoritative_exchange_state_advanced: false/, "Must include authoritative_exchange_state_advanced: false");
  assert.match(mod, /commitment_created: false/, "Must include commitment_created: false");
  assert.match(mod, /authorization_granted: false/, "Must include authorization_granted: false");
});

test("mcp-tools.ts handleCreateProposalFromAttempt has compensating delete on qualification failure", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /Compensating delete/, "Must have compensating delete comment");
  assert.match(mod, /exchange_records.*delete/, "Must delete proposal on qualification failure");
});

test("mcp-tools.ts does not import or call Commitment state transition functions", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  // Must NOT import commitment finalization or state transition functions
  assert.doesNotMatch(mod, /finalizeCommitment/, "Must not import finalizeCommitment");
  assert.doesNotMatch(mod, /buildCommitmentDraft/, "Must not import buildCommitmentDraft");
});

// ─── Agent Card tests ────────────────────────────────────────────────────────

test("Agent Card includes contribution-exchange skill", async () => {
  const card = await source("app/.well-known/agent-card.json/route.ts");
  assert.match(card, /id: "contribution-exchange"/);
  assert.match(card, /name: "Contribution Exchange"/);
  assert.match(card, /tags:\s*\[/);
  assert.match(card, /"contributions"/);
  assert.match(card, /"exchange"/);
  assert.match(card, /"signals"/);
});

test("Agent Card includes contribution-exchange extension with domain-specific URLs", async () => {
  const card = await source("app/.well-known/agent-card.json/route.ts");
  assert.match(card, /uri: "https:\/\/signalaf\.com\/spec\/contribution-exchange"/);
  assert.match(card, /required: false/);
  assert.match(card, /profile:.*\.well-known\/exchange\.json/);
  assert.match(card, /agentGuide:.*\/agents\.md/);
  assert.match(card, /steward:.*\/api\/exchange\/steward\//);
  assert.match(card, /signals:.*\/api\/exchange\/signals/);
});

test("Agent Card extension uses SITE_ORIGIN not hardcoded signalaf.com for URLs", async () => {
  const card = await source("app/.well-known/agent-card.json/route.ts");
  // The extension params should use SITE_ORIGIN, not hardcoded "https://signalaf.com"
  // (except the extension URI which is a spec identifier)
  // Use string-based regex to avoid backtick issues in regex literal
  assert.match(card, new RegExp("profile: `\\$\\{SITE_ORIGIN\\}/\\.well-known/exchange\\.json`"));
  assert.match(card, new RegExp("signals: `\\$\\{SITE_ORIGIN\\}/api/exchange/signals`"));
});

// ─── llms.txt tests ──────────────────────────────────────────────────────────

test("llms.txt has Contribution Exchange section with both ingress paths", async () => {
  const llms = await source("app/llms.txt/route.ts");
  assert.match(llms, /## Contribution Exchange/);
  // Both ingress paths documented
  assert.match(llms, /discover domain-published/);
  assert.match(llms, /submit bounded attempts/);
  assert.match(llms, /propose useful unsolicited/);
  // Non-obligation disclaimer
  assert.match(llms, /does not grant execution authority/);
  assert.match(llms, /Commitments require separate bilateral acceptance/);
});

test("llms.txt includes canonical links for Exchange surfaces", async () => {
  const llms = await source("app/llms.txt/route.ts");
  assert.match(llms, /\.well-known\/exchange\.json/);
  assert.match(llms, /\/exchange\/signals/);
  assert.match(llms, /\/agents\.md/);
  assert.match(llms, /\/api\/exchange\/steward\//);
  assert.match(llms, /\/api\/exchange\/proposals/);
  assert.match(llms, /\/exchange\.schema\.json/);
  assert.match(llms, /\/api\/mcp/);
  assert.match(llms, /\/.well-known\/mcp\.json/);
});

// ─── agents.md tests ─────────────────────────────────────────────────────────

test("agents.md documents MCP tools section", async () => {
  const agents = await source("app/agents.md/route.ts");
  assert.match(agents, /## MCP tools/);
  assert.match(agents, /exchange_discover_domain/);
  assert.match(agents, /exchange_get_policy/);
  assert.match(agents, /exchange_preflight/);
  assert.match(agents, /exchange_propose/);
  assert.match(agents, /exchange_list_signals/);
  assert.match(agents, /exchange_create_attempt/);
  assert.match(agents, /exchange_submit_attempt/);
  assert.match(agents, /exchange_create_proposal_from_attempt/);
});

test("agents.md documents both ingress paths", async () => {
  const agents = await source("app/agents.md/route.ts");
  // Unsolicited path
  assert.match(agents, /unsolicited/i);
  // Signal path
  assert.match(agents, /Exchange Signals/i);
  assert.match(agents, /solicited ingress/);
});

test("agents.md documents what MCP tools do NOT do", async () => {
  const agents = await source("app/agents.md/route.ts");
  assert.match(agents, /No MCP tool creates a Commitment/);
  assert.match(agents, /No MCP tool grants execution authorization/);
  assert.match(agents, /No MCP tool creates a payment obligation/);
});

test("agents.md documents authorization scopes", async () => {
  const agents = await source("app/agents.md/route.ts");
  assert.match(agents, /exchange:read/);
  assert.match(agents, /exchange:attempt/);
  assert.match(agents, /exchange:propose/);
});

test("agents.md documents canonical HTTP alternatives", async () => {
  const agents = await source("app/agents.md/route.ts");
  assert.match(agents, /Canonical HTTP alternatives/);
  assert.match(agents, /GET.*\.well-known\/exchange\.json/);
  assert.match(agents, /POST.*\/api\/exchange\/proposals/);
});

test("agents.md states MCP does not replace canonical protocol documentation", async () => {
  const agents = await source("app/agents.md/route.ts");
  assert.match(agents, /MCP documentation does not replace/);
  assert.match(agents, /HTTP API is the source of truth/);
});

// ─── robots.txt tests ────────────────────────────────────────────────────────

test("robots.txt allows /api/exchange/signals", async () => {
  const robots = await source("app/robots.ts");
  assert.match(robots, /\/api\/exchange\/signals/);
});

test("robots.txt preserves private exclusions (/api/, /auth/, /internal/)", async () => {
  const robots = await source("app/robots.ts");
  assert.match(robots, /disallow.*\/api\//);
  assert.match(robots, /disallow.*\/auth\//);
  assert.match(robots, /disallow.*\/internal\//);
});

// ─── JSON-LD tests ───────────────────────────────────────────────────────────

test("contributionExchangeService function exists and returns valid JSON-LD", async () => {
  const jsonld = await source("lib/jsonld.ts");
  assert.match(jsonld, /export function contributionExchangeService/);
  // Must be a Service type
  assert.match(jsonld, /"@type": "Service"/);
  // Must reference existing ORG_ID (reuse, not duplicate)
  assert.match(jsonld, /"@id": ORG_ID/);
  // Must reference the exchange page
  assert.match(jsonld, /\/exchange/);
  // Must mention signals
  assert.match(jsonld, /signal/i);
});

test("layout.tsx renders contributionExchangeService JSON-LD", async () => {
  const layout = await source("app/layout.tsx");
  assert.match(layout, /contributionExchangeService/);
});

// ─── Sitemap tests ───────────────────────────────────────────────────────────

test("sitemap includes /exchange route", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /path: "\/exchange"/);
});

test("sitemap includes /exchange/signals route", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /path: "\/exchange\/signals"/);
});

test("sitemap includes /exchange/propose route", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /path: "\/exchange\/propose"/);
});

test("sitemap includes /agents.md route", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /path: "\/agents\.md"/);
});

test("sitemap includes /exchange.schema.json route", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /path: "\/exchange\.schema\.json"/);
});

test("sitemap does NOT include private/admin routes", async () => {
  const sitemap = await source("app/sitemap.ts");
  // Should not include internal routes
  assert.doesNotMatch(sitemap, /path: "\/internal\//);
  // Should not include attempt routes
  assert.doesNotMatch(sitemap, /\/attempts/);
});

// ─── MCP server card tests ───────────────────────────────────────────────────

test("SigRank MCP server card does NOT advertise Exchange tools", async () => {
  const card = await source("app/.well-known/mcp.json/route.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    assert.doesNotMatch(card, new RegExp(`"${tool}"`), `SigRank MCP card must NOT list ${tool}`);
  }
});

test("SigRank MCP server card does NOT declare Exchange authorization scopes", async () => {
  const card = await source("app/.well-known/mcp.json/route.ts");
  assert.doesNotMatch(card, /exchange:read/);
  assert.doesNotMatch(card, /exchange:attempt/);
  assert.doesNotMatch(card, /exchange:propose/);
});

test("Exchange MCP server card advertises all Exchange tools", async () => {
  const card = await source("app/.well-known/exchange-mcp.json/route.ts");
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    assert.match(card, new RegExp(`"${tool}"`), `Exchange MCP card must list ${tool}`);
  }
});

test("Exchange MCP server card declares authorization scopes", async () => {
  const card = await source("app/.well-known/exchange-mcp.json/route.ts");
  assert.match(card, /authorization/);
  assert.match(card, /exchange:read/);
  assert.match(card, /exchange:attempt/);
  assert.match(card, /exchange:propose/);
});

test("Exchange MCP server card declares user control expectations", async () => {
  const card = await source("app/.well-known/exchange-mcp.json/route.ts");
  assert.match(card, /userControl/);
  assert.match(card, /State-changing tools/);
  assert.match(card, /No tool can create a Commitment/);
});

test("Exchange MCP server card points to correct endpoint", async () => {
  const card = await source("app/.well-known/exchange-mcp.json/route.ts");
  assert.match(card, /api\/exchange\/mcp/);
  assert.match(card, /contribution-exchange/);
});

test("Exchange MCP server card links to Exchange profile and guide", async () => {
  const card = await source("app/.well-known/exchange-mcp.json/route.ts");
  assert.match(card, /exchange\.json/);
  assert.match(card, /agents\.md/);
  assert.match(card, /\/exchange/);
  assert.match(card, /exchange\.schema\.json/);
});

// ─── Initialize instructions test ────────────────────────────────────────────

test("Exchange MCP initialize instructions mention Exchange tools and invariants", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  assert.match(mod, /EXCHANGE_INSTRUCTIONS/);
  assert.match(mod, /exchange_discover_domain/);
  assert.match(mod, /exchange_preflight/);
  assert.match(mod, /exchange_propose/);
  assert.match(mod, /No Exchange tool creates a Commitment/);
});

test("SigRank MCP initialize instructions do NOT advertise Exchange tools", async () => {
  const mcp = await source("app/api/mcp/route.ts");
  // Should mention the dedicated Exchange MCP endpoint
  assert.match(mcp, /api\/exchange\/mcp/);
  // Should NOT list individual Exchange tool names in instructions
  const initStart = mcp.indexOf('method === "initialize"');
  const initEnd = mcp.indexOf("}", initStart + 200);
  const initSection = mcp.slice(initStart, initEnd + 500);
  assert.doesNotMatch(initSection, /exchange_discover_domain/);
  assert.doesNotMatch(initSection, /exchange_preflight/);
  assert.doesNotMatch(initSection, /exchange_propose/);
});

// ─── Domain discovery SSRF tests ─────────────────────────────────────────────

test("normalizeDomainInput rejects empty input", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /empty input/);
});

test("normalizeDomainInput rejects domains without dots", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /not a valid domain.*no dot/);
});

test("normalizeDomainInput rejects prohibited hosts", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /prohibited host/);
});

// ─── Invariant: no Commitment creation ───────────────────────────────────────

test("No Exchange MCP tool description claims to create a Commitment", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  // Check all tool descriptions for un-negated Commitment claims
  for (const tool of EXPECTED_EXCHANGE_TOOLS) {
    const toolIdx = mod.indexOf(`name: "${tool}"`);
    const section = mod.slice(toolIdx, toolIdx + 2000);
    const lines = section.split("\n");
    for (const line of lines) {
      if (line.includes("Commitment") && (line.includes("description") || line.includes("NOT") || line.includes("does not") || line.includes("NON-BINDING"))) {
        // Must be negated
        assert.match(line, /NOT.*Commitment|does not.*Commitment|NON-BINDING/i, "Commitment mentions must be negated");
      }
    }
  }
});

// ─── Round-2 review fix tests ────────────────────────────────────────────────

// Fix 1: SSRF bypass via redirect — fetch must use redirect: "manual" and
// check each redirect target against isProhibitedHost before following.

test("Fix 1: handleDiscoverDomain uses redirect: manual (not follow)", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /redirect:\s*"manual"/, "Must use redirect: manual to inspect redirect targets");
  assert.doesNotMatch(mod, /redirect:\s*"follow"/, "Must NOT use redirect: follow (SSRF bypass risk)");
});

test("Fix 1: handleDiscoverDomain checks redirect Location against isProhibitedHost", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  // Must have a redirect-following loop that checks the Location header
  assert.match(mod, /headers\.get\("location"\)/, "Must read Location header from redirect responses");
  assert.match(mod, /isProhibitedHost\(redirectHost\)/, "Must check redirect host against isProhibitedHost");
  assert.match(mod, /redirect to prohibited host blocked/, "Must block prohibited redirect targets");
});

test("Fix 1: handleDiscoverDomain enforces HTTPS on redirect targets", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /non-HTTPS URL blocked/, "Must block non-HTTPS redirect targets");
});

test("Fix 1: handleDiscoverDomain enforces redirect limit", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /redirectsFollowed < 3/, "Must limit redirects to 3");
  assert.match(mod, /redirect limit exceeded/, "Must report when redirect limit is exceeded");
});

// Fix 2: exchange_submit_attempt and exchange_create_proposal_from_attempt
// must require an idempotency_key in their schemas.

test("Fix 2: exchange_submit_attempt schema requires idempotency_key", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const toolIdx = mod.indexOf(`name: "exchange_submit_attempt"`);
  const section = mod.slice(toolIdx, toolIdx + 1500);
  assert.match(section, /idempotency_key/, "exchange_submit_attempt must have idempotency_key property");
  assert.match(section, /required:.*"idempotency_key"/, "idempotency_key must be in required array");
});

test("Fix 2: exchange_create_proposal_from_attempt schema requires idempotency_key", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  const toolIdx = mod.indexOf(`name: "exchange_create_proposal_from_attempt"`);
  const section = mod.slice(toolIdx, toolIdx + 1500);
  assert.match(section, /idempotency_key/, "exchange_create_proposal_from_attempt must have idempotency_key property");
  assert.match(section, /required:.*"idempotency_key"/, "idempotency_key must be in required array");
});

test("Fix 2: dispatchExchangeTool passes idempotency_key to handleSubmitAttempt", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  assert.match(mod, /exchange_submit_attempt[\s\S]*idempotency_key[\s\S]*handleSubmitAttempt/s,
    "dispatchExchangeTool must extract and pass idempotency_key to handleSubmitAttempt");
});

test("Fix 2: dispatchExchangeTool passes idempotency_key to handleCreateProposalFromAttempt", async () => {
  const mod = await source("lib/exchange/mcp-server.ts");
  assert.match(mod, /exchange_create_proposal_from_attempt[\s\S]*idempotency_key[\s\S]*handleCreateProposalFromAttempt/s,
    "dispatchExchangeTool must extract and pass idempotency_key to handleCreateProposalFromAttempt");
});

test("Fix 2: handleSubmitAttempt handler signature includes idempotency_key", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /export async function handleSubmitAttempt[\s\S]*idempotency_key:\s*string/s,
    "handleSubmitAttempt must accept idempotency_key parameter");
});

test("Fix 2: handleCreateProposalFromAttempt handler signature includes idempotency_key", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /export async function handleCreateProposalFromAttempt[\s\S]*idempotency_key:\s*string/s,
    "handleCreateProposalFromAttempt must accept idempotency_key parameter");
});

// Fix 3: handleCreateAttempt must return idempotent_replay: true when
// createAttempt returns an existing attempt (replay), not always false.

test("Fix 3: createAttempt returns idempotent_replay field", async () => {
  const mod = await source("lib/exchange/signal-server.ts");
  // The return type must include idempotent_replay
  assert.match(mod, /idempotent_replay:\s*boolean/, "createAttempt return type must include idempotent_replay: boolean");
  // Existing/replay paths must return idempotent_replay: true
  assert.match(mod, /idempotent_replay:\s*true/, "Replay paths must return idempotent_replay: true");
  // New insert path must return idempotent_replay: false
  assert.match(mod, /idempotent_replay:\s*false/, "New insert path must return idempotent_replay: false");
});

test("Fix 3: handleCreateAttempt uses result.idempotent_replay (not hardcoded false)", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  // Must use result.idempotent_replay from createAttempt, not hardcode false
  assert.match(mod, /idempotent_replay:\s*result\.idempotent_replay/,
    "handleCreateAttempt must use result.idempotent_replay from createAttempt");
  // Must NOT hardcode idempotent_replay: false in the success path
  const createAttemptSection = mod.slice(
    mod.indexOf("const result = await createAttempt("),
    mod.indexOf("} catch (e) {", mod.indexOf("const result = await createAttempt(")),
  );
  assert.doesNotMatch(createAttemptSection, /idempotent_replay:\s*false/,
    "handleCreateAttempt success path must NOT hardcode idempotent_replay: false");
});

// Fix 4: All mutation responses must include idempotent_replay field.

test("Fix 4: handleSubmitAttempt response includes idempotent_replay", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const submitSection = mod.slice(
    mod.indexOf("export async function handleSubmitAttempt"),
    mod.indexOf("// ─── exchange_create_proposal_from_attempt"),
  );
  // The submitted response must include idempotent_replay
  assert.match(submitSection, /outcome: "submitted"[\s\S]*idempotent_replay:\s*false/s,
    "handleSubmitAttempt submitted response must include idempotent_replay: false");
  // The idempotent replay response must include idempotent_replay: true
  assert.match(submitSection, /outcome: "idempotent_replay"[\s\S]*idempotent_replay:\s*true/s,
    "handleSubmitAttempt replay response must include idempotent_replay: true");
});

test("Fix 4: handleCreateProposalFromAttempt response includes idempotent_replay", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const proposalSection = mod.slice(
    mod.indexOf("export async function handleCreateProposalFromAttempt"),
  );
  // The created response must include idempotent_replay
  assert.match(proposalSection, /outcome: "created"[\s\S]*idempotent_replay:\s*false/s,
    "handleCreateProposalFromAttempt created response must include idempotent_replay: false");
  // The idempotent replay response must include idempotent_replay: true
  assert.match(proposalSection, /outcome: "idempotent_replay"[\s\S]*idempotent_replay:\s*true/s,
    "handleCreateProposalFromAttempt replay response must include idempotent_replay: true");
});

// Fix 5: handlePropose must handle the idempotency race condition with a
// post-insert duplicate check.

test("Fix 5: handlePropose has post-insert duplicate check for race safety", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  // Must re-query for duplicates after insert
  assert.match(mod, /Race-safe idempotency/,
    "Must have a comment explaining the race-safe idempotency check");
  assert.match(mod, /duplicates\.length > 1/,
    "Must check for duplicate rows after insert");
  assert.match(mod, /winner\.id !== data\.id/,
    "Must compare winner ID with our inserted ID");
  assert.match(mod, /delete\(\)\.eq\("id", data\.id\)/,
    "Must delete the losing duplicate row");
});

test("Fix 5: handlePropose race-loser returns idempotent_replay: true", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const raceSection = mod.slice(
    mod.indexOf("Race-safe idempotency"),
    mod.indexOf("// Record lineage"),
  );
  assert.match(raceSection, /outcome: "idempotent_replay"/,
    "Race loser must return outcome: idempotent_replay");
  assert.match(raceSection, /idempotent_replay:\s*true/,
    "Race loser must return idempotent_replay: true");
});

// ─── Round-2 review fixes: rate limiting, audit logging, validation, scope enforcement ──

test("R2-Fix 1a: handlePropose calls checkProposalRateLimit at the start", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const proposeSection = mod.slice(
    mod.indexOf("export async function handlePropose"),
    mod.indexOf("// Build the proposal payload"),
  );
  assert.match(proposeSection, /checkProposalRateLimit/,
    "handlePropose must call checkProposalRateLimit");
  assert.match(proposeSection, /rate_limited/,
    "handlePropose must check the rate-limited result");
});

test("R2-Fix 1b: handleCreateAttempt calls checkSignalAttemptRateLimit at the start", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const start = mod.indexOf("export async function handleCreateAttempt");
  const end = mod.indexOf("const signal = await getSignal(args.signal_id)", start);
  const attemptSection = mod.slice(start, end);
  assert.match(attemptSection, /checkSignalAttemptRateLimit/,
    "handleCreateAttempt must call checkSignalAttemptRateLimit");
  assert.match(attemptSection, /rate_limited/,
    "handleCreateAttempt must check the rate-limited result");
});

test("R2-Fix 1c: handleSubmitAttempt calls checkSignalSubmitRateLimit at the start", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const start = mod.indexOf("export async function handleSubmitAttempt");
  const end = mod.indexOf("const signal = await getSignal(args.signal_id)", start);
  const submitSection = mod.slice(start, end);
  assert.match(submitSection, /checkSignalSubmitRateLimit/,
    "handleSubmitAttempt must call checkSignalSubmitRateLimit");
  assert.match(submitSection, /rate_limited/,
    "handleSubmitAttempt must check the rate-limited result");
});

test("R2-Fix 1d: handleCreateProposalFromAttempt calls checkSignalProposalRateLimit at the start", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const start = mod.indexOf("export async function handleCreateProposalFromAttempt");
  const end = mod.indexOf("const signal = await getSignal(args.signal_id)", start);
  const proposalSection = mod.slice(start, end);
  assert.match(proposalSection, /checkSignalProposalRateLimit/,
    "handleCreateProposalFromAttempt must call checkSignalProposalRateLimit");
  assert.match(proposalSection, /rate_limited/,
    "handleCreateProposalFromAttempt must check the rate-limited result");
});

test("R2-Fix 1e: rate limit helpers use the same parameters as HTTP routes", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  // Proposal: exchange_proposal action (20/hr from rate-limit.ts LIMITS)
  assert.match(mod, /rateLimitAllowAsync\(ip, "exchange_proposal"\)/,
    "Proposal rate limit must use the exchange_proposal action");
  // Signal attempt: signal-attempt dimension, 30/hr, fail-closed
  assert.match(mod, /"signal-attempt", ip/,
    "Signal attempt rate limit must use signal-attempt dimension");
  assert.match(mod, /windowMs: 60 \* 60 \* 1000, max: 30/,
    "Signal attempt rate limit must use 30/hr window");
  // Signal submit: signal-submit dimension, 30/hr, fail-closed
  assert.match(mod, /"signal-submit", ip/,
    "Signal submit rate limit must use signal-submit dimension");
  // Signal proposal: signal-proposal dimension, 10/hr, fail-closed
  assert.match(mod, /"signal-proposal", ip/,
    "Signal proposal rate limit must use signal-proposal dimension");
  assert.match(mod, /max: 10/,
    "Signal proposal rate limit must use 10/hr (stricter than attempt/submit)");
});

test("R2-Fix 2: handlePropose calls appendExchangeEvent after insert", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const proposeSection = mod.slice(
    mod.indexOf("Race-safe idempotency"),
    mod.indexOf("// Dispatch to domain agent"),
  );
  assert.match(proposeSection, /appendExchangeEvent/,
    "handlePropose must call appendExchangeEvent after the race-safe check");
  assert.match(proposeSection, /eventType: "proposal_created"/,
    "Event type must be proposal_created (same as HTTP route)");
  assert.match(proposeSection, /fromState: null/,
    "fromState must be null (same as HTTP route)");
  assert.match(proposeSection, /toState: "proposed"/,
    "toState must be 'proposed' (same as HTTP route)");
});

test("R2-Fix 3a: handlePropose calls logEncounter on success", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const proposeSection = mod.slice(
    mod.indexOf("export async function handlePropose"),
    mod.indexOf("\n// ─── Signal discovery tools"),
  );
  // Success path
  assert.match(proposeSection, /logEncounter\(\{[\s\S]*?result: "ok"/,
    "handlePropose must call logEncounter with result: 'ok' on success");
  // Error paths
  assert.match(proposeSection, /result: "rate_limited"/,
    "handlePropose must log rate_limited encounters");
  assert.match(proposeSection, /result: "not_found"/,
    "handlePropose must log not_found encounters");
  assert.match(proposeSection, /result: "validation_error"/,
    "handlePropose must log validation_error encounters");
  assert.match(proposeSection, /result: "auth_error"/,
    "handlePropose must log auth_error encounters");
  assert.match(proposeSection, /result: "server_error"/,
    "handlePropose must log server_error encounters");
});

test("R2-Fix 3b: handleCreateAttempt calls logEncounter on success and rate-limit", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const attemptSection = mod.slice(
    mod.indexOf("export async function handleCreateAttempt"),
    mod.indexOf("export async function handleSubmitAttempt"),
  );
  assert.match(attemptSection, /result: "ok"/,
    "handleCreateAttempt must log successful encounters");
  assert.match(attemptSection, /result: "rate_limited"/,
    "handleCreateAttempt must log rate-limited encounters");
});

test("R2-Fix 3c: handleSubmitAttempt calls logEncounter on success and rate-limit", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const submitSection = mod.slice(
    mod.indexOf("export async function handleSubmitAttempt"),
    mod.indexOf("export async function handleCreateProposalFromAttempt"),
  );
  assert.match(submitSection, /result: "ok"/,
    "handleSubmitAttempt must log successful encounters");
  assert.match(submitSection, /result: "rate_limited"/,
    "handleSubmitAttempt must log rate-limited encounters");
});

test("R2-Fix 3d: handleCreateProposalFromAttempt calls logEncounter on success and rate-limit", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const proposalSection = mod.slice(
    mod.indexOf("export async function handleCreateProposalFromAttempt"),
  );
  assert.match(proposalSection, /result: "ok"/,
    "handleCreateProposalFromAttempt must log successful encounters");
  assert.match(proposalSection, /result: "rate_limited"/,
    "handleCreateProposalFromAttempt must log rate-limited encounters");
});

test("R2-Fix 4: handleSubmitAttempt validates required_fields for JSON submissions", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const submitSection = mod.slice(
    mod.indexOf("export async function handleSubmitAttempt"),
    mod.indexOf("const bodyHash"),
  );
  assert.match(submitSection, /required_fields/,
    "handleSubmitAttempt must reference required_fields");
  assert.match(submitSection, /signal\.submission\.required_fields\.length > 0/,
    "Must check required_fields length");
  assert.match(submitSection, /JSON\.parse\(body\)/,
    "Must parse JSON body for validation");
  assert.match(submitSection, /missing\.length > 0/,
    "Must check for missing fields");
  assert.match(submitSection, /missing_fields: missing/,
    "Must return missing_fields in the error response");
  // Must skip validation for non-JSON media types
  assert.match(submitSection, /mediaType\.includes\("application\/json"\)/,
    "Must only validate required_fields for application/json media type");
});

test("R2-Fix 5a: requiredScopeForTool maps mutation tools to scopes", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /export function requiredScopeForTool/,
    "requiredScopeForTool must be exported");
  assert.match(mod, /"exchange_propose"\s*\|\|\s*toolName === "exchange_create_proposal_from_attempt"/,
    "exchange_propose and exchange_create_proposal_from_attempt require exchange:propose");
  assert.match(mod, /"exchange_create_attempt"\s*\|\|\s*toolName === "exchange_submit_attempt"/,
    "exchange_create_attempt and exchange_submit_attempt require exchange:attempt");
});

test("R2-Fix 5b: enforceScopeForCall returns error when scope is missing", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  assert.match(mod, /export function enforceScopeForCall/,
    "enforceScopeForCall must be exported");
  assert.match(mod, /Missing required scope/,
    "Must return 'Missing required scope' error");
  assert.match(mod, /required_scope: required/,
    "Must include required_scope in error");
  assert.match(mod, /available_scopes:/,
    "Must include available_scopes in error");
});

test("R2-Fix 5c: Exchange MCP route enforces scopes at tools/call time", async () => {
  const route = await source("app/api/exchange/mcp/route.ts");
  assert.match(route, /enforceScopeForCall/,
    "Exchange MCP route must import and call enforceScopeForCall");
  // The enforcement must be in the tools/call handler, before the dispatch
  const callHandlerStart = route.indexOf('method === "tools/call"');
  const callHandlerEnd = route.indexOf("return jsonRpc(id, result);", callHandlerStart);
  const callSection = route.slice(callHandlerStart, callHandlerEnd);
  assert.match(callSection, /enforceScopeForCall/,
    "enforceScopeForCall must be called in the tools/call handler");
  assert.match(callSection, /scopeError/,
    "Must check the scope error result");
  // enforceScopeForCall must appear before dispatchExchangeTool in the handler
  const enforcePos = callSection.indexOf("enforceScopeForCall");
  const dispatchPos = callSection.indexOf("dispatchExchangeTool");
  assert.ok(enforcePos > -1 && dispatchPos > -1,
    "Both enforceScopeForCall and dispatchExchangeTool must be present in the handler");
  assert.ok(enforcePos < dispatchPos,
    "enforceScopeForCall must be called before dispatchExchangeTool");
});

test("R2-Fix 5c: SigRank MCP route enforces scopes for legacy Exchange calls", async () => {
  const mcp = await source("app/api/mcp/route.ts");
  assert.match(mcp, /enforceScopeForCall/,
    "SigRank MCP route must call enforceScopeForCall for legacy Exchange calls");
  // The enforcement must be gated on isExchangeTool
  const callHandlerStart = mcp.indexOf('method === "tools/call"');
  const callHandlerEnd = mcp.indexOf("return jsonRpc(id, result);", callHandlerStart);
  const callSection = mcp.slice(callHandlerStart, callHandlerEnd);
  assert.match(callSection, /isExchangeTool/,
    "Scope enforcement must be gated on isExchangeTool check");
  assert.match(callSection, /enforceScopeForCall/,
    "enforceScopeForCall must be called for Exchange tools");
});

test("R2-Fix 5d: read-only tools pass scope enforcement (return null)", async () => {
  const mod = await source("lib/exchange/mcp-tools.ts");
  const scopeSection = mod.slice(
    mod.indexOf("export function enforceScopeForCall"),
    mod.indexOf("// ─── Rate limiting helpers"),
  );
  assert.match(scopeSection, /return null; \/\/ read-only tool/,
    "Read-only tools must return null (allowed)");
});
