// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  process.env.RADAR_KEY = "rk_test_local-placeholder";
  process.env.VERCEL_ENV = "production";
  return { after: [] as (() => unknown)[], sent: [] as Record<string, unknown>[] };
});

vi.mock("next/server", async importOriginal => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (fn: () => unknown) => { h.after.push(fn); },
}));
vi.mock("@/lib/mcp/posthog", () => ({ posthogMcp: null }));
vi.mock("@/lib/infra/distributed-rate-limit", () => ({
  checkDistributedRateLimit: async () => ({ ok: true }),
}));
vi.mock("@/lib/mcp/plugin/service", () => ({
  callPluginTool: async () => ({ status: "error", error: { code: "operator_not_found", message: "private error detail" } }),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/plugins/sigrank/mcp/route";
import { redactRadarEvent } from "@/lib/mcp/plugin/radar";
import type { RadarEvent } from "@pluginsradar/analytics";
import contracts from "@/lib/mcp/plugin/contracts.json";

beforeEach(() => {
  h.after.length = 0;
  h.sent.length = 0;
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    h.sent.push(...JSON.parse(String(init.body)).events);
    return new Response(null, { status: 202 });
  }));
});

async function rpc(body: unknown) {
  const response = await POST(new NextRequest("https://analyst.signalaf.com/api/plugins/sigrank/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "user-agent": "private user agent" },
    body: JSON.stringify(body),
  }));
  const text = await response.text();
  for (const task of h.after.splice(0)) await task();
  const data = text.split("\n").find(line => line.startsWith("data: "));
  return JSON.parse(data ? data.slice(6) : text);
}

describe("Analyst Radar transport integration", () => {
  it("records a real SDK tool response and flushes only the permitted metadata", async () => {
    const response = await rpc({
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: {
        name: "get_operator", arguments: { operator: "private operator query" },
        _meta: {
          "openai/subject": "pseudonymous-user", "openai/session": "pseudonymous-conversation",
          "openai/organization": "private-org", "openai/locale": "en-US",
          "openai/userLocation": { country: "US", city: "private city", region: "private region", timezone: "private timezone" },
        },
      },
    });
    expect(response.result.isError).toBe(true);
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]).toMatchObject({
      type: "tool_call", tool: "get_operator", status: "tool_error", platform: "chatgpt",
      platform_user: "pseudonymous-user", platform_conversation: "pseudonymous-conversation", locale: "en-US",
    });
    expect(h.sent[0].duration_ms).toEqual(expect.any(Number));
    for (const field of ["args", "arg_names", "args_hash", "raw", "meta_keys", "platform_org", "user_agent", "country", "region", "city", "timezone", "content", "structuredContent"]) {
      expect(h.sent[0]).not.toHaveProperty(field);
    }
    expect(JSON.stringify(h.sent)).not.toContain("private");
  });

  it("keeps published schemas and security metadata unchanged", async () => {
    const { result } = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(result.tools).toHaveLength(contracts.tools.length);
    for (const tool of result.tools) {
      const published = contracts.tools.find(entry => entry.name === tool.name)!;
      expect(Object.keys(tool.inputSchema.properties).sort()).toEqual(Object.keys(published.inputSchema.properties).sort());
      expect(tool.securitySchemes).toEqual(published.securitySchemes);
    }
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].type).toBe("tools_list");
  });

  it("continues returning tool responses when the intake refuses the key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 403 })));
    const response = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_operator", arguments: { operator: "none" } } });
    expect(response.result.isError).toBe(true);
  });

  it("drops other protocol events and masks unrecognized tool names", () => {
    const event = { event_id: "test", type: "resource_read", at: "test", sdk_version: "test", resource_uri: "private" } as RadarEvent;
    expect(redactRadarEvent(event)).toBeNull();
    expect(redactRadarEvent({ ...event, type: "tool_call", tool: "private query" })?.tool).toBe("unknown_tool");
  });

  it("stays disabled without a key and on Vercel previews", async () => {
    vi.stubEnv("RADAR_KEY", undefined);
    vi.resetModules();
    expect((await import("@/lib/mcp/plugin/radar")).radarMcp).toBeNull();
    vi.stubEnv("RADAR_KEY", "rk_test_local-placeholder");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.resetModules();
    expect((await import("@/lib/mcp/plugin/radar")).radarMcp).toBeNull();
    vi.unstubAllEnvs();
  });
});
