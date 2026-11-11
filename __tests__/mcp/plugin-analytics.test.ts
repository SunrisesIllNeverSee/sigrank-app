// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  captured: [] as { event: string; properties: Record<string, unknown> }[],
  flushes: 0,
  limiter: vi.fn(async (_d: string[], c: { max: number }) => ({ ok: true, retryAfter: 0, limit: c.max, remaining: c.max, reset: 60 })),
}));

vi.mock("@/lib/infra/distributed-rate-limit", () => ({ checkDistributedRateLimit: h.limiter }));
vi.mock("@/lib/mcp/plugin/service", () => ({
  callPluginTool: vi.fn(async () => ({ contract_version: "1.1.0", status: "error", error: { code: "operator_not_found", message: "No such operator" } })),
}));
vi.mock("@/lib/mcp/posthog", () => ({
  posthogMcp: {
    capture: (e: { event: string; properties?: Record<string, unknown> }) => { h.captured.push({ event: e.event, properties: e.properties ?? {} }); },
    flush: async () => { h.flushes += 1; },
  },
}));
vi.mock("next/server", async importOriginal => ({ ...(await importOriginal<typeof import("next/server")>()), after: (fn: () => unknown) => { void fn(); } }));

import { NextRequest } from "next/server";
import { POST as pluginPost } from "@/app/api/plugins/sigrank/mcp/route";
import { mcpSurface, mcpTraffic } from "@/lib/mcp/analytics";
import contracts from "@/lib/mcp/plugin/contracts.json";

const URL_ = "https://analyst.signalaf.com/api/plugins/sigrank/mcp";
const base = { "content-type": "application/json", accept: "application/json, text/event-stream", "x-real-ip": "203.0.113.9" };

async function rpc(body: unknown, headers: Record<string, string> = {}) {
  const res = await pluginPost(new NextRequest(URL_, { method: "POST", headers: { ...base, ...headers }, body: JSON.stringify(body) }));
  const text = await res.text();
  const line = text.split("\n").find(l => l.startsWith("data: "));
  return JSON.parse(line ? line.slice(6) : text);
}

const toolCalls = () => h.captured.filter(e => e.event === "$mcp_tool_call");

beforeEach(() => { h.captured.length = 0; h.flushes = 0; });

describe("Analyst connector MCP analytics", () => {
  it("leaves the published tool input schemas untouched", async () => {
    const { result } = await rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(result.tools).toHaveLength(contracts.tools.length);
    for (const tool of result.tools) {
      const published = contracts.tools.find(t => t.name === tool.name)!;
      expect(Object.keys(tool.inputSchema.properties ?? {}).sort()).toEqual(Object.keys(published.inputSchema.properties ?? {}).sort());
      expect(tool.inputSchema.required ?? []).toEqual(published.inputSchema.required ?? []);
    }
  });

  it("captures a ChatGPT tool call under the Analyst server name", async () => {
    await rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_operator", arguments: { operator: "nobody" } } }, { "user-agent": "openai-mcp/1.0.0" });
    const calls = toolCalls();
    expect(calls).toHaveLength(1);
    const p = calls[0].properties;
    expect(p.$mcp_tool_name).toBe("get_operator");
    expect(p.$mcp_server_name).toBe("sigrank-signalaf");
    expect(p.$mcp_is_error).toBe(true);
    expect(p.sigrank_mcp_surface).toBe("chatgpt");
    expect(p.sigrank_traffic).toBe("client");
    expect(h.flushes).toBeGreaterThan(0);
    expect(h.captured.some(e => e.event === "$exception")).toBe(false);
  });

  it("tags monitoring probes so dashboards can exclude them", async () => {
    await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_operator", arguments: { operator: "nobody" } } }, { "user-agent": "sentinel-probe/2.1" });
    expect(toolCalls()[0].properties.sigrank_traffic).toBe("probe");
  });
});

describe("surface and traffic labels", () => {
  it("reads the calling app from client name or User-Agent", () => {
    expect(mcpSurface("", "openai-mcp/1.0.0")).toBe("chatgpt");
    expect(mcpSurface("claude-ai", "Claude-User/1.0 (Anthropic MCP client)")).toBe("claude");
    expect(mcpSurface("claude-code", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("claude");
    expect(mcpSurface("codex-mcp-client", "codex-mcp-client/0.159.2")).toBe("codex");
    expect(mcpSurface("codexguild-catalog-review", "node")).toBe("other");
    expect(mcpSurface("cursor", "node")).toBe("other");
    expect(mcpSurface("", "")).toBe("unknown");
  });

  it("tags the monitors and indexers seen in production as probes", () => {
    const bots: [string, string][] = [
      ["fixter-monitoring", "Java-http-client/25.0.3"],
      ["glimind-probe", "SentinelOracle/0.1"],
      ["rokmcp-probe", "rokmcp-collector/0.2"],
      ["glama", "node"],
      ["talaria-catalog", "Talaria"],
      ["agent-collector", "agent-collector/0.1 (+health check)"],
      ["taifoon-harvester", "TaifoonHarvester/1.0.0"],
      ["AgentsJunction health checker", "node"],
      ["mcpbeat", "mcpbeat/0.1 (liveness check)"],
      ["mcpindex-trust", ""],
      ["mcplantern-check", "mcplantern-check/0.2"],
      ["mcp.market-uptime", "mcp.market uptime check"],
      ["SealKeeper", "SealKeeperBot/1.0"],
      ["mcpwatch", "MCPWatch/0.1.0"],
      ["exp116-census", "Python-urllib/3.12"],
      ["atpp-scan", "atpp-scan/1.0"],
      ["posthog-mcp-registry-probe", "python-requests/2.33.0"],
      ["codexguild-catalog-review", "node"],
    ];
    for (const [name, ua] of bots) expect(mcpTraffic(name, ua), name).toBe("probe");
  });

  it("leaves real AI apps as client traffic", () => {
    expect(mcpTraffic("claude-ai", "Claude-User/1.0 (Anthropic MCP client)")).toBe("client");
    expect(mcpTraffic("claude-code", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")).toBe("client");
    expect(mcpTraffic("codex-mcp-client", "codex-mcp-client/0.159.2")).toBe("client");
    expect(mcpTraffic("openai-mcp", "openai-mcp/1.0.0")).toBe("client");
    expect(mcpTraffic("cursor-vscode", "node")).toBe("client");
  });
});
