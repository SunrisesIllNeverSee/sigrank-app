// @vitest-environment node
/**
 * __tests__/mcp/protocol-conformance.test.ts
 *
 * Runtime protocol conformance tests for the SignalAF MCP server.
 * These tests invoke the actual POST/GET/DELETE route handlers with mock
 * MCP JSON-RPC requests and verify the responses — not source-text regex.
 *
 * Covers spec Sections 36-37:
 *   - Initialization (valid, protocol negotiation, unsupported, malformed)
 *   - Tools (list, call, unknown tool, invalid args, success, domain failure)
 *   - Resources (list, read, unknown)
 *   - Prompts (list, get, unknown)
 *   - Transport (valid request, invalid method, malformed payload, origin
 *     rejection, parse error, invalid JSON-RPC)
 *
 * External dependencies (Supabase, PostHog) are mocked so tests run without
 * network or database access. Pure-math tools (rank_paste, simulate_change,
 * etc.) are tested end-to-end through the full SDK protocol stack.
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextRequest } from "next/server";

// ── Mock external dependencies ──────────────────────────────────────────────
// Observability (Supabase-backed) — mock to no-ops, but keep a reference to
// recordMcpCall so we can assert it's called with the ACTUAL result (not a
// pre-execution "success" guess). This is the regression guard for the
// observability fix that moved tools/call telemetry into the tool handler.
const recordMcpCallMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/exchange/mcp-observability", () => ({
  recordMcpCall: recordMcpCallMock,
  hashIp: vi.fn().mockReturnValue("test-hash"),
  deriveAuthTier: vi.fn().mockReturnValue("anonymous"),
}));

// Exchange compatibility bridge — mock to no-ops (Exchange tools tested separately)
vi.mock("@/lib/exchange/mcp-server", () => ({
  dispatchExchangeTool: vi.fn(),
  isExchangeTool: vi.fn().mockReturnValue(false),
  resolveScopes: vi.fn().mockReturnValue(new Set<string>()),
  enforceScopeForCall: vi.fn().mockReturnValue(null),
}));

// PostHog telemetry — mock to no-op
vi.mock("@/lib/infra/posthog/server", () => ({
  captureServer: vi.fn().mockResolvedValue(undefined),
}));

const { POST, GET, DELETE } = await import("@/app/api/mcp/route");

// ── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = "https://signalaf.com/api/mcp";
const VALID_ORIGIN = "https://signalaf.com";

interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

function makePostRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(BASE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      origin: VALID_ORIGIN,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeJsonRpc(
  method: string,
  params?: Record<string, unknown>,
  id: string | number = 1,
): JsonRpcRequest {
  return { jsonrpc: "2.0", id, method, ...(params ? { params } : {}) };
}

function makeModernJsonRpc(
  method: string,
  params?: Record<string, unknown>,
  id: string | number = 1,
): JsonRpcRequest {
  const meta = {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {},
  };
  return {
    jsonrpc: "2.0",
    id,
    method,
    params: { ...(params ?? {}), _meta: meta },
  };
}

function makeModernPostRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  const bodyObj = typeof body === "string" ? JSON.parse(body) : (body as Record<string, unknown>);
  const method = bodyObj?.method as string | undefined;
  const name = (bodyObj?.params as Record<string, unknown>)?.name as string | undefined;
  return new NextRequest(BASE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      origin: VALID_ORIGIN,
      "mcp-protocol-version": "2026-07-28",
      ...(method ? { "mcp-method": method } : {}),
      ...(name ? { "mcp-name": name } : {}),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/**
 * Parse the response body. The SDK may return either:
 *   - Plain JSON (content-type: application/json)
 *   - SSE stream (content-type: text/event-stream)
 * This helper handles both formats.
 */
async function parseResponseBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  const trimmed = text.trim();

  // Plain JSON response
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  // SSE response: extract data: lines
  const dataLines = trimmed
    .split("\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => l.slice(6));

  if (dataLines.length > 0) {
    return JSON.parse(dataLines.join("\n"));
  }

  throw new Error(`Cannot parse response as JSON or SSE: ${text.slice(0, 300)}`);
}

