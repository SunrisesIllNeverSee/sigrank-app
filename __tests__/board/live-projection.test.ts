/**
 * __tests__/board/live-projection.test.ts
 *
 * Acceptance coverage for the Phase-2B WS-2 live-board projection
 * (lib/board/live-projection.ts → lib/board/live-types.ts contract):
 *
 *   1. operators[] is the paginated subset; population.count /
 *      totalOperators / fieldStats / movers / fieldMax / featured all derive
 *      from the FULL ranking scope — never the subset.
 *   2. Non-compounding rows render "—" on canonical compounding fields
 *      (yield/lev; dev is the numeric slot → 0 with nc=true, matching the
 *      reference's numvOf("—") → 0), never synthesized zeros on strings.
 *   3. slug === codename verbatim on every row (share identity).
 *   4. The live denominator is the same-scope ranked count — no constants.
 *   5. The wrapper reads the SAME scope as /board/[window] (claimedOnly +
 *      operatorTotal + mode:"all", windowFilter off only for all_time) and
 *      issues ZERO per-operator fetches (the 1,649-call sync was rejected).
 *   6. Compact formats match sync.py byte-for-byte semantics.
 *
 * The cached data layer is module-mocked; fixture cascades are computed by
 * the real computeCascadeMetrics so expectations are canonical, not staged.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { computeCascadeMetrics } from "@/lib/analytics/cascade";
import type { HallRecord, LeaderboardRow } from "@/lib/board/types";

// ── Module mock (cross-runner safe: factory touches only globalThis) ──────
// vi.mock is hoisted by vitest and evaluated in-place by bun; the factory
// reads globals so neither runner resolves top-level captures too early.
vi.mock("@/lib/board/cached", () => ({
  getLeaderboard: async (params: unknown) => {
    (globalThis as Record<string, unknown>).__lbCalls =
      ((globalThis as Record<string, unknown>).__lbCalls as unknown[]) ?? [];
    ((globalThis as Record<string, unknown>).__lbCalls as unknown[]).push(params);
    return (globalThis as Record<string, unknown>).__rows as LeaderboardRow[];
  },
  getHallOfSignal: async () =>
    (globalThis as Record<string, unknown>).__hall as HallRecord[],
  // Tripwire: per-operator reads are forbidden on this path (WS-4 lazies them).
  getOperatorHistory: async () => {
    (globalThis as Record<string, unknown>).__histCalls =
      (((globalThis as Record<string, unknown>).__histCalls as number) ?? 0) + 1;
    throw new Error("per-operator fetch forbidden in live projection");
  },
  getOperatorRecords: async () => {
    (globalThis as Record<string, unknown>).__recsCalls =
      (((globalThis as Record<string, unknown>).__recsCalls as number) ?? 0) + 1;
    throw new Error("per-operator records fetch forbidden in live projection");
  },
}));

const { getLiveBoardInitialState, projectLiveBoard } = await import(
  "@/lib/board/live-projection"
);

// ── Fixtures ──────────────────────────────────────────────────────────────

interface FixtureSpec {
  codename: string;
  displayName?: string;
  handle?: string;
  pillars: [number, number, number, number]; // input, output, cacheCreate, cacheRead
  mv24: number;
  mv7: number;
  rank: number;
  supporter?: string;
  verified?: boolean;
}

const SPECS: FixtureSpec[] = [
  // live.js rank-1 row parity: Kabir Acharya — "34.2B", "69.5M", 0.998, kinetic.
  {
    codename: "signal-d4e0290661",
    displayName: "Kabir Acharya",
    handle: "kabir",
    pillars: [252_600, 132_800_000, 656_300_000, 33_400_000_000],
    mv24: 0,
    mv7: 8,
    rank: 1,
  },
  {
    codename: "signal-3b92921881",
    displayName: "H82",
    pillars: [52_300, 6_600_000, 30_100_000, 1_400_000_000],
    mv24: 0,
    mv7: 0,
    rank: 2,
    supporter: "patron",
  },
  {
    codename: "signal-delta000003",
    pillars: [1_000_000, 2_000_000, 3_000_000, 20_000_000],
    mv24: 1,
    mv7: 14,
    rank: 3,
    verified: false,
  },
  {
    codename: "signal-echo0000004",
    pillars: [500_000, 1_000_000, 1_000_000, 8_000_000],
    mv24: 0,
    mv7: 2,
    rank: 4,
  },
  // Biggest mover + velocity max sits OUTSIDE the first page — the
  // full-scope-vs-subset tripwire.
  {
    codename: "signal-zeta0000005",
    pillars: [10_000, 8_000_000, 1_000, 50],
    mv24: 2,
    mv7: 15,
    rank: 5,
  },
  {
    codename: "signal-foxtrot00006",
    pillars: [2_000_000, 1_000_000, 500_000, 10_000_000],
    mv24: 0,
    mv7: -1,
    rank: 6,
  },
  {
    codename: "signal-golf0000007",
    pillars: [1_000_000, 500_000, 250_000, 4_000_000],
    mv24: 0,
    mv7: 0,
    rank: 7,
  },
  // Non-compounding row (cache_write = 0) — live.js parity: "16.2B",
  // "—" yield/lev, "1" eff, "$1.10" cost, "3:1" opratio, input-bound.
  {
    codename: "signal-468408d933",
    displayName: "DirtyData",
    pillars: [4_400_000_000, 67_600_000, 0, 11_700_000_000],
    mv24: -3,
    mv7: -4,
    rank: 8,
  },
];

function mkRow(spec: FixtureSpec, total: number): LeaderboardRow {
  const [input, output, cacheCreate, cacheRead] = spec.pillars;
  const cascade = computeCascadeMetrics({
    input,
    output,
    cacheCreate,
    cacheRead,
  });
  return {
    operator: {
      operator_id: `op-${spec.codename}`,
      codename: spec.codename,
      display_name: spec.displayName ?? null,
      claimed: true,
      claimed_at: "2026-01-01T00:00:00Z",
      claim_payment_id: null,
      claim_contact: null,
      current_supporter_tier:
        (spec.supporter as "free" | "patron" | "pro" | "circle_sponsor") ?? "free",
      verification_status: spec.verified === false ? "unverified" : "verified",
      primary_domain: "claude",
      account_age_days: 365,
      total_messages_lifetime: 1_000,
      isPlaceholder: false,
      handle: spec.handle ?? null,
      avatar_url: null,
      bio: null,
      links: null,
      location: null,
      profile_visibility: "public",
      status: "active",
    },
    snapshot: {
      signa_rate: 50,
      class_tier: "POWER II",
      compression_ratio: 0.9,
      prompt_complexity: { value: 10, confidence: "low" },
      cross_thread: 0,
      session_depth: 0,
      token_throughput: input + output + cacheCreate + cacheRead,
      signal_force: 0,
      drift_ratio: null,
      sdot_score: null,
      sdrm_score: null,
      movement_24h: spec.mv24,
      movement_7d: spec.mv7,
      ruleset_version: "1.0",
      snapshot_date: "2026-10-02",
      cascade,
    },
    global_rank: spec.rank,
    percentile: Math.round(((total - spec.rank) / (total - 1)) * 100 * 100) / 100,
    telemetry: {
      fresh_input: input,
      output,
      cache_read: cacheRead,
      cache_create: cacheCreate,
      sessions: 0,
      turns: 0,
    },
    window_type: "all_time",
    platform: "multi",
    snapshot_date: "2026-10-02",
    window_start: "2025-10-02T00:00:00Z",
    window_end: "2026-10-02T00:00:00Z",
    workflow_mode: "hitl",
    source_submission_id: null,
  };
}

const ROWS: LeaderboardRow[] = SPECS.map((s) => mkRow(s, SPECS.length));

const HALL: HallRecord[] = [
  {
    reward_id: "RW.01",
    title: "Highest SNR",
    operator_codename: "TransVaultOrigin",
    value: "0.9694",
    date: "2026-09-30",
    isPlaceholder: false,
  },
  {
    reward_id: "RW.02",
    title: "Most turns/session",
    operator_codename: "TransVaultOrigin",
    value: "348.9 turns/session",
    date: "2026-09-29",
    isPlaceholder: false,
  },
  {
    reward_id: "RW.03",
    title: "Streak",
    operator_codename: "OrcaVanguard",
    value: "41",
    date: "2026-09-28",
    isPlaceholder: false,
  },
  {
    reward_id: "RW.04",
    title: "Overflow",
    operator_codename: "CutMe",
    value: "should not render",
    date: "2026-09-27",
    isPlaceholder: false,
  },
  {
    reward_id: "RW.05",
    title: "Seed record",
    operator_codename: "SeedOp",
    value: "placeholder",
    date: "2026-09-26",
    isPlaceholder: true,
  },
];

const GEN_AT = "2026-10-05T22:27:42.305Z";

function lbCalls(): unknown[] {
  return ((globalThis as Record<string, unknown>).__lbCalls as unknown[]) ?? [];
}
function histCalls(): number {
  return ((globalThis as Record<string, unknown>).__histCalls as number) ?? 0;
}
function recsCalls(): number {
  return ((globalThis as Record<string, unknown>).__recsCalls as number) ?? 0;
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).__lbCalls = [];
  (globalThis as Record<string, unknown>).__histCalls = 0;
  (globalThis as Record<string, unknown>).__recsCalls = 0;
  (globalThis as Record<string, unknown>).__rows = ROWS;
  (globalThis as Record<string, unknown>).__hall = HALL;
});

// ── Wrapper: scope parity + zero per-operator fetches ─────────────────────

describe("getLiveBoardInitialState wrapper", () => {
  it("reads the same claimed/operatorTotal/mode-resolved scope as /board/[window]", async () => {
    await getLiveBoardInitialState("all", { generatedAt: GEN_AT });
    await getLiveBoardInitialState("30d", { generatedAt: GEN_AT });
    const [allCall, d30Call] = lbCalls() as Record<string, unknown>[];
    expect(allCall).toEqual({
      window: "all_time",
      windowFilter: false,
      operatorTotal: true,
      claimedOnly: true,
      mode: "all",
    });
    expect(d30Call).toEqual({
      window: "30d",
      windowFilter: true,
      operatorTotal: true,
      claimedOnly: true,
      mode: "all",
    });
  });

  it("issues no per-operator reads (history/records are lazy, WS-4)", async () => {
    await getLiveBoardInitialState("all", { generatedAt: GEN_AT });
    expect(histCalls()).toBe(0);
    expect(recsCalls()).toBe(0);
  });

  it("honors pageSize for the operator subset only", async () => {
    const s = await getLiveBoardInitialState("all", {
      pageSize: 3,
      generatedAt: GEN_AT,
    });
    expect(s.operators).toHaveLength(3);
    expect(s.totalOperators).toBe(8);
    expect(s.population.count).toBe(8);
  });
});

// ── Scope discipline: aggregates from the FULL field, not the subset ──────

describe("full-scope derivation", () => {
  const state = projectLiveBoard(ROWS, HALL, "all_time", {
    pageSize: 3,
    generatedAt: GEN_AT,
  });

  it("movers derive from the full scope (top mover is outside page 1)", () => {
    expect(state.movers.map((m) => m.slug)).toEqual([
      "signal-zeta0000005", // mv7 +15 — rank 5, outside the 3-row subset
      "signal-delta000003", // mv7 +14
      "signal-d4e0290661", // mv7 +8
      "signal-echo0000004", // mv7 +2
    ]);
    expect(state.movers[0].mv7).toBe(15);
    expect(state.movers[0].delta).toBe("+15 spots vs 7d");
    // negative movers never enter the rail
    expect(state.movers.some((m) => m.slug === "signal-468408d933")).toBe(false);
  });

  it("fieldMax covers the full scope (velocity max lives outside page 1)", () => {
    const alpha = computeCascadeMetrics({
      input: 252_600,
      output: 132_800_000,
      cacheCreate: 656_300_000,
      cacheRead: 33_400_000_000,
    });
    expect(state.fieldMax.yield).toBe(alpha.yield_);
    expect(state.fieldMax.vel).toBe(800); // zeta (rank 5), not in operators[]
    expect(state.fieldMax.lev).toBe(alpha.leverage);
    expect(state.fieldMax.dev).toBeCloseTo(alpha.dev10x ?? 0, 5);
  });

  it("population + totalOperators are the same-scope ranked count", () => {
    expect(state.population.count).toBe(8);
    expect(state.totalOperators).toBe(8);
    expect(state.population.tag).toBe("LIVE FIELD · ALL-TIME");
    // the strip's total is the live field count, never a fixed constant
    expect(state.fieldStats[0]).toEqual({
      field: "total_operators",
      value: "8",
    });
  });

  it("fieldStats derive from the full scope, not /stats or the subset", () => {
    const yields = ROWS.map(
      (r) => r.snapshot.cascade,
    )
      .filter((c) => c && !c.nonCompounding)
      .map((c) => c!.yield_)
      .sort((a, b) => a - b);
    const median = yields[Math.floor(yields.length / 2)];
    expect(state.fieldStats).toContainEqual({
      field: "median_yield",
      value: median.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    });
    expect(state.fieldStats).toContainEqual({
      field: "window",
      value: "All-Time · live",
    });
  });

  it("featured is the rank-1 context block", () => {
    expect(state.featured).not.toBeNull();
    expect(state.featured!.name).toBe("Kabir Acharya");
    expect(state.featured!.handle).toBe("@kabir");
    expect(state.featured!.rank).toBe(1);
    expect(state.featured!.archetype).toBe("kinetic");
    expect(state.featured!.yield).toBe("69.5M");
    expect(state.featured!.delta).toBe("+8 spots vs 7d");
    expect(state.featured!.blurb).toContain("KINETIC");
  });

  it("hall teaser renders 'Operator — value' lines, top 3 non-placeholder", () => {
    expect(state.hall).toHaveLength(3);
    expect(state.hall[0].value).toBe("TransVaultOrigin — 0.9694");
    expect(state.hall[0].codename).toBe("TransVaultOrigin");
    expect(state.hall.some((h) => h.value.includes("CutMe"))).toBe(false);
    expect(state.hall.some((h) => h.value.includes("SeedOp"))).toBe(false);
  });

  it("window tag follows the enum for bounded windows", () => {
    const s = projectLiveBoard(ROWS, HALL, "30d", { generatedAt: GEN_AT });
    expect(s.population.tag).toBe("LIVE FIELD · 30D");
    expect(s.meta.window).toBe("30d");
  });
});

// ── Row shape: identity, compact formats, nc semantics ────────────────────

describe("LiveOperator rows", () => {
  const ops = projectLiveBoard(ROWS, HALL, "all_time", {
    generatedAt: GEN_AT,
  }).operators;
  const alpha = ops[0];
  const charlie = ops.find((o) => o.slug === "signal-468408d933")!;

  it("slug === codename, verbatim, on every row", () => {
    for (const o of ops) expect(o.slug).toBe(o.codename);
    expect(alpha.codename).toBe("signal-d4e0290661");
  });

  it("handle resolves a display identity — never bare codename when one exists", () => {
    expect(alpha.handle).toBe("@kabir"); // real handle wins
    expect(ops[1].handle).toBe("H82"); // display_name fallback
    expect(ops[2].handle).toBe("signal-delta000003"); // codename last resort
  });

  it("compact formatting matches sync.py/live.js exactly", () => {
    expect(alpha.total).toBe("34.2B");
    expect(alpha.yield).toBe("69.5M");
    expect(alpha.snr).toBe(0.998);
    expect(alpha.vel).toBe(525.73);
    expect(alpha.lev).toBe("132,224.9×");
    expect(alpha.dev).toBe(5.12);
    expect(alpha.scalev).toBe(10.53);
    expect(alpha.ptpd).toBe("93.7M/d");
    expect(alpha.otpd).toBe("363.8K/d");
    expect(alpha.opratio).toBe("132225:1");
    expect(alpha.eff).toBe("33.8K");
    expect(alpha.cost).toBe("$0.42");
    expect(alpha.platform).toBe("multi");
    expect(alpha.last).toBe("10/02/26");
    expect(alpha.raw).toEqual({
      i: "252.6K",
      o: "132.8M",
      cr: "33.4B",
      cw: "656.3M",
    });
  });

  it("num carries the raw math-path numerics", () => {
    const c = computeCascadeMetrics({
      input: 252_600,
      output: 132_800_000,
      cacheCreate: 656_300_000,
      cacheRead: 33_400_000_000,
    });
    expect(alpha.num.yield).toBe(c.yield_);
    expect(alpha.num.lev).toBe(c.leverage);
    expect(alpha.num.total).toBe(34_189_352_600);
    expect(alpha.num.cost).toBeCloseTo(c.costPerMillion, 6);
  });

  it("non-compounding rows render '—' on canonical compounding fields", () => {
    expect(charlie.nc).toBe(true);
    expect(charlie.yield).toBe("—");
    expect(charlie.lev).toBe("—");
    expect(charlie.dev).toBe(0); // numeric slot — nc flag carries the "—"
    expect(charlie.num.yield).toBe(0);
    expect(charlie.num.lev).toBe(0);
    // non-compounding ≠ zeroed-out: the rest keep real canonical values
    expect(charlie.total).toBe("16.2B");
    expect(charlie.snr).toBe(0.015);
    expect(charlie.vel).toBe(0.02);
    expect(charlie.scalev).toBe(10.21);
    expect(charlie.opratio).toBe("3:1");
    expect(charlie.eff).toBe("1");
    expect(charlie.cost).toBe("$1.10");
    expect(charlie.archetype).toBe("input-bound");
  });

  it("delta copy derives from mv7 with the locked semantic", () => {
    expect(alpha.mv7).toBe(8);
    expect(alpha.delta).toBe("+8 spots vs 7d");
    expect(charlie.delta).toBe("−4 spots vs 7d"); // U+2212, matching reference
    expect(charlie.mv24).toBe(-3);
    const zero = ops.find((o) => o.slug === "signal-golf0000007")!;
    expect(zero.delta).toBe("+0 spots vs 7d");
  });

  it("trend + recs ship empty (lazy enrichment on selection, WS-4)", () => {
    for (const o of ops) {
      expect(o.trend).toEqual([]);
      expect(o.recs).toEqual([]);
    }
  });

  it("meta + population provenance", () => {
    const s = projectLiveBoard(ROWS, HALL, "all_time", { generatedAt: GEN_AT });
    expect(s.meta).toEqual({
      window: "all_time",
      generatedAt: GEN_AT,
      ruleset: "1.0",
      source: "signalaf.com/api/v1",
    });
  });
});
