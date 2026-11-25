// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ capture: vi.fn(async (..._a: unknown[]) => {}) }));
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: h.capture }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ insert: async () => ({ error: null }) }) }),
}));

import { recordMcpCall, bucketMcpMethod } from "@/lib/exchange/mcp-observability";
import { requestHost } from "@/lib/infra/request-host";

describe("MCP analytics host and method properties", () => {
  beforeEach(() => {
    h.capture.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
  });

  it("requestHost allow-lists hosts and never returns raw unknown values", () => {
    const mk = (o: Record<string, string>) => ({ headers: new Headers(o) });
    expect(requestHost(mk({ host: "SignalAF.com:3000" }))).toBe("signalaf.com");
    expect(requestHost(mk({ host: "analyst.signalaf.com" }))).toBe("analyst.signalaf.com");
    expect(requestHost(mk({ host: "a.dev", "x-forwarded-host": "signalaf.com, b" }))).toBe("signalaf.com");
    expect(requestHost(mk({ host: "sigrank-app-git-x.vercel.app" }))).toBe("preview");
    expect(requestHost(mk({ host: "signalaf.com", "x-forwarded-host": "evil.example" }))).toBe("signalaf.com");
    expect(requestHost(mk({ host: "evil.example" }))).toBe("other");
    expect(requestHost(mk({}))).toBeUndefined();
  });

  it("unknown method names are bucketed as other for PostHog", async () => {
    expect(bucketMcpMethod("resources/list")).toBe("resources/list");
    expect(bucketMcpMethod("x".repeat(60))).toBe("other");
    await recordMcpCall({
      server_id: "contribution-exchange", transport: "remote_mcp", operation: "unsupported_method",
      result: "error", metadata: { method: "totally/made-up" },
    });
    expect((h.capture.mock.calls[0][2] as Record<string, unknown>).method).toBe("other");
  });

  it("exchange_mcp_call carries host and the real method for unsupported methods", async () => {
    await recordMcpCall({
      server_id: "contribution-exchange", transport: "remote_mcp", operation: "unsupported_method",
      result: "error", host: "signalaf.com", metadata: { method: "resources/list" },
    });
    const [, event, props] = h.capture.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(event).toBe("exchange_mcp_call");
    expect(props).toMatchObject({ operation: "unsupported_method", host: "signalaf.com", method: "resources/list" });
  });

  it("host and method are null when absent", async () => {
    await recordMcpCall({ server_id: "sigrank", transport: "remote_mcp", operation: "tools_call", tool_name: "rank_paste", result: "success" });
    const props = h.capture.mock.calls[0][2] as Record<string, unknown>;
    expect(props).toMatchObject({ operation: "tools_call", host: null, method: null });
  });
});