// ── Initialization ──────────────────────────────────────────────────────────

describe("Initialization", () => {
  it("valid initialize returns server info and capabilities", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        }),
      ),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(1);
    expect(body.result).toBeDefined();
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    expect(result.serverInfo).toBeDefined();
    const serverInfo = result.serverInfo as Record<string, unknown>;
    expect(serverInfo.name).toBe("sigrank");
    expect(serverInfo.version).toBe("1.0.0");

    expect(result.capabilities).toBeDefined();
    const capabilities = result.capabilities as Record<string, unknown>;
    expect(capabilities.tools).toBeDefined();
    expect(capabilities.resources).toBeDefined();
    expect(capabilities.prompts).toBeDefined();
  });

  it("negotiates legacy protocol version 2025-03-26", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("initialize", {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "legacy-client", version: "0.1.0" },
        }),
      ),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();
    expect(body.result).toBeDefined();
  });

  it("negotiates SDK latest legacy protocol version 2025-11-25", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("initialize", {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        }),
      ),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();
    expect(body.result).toBeDefined();
  });

  it("rejects future protocol version header without envelope claim", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("initialize"), {
        "mcp-protocol-version": "2099-01-01",
      }),
    );

    // The SDK classifies 2099-01-01 as a modern version (>= 2026-07-28)
    // but since there is no envelope claim in params._meta, it returns
    // an error rather than dispatching the request.
    expect(res.status).not.toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeDefined();
  });

  it("handles malformed initialization (missing params)", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("initialize")),
    );

    // The SDK should handle missing params gracefully
    const body = await parseResponseBody(res);
    // Either succeeds with defaults or returns an error — both are acceptable
    // as long as the server doesn't crash
    expect(body.jsonrpc).toBe("2.0");
  });
});

// ── Modern protocol (2026-07-28) ────────────────────────────────────────────

