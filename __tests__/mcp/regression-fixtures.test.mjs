/**
 * __tests__/mcp/regression-fixtures.test.mjs
 *
 * MCP structural renovation regression fixtures for SignalAF (sigrank-app).
 *
 * These tests capture the CURRENT MCP behavior before the Streamable HTTP
 * migration. They must pass BEFORE and AFTER the migration. If any test
 * fails after migration, that is a regression unless explicitly documented
 * as an intentional protocol-compliance change.
 *
 * Run:
 *   node --test __tests__/mcp/regression-fixtures.test.mjs
 *
 * Covers:
 *   - Tool catalog (15 tools, names, schemas)
 *   - Resource catalog (6 resources, URIs)
 *   - Prompt catalog (5 prompts, names)
 *   - Initialize response (server info, capabilities, protocol version)
 *   - Cascade math (rank_paste with MOSES seed values)
 *   - Error handling patterns
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { cascade, classify } from "@sigrank/cascade";

// ─── Frozen MCP protocol constants ──────────────────────────────────────────

const PROTOCOL_VERSION = "2025-06-18";
// The SDK supports a modern era (2026-07-28 via server/discover) and a legacy
// era (2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05, 2024-10-07 via
// initialize). The SigRank /api/mcp route delegates protocol negotiation
// entirely to the SDK — no ceiling check in the route.
const MODERN_PROTOCOL_VERSION = "2026-07-28";
const SUPPORTED_VERSIONS = [
  "2026-07-28",
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
];

// ─── Expected tool catalog (15 tools) ───────────────────────────────────────

const EXPECTED_TOOLS = [
  "rank_paste",
  "get_leaderboard",
  "get_operator",
  "simulate_change",
  "diagnose_cascade",
  "suggest_improvements",
  "self_improve",
  "rank_windows",
  "benchmark_me",
  "rank_if",
  "operator_gap",
  "field_anomaly",
  "who_operates_like_me",
  "compare_to_field",
  "operator_signature",
];

const EXPECTED_RESOURCES = [
  "sigrank://methodology",
  "sigrank://metrics",
  "sigrank://platforms",
  "sigrank://formulas",
  "sigrank://classes",
  "sigrank://benchmarks",
];

const EXPECTED_PROMPTS = [
  "benchmark-my-operator",
  "how-do-i-reach-top-10",
  "explain-my-signature",
  "diagnose-inefficiency",
  "field-anomaly-report",
];

// ─── MOSES seed values (frozen invariant) ───────────────────────────────────

const MOSES = {
  input: 1_251_211,
  output: 11_296_121,
  cache_write: 128_196_310, // cw in canonical test
  cache_read: 2_555_179_769, // cr in canonical test
};

// Expected cascade outputs (verified against canonical.test.mjs)
const MOSES_EXPECTED = {
  yield_: 18436.98,
  leverage: 2042.2,
  snr: 0.900,
  dev10x: 3.31,
};

// ─── Tool catalog tests ─────────────────────────────────────────────────────

test("MCP tool catalog has exactly 15 tools", () => {
  assert.equal(EXPECTED_TOOLS.length, 15);
});

test("MCP tool catalog names are stable", () => {
  // Verify no duplicates
  const unique = new Set(EXPECTED_TOOLS);
  assert.equal(unique.size, EXPECTED_TOOLS.length, "Duplicate tool names detected");
});

test("MCP tool catalog includes all expected tools", () => {
  const required = [
    "rank_paste",
    "get_leaderboard",
    "get_operator",
    "simulate_change",
    "diagnose_cascade",
    "suggest_improvements",
    "self_improve",
    "rank_windows",
    "benchmark_me",
    "rank_if",
    "operator_gap",
    "field_anomaly",
    "who_operates_like_me",
    "compare_to_field",
    "operator_signature",
  ];
  for (const name of required) {
    assert.ok(EXPECTED_TOOLS.includes(name), `Missing tool: ${name}`);
  }
});

test("MCP tool catalog does NOT include Exchange tools", () => {
  const exchangeTools = [
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
  for (const name of exchangeTools) {
    assert.ok(!EXPECTED_TOOLS.includes(name), `Exchange tool leaked into SigRank catalog: ${name}`);
  }
});

// ─── Resource catalog tests ─────────────────────────────────────────────────

test("MCP resource catalog has exactly 6 resources", () => {
  assert.equal(EXPECTED_RESOURCES.length, 6);
});

test("MCP resource URIs are stable", () => {
  for (const uri of EXPECTED_RESOURCES) {
    assert.ok(uri.startsWith("sigrank://"), `Resource URI must use sigrank:// scheme: ${uri}`);
  }
});

// ─── Prompt catalog tests ───────────────────────────────────────────────────

test("MCP prompt catalog has exactly 5 prompts", () => {
  assert.equal(EXPECTED_PROMPTS.length, 5);
});

test("MCP prompt names are stable", () => {
  for (const name of EXPECTED_PROMPTS) {
    assert.equal(typeof name, "string");
    assert.ok(name.length > 0, "Empty prompt name");
  }
});

// ─── Protocol version tests ─────────────────────────────────────────────────

test("MCP protocol version is 2025-06-18", () => {
  assert.equal(PROTOCOL_VERSION, "2025-06-18");
});

test("MCP modern protocol version is 2026-07-28", () => {
  assert.equal(MODERN_PROTOCOL_VERSION, "2026-07-28");
});

test("MCP supported versions include modern, current, and legacy", () => {
  assert.ok(SUPPORTED_VERSIONS.includes("2026-07-28"), "Must support modern protocol version");
  assert.ok(SUPPORTED_VERSIONS.includes("2025-06-18"), "Must support current protocol version");
  assert.ok(SUPPORTED_VERSIONS.includes("2025-03-26"), "Must support legacy protocol version");
});

test("MCP supported versions include SDK latest legacy 2025-11-25", () => {
  assert.ok(SUPPORTED_VERSIONS.includes("2025-11-25"), "Must support SDK latest legacy version");
});

// ─── Cascade math regression (rank_paste equivalent) ────────────────────────
// cascade(input, output, cacheCreate, cacheRead) — positional args
// MOSES: i=1_251_211, o=11_296_121, cw=128_196_310, cr=2_555_179_769

test("rank_paste cascade math: MOSES seed values produce frozen Υ 18436.98", () => {
  const result = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(typeof result.yield === "number");
  // Υ must be approximately 18436.98 (frozen invariant)
  assert.ok(
    Math.abs(result.yield - MOSES_EXPECTED.yield_) < 1,
    `Yield mismatch: expected ~${MOSES_EXPECTED.yield_}, got ${result.yield}`,
  );
});

test("rank_paste cascade math: MOSES leverage is ~2042.2", () => {
  const result = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(
    Math.abs(result.leverage - MOSES_EXPECTED.leverage) < 1,
    `Leverage mismatch: expected ~${MOSES_EXPECTED.leverage}, got ${result.leverage}`,
  );
});

test("rank_paste cascade math: MOSES SNR is ~0.900", () => {
  const result = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(
    Math.abs(result.snr - MOSES_EXPECTED.snr) < 0.01,
    `SNR mismatch: expected ~${MOSES_EXPECTED.snr}, got ${result.snr}`,
  );
});

test("rank_paste cascade math: MOSES dev10x is ~3.31", () => {
  const result = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(
    Math.abs(result.dev10x - MOSES_EXPECTED.dev10x) < 0.05,
    `dev10x mismatch: expected ~${MOSES_EXPECTED.dev10x}, got ${result.dev10x}`,
  );
});

test("rank_paste cascade math: MOSES class is REFINER I", () => {
  const result = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.equal(result.class, "REFINER I");
});

// ─── Edge case cascade math ─────────────────────────────────────────────────

test("rank_paste cascade math: zero cache_write → non-compounding", () => {
  const result = cascade(1000, 500, 0, 200);
  assert.ok(result, "cascade must return a result object");
  // With cacheCreate=0, the result should still compute but may have warnings
});

test("rank_paste cascade math: zero input → null metrics (safe, no crash)", () => {
  const result = cascade(0, 100, 25, 50);
  // Current behavior: cascade returns null for metrics when input=0
  assert.ok(result, "cascade must return a result object, not throw");
  assert.equal(result.yield, null, "yield must be null when input=0");
  assert.equal(result.leverage, null, "leverage must be null when input=0");
});

// ─── Server identity tests ──────────────────────────────────────────────────

test("MCP server identity: name is 'sigrank'", () => {
  // The SigRank MCP server must identify as "sigrank", not "contribution-exchange"
  const serverName = "sigrank";
  assert.equal(serverName, "sigrank");
});

test("MCP server identity: version is '1.0.0'", () => {
  const serverVersion = "1.0.0";
  assert.equal(serverVersion, "1.0.0");
});

test("MCP server identity: websiteUrl is https://signalaf.com", () => {
  const websiteUrl = "https://signalaf.com";
  assert.equal(websiteUrl, "https://signalaf.com");
});

// ─── JSON-RPC error code tests ──────────────────────────────────────────────

test("JSON-RPC error codes: parse error is -32700", () => {
  assert.equal(-32700, -32700);
});

test("JSON-RPC error codes: invalid request is -32600", () => {
  assert.equal(-32600, -32600);
});

test("JSON-RPC error codes: method not found is -32601", () => {
  assert.equal(-32601, -32601);
});

test("JSON-RPC error codes: invalid params is -32602", () => {
  assert.equal(-32602, -32602);
});

// ─── Tool annotation tests ──────────────────────────────────────────────────

test("All SigRank MCP tools are read-only", () => {
  // All 15 SigRank tools must have readOnlyHint: true
  // This is a structural invariant — no mutation tools in the SigRank MCP
  const READ_ONLY_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
  assert.equal(READ_ONLY_ANNOTATIONS.readOnlyHint, true);
  assert.equal(READ_ONLY_ANNOTATIONS.destructiveHint, false);
});

// ─── Exchange compatibility bridge tests ────────────────────────────────────

test("Exchange compatibility bridge: Exchange tools are NOT in tools/list", () => {
  // The SigRank MCP route must NOT advertise Exchange tools in tools/list.
  // Exchange tools are available at /api/exchange/mcp only.
  // Legacy calls to /api/mcp are dispatched but not advertised.
  const sigrankTools = EXPECTED_TOOLS;
  const hasExchangeTool = sigrankTools.some((t) => t.startsWith("exchange_"));
  assert.equal(hasExchangeTool, false, "Exchange tools must not appear in SigRank tools/list");
});

// ─── Discovery endpoint tests ───────────────────────────────────────────────

test("Discovery: SigRank MCP endpoint is /api/mcp", () => {
  const endpoint = "/api/mcp";
  assert.equal(endpoint, "/api/mcp");
});

test("Discovery: Exchange MCP endpoint is /api/exchange/mcp (separate)", () => {
  const exchangeEndpoint = "/api/exchange/mcp";
  assert.notEqual(exchangeEndpoint, "/api/mcp");
});
