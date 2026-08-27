/**
 * __tests__/contract/webmcp-site-tools.test.mjs
 *
 * Contract tests for the WebMCP/Site Tools registration component.
 *
 * Verifies (per Part 10 of the Contribution Exchange build):
 * - The current document.modelContext API is used as the primary path
 * - navigator.modelContext is only a feature-detected fallback
 * - Tools do not register twice (AbortController lifecycle)
 * - The current hostname is the trusted domain (window.location)
 * - Mutation tools are absent from unrelated pages
 * - Schemas align with canonical Exchange schemas (additionalProperties: false)
 * - No client secrets are embedded
 * - Site Tool calls reach canonical Exchange logic (relative URLs to origin)
 * - Telemetry identifies transport: "webmcp"
 * - Unsupported browsers continue normally (early return when no API)
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const COMPONENT_PATH = "components/webmcp/register-tools.tsx";

function source() {
  return readFileSync(resolve(root, COMPONENT_PATH), "utf8");
}

// ─── API surface tests ──────────────────────────────────────────────────────

test("WebMCP: uses document.modelContext as the primary API", () => {
  const src = source();
  // The current official API (per learn.chatgpt.com/docs/webmcp) is
  // document.modelContext.registerTool(...). The component must check
  // document.modelContext FIRST.
  assert.ok(src.includes("document.modelContext"), "must reference document.modelContext");
  assert.ok(src.includes("interface Document"), "must declare Document interface");
  // The getModelContext helper must check document BEFORE navigator
  const docIdx = src.indexOf("document.modelContext");
  const navIdx = src.indexOf("navigator.modelContext");
  // The first real usage (in getModelContext) must be document first
  const helperStart = src.indexOf("function getModelContext");
  const helperSlice = src.slice(helperStart, helperStart + 300);
  const docInHelper = helperSlice.indexOf("document.modelContext");
  const navInHelper = helperSlice.indexOf("navigator.modelContext");
  assert.ok(docInHelper > -1 && docInHelper < navInHelper,
    "getModelContext must check document.modelContext before navigator.modelContext");
});

test("WebMCP: navigator.modelContext is only a compatibility fallback", () => {
  const src = source();
  assert.ok(src.includes("navigator.modelContext"), "must include navigator fallback");
  // The comment must label it as a fallback
  assert.ok(src.includes("fallback") || src.includes("compatibility"),
    "navigator.modelContext must be labeled as fallback/compatibility");
  // Must NOT use navigator.modelContext as the primary check
  // (i.e., the old pattern `if (!navigator.modelContext) return` must be gone)
  assert.doesNotMatch(src, /if\s*\(\s*typeof\s+navigator\s*===\s*"undefined"\s*\|\|\s*!navigator\.modelContext\s*\)\s*return/,
    "must not use navigator.modelContext as the sole entry condition");
});

test("WebMCP: unsupported browsers continue normally (early return)", () => {
  const src = source();
  // getModelContext returns null if neither API is available
  assert.ok(src.includes("return null"), "must return null when no API available");
  // The component must early-return when mc is null
  assert.ok(src.includes("if (!mc) return"), "must early-return when no model context");
});

// ─── Lifecycle tests ────────────────────────────────────────────────────────

test("WebMCP: AbortController prevents duplicate registration", () => {
  const src = source();
  assert.ok(src.includes("AbortController"), "must use AbortController");
  assert.ok(src.includes("controller.abort()"), "must abort on cleanup");
  // Every registerTool call must pass the signal
  const registerCount = (src.match(/\.registerTool\(/g) || []).length;
  const signalCount = (src.match(/\{\s*signal\s*\}/g) || []).length;
  assert.ok(signalCount >= registerCount,
    `every registerTool call must pass { signal } (registers: ${registerCount}, signals: ${signalCount})`);
});

test("WebMCP: useEffect dependency array is empty (run once per mount)", () => {
  const src = source();
  // The useEffect must have an empty dependency array to avoid re-running
  // on every render, which would cause duplicate registration.
  assert.ok(src.includes("}, []);"), "useEffect must have empty dependency array");
});

// ─── Domain binding tests ───────────────────────────────────────────────────

test("WebMCP: hostname is derived from window.location (trusted context)", () => {
  const src = source();
  assert.ok(src.includes("window.location.hostname"),
    "must derive hostname from window.location.hostname");
  // Must NOT accept domain from tool input for domain-bound tools
  // The exchange_discover_domain and exchange_get_policy tools must have
  // empty inputSchema properties (no domain parameter)
  assert.ok(src.includes('name: "exchange_discover_domain"'),
    "must have exchange_discover_domain tool");
  // The discover tool should not take a domain input — it uses the page's domain
  const discoverStart = src.indexOf('name: "exchange_discover_domain"');
  const discoverSlice = src.slice(discoverStart, discoverStart + 500);
  assert.ok(discoverSlice.includes("properties: {}") || discoverSlice.includes("properties:{}"),
    "exchange_discover_domain must not accept domain input (uses trusted page context)");
});

// ─── Page-aware registration tests ──────────────────────────────────────────

test("WebMCP: Exchange tools only registered on /exchange* pages", () => {
  const src = source();
  assert.ok(src.includes('pathname === "/exchange"'), "must check for /exchange path");
  assert.ok(src.includes('pathname.startsWith("/exchange/")'),
    "must check for /exchange/ subpaths");
  // The isExchangePage guard must wrap all Exchange tool registrations
  assert.ok(src.includes("isExchangePage"), "must use isExchangePage guard");
});

test("WebMCP: mutation tools are NOT exposed via WebMCP", () => {
  const src = source();
  // These mutation tools must NOT be registered as Site Tools
  const mutationTools = [
    "exchange_propose",
    "exchange_create_attempt",
    "exchange_submit_attempt",
    "exchange_create_proposal_from_attempt",
  ];
  for (const tool of mutationTools) {
    // The tool name may appear in comments but must NOT appear in a
    // registerTool call within the component
    const toolPattern = `name: "${tool}"`;
    assert.ok(!src.includes(toolPattern),
      `${tool} must not be registered as a Site Tool (mutation tools require auth)`);
  }
});

// ─── Schema tests ───────────────────────────────────────────────────────────

test("WebMCP: read-only Exchange tools use additionalProperties: false", () => {
  const src = source();
  // Schemas should include additionalProperties: false for safety
  const additionalPropsCount = (src.match(/additionalProperties:\s*false/g) || []).length;
  assert.ok(additionalPropsCount >= 3,
    `expected at least 3 additionalProperties: false (got ${additionalPropsCount})`);
});

test("WebMCP: read-only tools have readOnlyHint annotation", () => {
  const src = source();
  // Exchange tools should have readOnlyHint: true
  assert.ok(src.includes("readOnlyHint: true") || src.includes('"readOnlyHint": true'),
    "read-only Exchange tools must have readOnlyHint annotation");
});

// ─── Security tests ─────────────────────────────────────────────────────────

test("WebMCP: no client secrets embedded in source", () => {
  const src = source();
  // Must not contain any hardcoded secrets, API keys, or tokens
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{20,}/,  // OpenAI-style keys
    /Bearer\s+[a-zA-Z0-9._-]+/,
    /api_key\s*[:=]\s*["'][^"']{10,}["']/i,
    /secret\s*[:=]\s*["'][^"']{10,}["']/i,
    /token\s*[:=]\s*["'][^"']{10,}["']/i,
    /password\s*[:=]\s*["'][^"']{6,}["']/i,
  ];
  for (const pattern of secretPatterns) {
    assert.doesNotMatch(src, pattern, `must not contain secret matching ${pattern}`);
  }
});

test("WebMCP: all fetch calls use relative URLs (origin-safe, no hardcoded hosts)", () => {
  const src = source();
  // All fetch calls should use the `origin` variable (window.location.origin)
  // or relative paths, never hardcoded external URLs
  const fetchMatches = src.match(/fetch\(`?\$\{origin\}[^`]*`?\)/g) || [];
  assert.ok(fetchMatches.length > 0, "must have fetch calls using origin variable");
  // Must not fetch from hardcoded external domains
  assert.doesNotMatch(src, /fetch\(["'`]https?:\/\/(?!signalaf)/,
    "must not fetch from hardcoded external URLs (use origin variable)");
});

// ─── Telemetry tests ────────────────────────────────────────────────────────

test("WebMCP: telemetry identifies transport: webmcp", () => {
  const src = source();
  assert.ok(src.includes('transport: "webmcp"') || src.includes("transport: 'webmcp'"),
    "telemetry must identify transport as webmcp");
  assert.ok(src.includes("beaconWebmcpCall") || src.includes("beacon"),
    "must have a beacon function for telemetry");
});

test("WebMCP: telemetry is fire-and-forget (never blocks tool execution)", () => {
  const src = source();
  // The beacon function must have a try/catch that swallows errors
  assert.ok(src.includes("// Telemetry must never break the page") ||
    src.includes("Telemetry must never"),
    "telemetry must document non-blocking behavior");
  // withTelemetry wrapper must not let beacon failure affect the result
  assert.ok(src.includes("withTelemetry"),
    "must wrap execute with telemetry wrapper");
});

test("WebMCP: beacon endpoint is the observability beacon route", () => {
  const src = source();
  assert.ok(src.includes("/api/exchange/observability/beacon"),
    "must beacon to the observability beacon endpoint");
});

// ─── Beacon endpoint tests ──────────────────────────────────────────────────

test("WebMCP: beacon route exists and accepts POST", async () => {
  const beaconSrc = readFileSync(
    resolve(root, "app/api/exchange/observability/beacon/route.ts"), "utf8"
  );
  assert.ok(beaconSrc.includes("export async function POST"),
    "beacon route must export POST handler");
  // Must enforce transport: "webmcp" only (prevent spoofing)
  assert.ok(beaconSrc.includes('transport !== "webmcp"'),
    "beacon route must reject non-webmcp transport");
  // Must require tool_name
  assert.ok(beaconSrc.includes("missing_tool_name"),
    "beacon route must require tool_name");
  // Must have rate limiting
  assert.ok(beaconSrc.includes("BEACON_MAX") || beaconSrc.includes("rate_limited"),
    "beacon route must have rate limiting");
});

// ─── Dashboard encounter link fix ───────────────────────────────────────────

test("WebMCP: dashboard no longer has broken/mislabeled encounter link", () => {
  const dashSrc = readFileSync(
    resolve(root, "components/exchange/ExchangeActivityClient.tsx"), "utf8"
  );
  // The mislabeled "View encounter data" link that pointed to the
  // observability summary endpoint must be removed.
  assert.doesNotMatch(dashSrc, /View encounter data/,
    "dashboard must not have mislabeled 'View encounter data' link");
  // The MCP observability section must remain and point to the correct endpoint
  assert.ok(dashSrc.includes("MCP observability"),
    "dashboard must still have MCP observability section");
  assert.ok(dashSrc.includes("/api/exchange/observability/summary"),
    "dashboard must link to the observability summary endpoint");
});

// ─── PostHog event tests ────────────────────────────────────────────────────

test("WebMCP: observability module emits PostHog exchange_mcp_call event", () => {
  const obsSrc = readFileSync(
    resolve(root, "lib/exchange/mcp-observability.ts"), "utf8"
  );
  assert.ok(obsSrc.includes("captureServer"),
    "observability module must import captureServer from PostHog");
  assert.ok(obsSrc.includes('"exchange_mcp_call"') || obsSrc.includes("'exchange_mcp_call'"),
    "observability module must emit exchange_mcp_call event");
  // Must include the required properties from the prompt
  assert.ok(obsSrc.includes("server_id"), "event must include server_id");
  assert.ok(obsSrc.includes("transport"), "event must include transport");
  assert.ok(obsSrc.includes("operation"), "event must include operation");
  assert.ok(obsSrc.includes("tool_name"), "event must include tool_name");
  assert.ok(obsSrc.includes("auth_tier"), "event must include auth_tier");
  assert.ok(obsSrc.includes("duration_bucket"), "event must include duration_bucket");
  assert.ok(obsSrc.includes("idempotent_replay"), "event must include idempotent_replay");
  assert.ok(obsSrc.includes("client_name"), "event must include client_name");
});

// ─── Cross-domain discovery tests ───────────────────────────────────────────
// These tests fetch exchange.json from the live domains rather than reading
// sibling repo files (which don't exist in CI). Falls back to local files
// when available (local dev with sibling repos checked out).

async function fetchExchangeJson(domain, localPath) {
  // Try local file first (dev environment with sibling repos)
  try {
    const local = readFileSync(localPath, "utf8");
    return JSON.parse(local);
  } catch {
    // Fall back to live fetch (CI environment)
    const res = await fetch(`https://${domain}/.well-known/exchange.json`);
    if (!res.ok) throw new Error(`${domain} exchange.json fetch failed: ${res.status}`);
    return res.json();
  }
}

test("WebMCP: signomy.xyz exchange.json has MCP block", async () => {
  const parsed = await fetchExchangeJson(
    "signomy.xyz",
    resolve(root, "..", "..", "..", "_5_Signomy", "1_agent-universe",
      "frontend", ".well-known", "exchange.json")
  );
  assert.ok(parsed.mcp, "signomy.xyz exchange.json must have mcp block");
  assert.equal(parsed.mcp.server_name, "contribution-exchange");
  assert.equal(parsed.mcp.endpoint, "https://signalaf.com/api/exchange/mcp");
  assert.equal(parsed.mcp.transport, "streamable-http");
  assert.ok(parsed.mcp.hosting === "central",
    "signomy.xyz must declare central hosting (not its own MCP server)");
});

test("WebMCP: mos2es.com exchange.json has MCP block", async () => {
  const parsed = await fetchExchangeJson(
    "mos2es.com",
    resolve(root, "..", "..", "..", "_1_moses", "1_mos2es-site",
      ".well-known", "exchange.json")
  );
  assert.ok(parsed.mcp, "mos2es.com exchange.json must have mcp block");
  assert.equal(parsed.mcp.server_name, "contribution-exchange");
  assert.equal(parsed.mcp.endpoint, "https://signalaf.com/api/exchange/mcp");
  assert.equal(parsed.mcp.transport, "streamable-http");
  assert.ok(parsed.mcp.hosting === "central",
    "mos2es.com must declare central hosting (not its own MCP server)");
});
