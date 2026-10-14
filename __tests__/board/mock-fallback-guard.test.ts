/**
 * __tests__/board/mock-fallback-guard.test.ts
 *
 * Regression test suite verifying that when Supabase is configured:
 * 1. getOperator returns null on not-found and DB error (never fromMock).
 * 2. getHallOfSignal returns [] on empty/error (never MOCK_HALL).
 * 3. getHomepageStats returns unavailable state (isPlaceholder=true, 0s) on empty/error (never MOCK_HOMEPAGE_STATS).
 * 4. getClassDistribution returns real 0-counts for all tiers on empty/error (never MOCK_CLASS_DISTRIBUTION).
 * 5. getLeaderboard returns [] on empty/error (never filterMockBoard).
 * 6. Fixture-name collisions (e.g. TransVaultOrigin) never serve fixture rows when live DB query returns empty.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

interface ReqRec {
  table: string;
  filters: { op: string; col: string; val?: unknown }[];
  terminal: string;
}

let tableData: Record<string, unknown[]> = {};
let failTables = new Set<string>();

function makeSb() {
  const requests: ReqRec[] = [];

  function pickRows(rec: ReqRec): unknown[] {
    return tableData[rec.table] ?? [];
  }

  function builder(rec: ReqRec) {
    const note =
      (op: string) =>
      (col: string, val?: unknown) => {
        rec.filters.push({ op, col, val });
        return b;
      };
    const b: Record<string, unknown> = {
      select: () => b,
      order: () => b,
      limit: () => b,
      range: () => b,
      eq: note("eq"),
      in: note("in"),
      is: note("is"),
      neq: note("neq"),
      gte: note("gte"),
      lte: note("lte"),
      lt: note("lt"),
      gt: note("gt"),
      like: note("like"),
      ilike: note("ilike"),
      not: () => b,
      or: () => b,
      maybeSingle: async () => {
        rec.terminal = "maybeSingle";
        requests.push(rec);
        if (failTables.has(rec.table)) {
          return { data: null, error: { message: "database error" } };
        }
        return { data: pickRows(rec)[0] ?? null, error: null };
      },
      then: (res: (v: unknown) => unknown) => {
        rec.terminal = "await";
        requests.push(rec);
        if (failTables.has(rec.table)) {
          return Promise.resolve({ data: null, error: { message: "database error" } }).then(res);
        }
        return Promise.resolve({ data: pickRows(rec), error: null }).then(res);
      },
    };
    return b;
  }

  return {
    from(table: string) {
      const rec: ReqRec = { table, filters: [], terminal: "" };
      return builder(rec);
    },
    __requests: requests,
  };
}

const sb = makeSb();

vi.mock("@/lib/infra/supabase/server", () => ({
  getSupabaseServer: () => sb,
  getSupabaseService: () => sb,
}));

const {
  getOperator,
  getHallOfSignal,
  getHomepageStats,
  getClassDistribution,
  getLeaderboard,
} = await import("@/lib/board/queries");

describe("Live mock fallback guards (when DB is configured)", () => {
  beforeEach(() => {
    tableData = {};
    failTables = new Set();
    sb.__requests.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("getOperator", () => {
    it("returns null for unknown operator (even if codename matches mock fixture TransVaultOrigin)", async () => {
      tableData["operators_public"] = [];
      const op = await getOperator("TransVaultOrigin");
      expect(op).toBeNull();
    });

    it("returns null when operators_public query fails", async () => {
      failTables.add("operators_public");
      const op = await getOperator("TransVaultOrigin");
      expect(op).toBeNull();
    });

    it("returns real operator when found in DB", async () => {
      tableData["operators_public"] = [
        {
          operator_id: "op-real-1",
          codename: "real-op",
          display_name: "Real Operator",
          status: "active",
          claimed: true,
          profile_visibility: "public",
          primary_domain: "claude",
          verification_status: "verified",
        },
      ];
      tableData["metric_snapshots"] = [
        {
          metric_snapshot_id: "snap-1",
          operator_id: "op-real-1",
          snapshot_date: "2026-10-01",
          window_type: "all_time",
          class_tier: "IGNITER I",
          signa_rate: 10,
          input_tokens: 1000,
          output_tokens: 2000,
          cache_creation_tokens: 500,
          cache_read_tokens: 4000,
        },
      ];
      const op = await getOperator("real-op");
      expect(op).not.toBeNull();
      expect(op?.operator.codename).toBe("real-op");
      expect(op?.snapshot.class_tier).toBe("IGNITER I");
    });
  });

  describe("getHallOfSignal", () => {
    it("returns empty array when operator_badges is empty (never MOCK_HALL)", async () => {
      tableData["operator_badges"] = [];
      const hall = await getHallOfSignal();
      expect(hall).toEqual([]);
    });

    it("returns empty array when operator_badges query fails (never MOCK_HALL)", async () => {
      failTables.add("operator_badges");
      const hall = await getHallOfSignal();
      expect(hall).toEqual([]);
    });

    it("returns real records when operator_badges returns data", async () => {
      tableData["operator_badges"] = [
        {
          awarded_at: "2026-10-01T12:00:00Z",
          source_note: "Top Yield RW.15",
          badges: { badge_name: "Highest Yield" },
          operators: {
            operator_id: "op-real-1",
            codename: "real-op",
            display_name: "Real Op",
          },
        },
      ];
      // Names resolve only for operators visible via operators_public.
      tableData["operators_public"] = [{ operator_id: "op-real-1" }];
      const hall = await getHallOfSignal();
      expect(hall).toHaveLength(1);
      expect(hall[0].operator_codename).toBe("Real Op");
      expect(hall[0].title).toBe("Highest Yield");
    });

    it("redacts the operator name to 'unknown' when the operator is not public", async () => {
      tableData["operator_badges"] = [
        {
          awarded_at: "2026-10-01T12:00:00Z",
          source_note: "Top Yield RW.15",
          badges: { badge_name: "Highest Yield" },
          operators: {
            operator_id: "op-private-1",
            codename: "private-op",
            display_name: "Private Op",
          },
        },
      ];
      tableData["operators_public"] = [];
      const hall = await getHallOfSignal();
      expect(hall).toHaveLength(1);
      expect(hall[0].operator_codename).toBe("unknown");
    });
  });

  describe("getHomepageStats", () => {
    it("returns unavailable stats with isPlaceholder: true and 0s when system_stats query returns empty (never MOCK_HOMEPAGE_STATS)", async () => {
      tableData["system_stats"] = [];
      const stats = await getHomepageStats();
      expect(stats.isPlaceholder).toBe(true);
      expect(stats.total_operators).toBe(0);
      expect(stats.top_operator_codename).toBe("");
    });

    it("returns unavailable stats when system_stats query fails", async () => {
      failTables.add("system_stats");
      const stats = await getHomepageStats();
      expect(stats.isPlaceholder).toBe(true);
      expect(stats.total_operators).toBe(0);
      expect(stats.total_tokens_scored).toBe(0);
    });

    it("returns live stats when system_stats exists", async () => {
      tableData["system_stats"] = [
        {
          total_operators: 42,
          total_snapshots: 108,
          total_tokens_scored: 5000000,
          transmitter_count: 5,
          top_signa_rate: 98.5,
          top_yield: 1250,
          top_operator_id: "op-champ-1",
        },
      ];
      // Top operator's codename resolves via operators_public (visibility-gated).
      tableData["operators_public"] = [{ codename: "champion-op" }];
      const stats = await getHomepageStats();
      expect(stats.isPlaceholder).toBe(false);
      expect(stats.total_operators).toBe(42);
      expect(stats.top_operator_codename).toBe("champion-op");
    });
  });

  describe("getClassDistribution", () => {
    it("returns zero counts for all canonical tiers when metric_snapshots is empty (never MOCK_CLASS_DISTRIBUTION)", async () => {
      tableData["metric_snapshots"] = [];
      const dist = await getClassDistribution();
      expect(dist.length).toBe(24);
      expect(dist.every((d) => d.count === 0)).toBe(true);
    });

    it("returns zero counts for all canonical tiers when metric_snapshots query fails", async () => {
      failTables.add("metric_snapshots");
      const dist = await getClassDistribution();
      expect(dist.length).toBe(24);
      expect(dist.every((d) => d.count === 0)).toBe(true);
    });
  });

  describe("getLeaderboard", () => {
    it("returns empty array when metric_snapshots is empty (never filterMockBoard)", async () => {
      tableData["metric_snapshots"] = [];
      const board = await getLeaderboard();
      expect(board).toEqual([]);
    });

    it("returns empty array when metric_snapshots query fails (never filterMockBoard)", async () => {
      failTables.add("metric_snapshots");
      const board = await getLeaderboard();
      expect(board).toEqual([]);
    });
  });
});
