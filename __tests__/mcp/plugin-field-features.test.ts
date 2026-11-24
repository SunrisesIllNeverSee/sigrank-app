// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import Ajv from "ajv/dist/2020";
import { NextRequest } from "next/server";
import contracts from "@/lib/mcp/plugin/contracts.json";
import type { LeaderboardRow } from "@/lib/board/types";

const h = vi.hoisted(() => ({
  rows: [] as unknown[], platformRows: [] as unknown[], db: true,
  read: vi.fn(), probe: vi.fn(),
}));
vi.mock("@/lib/board", () => ({ getLeaderboard: (args: { perPlatform?: boolean }) => { h.read(args); return args.perPlatform ? h.platformRows : h.rows; } }));
vi.mock("@/lib/board/queries", () => ({ getOperator: () => null }));
vi.mock("@/lib/infra/supabase/server", () => ({ getSupabaseService: () => {
  h.probe(); return h.db ? { from: () => ({ select: async () => ({ count: 3, error: null }) }) } : null;
} }));
vi.mock("@/lib/infra/distributed-rate-limit", () => ({ checkDistributedRateLimit: vi.fn() }));
vi.mock("@/lib/mcp/route-limit", () => ({ mcpRateLimitResponse: async () => null }));
vi.mock("@/lib/mcp/posthog", () => ({ posthogMcp: null }));
vi.mock("@/lib/mcp/plugin/radar", () => ({ radarMcp: null, instrumentPluginRadar: vi.fn() }));

import { callPluginTool, liveBoard, platformBoard } from "@/lib/mcp/plugin/service";
import { distribution, fieldPage, orderedEntries, metricValue } from "@/lib/mcp/plugin/field-analysis";
import { POST } from "@/app/api/plugins/sigrank/mcp/route";

function row(name: string, input = 10, output = 20, write: number | null = 0, read = 100, platform = "claude", rank = 1, nonCompounding = false) {
  return { operator: { codename: name, display_name: name, primary_domain: platform, claimed: true, status: "active", isPlaceholder: false },
    platform, global_rank: rank, percentile: 50, snapshot_date: "2026-11-20", window_start: "2026-11-01", window_end: "2026-11-20",
    telemetry: { fresh_input: input, output, cache_create: write, cache_read: read },
    snapshot: { class_tier: "POWER", ruleset_version: "test", snapshot_date: "2026-11-20", cascade: {
      yield_: read * output / input ** 2, leverage: read / input, velocity: output / input,
      snr: output / (output + input), construction: write === null ? null : write / read, dev10x: 1, scaleV: 4,
      opRatio: `${read / input}:1:${output / input}`, nonCompounding,
    } } } as unknown as LeaderboardRow;
}
const request = new Request("https://analyst.signalaf.com/api/plugins/sigrank/mcp");
async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await callPluginTool(name, args, request);
  const schema = contracts.tools.find(t => t.name === name)!.outputSchema;
  const validate = new Ajv({ strict: false, validateFormats: false }).compile(schema);
  expect(validate(result), JSON.stringify(validate.errors)).toBe(true);
  return result as { status: string; data: Record<string, any> | null; error: { code: string } | null };
}
beforeEach(() => { h.db = true; h.rows = [row("a"), row("b", 30, 40, 20, 300, "codex", 2)]; h.platformRows = h.rows;
  h.read.mockClear(); h.probe.mockClear(); liveBoard.clear(); platformBoard.clear(); });

