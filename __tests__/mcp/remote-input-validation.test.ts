// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ captured: [] as { event: string; distinctId?: string; properties: Record<string, unknown> }[] }));
vi.mock("@/lib/exchange/mcp-observability", () => ({ recordMcpCall: vi.fn().mockResolvedValue(undefined), hashIp: vi.fn().mockReturnValue("h"), deriveAuthTier: vi.fn().mockReturnValue("anonymous") }));
vi.mock("@/lib/exchange/mcp-server", () => ({ dispatchExchangeTool: vi.fn(), isExchangeTool: vi.fn().mockReturnValue(false), resolveScopes: vi.fn().mockReturnValue(new Set<string>()), enforceScopeForCall: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/mcp/posthog", () => ({
  posthogMcp: {
    capture: (e: { event: string; distinctId?: string; properties?: Record<string, unknown> }) => { h.captured.push({ event: e.event, distinctId: e.distinctId, properties: e.properties ?? {} }); },
    flush: async () => {},
  },
}));

const { POST } = await import("@/app/api/mcp/route");
import { isProbeCall, sessionDistinctId } from "@/lib/mcp/analytics";
import { exampleArguments } from "@/lib/mcp/lenient-schema";

async function rpc(body: unknown, headers: Record<string, string> = {}) {
  const res = await POST(new NextRequest("https://signalaf.com/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", origin: "https://signalaf.com", ...headers },
    body: JSON.stringify(body),
  }));
  const text = await res.text();
  const line = text.split("\n").find(l => l.startsWith("data: "));
  return JSON.parse(line ? line.slice(6) : text);
}
const callTool = (name: string, args: unknown, headers?: Record<string, string>) =>
  rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, headers);

describe("remote sigrank input validation", () => {
  it("ignores unknown extra properties", async () => {
    const out = await callTool("rank_paste", { input: 1000, output: 100, cache_read: 5000, cache_write: 100, note: "extra", foo: 1 });
    expect(out.result?.isError).toBeFalsy();
    expect(JSON.parse(out.result.content[0].text).input).toBe(1000);
  });

  it("lists required fields and an example when fields are missing", async () => {
    const out = await callTool("rank_paste", { input: 1000 });
    const text = JSON.stringify(out);
    expect(text).toMatch(/Required fields: input, output, cache_read, cache_write/);
    expect(text).toMatch(/Example call: rank_paste/);
  });

  it("still rejects wrong types, with guidance", async () => {
    const text = JSON.stringify(await callTool("rank_paste", { input: -5, output: 1, cache_read: 1, cache_write: 1 }));
    expect(text).toMatch(/>= 0/);
    expect(text).toMatch(/Example call/);
  });

  it("reports ignored extras back in _meta", async () => {
    const out = await callTool("rank_paste", { input: 1000, output: 100, cache_read: 5000, cache_write: 100, note: "extra", foo: 1 });
    expect(out.result._meta?.ignored_arguments).toEqual(["note", "foo"]);
    expect(JSON.stringify(out.result.content)).not.toContain("__sigrank_ignored_arguments");
  });

  it("rejects a property that looks like a typo, with did-you-mean", async () => {
    const text = JSON.stringify(await callTool("rank_paste", { input: 1, output: 1, cache_read: 1, cache_write: 1, cache_wrte: 3 }));
    expect(text).toMatch(/did you mean \\"cache_write\\"/);
  });

  it("builds example arguments from required fields", () => {
    expect(exampleArguments({ required: ["a", "b"], properties: { a: { type: "number" }, b: { type: "string", enum: ["x"] } } })).toEqual({ a: 1000, b: "x" });
    expect(exampleArguments({
      required: ["c", "d", "e", "f", "g", "h"],
      properties: {
        c: { const: "fixed" }, d: { type: "integer", minimum: 5000, maximum: 6000 }, e: { type: "integer", maximum: 10 },
        f: { anyOf: [{ type: "null" }, { type: "string", minLength: 8 }] }, g: { type: "string", examples: ["hello"] }, h: { type: "string", maxLength: 3 },
      },
    })).toEqual({ c: "fixed", d: 5000, e: 10, f: "examplex", g: "hello", h: "exa" });
  });
});

describe("remote sigrank probe flag and session id", () => {
  it("flags nonexistent tools and probe names, not real tools", () => {
    const known = (n: string) => n === "rank_paste";
    expect(isProbeCall("", "", "__mcp_index_nonexistent__", known)).toBe(true);
    expect(isProbeCall("", "", "__orank_nonexistent_tool_probe__", known)).toBe(true);
    expect(isProbeCall("", "", "calculate", known)).toBe(true);
    expect(isProbeCall("mcp-registry-call-probe", "x", "rank_paste", known)).toBe(true);
    expect(isProbeCall("claude-code", "x", "rank_paste", known)).toBe(false);
    // Exchange tools served through /api/mcp are known, not probes.
    const withExchange = (n: string) => known(n) || n.startsWith("exchange_");
    expect(isProbeCall("claude-code", "x", "exchange_get_policy", withExchange)).toBe(false);
  });

  it("stamps is_probe on tool-call events", async () => {
    h.captured.length = 0;
    await callTool("__mcp_index_nonexistent__", {});
    await callTool("rank_paste", { input: 1, output: 1, cache_read: 1, cache_write: 1 });
    const calls = h.captured.filter(e => e.event === "$mcp_tool_call");
    expect(calls.find(c => c.properties.$mcp_tool_name === "__mcp_index_nonexistent__")?.properties.is_probe).toBe(true);
    expect(calls.find(c => c.properties.$mcp_tool_name === "rank_paste")?.properties.is_probe).toBe(false);
  });

  it("hashes the session id and never echoes it", () => {
    const id = sessionDistinctId("abc-123");
    expect(id).toMatch(/^mcp-session:[0-9a-f]{32}$/);
    expect(id).not.toContain("abc-123");
    expect(sessionDistinctId("abc-123")).toBe(id);
    expect(sessionDistinctId(undefined)).toBeNull();
    expect(sessionDistinctId("  ")).toBeNull();
  });
});

describe("session distinct id on the wire", () => {
  it("uses a hash of Mcp-Session-Id, or stays anonymous without one", async () => {
    h.captured.length = 0;
    await callTool("rank_paste", { input: 1, output: 1, cache_read: 1, cache_write: 1 }, { "mcp-session-id": "sess-secret-1" });
    await callTool("rank_paste", { input: 1, output: 1, cache_read: 1, cache_write: 1 });
    const calls = h.captured.filter(e => e.event === "$mcp_tool_call");
    const withId = calls.find(c => String(c.distinctId ?? c.properties.distinct_id).startsWith("mcp-session:"));
    expect(withId).toBeTruthy();
    expect(calls.every(c => c.properties.$process_person_profile === false)).toBe(true);
    expect(JSON.stringify(calls)).not.toContain("sess-secret-1");
  });
});
