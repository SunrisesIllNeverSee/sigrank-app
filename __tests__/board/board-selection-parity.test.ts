/**
 * __tests__/board/board-selection-parity.test.ts
 *
 * Egress fix (2026-11-14): the board must show EXACTLY the same data whether
 * the page keeps its rows by pulling every snapshot and picking in JS (legacy)
 * or by asking Postgres for just the picked rows (BOARD_DB_SELECTION=1).
 *
 * Two layers:
 *   1. selection parity — selectLegacy() vs selectSqlModel() (the JS twin of
 *      migration 0059), both fed through the SAME assembleLeaderboard(), for
 *      every window and every param combination the callers use.
 *   2. end-to-end plumbing — the real getLeaderboard() with the flag off vs on,
 *      against a fake Supabase client whose rpc() runs the SQL model. Proves the
 *      rpc args, the claimed-operator restriction and the chunked .in() reads.
 *
 * Ordering note: rows whose sort value ties are ordered arbitrarily by the
 * legacy path (it depends on PostgREST's same-date row order); the SQL path
 * orders them deterministically. Fixtures here have distinct yields so the
 * full sequence is compared exactly; a dedicated test covers ties.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { BoardParams, DbMetricSnapshot, DbOperator } from "@/lib/board/mappers";
import {
  boardSelectionArgs,
  canUseDbSelection,
  modelBoardOperatorPlatforms,
  modelBoardPickSnapshots,
  selectLegacy,
  selectSqlModel,
} from "@/lib/board/selection";
import { assembleLeaderboard } from "@/lib/board/assemble";
import { sortValue } from "@/lib/board/fallback";

// ── Fixtures ────────────────────────────────────────────────────────────

/** Deterministic PRNG so failures reproduce. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const hex = (n: number, len: number) => n.toString(16).padStart(len, "0");
const uuid = (n: number) => `${hex(n, 8)}-0000-4000-8000-${hex(n * 7919, 12)}`;

function snapRow(over: Partial<DbMetricSnapshot> & { operator_id: string }): DbMetricSnapshot {
  return {
    metric_snapshot_id: null,
    snapshot_date: "2026-11-01",
    window_type: "all_time",
    platform: "multi",
    compression_ratio: 1,
    prompt_complexity: 1,
    cross_thread: 1,
    session_depth: 1,
    token_throughput: 100,
    signa_rate: 1,
    sdot_score: 1,
    sdrm_score: 1,
    signal_force: 1,
    drift_ratio: 0.5,
    class_tier: "POWER I",
    movement_24h: null,
    movement_7d: null,
    ruleset_version: "v1",
    input_tokens: 1000,
    output_tokens: 1000,
    cache_creation_tokens: 500,
    cache_read_tokens: 5000,
    account_age_days: 100,
    total_messages: 1000,
    ...over,
  } as DbMetricSnapshot;
}

function opRow(i: number, claimed: boolean): DbOperator {
  return {
    operator_id: uuid(i),
    codename: `op-${i}`,
    display_name: `Op ${i}`,
    claimed,
    claimed_at: claimed ? "2026-01-01T00:00:00Z" : null,
    current_supporter_tier: null,
    verification_status: "verified",
    primary_domain: i % 3 === 0 ? "claude" : "codex",
    account_age_days: 100,
    total_messages_lifetime: 1000,
    handle: `op${i}`,
    avatar_url: null,
    bio: null,
    links: null,
    location: null,
    profile_visibility: "public",
    status: "active",
  };
}

const WINDOWS = ["7d", "30d", "90d", "all_time"] as const;
const PLATFORMS = ["multi", "claude", "codex", null, "pi"] as const;
const DATES = ["2026-11-14", "2026-11-13", "2026-11-12", "2026-11-05", "2026-10-30", "2026-10-01", "2026-08-01"];

/** Random but reproducible corpus covering every ladder branch. */
function buildCorpus(nOps: number, seed: number) {
  const r = rng(seed);
  const ops: DbOperator[] = [];
  const snaps: DbMetricSnapshot[] = [];
  let idn = 1;
  let uniq = 1; // unique cache_read per row → distinct yields, no sort ties
  for (let i = 1; i <= nOps; i++) {
    ops.push(opRow(i, r() < 0.4));
    const nRows = 1 + Math.floor(r() * 9);
    for (let k = 0; k < nRows; k++) {
      const eligible = r() > 0.12;
      snaps.push(
        snapRow({
          operator_id: uuid(i),
          metric_snapshot_id: uuid(100_000 + idn++),
          window_type: WINDOWS[Math.floor(r() * WINDOWS.length)],
          platform: PLATFORMS[Math.floor(r() * PLATFORMS.length)],
          snapshot_date: DATES[Math.floor(r() * DATES.length)],
          input_tokens: eligible ? 500 + Math.floor(r() * 5000) : r() < 0.5 ? null : 0,
          output_tokens: eligible ? 500 + Math.floor(r() * 5000) : 1000,
          cache_creation_tokens: Math.floor(r() * 9000),
          cache_read_tokens: 10_000 + uniq++ * 37 + Math.floor(r() * 30),
        }),
      );
    }
  }
  return { ops, snaps };
}

