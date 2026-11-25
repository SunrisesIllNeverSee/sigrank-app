// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({ record: vi.fn(async (_r: Record<string, unknown>) => {}) }));

vi.mock("@/lib/exchange/mcp-observability", async (orig) => ({
  ...(await orig<typeof import("@/lib/exchange/mcp-observability")>()),
  recordMcpCall: h.record,
}));

import { POST } from "@/app/api/exchange/mcp/route";

function call(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest("https://signalaf.com/api/exchange/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const last = () => h.record.mock.calls.at(-1)![0];

describe("exchange MCP records the real operation", () => {
  beforeEach(() => h.record.mockClear());

  it("unknown methods are unsupported_method, not tools_call, and the client response is unchanged", async () => {
    const res = await call({ jsonrpc: "2.0", id: 7, method: "resources/list" });
    const json = await res.json();
    expect(json.error.code).toBe(-32601);
    expect(json.error.message).toBe("Method not found");
    expect(last()).toMatchObject({
      operation: "unsupported_method",
      error_code: "method_not_found",
      metadata: { method: "resources/list" },
    });
  });

  it("parse errors and malformed envelopes are invalid_request", async () => {
    const parse = await call("{nope");
    expect(parse.status).toBe(400);
    expect(last()).toMatchObject({ operation: "invalid_request", error_code: "parse_error" });
    const bad = await call({ jsonrpc: "1.0", id: 1, method: "tools/call" });
    expect(bad.status).toBe(400);
    expect(last()).toMatchObject({ operation: "invalid_request", error_code: "invalid_request" });
  });

  it("an unsupported protocol version is invalid_request", async () => {
    const res = await call({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { "mcp-protocol-version": "1999-01-01" });
    expect(res.status).toBe(400);
    expect(last()).toMatchObject({ operation: "invalid_request", error_code: "unsupported_protocol" });
  });

  it("tools/list and initialize keep their own operations and carry the host", async () => {
    await call({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { host: "SignalAF.com:443" });
    expect(last()).toMatchObject({ operation: "tools_list", host: "signalaf.com" });
    await call({ jsonrpc: "2.0", id: 2, method: "initialize", params: {} }, { host: "signalaf.com" });
    expect(last()).toMatchObject({ operation: "initialize", host: "signalaf.com" });
  });

  it("a tools/call that reaches tool handling stays tools_call", async () => {
    await call({ jsonrpc: "2.0", id: 3, method: "tools/call", params: {} });
    expect(last()).toMatchObject({ operation: "tools_call", error_code: "missing_tool_name" });
  });
});
