// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ rows: [] as unknown[] }));
vi.mock("@/lib/board", () => ({ getLeaderboard: () => h.rows }));
vi.mock("@/lib/board/queries", () => ({ getOperator: () => null }));
vi.mock("@/lib/infra/supabase/server", () => ({ getSupabaseService: () => ({ from: () => ({ select: async () => ({ count: 3, error: null }) }) }) }));
vi.mock("@/lib/infra/distributed-rate-limit", () => ({ checkDistributedRateLimit: vi.fn() }));
vi.mock("@/lib/mcp/posthog", () => ({ posthogMcp: null }));

import { callPluginTool, liveBoard, normalizePlatform } from "@/lib/mcp/plugin/service";

const req = new Request("https://analyst.signalaf.com/api/plugins/sigrank/mcp");
const call = (name: string, args: Record<string, unknown> = {}) => callPluginTool(name, args, req as never) as Promise<{ status: string; error: { code: string; message: string } | null; data: any }>;

beforeEach(() => { h.rows = []; liveBoard.clear(); });

describe("Analyst error guidance", () => {
  it("maps client/product names to the supported platform", () => {
    expect(normalizePlatform("claude-code")).toBe("claude");
    expect(normalizePlatform("codex-cli")).toBe("codex");
    expect(normalizePlatform("gemini-cli")).toBe("gemini");
    expect(normalizePlatform("claude")).toBe("claude");
    expect(normalizePlatform("cursor")).toBe("cursor");
    expect(normalizePlatform("Claude_Code")).toBe("claude");
    expect(normalizePlatform("chatgpt-desktop")).toBe("chatgpt");
    // Vendor names are not one platform: not mapped.
    for (const v of ["google", "gpt", "anthropic", "openai"]) expect(normalizePlatform(v)).toBe(v);
  });

  it("accepts an alias instead of UNSUPPORTED_SCOPE", async () => {
    h.rows = [];
    const out = await call("get_leaderboard", { platform: "claude-code" });
    expect(out.error?.code).not.toBe("UNSUPPORTED_SCOPE");
  });

  it("lists the supported platforms when the platform is unknown", async () => {
    const out = await call("get_platform_stats", { platform: "cursor" });
    expect(out.error?.code).toBe("UNSUPPORTED_SCOPE");
    expect(out.error?.message).toMatch(/Use one of: all, claude, codex, chatgpt, gemini, pi, multi/);
  });

  it("tells the caller which cohort value works", async () => {
    const out = await call("get_field_stats", { cohort: "exact4" });
    expect(out.error?.code).toBe("UNSUPPORTED_SCOPE");
    expect(out.error?.message).toMatch(/cohort "public"/);
  });

  it("says how to find valid codenames on NOT_FOUND", async () => {
    const out = await call("get_operator", { codename: "audit-fixturex" });
    expect(out.error?.code).toBe("NOT_FOUND");
    expect(out.error?.message).toMatch(/get_leaderboard/);
    const cmp = await call("compare_operators", { codename_a: "x", codename_b: "y" });
    expect(cmp.error?.message).toMatch(/get_leaderboard/);
  });
});

import { ttlMemo } from "@/lib/mcp/untrusted";
describe("ttlMemo negative caching", () => {
  it("caches rejected results only for the short negative TTL", async () => {
    vi.useFakeTimers();
    try {
      let n = 0;
      const f = ttlMemo(60_000, (k: string) => k, async (_k: string) => (n++ < 1 ? [] : [1]), (r) => r.length > 0, 10_000);
      expect(await f("a")).toEqual([]);
      await Promise.resolve();
      expect(await f("a")).toEqual([]);
      expect(n).toBe(1);
      vi.advanceTimersByTime(11_000);
      expect(await f("a")).toEqual([1]);
      vi.advanceTimersByTime(30_000);
      await f("a");
      expect(n).toBe(2);
    } finally { vi.useRealTimers(); }
  });
  it("treats a throwing keep as a rejected result", async () => {
    let n = 0;
    const f = ttlMemo(60_000, (k: string) => k, async () => ++n, () => { throw new Error("x"); }, 10_000);
    expect(await f("a")).toBe(1);
    await Promise.resolve();
    expect(await f("a")).toBe(1);
  });
});

describe("get_historical_board platform aliases", () => {
  it("normalizes the platform filter", async () => {
    const out = await call("get_historical_board", { platform: "Claude_Code" });
    expect(out.error?.code).not.toBe("INVALID_ARGUMENT");
  });
});
