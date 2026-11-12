// @vitest-environment node
/**
 * The main `sigrank` MCP server is instrumented with @posthog/mcp. In 0.25 the
 * SDK injects analytics parameters (context, llm_model, conversation_id) into
 * every tool's input schema unless they are turned off. This guards that the
 * advertised tool schemas carry only SigRank's own parameters.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/exchange/mcp-observability", () => ({
  recordMcpCall: vi.fn().mockResolvedValue(undefined),
  hashIp: vi.fn().mockReturnValue("test-hash"),
  deriveAuthTier: vi.fn().mockReturnValue("anonymous"),
}));
vi.mock("@/lib/exchange/mcp-server", () => ({
  dispatchExchangeTool: vi.fn(),
  isExchangeTool: vi.fn().mockReturnValue(false),
  resolveScopes: vi.fn().mockReturnValue(new Set<string>()),
  enforceScopeForCall: vi.fn().mockReturnValue(null),
}));
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: vi.fn().mockResolvedValue(undefined) }));
// A non-null client so instrument() actually runs and would inject parameters.
vi.mock("@/lib/mcp/posthog", () => ({ posthogMcp: { capture: () => {}, flush: async () => {} } }));

const { POST } = await import("@/app/api/mcp/route");

const INJECTED = ["context", "llm_model", "conversation_id"];

describe("main sigrank MCP server analytics", () => {
  it("does not inject analytics parameters into tool schemas", async () => {
    const res = await POST(new NextRequest("https://signalaf.com/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", origin: "https://signalaf.com" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    }));
    const text = await res.text();
    const line = text.split("\n").find(l => l.startsWith("data: "));
    const { result } = JSON.parse(line ? line.slice(6) : text);
    expect(result.tools.length).toBeGreaterThan(0);
    for (const tool of result.tools) {
      const props = Object.keys(tool.inputSchema?.properties ?? {});
      const required: string[] = tool.inputSchema?.required ?? [];
      for (const name of INJECTED) {
        expect(props, `${tool.name} advertises ${name}`).not.toContain(name);
        expect(required, `${tool.name} requires ${name}`).not.toContain(name);
      }
    }
  });
});
