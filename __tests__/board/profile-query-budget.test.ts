/**
 * __tests__/board/profile-query-budget.test.ts
 *
 * Blast-radius guard for the /user/[codename] cold-render path.
 * Added 2026-09-27 after the rank-basis fix moved recomputeRank's
 * FULL metric_snapshots scan (~2,700 rows, 3 paginated round trips)
 * inside every cold profile render — the crawl-flagged 2.3–2.7s pages.
 *
 * Invariants enforced here:
 *   1. Every metric_snapshots request on the getOperator path is
 *      operator-constrained (.eq/.in on operator_id). No unfiltered
 *      corpus scans may ever ride the profile render path.
 *   2. The claimed rank map is shared across renders: a second
 *      getOperator call within the memo TTL issues zero corpus work —
 *      only the operator's own identity/snapshot/rank_history reads.
 *   3. The map actually feeds the row (rank correctness, not just cost).
 *
 * How: a counting fake Supabase client records every executed request
 * (each awaited query chain = one PostgREST round trip) and which
 * filters it carried. If a future change reintroduces a corpus scan on
 * this path, invariant 1 fails; if it makes the scan per-render again,
 * invariant 2 fails.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Fixtures ────────────────────────────────────────────────────────────
// Two claimed operators: op-1 (the profile under test) and op-2 (ranks
// higher by yield). Fields cover OPERATOR_COLUMNS / SNAPSHOT_COLUMNS.

const OP = {
  operator_id: "op-1",
  codename: "test-op",
  display_name: "Test Op",
  claimed: true,
  claimed_at: "2026-01-01T00:00:00Z",
  current_supporter_tier: null,
  verification_status: "verified",
  primary_domain: null,
  account_age_days: 100,
  total_messages_lifetime: 1000,
  handle: "testop",
  avatar_url: null,
  bio: null,
  links: [],
  location: null,
  profile_visibility: "public",
  status: "active",
};

function snap(operatorId: string, cacheRead: number) {
  return {
    metric_snapshot_id: `ms-${operatorId}`,
    operator_id: operatorId,
    snapshot_date: "2026-09-26",
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
    input_tokens: 100,
    output_tokens: 100,
    cache_creation_tokens: 50,
    cache_read_tokens: cacheRead,
    account_age_days: 100,
    total_messages: 1000,
  };
}

const SNAP_OP1 = snap("op-1", 1_000); // yield = (1000/100)*(100/100) = 10
const SNAP_OP2 = {
  ...snap("op-2", 50_000),
  workflow_mode: "agentic",
  workflow_evidence_url: "https://example.org/workflow",
}; // yield = 500 → assessed Agentic op-2 ranks #1

// ── Counting fake ───────────────────────────────────────────────────────

interface ReqRec {
  table: string;
  filters: { op: string; col: string }[];
  terminal: string;
}

function makeSb() {
  const requests: ReqRec[] = [];

  function pickRows(rec: ReqRec): unknown[] {
    const has = (op: string, col: string) =>
      rec.filters.some((f) => f.op === op && f.col === col);
    switch (rec.table) {
      case "operators_public":
        // claimed-id query (claimedRanks) vs identity query (ilike codename)
        return has("eq", "claimed")
          ? [{ operator_id: "op-1", codename: "test-op" }, { operator_id: "op-2", codename: "agentic-op" }]
          : [OP];
      case "metric_snapshots":
        // claimedRanks fetches via .in(operator_id) → both ops' snaps;
        // the per-operator fetch via .eq(operator_id) → op-1's only.
        return has("in", "operator_id") ? [SNAP_OP1, SNAP_OP2] : [SNAP_OP1];
      case "rank_history":
        return [];
      default:
        return [];
    }
  }

  function builder(rec: ReqRec) {
    const note = (op: string) => (col: string) => {
      rec.filters.push({ op, col });
      return b;
    };
    const b: Record<string, unknown> = {
      select: () => b,
      order: () => b,
      limit: () => b,
      range: () => b,
      gte: note("gte"),
      lte: note("lte"),
      lt: note("lt"),
      gt: note("gt"),
      is: note("is"),
      neq: note("neq"),
      like: note("like"),
      ilike: note("ilike"),
      eq: note("eq"),
      in: note("in"),
      not: () => b,
      or: () => b,
      filter: note("filter"),
      match: () => b,
      contains: note("contains"),
      overlaps: note("overlaps"),
      textSearch: () => b,
      head: () => b,
      maybeSingle: async () => {
        rec.terminal = "maybeSingle";
        requests.push(rec);
        return { data: pickRows(rec)[0] ?? null, error: null };
      },
      single: async () => {
        rec.terminal = "single";
        requests.push(rec);
        return { data: pickRows(rec)[0] ?? null, error: null };
      },
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
        rec.terminal = "await";
        requests.push(rec);
        return Promise.resolve({
          data: pickRows(rec),
          error: null,
        }).then(res, rej);
      },
    };
    return b;
  }

  const sb = {
    from(table: string) {
      const rec: ReqRec = { table, filters: [], terminal: "" };
      return builder(rec);
    },
    __requests: requests,
  };
  return sb;
}

const sb = makeSb();

vi.mock("@/lib/infra/supabase/server", () => ({
  getSupabaseServer: () => sb,
}));

const { getOperator } = await import("@/lib/board/queries");
const { memoClear } = await import("@/lib/board/memo");

const requests = sb.__requests;

describe("profile query budget (blast-radius guard)", () => {
  beforeEach(() => {
    memoClear();
    requests.length = 0;
  });

  it("never issues an unconstrained metric_snapshots scan on the profile path", async () => {
    await getOperator("test-op");
    const snapReqs = requests.filter((r) => r.table === "metric_snapshots");
    expect(snapReqs.length).toBeGreaterThan(0);
    for (const r of snapReqs) {
      expect(
        r.filters.some((f) => f.col === "operator_id"),
        `unconstrained metric_snapshots ${r.terminal} on profile path`,
      ).toBe(true);
    }
  });

  it("a second render within the memo TTL does zero corpus work", async () => {
    await getOperator("test-op"); // cold: builds the claimed map
    requests.length = 0;
    await getOperator("test-op"); // warm: map hit → per-operator reads only
    // identity + own snapshots + rank_history. Anything above this means
    // corpus-level work crept back into the per-render path.
    expect(requests.length).toBeLessThanOrEqual(3);
    expect(
      requests.filter((r) => r.filters.some((f) => f.op === "in")).length,
    ).toBe(0);
  });

  it("cold render stays within the profile query budget", async () => {
    await getOperator("test-op");
    // identity(1) + own snaps(1) + rank_history(1) + claimed ids(1)
    // + claimed snaps(1 page) = 5. Multi-page corpus scans push this over.
    expect(requests.length).toBeLessThanOrEqual(6);
  });

  it("claimed rank map feeds the displayed rank", async () => {
    const row = await getOperator("test-op");
    // op-2 (yield 500) ranks #1; op-1 (yield 10) ranks #2 of 2.
    expect(row?.global_rank).toBe(2);
    expect(row?.percentile).toBe(0);
  });
});