describe("full-field statistics and sorting", () => {
  it("uses the same claimed all-time default scope for the board and statistics", async () => {
    const board = await call("get_leaderboard"), field = await call("get_field_stats");
    expect(board.data!.scope).toEqual(field.data!.scope);
    expect(board.data!.scope).toMatchObject({ window: "all", view: "total", dataset: "live" });
    expect(h.read).toHaveBeenCalledWith(expect.objectContaining({ claimedOnly: true, operatorTotal: true, window: "all_time", strictLive: true }));
  });
  it("a named platform does not silently broaden the default population", async () => {
    const out = await call("get_field_stats", { platform: "claude" });
    expect(out.data!.scope).toMatchObject({ platform: "claude", view: "total", population: "claimed_operators" });
    expect(h.read).toHaveBeenCalledWith(expect.objectContaining({ claimedOnly: true, perPlatform: true, operatorTotal: false }));
  });
  it("includes the full field, missingness and observed zeros in arithmetic statistics", async () => {
    h.rows = [row("zero"), row("other", 30, 40, 20), row("missing", 50, 60, null)];
    const out = await call("get_field_stats");
    const counts = out.data!.token_distributions;
    expect(counts.input).toMatchObject({ n: 3, mean: 30, median: 30, min: 10, max: 50 });
    expect(counts.cache_write).toMatchObject({ n: 2, missing_count: 1, zero_count: 1, mean: 10, median: 10 });
    expect(counts.total.missing_count).toBe(1);
  });
  it("sorts the whole eligible field before pagination and preserves published rank", async () => {
    h.rows = Array.from({ length: 120 }, (_, i) => row(`op${i}`, i + 1, 1, 0, 1, "claude", i + 1));
    const first = await call("get_leaderboard", { sort_by: "input", order: "desc", limit: 100 });
    expect(first.data!.entries[0]).toMatchObject({ codename: "op119", rank: 120, position: 1 });
    const next = await call("get_leaderboard", { sort_by: "input", order: "desc", limit: 100, cursor: first.data!.next_cursor });
    expect(next.data!.entries).toHaveLength(20); expect(next.data!.entries[0].position).toBe(101);
    expect(next.data!.next_cursor).toBeNull();
    expect(new Set([...first.data!.entries, ...next.data!.entries].map(e => e.codename)).size).toBe(120);
    const changed = await call("get_leaderboard", { sort_by: "output", cursor: first.data!.next_cursor });
    expect(changed.error!.code).toBe("INVALID_CURSOR");
  });
  it("masks non-compounding Yield just like the published board, while retaining observed tokens", async () => {
    h.rows = [row("compound", 100, 1, 1, 100, "claude", 1), row("noncompound", 10, 20, 0, 100, "claude", 2, true)];
    const out = await call("get_leaderboard");
    expect(out.data!.entries[1]).toMatchObject({ codename: "noncompound", metrics: { yield: null, leverage: null, dev10x: null }, pillars: { input: 10 } });
    expect((await call("get_field_stats")).data!.distributions.yield.missing_count).toBe(1);
  });
  it("returns null statistics for empty populations without invented zeros", async () => {
    h.rows = [];
    const out = await call("get_field_stats");
    expect(out.data!.population_size).toBe(0); expect(out.data!.token_distributions.input).toMatchObject({ n: 0, mean: null, median: null, missing_count: 0 });
  });
  it.each([{ sort_by: "private" }, { order: "sideways" }, { limit: 0 }, { dataset: "july_2026" }])("rejects unsupported live requests %j", async args => {
    const out = await call("get_leaderboard", args); expect(out.status).toBe("error");
  });
});

describe("platform grouping", () => {
  it("uses platform snapshots, reports overlap and keeps means weighted by records", async () => {
    h.platformRows = [row("both", 10, 20, 0, 100, "claude"), row("both", 30, 20, 0, 100, "codex"), row("other", 50, 20, 0, 100, "codex")];
    const out = await call("get_platform_stats");
    expect(out.data).toMatchObject({ record_count: 3, unique_operator_count: 2, overlapping_operators: 1, denominator: "operator_platform_records" });
    expect(out.data!.groups[1]).toMatchObject({ platform: "codex", population_size: 2, token_distributions: { input: { mean: 40 } }, periods_aligned: true });
    expect(h.read).toHaveBeenCalledWith(expect.objectContaining({ perPlatform: true, claimedOnly: true, operatorTotal: false }));
  });
  it("discloses mixed and missing periods instead of treating window labels as durations", async () => {
    const other = row("other"); other.window_start = null;
    h.platformRows = [row("one"), other];
    const out = await call("get_platform_stats");
    expect(out.data!.groups[0]).toMatchObject({ periods_aligned: false, common_period: null });
  });
  it("marks otherwise aligned platform groups as different periods across the comparison", async () => {
    const codex = row("two", 10, 20, 0, 100, "codex"); codex.window_start = "2026-10-01";
    h.platformRows = [row("one"), codex];
    const out = await call("get_platform_stats");
    expect(out.data!.groups.every((g: { periods_aligned: boolean }) => g.periods_aligned)).toBe(true);
    expect(out.data!.periods_aligned).toBe(false); expect(out.data!.common_period).toBeNull();
  });
  it("does not treat invalid or reversed period bounds as comparable", async () => {
    const bad = row("bad"); bad.window_start = "2026-11-30";
    h.platformRows = [bad];
    expect((await call("get_platform_stats")).data!.periods_aligned).toBe(false);
  });
});

