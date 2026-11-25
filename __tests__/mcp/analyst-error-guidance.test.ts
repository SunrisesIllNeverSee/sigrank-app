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
describe("ttlMemo keep", () => {
  it("does not keep results the caller rejects", async () => {
    let n = 0;
    const f = ttlMemo(60_000, (k: string) => k, async (_k: string) => (n++ === 0 ? [] : [1]), (r) => r.length > 0);
    expect(await f("a")).toEqual([]);
    await Promise.resolve();
    expect(await f("a")).toEqual([1]);
    expect(await f("a")).toEqual([1]);
    expect(n).toBe(2);
  });
});
