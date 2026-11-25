// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ mode: "empty" as "empty" | "throw", calls: 0 }));
vi.mock("@/lib/board", () => ({
  getLeaderboard: async () => { h.calls++; if (h.mode === "throw") throw new Error("down"); return []; },
}));
vi.mock("@/lib/exchange/mcp-observability", () => ({ recordMcpCall: vi.fn().mockResolvedValue(undefined), hashIp: vi.fn().mockReturnValue("h"), deriveAuthTier: vi.fn().mockReturnValue("anonymous") }));
vi.mock("@/lib/exchange/mcp-server", () => ({ dispatchExchangeTool: vi.fn(), isExchangeTool: vi.fn().mockReturnValue(false), resolveScopes: vi.fn().mockReturnValue(new Set<string>()), enforceScopeForCall: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/mcp/posthog", () => ({ posthogMcp: null }));

const { POST } = await import("@/app/api/mcp/route");

async function fieldAnomaly(window: string) {
  const res = await POST(new NextRequest("https://signalaf.com/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", origin: "https://signalaf.com" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "field_anomaly", arguments: { window } } }),
  }));
  const text = await res.text();
  const line = text.split("\n").find(l => l.startsWith("data: "));
  return JSON.parse(JSON.parse(line ? line.slice(6) : text).result.content[0].text);
}

beforeEach(() => { h.calls = 0; });

describe("board_unavailable", () => {
  it("a failed read is temporary and retryable", async () => {
    h.mode = "throw";
    const out = await fieldAnomaly("7d");
    expect(out).toMatchObject({ code: "board_unavailable", retryable: true });
    expect(out.message).toMatch(/temporary/);
  });

  it("an empty board for a valid window is not retryable and not called temporary", async () => {
    h.mode = "empty";
    const out = await fieldAnomaly("90d");
    expect(out).toMatchObject({ code: "board_unavailable", retryable: false });
    expect(out.message).not.toMatch(/temporary|Retry/);
  });

  it("outages do not cause a board read per call", async () => {
    h.mode = "throw";
    await fieldAnomaly("30d");
    const after = h.calls;
    await fieldAnomaly("30d");
    await fieldAnomaly("30d");
    expect(h.calls).toBe(after);
  });
});