describe("Streamable HTTP feature calls", () => {
  it.each(["get_field_stats", "get_platform_stats", "get_historical_board"])("executes %s through the actual SDK handler", async name => {
    const response = await POST(new NextRequest(request.url, { method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: name === "get_historical_board" ? { limit: 2 } : {} } }),
    }));
    expect(response.status).toBe(200);
    const text = await response.text(), data = text.split("\n").find(line => line.startsWith("data: "));
    const rpc = JSON.parse(data ? data.slice(6) : text);
    expect(rpc.error).toBeUndefined(); expect(rpc.result.isError).not.toBe(true);
    expect(rpc.result.structuredContent.status).toBe("ok");
  });
});

describe("frozen historical tool", () => {
  it("works without a database and preserves archive composition and original rank", async () => {
    h.db = false;
    const out = await call("get_historical_board", { limit: 2, sort_by: "input", order: "asc" });
    expect(h.probe).not.toHaveBeenCalled(); expect(h.read).not.toHaveBeenCalled();
    expect(out.data).toMatchObject({ population_size: 1642, archive: { seeded: 1626, real: 16, generatedAt: "2026-07-31T12:09:09.303Z" } });
    expect(out.data!.entries).toHaveLength(2); expect(out.data!.next_cursor).toBeTruthy();
    const name = out.data!.entries[0].codename;
    const detail = await call("get_historical_board", { codenames: [name] });
    expect(detail.data!.entries[0].rank).toBe(out.data!.entries[0].rank);
    expect(detail.data!.population_size).toBe(1);
  });
  it("pages without scope mixing and rejects live selectors and unknown archive records", async () => {
    const first = await call("get_historical_board", { limit: 100 });
    const next = await call("get_historical_board", { limit: 100, cursor: first.data!.next_cursor });
    expect(next.data!.entries[0].position).toBe(101);
    expect(new Set([...first.data!.entries, ...next.data!.entries].map(e => e.codename)).size).toBe(200);
    expect((await call("get_historical_board", { window: "all" })).error!.code).toBe("INVALID_ARGUMENT");
    expect((await call("get_historical_board", { codenames: ["nonexistent-record"] })).error!.code).toBe("NOT_FOUND");
    expect((await call("get_historical_board", { limit: 0 })).error!.code).toBe("INVALID_ARGUMENT");
  });
});

describe("numeric and cursor edge cases", () => {
  it("keeps means and medians distinct in a skewed population", () => {
    expect(distribution([0, 0, 300, null, NaN])).toMatchObject({ n: 3, missing_count: 2, mean: 100, median: 0, zero_count: 2 });
  });
  it("ties remain stable, missing data sorts last in both directions, and counts cannot be negative", () => {
    const entries = [{ codename: "b", pillars: { input: null, output: 0, cache_read: 0, cache_write: 0 }, metrics: {} },
      { codename: "a", pillars: { input: 0, output: 0, cache_read: 0, cache_write: -1 }, metrics: {} }] as unknown as import("@/lib/mcp/plugin/field-analysis").FieldEntry[];
    expect(orderedEntries(entries, "input", "asc")[0].codename).toBe("a");
    expect(orderedEntries(entries, "input", "desc")[0].codename).toBe("a");
    expect(metricValue(entries[1], "total")).toBeNull();
  });
  it("cursors survive retrieval timestamps but reject changed values", () => {
    const rows = [{ value: 1, retrieved_at: "first" }, { value: 2, retrieved_at: "first" }];
    const first = fieldPage(rows, "query", 1, undefined);
    expect(fieldPage(rows.map(r => ({ ...r, retrieved_at: "later" })), "query", 1, first.next_cursor).offset).toBe(1);
    expect(() => fieldPage([{ ...rows[0], value: 3 }, rows[1]], "query", 1, first.next_cursor)).toThrow("INVALID_CURSOR");
  });
});
