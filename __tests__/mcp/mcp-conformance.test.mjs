/**
 * __tests__/mcp/mcp-conformance.test.mjs
 *
 * Conformance tests for the SignalAF MCP server after SDK v2 migration.
 * These tests verify that:
 *   1. The SDK v2 packages are installed and importable
 *   2. The cascade math produces frozen canonical outputs
 *   3. The server module registers the correct number of tools/resources/prompts
 *   4. The route delegates to the SDK handler
 *   5. Wire-level protocol constants are preserved
 *
 * These tests use source-file reading (like mcp-structure.test.mjs) for
 * modules that use @/ path aliases, and direct imports for packages.
 *
 * Run:
 *   node --test __tests__/mcp/mcp-conformance.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cascade } from "@sigrank/cascade";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, "..", "..", "lib", "mcp", "server.ts");
const routePath = join(__dirname, "..", "..", "app", "api", "mcp", "route.ts");
const toolsPath = join(__dirname, "..", "..", "lib", "mcp", "tools", "index.ts");
const resourcesPath = join(__dirname, "..", "..", "lib", "mcp", "resources", "index.ts");
const promptsPath = join(__dirname, "..", "..", "lib", "mcp", "prompts", "index.ts");
const protocolPath = join(__dirname, "..", "..", "lib", "mcp", "protocol.ts");

const serverSource = readFileSync(serverPath, "utf-8");
const routeSource = readFileSync(routePath, "utf-8");
const toolsSource = readFileSync(toolsPath, "utf-8");
const resourcesSource = readFileSync(resourcesPath, "utf-8");
const promptsSource = readFileSync(promptsPath, "utf-8");
const protocolSource = readFileSync(protocolPath, "utf-8");

// ─── SDK v2 availability ────────────────────────────────────────────────────

test("SDK v2: McpServer is importable", async () => {
  const { McpServer } = await import("@modelcontextprotocol/server");
  assert.equal(typeof McpServer, "function");
});

test("SDK v2: createMcpHandler is importable", async () => {
  const { createMcpHandler } = await import("@modelcontextprotocol/server");
  assert.equal(typeof createMcpHandler, "function");
});

test("SDK v2: fromJsonSchema is importable", async () => {
  const { fromJsonSchema } = await import("@modelcontextprotocol/server");
  assert.equal(typeof fromJsonSchema, "function");
});

test("SDK v2: McpServer can be instantiated", async () => {
  const { McpServer } = await import("@modelcontextprotocol/server");
  const server = new McpServer({ name: "test", version: "1.0.0" });
  assert.ok(server);
  assert.equal(typeof server.registerTool, "function");
  assert.equal(typeof server.registerResource, "function");
  assert.equal(typeof server.registerPrompt, "function");
});

test("SDK v2: fromJsonSchema wraps raw JSON Schema", async () => {
  const { fromJsonSchema } = await import("@modelcontextprotocol/server");
  const schema = fromJsonSchema({ type: "object", properties: {} });
  assert.ok(schema);
});

test("SDK v2: createMcpHandler returns object with fetch method", async () => {
  const { McpServer, createMcpHandler } = await import("@modelcontextprotocol/server");
  const handler = createMcpHandler(() => new McpServer({ name: "test", version: "1.0.0" }));
  assert.ok(handler);
  assert.equal(typeof handler.fetch, "function");
});

// ─── Server module uses SDK correctly ───────────────────────────────────────

test("server.ts uses McpServer from SDK", () => {
  assert.match(serverSource, /new\s+McpServer\s*\(/);
});

test("server.ts uses fromJsonSchema for input schemas", () => {
  assert.match(serverSource, /fromJsonSchema/);
});

test("server.ts registers all tools in a loop", () => {
  assert.match(serverSource, /for\s*\(\s*const\s+tool\s+of\s+TOOLS/);
  assert.match(serverSource, /registerTool/);
});

test("server.ts registers all resources in a loop", () => {
  assert.match(serverSource, /for\s*\(\s*const\s+resource\s+of\s+RESOURCES/);
  assert.match(serverSource, /registerResource/);
});

test("server.ts registers all prompts in a loop", () => {
  assert.match(serverSource, /for\s*\(\s*const\s+prompt\s+of\s+PROMPTS/);
  assert.match(serverSource, /registerPrompt/);
});

test("server.ts server identity: name='sigrank'", () => {
  assert.match(serverSource, /name:\s*["']sigrank["']/);
});

test("server.ts server identity: version='1.0.0'", () => {
  assert.match(serverSource, /version:\s*["']1\.0\.0["']/);
});

test("server.ts server identity: websiteUrl='https://signalaf.com'", () => {
  assert.match(serverSource, /websiteUrl:\s*["']https:\/\/signalaf\.com["']/);
});

// ─── Route delegates to SDK ─────────────────────────────────────────────────

test("route.ts uses createMcpHandler", () => {
  assert.match(routeSource, /createMcpHandler/);
});

test("route.ts calls mcpHandler.fetch for POST", () => {
  assert.match(routeSource, /mcpHandler\.fetch/);
});

test("route.ts preserves origin validation before SDK delegation", () => {
  assert.match(routeSource, /allowedOrigin/);
  assert.match(routeSource, /status:\s*403/);
});

test("route.ts preserves parse error handling (-32700)", () => {
  assert.match(routeSource, /-32700/);
});

test("route.ts preserves invalid request handling (-32600)", () => {
  assert.match(routeSource, /-32600/);
});

test("route.ts preserves Exchange compatibility bridge", () => {
  assert.match(routeSource, /isExchangeTool/);
  assert.match(routeSource, /dispatchExchangeTool/);
});

test("route.ts preserves observability (recordMcpCall)", () => {
  assert.match(routeSource, /recordMcpCall/);
});

test("route.ts does NOT import SUPPORTED_VERSIONS (delegates to SDK)", () => {
  assert.doesNotMatch(routeSource, /SUPPORTED_VERSIONS/);
});

// ─── Protocol constants preserved ───────────────────────────────────────────

test("protocol.ts preserves PROTOCOL_VERSION = 2025-06-18", () => {
  assert.match(protocolSource, /2025-06-18/);
});

test("protocol.ts preserves SUPPORTED_VERSIONS with 2025-03-26", () => {
  assert.match(protocolSource, /2025-03-26/);
});

test("protocol.ts preserves Cache-Control: no-store", () => {
  assert.match(protocolSource, /no-store/);
});

test("protocol.ts preserves MCP-Protocol-Version header", () => {
  assert.match(protocolSource, /MCP-Protocol-Version/);
});

// ─── Tool/resource/prompt counts preserved ──────────────────────────────────

test("tools/index.ts defines 15 tools", () => {
  const matches = toolsSource.match(/name:\s*["'](rank_paste|get_leaderboard|get_operator|simulate_change|diagnose_cascade|suggest_improvements|self_improve|rank_windows|benchmark_me|rank_if|operator_gap|field_anomaly|who_operates_like_me|compare_to_field|operator_signature)["']/g);
  assert.ok(matches);
  const unique = new Set(matches.map((m) => m.match(/["']([^"']+)["']/)[1]));
  assert.equal(unique.size, 15);
});

test("resources/index.ts defines 6 resources", () => {
  const matches = resourcesSource.match(/uri:\s*["']sigrank:\/\//g);
  assert.ok(matches);
  assert.equal(matches.length, 6);
});

test("prompts/index.ts defines 5 prompts", () => {
  const matches = promptsSource.match(/name:\s*["'](benchmark-my-operator|how-do-i-reach-top-10|explain-my-signature|diagnose-inefficiency|field-anomaly-report)["']/g);
  assert.ok(matches);
  const unique = new Set(matches.map((m) => m.match(/["']([^"']+)["']/)[1]));
  assert.equal(unique.size, 5);
});

// ─── Frozen cascade outputs (canonical invariants) ──────────────────────────

const MOSES = {
  input: 1_251_211,
  output: 11_296_121,
  cache_write: 128_196_310,
  cache_read: 2_555_179_769,
};

test("cascade: MOSES seeds produce Yield 18436.98", () => {
  const c = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(c.yield !== null);
  assert.ok(
    Math.abs(c.yield - 18436.98) < 0.1,
    `Expected yield ~18436.98, got ${c.yield}`,
  );
});

test("cascade: MOSES seeds produce Leverage ~2042.2", () => {
  const c = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(c.leverage !== null);
  assert.ok(
    Math.abs(c.leverage - 2042.2) < 1,
    `Expected leverage ~2042.2, got ${c.leverage}`,
  );
});

test("cascade: MOSES seeds produce SNR ~0.9003", () => {
  const c = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(c.snr !== null);
  assert.ok(
    Math.abs(c.snr - 0.9003) < 0.01,
    `Expected SNR ~0.9003, got ${c.snr}`,
  );
});

test("cascade: MOSES seeds produce dev10x ~3.31", () => {
  const c = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  assert.ok(c.dev10x !== null);
  assert.ok(
    Math.abs(c.dev10x - 3.31) < 0.05,
    `Expected dev10x ~3.31, got ${c.dev10x}`,
  );
});

test("cascade: MOSES seeds classify as REFINER I", () => {
  const c = cascade(MOSES.input, MOSES.output, MOSES.cache_write, MOSES.cache_read);
  // The cascade result has a .class property set by the cascade engine
  assert.equal(c.class, "REFINER I");
});

test("cascade: zero input returns null metrics", () => {
  const c = cascade(0, 0, 0, 0);
  assert.equal(c.yield, null);
  assert.equal(c.leverage, null);
});

// ─── Legacy protocol version support ────────────────────────────────────────

test("protocol.ts supports legacy version 2025-03-26", () => {
  assert.match(protocolSource, /2025-03-26/);
});

test("protocol.ts negotiateProtocolVersion falls back to current version", () => {
  assert.match(protocolSource, /negotiateProtocolVersion/);
});