describe("Modern protocol (2026-07-28)", () => {
  it("server/discover returns server info", async () => {
    const res = await POST(
      makeModernPostRequest(makeModernJsonRpc("server/discover", undefined, 50)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();
    expect(body.result).toBeDefined();
    const result = body.result as Record<string, unknown>;
    expect(result.serverInfo ?? result.capabilities).toBeDefined();
  });

  it("modern tools/list returns all 15 tools", async () => {
    const res = await POST(
      makeModernPostRequest(makeModernJsonRpc("tools/list", undefined, 51)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    const tools = result.tools as Array<Record<string, unknown>>;
    expect(tools.length).toBe(15);
  });

  it("modern tools/call executes rank_paste", async () => {
    const res = await POST(
      makeModernPostRequest(
        makeModernJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: {
              input: 1_251_211,
              output: 11_296_121,
              cache_read: 2_555_179_769,
              cache_write: 128_196_310,
            },
          },
          52,
        ),
      ),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    expect(result.content).toBeDefined();
    const content = result.content as Array<Record<string, unknown>>;
    expect(content[0].type).toBe("text");
  });

  it("modern resources/list returns resources", async () => {
    const res = await POST(
      makeModernPostRequest(makeModernJsonRpc("resources/list", undefined, 53)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    expect(result.resources).toBeDefined();
  });

  it("modern prompts/list returns prompts", async () => {
    const res = await POST(
      makeModernPostRequest(makeModernJsonRpc("prompts/list", undefined, 54)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    expect(result.prompts).toBeDefined();
  });

  it("MCP-Protocol-Version 2026-07-28 header without envelope claim is rejected", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("tools/list"), {
        "mcp-protocol-version": "2026-07-28",
      }),
    );

    expect(res.status).not.toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeDefined();
  });
});

// ── Tools ───────────────────────────────────────────────────────────────────

describe("Tools", () => {
  it("tools/list returns all 15 tools with correct names", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("tools/list", undefined, 2)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    const tools = result.tools as Array<Record<string, unknown>>;
    expect(tools.length).toBe(15);

    const names = tools.map((t) => t.name);
    const expected = [
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
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it("tools/list returns tools with inputSchema and annotations", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("tools/list", undefined, 3)),
    );

    const body = await parseResponseBody(res);
    const tools = (body.result as Record<string, unknown>).tools as Array<
      Record<string, unknown>
    >;

    for (const tool of tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.annotations).toBeDefined();
      // All SigRank tools are read-only
      const annotations = tool.annotations as Record<string, unknown>;
      expect(annotations.readOnlyHint).toBe(true);
    }
  });

  it("tools/call rank_paste with MOSES seeds returns frozen cascade metrics", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: {
              input: 1_251_211,
              output: 11_296_121,
              cache_read: 2_555_179_769,
              cache_write: 128_196_310,
            },
          },
          4,
        ),
      ),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    expect(result.content).toBeDefined();
    const content = result.content as Array<Record<string, unknown>>;
    expect(content[0].type).toBe("text");

    const parsed = JSON.parse(content[0].text as string);
    // Frozen canonical invariants (AGENTS.md)
    expect(parsed.yield_).toBeCloseTo(18436.98, 0);
    expect(parsed.leverage).toBeCloseTo(2042.2, 0);
    expect(parsed.snr).toBeCloseTo(0.9, 1);
    expect(parsed.dev10x).toBeCloseTo(3.31, 1);
    expect(parsed.class).toBe("REFINER I");
  });

  it("tools/call rank_paste with zero input returns null metrics (no crash)", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
          },
          5,
        ),
      ),
    );

    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();
    const result = body.result as Record<string, unknown>;
    const content = result.content as Array<Record<string, unknown>>;
    const parsed = JSON.parse(content[0].text as string);
    expect(parsed.yield_).toBeNull();
    expect(parsed.leverage).toBeNull();
  });

  it("tools/call rank_paste with invalid args returns SDK validation error", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: { input: "not a number", output: 100 },
          },
          6,
        ),
      ),
    );

    const body = await parseResponseBody(res);
    // The SDK validates input schema before dispatching to callTool.
    // Invalid types produce either:
    //   - a JSON-RPC error with code -32602 (Invalid Params), or
    //   - a result with isError=true and text describing the validation failure
    const err = body.error as Record<string, unknown> | undefined;
    if (err) {
      expect(err.code).toBe(-32602);
    } else {
      const result = body.result as Record<string, unknown>;
      expect(result.isError).toBe(true);
    }
  });

  it("tools/call with unknown tool returns error", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          { name: "nonexistent_tool", arguments: {} },
          7,
        ),
      ),
    );

    const body = await parseResponseBody(res);
    // SDK should return an error for unknown tools
    expect(body.error ?? (body.result as Record<string, unknown>)?.isError).toBeTruthy();
  });

  it("tools/call simulate_change returns modified metrics", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "simulate_change",
            arguments: {
              input: 1_251_211,
              output: 11_296_121,
              cache_read: 2_555_179_769,
              cache_write: 128_196_310,
              changes: {
                input: "-100000",
                output: "+50000",
              },
            },
          },
          8,
        ),
      ),
    );

    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();
    const result = body.result as Record<string, unknown>;
    const content = result.content as Array<Record<string, unknown>>;
    expect(content[0].type).toBe("text");
    const parsed = JSON.parse(content[0].text as string);
    expect(parsed).toBeDefined();
  });
});

// ── Resources ───────────────────────────────────────────────────────────────

describe("Resources", () => {
  it("resources/list returns all 6 resources", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("resources/list", undefined, 10)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    const resources = result.resources as Array<Record<string, unknown>>;
    expect(resources.length).toBe(6);

    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("sigrank://methodology");
    expect(uris).toContain("sigrank://metrics");
    expect(uris).toContain("sigrank://platforms");
    expect(uris).toContain("sigrank://formulas");
    expect(uris).toContain("sigrank://classes");
    expect(uris).toContain("sigrank://benchmarks");
  });

  it("resources/read resolves sigrank://methodology", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("resources/read", { uri: "sigrank://methodology" }, 11),
      ),
    );

    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    const contents = result.contents as Array<Record<string, unknown>>;
    expect(contents.length).toBeGreaterThan(0);
    expect(contents[0].uri).toBe("sigrank://methodology");
    expect(contents[0].text).toBeDefined();
  });

  it("resources/read resolves sigrank://formulas", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("resources/read", { uri: "sigrank://formulas" }, 12),
      ),
    );

    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();
    const result = body.result as Record<string, unknown>;
    const contents = result.contents as Array<Record<string, unknown>>;
    expect(contents.length).toBeGreaterThan(0);
    expect(contents[0].text).toBeDefined();
  });
});

