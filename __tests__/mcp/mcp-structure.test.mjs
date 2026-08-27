/**
 * __tests__/mcp/mcp-structure.test.mjs
 *
 * Structural tests for the SignalAF MCP server. These tests read the source
 * files and verify the MCP protocol structure is intact. They serve as
 * regression tests for the structural renovation — if the migration
 * accidentally removes a tool, resource, or prompt, these tests fail.
 *
 * After Phase 3 of the MCP structural renovation, the route delegates to the
 * official MCP SDK v2 (createMcpHandler) for protocol negotiation and method
 * dispatch. Tool/resource/prompt definitions live in lib/mcp/{tools,resources,
 * prompts}/. Server identity and registration live in lib/mcp/server.ts.
 * The route retains transport-level concerns: origin validation, Exchange
 * compatibility bridge, observability, and protocol version header checks.
 *
 * Run:
 *   node --test __tests__/mcp/mcp-structure.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const routePath = join(__dirname, "..", "..", "app", "api", "mcp", "route.ts");
const protocolPath = join(__dirname, "..", "..", "lib", "mcp", "protocol.ts");
const serverPath = join(__dirname, "..", "..", "lib", "mcp", "server.ts");
const toolsPath = join(__dirname, "..", "..", "lib", "mcp", "tools", "index.ts");
const resourcesPath = join(__dirname, "..", "..", "lib", "mcp", "resources", "index.ts");
const promptsPath = join(__dirname, "..", "..", "lib", "mcp", "prompts", "index.ts");
const securityPath = join(__dirname, "..", "..", "lib", "mcp", "security.ts");

const routeSource = readFileSync(routePath, "utf-8");
const protocolSource = readFileSync(protocolPath, "utf-8");
const serverSource = readFileSync(serverPath, "utf-8");
const toolsSource = readFileSync(toolsPath, "utf-8");
const resourcesSource = readFileSync(resourcesPath, "utf-8");
const promptsSource = readFileSync(promptsPath, "utf-8");
const securitySource = readFileSync(securityPath, "utf-8");

// ─── Protocol helpers ───────────────────────────────────────────────────────

test("protocol.ts exports PROTOCOL_VERSION = 2025-06-18", () => {
  assert.match(protocolSource, /PROTOCOL_VERSION\s*=\s*["']2025-06-18["']/);
});

test("protocol.ts exports SUPPORTED_VERSIONS with 2025-06-18 and 2025-03-26", () => {
  assert.match(protocolSource, /SUPPORTED_VERSIONS.*2025-06-18.*2025-03-26/s);
});

test("route.ts does NOT import SUPPORTED_VERSIONS (delegates to SDK)", () => {
  assert.doesNotMatch(routeSource, /SUPPORTED_VERSIONS/);
});

test("route.ts does NOT apply a protocol version ceiling", () => {
  assert.doesNotMatch(routeSource, /SUPPORTED_VERSIONS/);
  assert.doesNotMatch(routeSource, /negotiateProtocolVersion/);
});

test("protocol.ts exports jsonRpc helper", () => {
  assert.match(protocolSource, /export\s+function\s+jsonRpc/);
});

test("protocol.ts exports rpcError helper", () => {
  assert.match(protocolSource, /export\s+function\s+rpcError/);
});

test("protocol.ts exports textResult helper", () => {
  assert.match(protocolSource, /export\s+function\s+textResult/);
});

test("protocol.ts re-exports allowedOrigin from security.ts", () => {
  assert.match(protocolSource, /export\s*\{\s*allowedOrigin\s*\}/);
});

test("security.ts exports allowedOrigin helper", () => {
  assert.match(securitySource, /export\s+function\s+allowedOrigin/);
});

test("protocol.ts exports negotiateProtocolVersion helper", () => {
  assert.match(protocolSource, /export\s+function\s+negotiateProtocolVersion/);
});

test("protocol.ts sets Cache-Control: no-store on responses", () => {
  assert.match(protocolSource, /Cache-Control.*no-store/);
});

test("protocol.ts sets MCP-Protocol-Version header on responses", () => {
  assert.match(protocolSource, /MCP-Protocol-Version/);
});

// ─── Route handler structure ────────────────────────────────────────────────

test("route.ts exports POST handler", () => {
  assert.match(routeSource, /export\s+async\s+function\s+POST/);
});

test("route.ts exports GET handler", () => {
  assert.match(routeSource, /export\s+async\s+function\s+GET/);
});

test("route.ts exports DELETE handler", () => {
  assert.match(routeSource, /export\s+async\s+function\s+DELETE/);
});

test("route.ts checks allowedOrigin at entry", () => {
  assert.match(routeSource, /allowedOrigin\s*\(\s*req\s*\)/);
});

test("route.ts handles parse errors with -32700", () => {
  assert.match(routeSource, /-32700.*Parse error/);
});

test("route.ts handles invalid request with -32600", () => {
  assert.match(routeSource, /-32600.*Invalid Request/);
});

// ─── SDK integration ────────────────────────────────────────────────────────

test("route.ts imports createMcpHandler from SDK", () => {
  assert.match(routeSource, /createMcpHandler.*@modelcontextprotocol\/server/);
});

test("route.ts imports createSigrankServer from lib/mcp/server", () => {
  assert.match(routeSource, /createSigrankServer.*@\/lib\/mcp\/server/);
});

test("route.ts delegates to SDK handler via .fetch()", () => {
  assert.match(routeSource, /mcpHandler\.fetch/);
});

test("server.ts imports McpServer from SDK", () => {
  assert.match(serverSource, /McpServer[\s\S]*@modelcontextprotocol\/server/);
});

test("server.ts imports fromJsonSchema from SDK", () => {
  assert.match(serverSource, /fromJsonSchema[\s\S]*@modelcontextprotocol\/server/);
});

// ─── Method dispatch (now via SDK + server.ts) ──────────────────────────────
// The SDK handles initialize, ping, notifications/initialized, tools/list,
// tools/call, resources/list, resources/read, prompts/list, prompts/get.
// server.ts registers all tools/resources/prompts with the SDK.
// The route intercepts tools/call for the Exchange compatibility bridge
// and records observability for initialize/tools_list/tools_call.

test("route.ts intercepts tools/call for Exchange bridge", () => {
  assert.match(routeSource, /method\s*===\s*["']tools\/call["']/);
});

test("route.ts records initialize observability", () => {
  assert.match(routeSource, /method\s*===\s*["']initialize["']/);
});

test("route.ts records tools/list observability", () => {
  assert.match(routeSource, /method\s*===\s*["']tools\/list["']/);
});

test("server.ts registers tools via registerTool", () => {
  assert.match(serverSource, /registerTool/);
});

test("server.ts registers resources via registerResource", () => {
  assert.match(serverSource, /registerResource/);
});

test("server.ts registers prompts via registerPrompt", () => {
  assert.match(serverSource, /registerPrompt/);
});

// ─── Tool definitions (lib/mcp/tools/index.ts) ──────────────────────────────

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

for (const toolName of EXPECTED_TOOLS) {
  test(`tools/index.ts defines tool: ${toolName}`, () => {
    assert.match(
      toolsSource,
      new RegExp(`name:\\s*["']${toolName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}["']`),
    );
  });
}

test("tools/index.ts defines exactly 15 SigRank tools", () => {
  const matches = toolsSource.match(/name:\s*["'](rank_paste|get_leaderboard|get_operator|simulate_change|diagnose_cascade|suggest_improvements|self_improve|rank_windows|benchmark_me|rank_if|operator_gap|field_anomaly|who_operates_like_me|compare_to_field|operator_signature)["']/g);
  assert.ok(matches, "No tool definitions found");
  // Some tool names may appear in multiple contexts (definition + dispatch)
  const uniqueTools = new Set(matches.map((m) => m.match(/["']([^"']+)["']/)[1]));
  assert.equal(uniqueTools.size, 15, `Expected 15 unique tools, found ${uniqueTools.size}`);
});

test("server.ts imports TOOLS from lib/mcp/tools", () => {
  assert.match(serverSource, /import\s*\{.*TOOLS.*\}\s*from\s*["']@\/lib\/mcp\/tools["']/);
});

test("server.ts imports callTool from lib/mcp/tools", () => {
  assert.match(serverSource, /import\s*\{.*callTool.*\}\s*from\s*["']@\/lib\/mcp\/tools["']/);
});

// ─── Resource definitions (lib/mcp/resources/index.ts) ──────────────────────

const EXPECTED_RESOURCES = [
  "sigrank://methodology",
  "sigrank://metrics",
  "sigrank://platforms",
  "sigrank://formulas",
  "sigrank://classes",
  "sigrank://benchmarks",
];

for (const uri of EXPECTED_RESOURCES) {
  test(`resources/index.ts defines resource: ${uri}`, () => {
    const escaped = uri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(resourcesSource, new RegExp(escaped));
  });
}

test("server.ts imports RESOURCES from lib/mcp/resources", () => {
  assert.match(serverSource, /import\s*\{.*RESOURCES.*\}\s*from\s*["']@\/lib\/mcp\/resources["']/);
});

// ─── Prompt definitions (lib/mcp/prompts/index.ts) ──────────────────────────

const EXPECTED_PROMPTS = [
  "benchmark-my-operator",
  "how-do-i-reach-top-10",
  "explain-my-signature",
  "diagnose-inefficiency",
  "field-anomaly-report",
];

for (const promptName of EXPECTED_PROMPTS) {
  test(`prompts/index.ts defines prompt: ${promptName}`, () => {
    const escaped = promptName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    assert.match(promptsSource, new RegExp(escaped));
  });
}

test("server.ts imports PROMPTS from lib/mcp/prompts", () => {
  assert.match(serverSource, /import\s*\{.*PROMPTS.*\}\s*from\s*["']@\/lib\/mcp\/prompts["']/);
});

// ─── Server identity (lib/mcp/server.ts) ────────────────────────────────────

test("server.ts server name is 'sigrank'", () => {
  assert.match(serverSource, /name:\s*["']sigrank["']/);
});

test("server.ts server title includes 'SigRank'", () => {
  assert.match(serverSource, /title:\s*["']SigRank/);
});

test("server.ts server version is 1.0.0", () => {
  assert.match(serverSource, /version:\s*["']1\.0\.0["']/);
});

test("server.ts server websiteUrl is signalaf.com", () => {
  assert.match(serverSource, /websiteUrl:\s*["']https:\/\/signalaf\.com["']/);
});

// ─── Exchange compatibility bridge ──────────────────────────────────────────

test("route.ts imports Exchange compatibility bridge", () => {
  assert.match(routeSource, /dispatchExchangeTool|isExchangeTool/);
});

test("tools/index.ts does NOT advertise Exchange tools in TOOLS array", () => {
  // The TOOLS array should not include exchange_ prefixed tools
  // Check that exchange tool names don't appear in the TOOLS array definition
  const toolsSection = toolsSource.match(/export\s+const\s+TOOLS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
  assert.ok(toolsSection, "TOOLS array not found in tools/index.ts");
  assert.doesNotMatch(toolsSection[1], /exchange_discover_domain/);
  assert.doesNotMatch(toolsSection[1], /exchange_propose/);
});

// ─── Observability ──────────────────────────────────────────────────────────

test("route.ts imports recordMcpCall for observability", () => {
  assert.match(routeSource, /recordMcpCall/);
});

test("route.ts records initialize calls", () => {
  assert.match(routeSource, /operation:\s*["']initialize["']/);
});

test("route.ts records tools_list calls", () => {
  assert.match(routeSource, /operation:\s*["']tools_list["']/);
});

test("route.ts records tools_call operations", () => {
  assert.match(routeSource, /operation:\s*["']tools_call["']/);
});

// ─── Security ───────────────────────────────────────────────────────────────

test("route.ts enforces origin validation", () => {
  assert.match(routeSource, /allowedOrigin/);
});

test("route.ts returns 403 on origin mismatch", () => {
  assert.match(routeSource, /status:\s*403/);
});