/** What PostgREST hands the legacy path: newest date first. Same-date order is
 *  arbitrary in production; fix it (platform, then id) for a repeatable run. */
function legacyInput(rows: DbMetricSnapshot[]): DbMetricSnapshot[] {
  return [...rows].sort((a, b) =>
    a.snapshot_date !== b.snapshot_date
      ? a.snapshot_date > b.snapshot_date ? -1 : 1
      : (a.platform ?? "") < (b.platform ?? "") ? -1
      : (a.platform ?? "") > (b.platform ?? "") ? 1
      : 0,
  );
}

/** Rank percentile source, as rank_history_latest would provide. */
function pcts(ops: DbOperator[]) {
  return new Map(ops.map((o, i) => [o.operator_id, (i * 13) % 100]));
}

/** Every param combination the callers use (see the PR description). */
const COMBOS: { name: string; params: BoardParams }[] = [];
for (const w of WINDOWS) {
  COMBOS.push(
    // /board/[window], live-board API, home — claimed, operatorTotal, mode all
    { name: `board ${w}`, params: { window: w, windowFilter: w !== "all_time", operatorTotal: true, claimedOnly: true, mode: "all" } },
    // profile / earned-marks / compare / sandbox — all_time scope without filter
    { name: `claimed all-window pref ${w}`, params: { window: w, windowFilter: false, operatorTotal: true, claimedOnly: true, mode: "all" } },
    // /api/v1/leaderboard, MCP, benchmarks — windowFilter, no collapse flags
    { name: `legacy windowFilter ${w}`, params: { window: w, windowFilter: true, limit: 1000 } },
    // /api/v1/leaderboard with platform filter
    { name: `perPlatform ${w}`, params: { window: w, windowFilter: true, perPlatform: true } },
    // top-operator-column, hall — operatorTotal, unclaimed included
    { name: `operatorTotal ${w}`, params: { window: w, windowFilter: true, operatorTotal: true } },
    // strictLive plugin service
    { name: `strictLive ${w}`, params: { strictLive: true, window: w, windowFilter: true, operatorTotal: true, claimedOnly: true } },
  );
}
COMBOS.push(
  { name: "default board (no params)", params: {} },
  { name: "operatorTotal, no window", params: { operatorTotal: true, claimedOnly: true, mode: "all" } },
  { name: "platform filter", params: { window: "30d", windowFilter: true, perPlatform: true, platform: "claude" } },
  { name: "class scope + limit", params: { window: "all_time", operatorTotal: true, classScope: "POWER", limit: 5 } },
  { name: "unknown window enum", params: { window: "weird", windowFilter: true, operatorTotal: true } },
);