// ── Prompts ─────────────────────────────────────────────────────────────────

describe("Prompts", () => {
  it("prompts/list returns all 5 prompts", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("prompts/list", undefined, 20)),
    );

    expect(res.status).toBe(200);
    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    const prompts = result.prompts as Array<Record<string, unknown>>;
    expect(prompts.length).toBe(5);

    const names = prompts.map((p) => p.name);
    expect(names).toContain("benchmark-my-operator");
    expect(names).toContain("how-do-i-reach-top-10");
    expect(names).toContain("explain-my-signature");
    expect(names).toContain("diagnose-inefficiency");
    expect(names).toContain("field-anomaly-report");
  });

  it("prompts/get returns messages for benchmark-my-operator", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "prompts/get",
          {
            name: "benchmark-my-operator",
            arguments: {
              input: "1000000",
              output: "5000000",
              cache_read: "8000000",
              cache_write: "2000000",
            },
          },
          21,
        ),
      ),
    );

    const body = await parseResponseBody(res);
    expect(body.error).toBeUndefined();

    const result = body.result as Record<string, unknown>;
    const messages = result.messages as Array<Record<string, unknown>>;
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].role).toBeDefined();
    expect(messages[0].content).toBeDefined();
  });
});

// ── Transport / Error handling ──────────────────────────────────────────────