function runBoth(
  ops: DbOperator[],
  snaps: DbMetricSnapshot[],
  params: BoardParams,
) {
  const opById = new Map(ops.map((o) => [o.operator_id, o]));
  const pct = pcts(ops);
  const legacy = selectLegacy(legacyInput(snaps), params);
  // The SQL path restricts to claimed operators up front; legacy restricts after
  // the join. Model both faithfully.
  const claimedIds = params.claimedOnly
    ? new Set(ops.filter((o) => o.claimed).map((o) => o.operator_id))
    : null;
  const sql = selectSqlModel(snaps, params, claimedIds);
  const a = assembleLeaderboard(legacy.snapRows, legacy.platformsByOperator, opById, pct, params);
  const b = assembleLeaderboard(sql.snapRows, sql.platformsByOperator, opById, pct, params);
  return { a, b, legacy, sql };
}

// ── 1. Selection parity ─────────────────────────────────────────────────

describe("board selection parity: legacy JS vs SQL model", () => {
  const corpora = [11, 12, 13, 14, 15].map((seed) => buildCorpus(70, seed));

  for (const combo of COMBOS) {
    if (!canUseDbSelection(combo.params)) continue;
    it(`${combo.name}: identical LeaderboardRows (same rows, order, values)`, () => {
      for (const { ops, snaps } of corpora) {
        const { a, b } = runBoth(ops, snaps, combo.params);
        expect(b).toEqual(a);
      }
    });
  }

  it("covers every window, and non-trivial boards", () => {
    let nonEmpty = 0;
    for (const { ops, snaps } of corpora) {
      for (const w of WINDOWS) {
        const { a } = runBoth(ops, snaps, { window: w, windowFilter: w !== "all_time", operatorTotal: true });
        if (a.length > 3) nonEmpty++;
      }
    }
    expect(nonEmpty).toBeGreaterThanOrEqual(WINDOWS.length * 3);
  });

  it("fallback: operator with no row in the requested window keeps its freshest data", () => {
    const op = opRow(1, true);
    const snaps = [
      // no all_time row at all; a 7d multi and a 30d claude row
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(1001), window_type: "7d", platform: "multi", snapshot_date: "2026-11-10", cache_read_tokens: 11_111 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(1002), window_type: "30d", platform: "claude", snapshot_date: "2026-11-13", cache_read_tokens: 22_222 }),
    ];
    for (const params of [
      { window: "all_time", operatorTotal: true } as BoardParams,
      { window: "all_time" } as BoardParams,
      { window: "all_time", perPlatform: true } as BoardParams,
    ]) {
      const { a, b, sql } = runBoth([op], snaps, params);
      expect(b).toEqual(a);
      expect(a.length).toBeGreaterThan(0);
      // bucket 2 (other window + multi) beats bucket 3 (newer single platform)
      if (!params.perPlatform) expect(sql.snapRows[0].metric_snapshot_id).toBe(uuid(1001));
    }
  });

  it("ladder: preferred-window multi > preferred-window single > other multi > latest", () => {
    const op = opRow(2, true);
    const mk = (n: number, window_type: string, platform: string | null, snapshot_date = "2026-11-10") =>
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(2000 + n), window_type, platform, snapshot_date, cache_read_tokens: 10_000 + n });
    const cases: [DbMetricSnapshot[], number][] = [
      [[mk(1, "30d", "multi"), mk(2, "all_time", "claude"), mk(3, "all_time", "multi", "2026-10-01")], 3],
      [[mk(1, "30d", "multi"), mk(2, "all_time", "claude"), mk(3, "all_time", null, "2026-09-01")], 2],
      [[mk(1, "30d", "multi", "2026-10-01"), mk(2, "7d", "claude", "2026-11-14")], 1],
      [[mk(1, "30d", "claude", "2026-10-01"), mk(2, "7d", "codex", "2026-11-14")], 2],
    ];
    for (const [rows, expected] of cases) {
      const { a, b, sql } = runBoth([op], rows, { window: "all_time", operatorTotal: true });
      expect(b).toEqual(a);
      expect(sql.snapRows[0].metric_snapshot_id).toBe(uuid(2000 + expected));
    }
  });

  it("ties: same date, window and platform break on metric_snapshot_id (larger wins)", () => {
    const op = opRow(3, true);
    const rows = [
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(3001), cache_read_tokens: 11_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(3003), cache_read_tokens: 33_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(3002), cache_read_tokens: 22_000 }),
    ];
    for (const order of [rows, [...rows].reverse()]) {
      const { a, b, sql } = runBoth([op], order, { window: "all_time", operatorTotal: true });
      expect(b).toEqual(a);
      expect(sql.snapRows[0].metric_snapshot_id).toBe(uuid(3003));
    }
  });

  it("null platform: folds under one bucket per operator at the platform level, never in the platform badge set", () => {
    const op = opRow(4, true);
    const rows = [
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(4001), platform: null, snapshot_date: "2026-11-02", cache_read_tokens: 11_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(4002), platform: null, snapshot_date: "2026-11-03", cache_read_tokens: 22_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(4003), platform: "claude", snapshot_date: "2026-11-01", cache_read_tokens: 33_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(4004), platform: "", snapshot_date: "2026-11-01", cache_read_tokens: 44_000 }),
    ];
    const plat = runBoth([op], rows, { window: "all_time", perPlatform: true });
    expect(plat.b).toEqual(plat.a);
    expect(plat.sql.snapRows).toHaveLength(3); // ∅, claude, ""
    const tot = runBoth([op], rows, { window: "all_time", operatorTotal: true });
    expect(tot.b).toEqual(tot.a);
    expect(tot.sql.platformsByOperator?.get(op.operator_id)).toEqual(["claude"]);
  });

  it("multiple platforms: the badge set is complete and newest-first", () => {
    const op = opRow(5, true);
    const rows = [
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(5001), platform: "codex", snapshot_date: "2026-11-01", cache_read_tokens: 11_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(5002), platform: "claude", snapshot_date: "2026-11-03", cache_read_tokens: 22_000 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(5003), platform: "multi", snapshot_date: "2026-11-02", cache_read_tokens: 33_000 }),
    ];
    const { a, b } = runBoth([op], rows, { window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" });
    expect(b).toEqual(a);
    expect((a[0] as { platforms?: string[] }).platforms).toEqual(["claude", "multi", "codex"]);
  });

  it("window recency: the reference date is the window's newest row even when that row is ineligible", () => {
    const op = opRow(6, true);
    const op2 = opRow(7, true);
    const rows = [
      // newest 30d row is a ghost (zero input): it still sets "now" for the recency check
      snapRow({ operator_id: op2.operator_id, metric_snapshot_id: uuid(6001), window_type: "30d", snapshot_date: "2026-11-14", input_tokens: 0 }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(6002), window_type: "30d", snapshot_date: "2026-10-12", cache_read_tokens: 12_345 }), // 33 days old: kept (30 + 3)
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(6003), window_type: "30d", snapshot_date: "2026-10-11", platform: "claude", cache_read_tokens: 54_321 }), // 34 days: dropped
    ];
    const params: BoardParams = { window: "30d", windowFilter: true, operatorTotal: true };
    const { a, b, sql } = runBoth([op, op2], rows, params);
    expect(b).toEqual(a);
    expect(sql.snapRows.map((r) => r.metric_snapshot_id)).toEqual([uuid(6002)]);
    // restricting to claimed operators must NOT change the reference date
    const restricted = selectSqlModel(rows, params, new Set([op.operator_id]));
    expect(restricted.snapRows.map((r) => r.metric_snapshot_id)).toEqual([uuid(6002)]);
  });

  it("ineligible rows (null / zero tokens) never win a slot", () => {
    const op = opRow(8, true);
    const rows = [
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(8001), input_tokens: null, snapshot_date: "2026-11-14" }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(8002), output_tokens: 0, snapshot_date: "2026-11-13" }),
      snapRow({ operator_id: op.operator_id, metric_snapshot_id: uuid(8003), snapshot_date: "2026-11-01", cache_read_tokens: 12_345 }),
    ];
    const { a, b, sql } = runBoth([op], rows, { window: "all_time", operatorTotal: true });
    expect(b).toEqual(a);
    expect(sql.snapRows.map((r) => r.metric_snapshot_id)).toEqual([uuid(8003)]);
  });

  it("sort-value ties: same members and same rank groups (order inside a tie is unspecified today)", () => {
    const ops = [1, 2, 3, 4].map((i) => opRow(20 + i, true));
    const snaps = ops.map((o, i) =>
      snapRow({ operator_id: o.operator_id, metric_snapshot_id: uuid(9000 + i), snapshot_date: `2026-11-0${i + 1}`, cache_read_tokens: i < 2 ? 7_000 : 0 + i * 1000 }),
    );
    const { a, b } = runBoth(ops, snaps, { window: "all_time", operatorTotal: true });
    expect(b.map((r) => sortValue(r, "yield" as never))).toEqual(a.map((r) => sortValue(r, "yield" as never)));
    expect(new Set(b.map((r) => r.operator.operator_id))).toEqual(new Set(a.map((r) => r.operator.operator_id)));
  });

  it("mode hitl / agentic / hybrid stay on the legacy path", () => {
    expect(canUseDbSelection({ mode: "all" })).toBe(true);
    expect(canUseDbSelection({})).toBe(true);
    expect(canUseDbSelection({ mode: "hitl" })).toBe(false);
    expect(canUseDbSelection({ mode: "agentic" })).toBe(false);
    expect(canUseDbSelection({ mode: "hybrid" })).toBe(false);
    expect(canUseDbSelection({ allSnapshots: true })).toBe(false);
  });

  it("boardSelectionArgs: window days + buffer", () => {
    expect(boardSelectionArgs({ window: "7d", windowFilter: true }).p_max_age_days).toBe(8);
    expect(boardSelectionArgs({ window: "30d", windowFilter: true }).p_max_age_days).toBe(33);
    expect(boardSelectionArgs({ window: "90d", windowFilter: true }).p_max_age_days).toBe(93);
    expect(boardSelectionArgs({ window: "all_time", windowFilter: true }).p_max_age_days).toBeNull();
    expect(boardSelectionArgs({ window: "30d" }).p_window_filter).toBe(false);
    expect(boardSelectionArgs({ perPlatform: true }).p_level).toBe("platform");
    expect(boardSelectionArgs({ perPlatform: true, operatorTotal: true }).p_level).toBe("operator");
  });

  it("the SQL model returns far fewer rows than the legacy fetch", () => {
    const { snaps, ops } = corpora[0];
    const picked = modelBoardPickSnapshots(snaps, boardSelectionArgs({ window: "all_time", operatorTotal: true }));
    expect(picked.length).toBeLessThanOrEqual(ops.length);
    expect(picked.length).toBeLessThan(snaps.length);
    expect(modelBoardOperatorPlatforms(snaps, boardSelectionArgs({ window: "all_time" })).size).toBeGreaterThan(0);
  });
});

// ── 2. End to end through getLeaderboard (flag off vs on) ───────────────

const fixture = vi.hoisted(() => ({ ops: [] as unknown[], snaps: [] as unknown[], calls: [] as string[] }));

vi.mock("@/lib/infra/supabase/server", async () => {
  const sel = await import("@/lib/board/selection");
  type Row = Record<string, unknown>;
  function builder(table: string, produce: () => Row[]) {
    const st = { filters: [] as ((r: Row) => boolean)[], orders: [] as [string, boolean][], range: [0, 999] as [number, number] };
    const b: Record<string, unknown> = {};
    const exec = () => {
      fixture.calls.push(table);
      let rows = produce().filter((r) => st.filters.every((f) => f(r)));
      for (const [col, asc] of [...st.orders].reverse()) {
        rows = [...rows].sort((x, y) => {
          const xv = x[col] as string | number, yv = y[col] as string | number;
          return xv === yv ? 0 : (xv > yv ? 1 : -1) * (asc ? 1 : -1);
        });
      }
      return { data: rows.slice(st.range[0], st.range[1] + 1), error: null };
    };
    b.select = () => b;
    b.eq = (c: string, v: unknown) => (st.filters.push((r) => r[c] === v), b);
    b.in = (c: string, vs: unknown[]) => (st.filters.push((r) => vs.includes(r[c])), b);
    b.order = (c: string, o?: { ascending?: boolean }) => (st.orders.push([c, o?.ascending !== false]), b);
    b.range = (f: number, t: number) => ((st.range = [f, t]), b);
    b.then = (res: (v: unknown) => unknown) => res(exec());
    return b;
  }
  const client = {
    from(table: string) {
      return builder(table, () => {
        if (table === "metric_snapshots") return fixture.snaps as Row[];
        if (table === "operators_public") return fixture.ops as Row[];
        if (table === "rank_history") return (fixture.ops as Row[]).map((o, i) => ({ operator_id: o.operator_id, snapshot_date: "2026-11-14", global_rank: i + 1, percentile: (i * 13) % 100 }));
        if (table === "rank_history_latest") return (fixture.ops as Row[]).map((o, i) => ({ operator_id: o.operator_id, snapshot_date: "2026-11-14", global_rank: i + 1, percentile: (i * 13) % 100 }));
        throw new Error(`unexpected table ${table}`);
      });
    },
    rpc(name: string, args: Record<string, unknown>) {
      const a = args as unknown as import("@/lib/board/selection").BoardSelectionArgs & { p_operator_ids: string[] | null };
      const ids = a.p_operator_ids ? new Set(a.p_operator_ids) : null;
      if (name === "board_pick_snapshots") {
        return builder(name, () => sel.modelBoardPickSnapshots(fixture.snaps as DbMetricSnapshot[], a, ids) as unknown as Row[]);
      }
      if (name === "board_operator_platforms") {
        return builder(name, () => [...sel.modelBoardOperatorPlatforms(fixture.snaps as DbMetricSnapshot[], a, ids)].map(([operator_id, platforms]) => ({ operator_id, platforms })));
      }
      throw new Error(`unexpected rpc ${name}`);
    },
  };
  return { getSupabaseServer: () => client, getSupabaseService: () => client };
});