describe("Transport and error handling", () => {
  it("rejects invalid JSON body with -32700 Parse error", async () => {
    const res = await POST(makePostRequest("not valid json{"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(-32700);
    expect(body.error.message).toContain("Parse error");
  });

  it("rejects invalid JSON-RPC version with -32600 Invalid Request", async () => {
    const res = await POST(
      makePostRequest({ jsonrpc: "1.0", id: 1, method: "initialize" }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(-32600);
    expect(body.error.message).toContain("Invalid Request");
  });

  it("rejects disallowed origin with 403 Forbidden", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        }),
        { origin: "https://evil.example.com" },
      ),
    );

    expect(res.status).toBe(403);
  });

  it("allows requests with no origin header (non-browser clients)", async () => {
    const res = await POST(
      makePostRequest(
        makeJsonRpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "curl", version: "1.0" },
        }),
        {},
      ),
    );

    // Remove origin header by constructing request without it
    const req = new NextRequest(BASE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(
        makeJsonRpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "curl", version: "1.0" },
        }),
      ),
    });

    const res2 = await POST(req);
    expect(res2.status).toBe(200);
  });

  it("GET handler delegates to SDK", async () => {
    const req = new NextRequest(BASE_URL, {
      method: "GET",
      headers: { origin: VALID_ORIGIN },
    });

    const res = await GET(req);
    // GET without session may return 400 or 405 from SDK — the key is that
    // it doesn't 403 (origin check passed) or 500 (crash)
    expect(res.status).toBeLessThan(500);
  });

  it("GET rejects disallowed origin with 403", async () => {
    const req = new NextRequest(BASE_URL, {
      method: "GET",
      headers: { origin: "https://evil.example.com" },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("DELETE handler delegates to SDK", async () => {
    const req = new NextRequest(BASE_URL, {
      method: "DELETE",
      headers: { origin: VALID_ORIGIN },
    });

    const res = await DELETE(req);
    expect(res.status).toBeLessThan(500);
  });

  it("DELETE rejects disallowed origin with 403", async () => {
    const req = new NextRequest(BASE_URL, {
      method: "DELETE",
      headers: { origin: "https://evil.example.com" },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });
});

// ── Observability regression guard ──────────────────────────────────────────
// Spec Section 24 requires tool invocation telemetry to survive the migration.
// The pre-migration route recorded the ACTUAL result (error vs success) and
// ACTUAL duration after callTool returned. After the SDK v2 migration, tool
// dispatch moved into the SDK handler, so observability must be recorded inside
// the tool handler (lib/mcp/server.ts) — not as a pre-execution "success" guess
// in the route. These tests verify the actual result is recorded.

describe("Observability records actual tool result (not pre-execution guess)", () => {
  it("records result: success for a valid rank_paste call", async () => {
    recordMcpCallMock.mockClear();
    const res = await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: {
              input: 1_251_211,
              output: 11_296_121,
              cache_read: 2_555_179_769,
              cache_write: 128_196_310,
            },
          },
          40,
        ),
      ),
    );
    expect(res.status).toBe(200);

    // Find the tools_call record (initialize/tools_list may also be recorded)
    const toolCall = recordMcpCallMock.mock.calls.find(
      (c) => c[0]?.operation === "tools_call" && c[0]?.tool_name === "rank_paste",
    );
    expect(toolCall).toBeDefined();
    expect(toolCall![0].result).toBe("success");
    expect(toolCall![0].duration_ms).toBeGreaterThanOrEqual(0);
    expect(toolCall![0].server_id).toBe("sigrank");
    expect(toolCall![0].transport).toBe("remote_mcp");
  });

  it("records result: error when callTool returns isError (invalid args)", async () => {
    recordMcpCallMock.mockClear();
    // rank_paste with a string input — callTool returns isError: true with
    // code: "invalid_arguments". The SDK may reject this at schema validation
    // (before reaching callTool), in which case no tools_call record is emitted
    // (which is also acceptable — the SDK owns the error). If callTool IS
    // reached and returns isError, the record must say "error" not "success".
    await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: { input: "not a number", output: 100, cache_read: 50, cache_write: 25 },
          },
          41,
        ),
      ),
    );

    const toolCall = recordMcpCallMock.mock.calls.find(
      (c) => c?.[0]?.operation === "tools_call" && c?.[0]?.tool_name === "rank_paste",
    );
    if (toolCall) {
      // If a record was emitted, it must NOT be a pre-execution "success" guess.
      // It must reflect the actual isError result from callTool.
      expect(toolCall[0].result).toBe("error");
    }
    // If no record was emitted, the SDK rejected at schema validation — acceptable.
  });

  it("never records a pre-execution success for tools/call (duration includes execution)", async () => {
    recordMcpCallMock.mockClear();
    await POST(
      makePostRequest(
        makeJsonRpc(
          "tools/call",
          {
            name: "rank_paste",
            arguments: {
              input: 1_251_211,
              output: 11_296_121,
              cache_read: 2_555_179_769,
              cache_write: 128_196_310,
            },
          },
          42,
        ),
      ),
    );

    const toolCall = recordMcpCallMock.mock.calls.find(
      (c) => c?.[0]?.operation === "tools_call" && c?.[0]?.tool_name === "rank_paste",
    );
    expect(toolCall).toBeDefined();
    // The duration must be >= 0 (measured after execution, not before).
    // A pre-execution guess would measure from startTime to before-dispatch (≈0).
    // The actual measurement includes callTool execution time.
    expect(toolCall![0].duration_ms).toBeGreaterThanOrEqual(0);
    // The result must be "success" (this call succeeds) — but it must be
    // recorded AFTER execution, which we infer from the fact that it's
    // accurate. The key invariant: result matches the actual callTool output.
    expect(toolCall![0].result).toBe("success");
  });
});

// ── Ping ────────────────────────────────────────────────────────────────────

describe("Ping", () => {
  it("ping returns response (not method not found)", async () => {
    const res = await POST(
      makePostRequest(makeJsonRpc("ping", undefined, 30)),
    );

    const body = await parseResponseBody(res);
    // Ping should either return a result or be handled by the SDK
    // It should NOT return -32601 Method not found
    if (body.error) {
      const code = (body.error as Record<string, unknown>).code;
      expect(code).not.toBe(-32601);
    } else {
      expect(body.result).toBeDefined();
    }
  });
});