describe("getLeaderboard: BOARD_DB_SELECTION off vs on (fake Supabase)", () => {
  const { ops, snaps } = buildCorpus(60, 99);
  beforeEach(() => {
    fixture.ops = ops;
    fixture.snaps = legacyInput(snaps);
    fixture.calls = [];
  });
  afterEach(() => vi.unstubAllEnvs());

  const e2e = COMBOS.filter((c) => canUseDbSelection(c.params) && !c.params.strictLive);
  for (const combo of e2e) {
    it(`${combo.name}: same rows with the flag on`, async () => {
      const { getLeaderboard } = await import("@/lib/board/queries");
      vi.stubEnv("BOARD_DB_SELECTION", "");
      const off = await getLeaderboard(combo.params);
      vi.stubEnv("BOARD_DB_SELECTION", "1");
      const on = await getLeaderboard(combo.params);
      expect(on).toEqual(off);
    });
  }

  it("flag on never reads the whole metric_snapshots table", async () => {
    const { getLeaderboard } = await import("@/lib/board/queries");
    vi.stubEnv("BOARD_DB_SELECTION", "1");
    await getLeaderboard({ window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" });
    expect(fixture.calls).not.toContain("metric_snapshots");
    expect(fixture.calls).not.toContain("rank_history");
    expect(fixture.calls).toContain("board_pick_snapshots");
  });

  it("mode hitl ignores the flag (legacy path)", async () => {
    const { getLeaderboard } = await import("@/lib/board/queries");
    vi.stubEnv("BOARD_DB_SELECTION", "1");
    await getLeaderboard({ window: "all_time", operatorTotal: true, mode: "hitl" });
    expect(fixture.calls).toContain("metric_snapshots");
    expect(fixture.calls).not.toContain("board_pick_snapshots");
  });
});
