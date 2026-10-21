/**
 * Wiring test for the all-time guard in materializeVerifiedSnapshot
 * (lib/ingest/materialize.ts → lib/ingest/all-time-guard.ts), against an
 * in-memory stand-in for the service-role Supabase client. Synthetic operator.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const db: { metric: Row[]; submissions: Row[]; rpc: Row[] } = {
  metric: [],
  submissions: [],
  rpc: [],
};

function query(rows: () => Row[]) {
  const filters: ((r: Row) => boolean)[] = [];
  let lim = Infinity;
  const b = {
    select: () => b,
    eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), b),
    neq: (k: string, v: unknown) => (filters.push((r) => r[k] !== v), b),
    order: () => b,
    limit: (n: number) => ((lim = n), b),
    then: (resolve: (v: { data: Row[]; error: null }) => void) =>
      resolve({
        data: rows()
          .filter((r) => filters.every((f) => f(r)))
          .sort((a, z) => String(z.snapshot_date).localeCompare(String(a.snapshot_date)))
          .slice(0, lim),
        error: null,
      }),
  };
  return b;
}

const svc = {
  from: (table: string) => ({
    ...query(() => (table === "metric_snapshots" ? db.metric : db.submissions)),
    insert: (row: Row) => {
      const saved = { ...row, submission_id: `sub-${db.submissions.length + 1}` };
      db.submissions.push(saved);
      return { select: () => ({ single: async () => ({ data: saved, error: null }) }) };
    },
    upsert: (row: Row) => {
      const key = (r: Row) => [r.operator_id, r.snapshot_date, r.window_type, r.platform].join("|");
      db.metric = db.metric.filter((r) => key(r) !== key(row));
      const saved = { ...row, metric_snapshot_id: `ms-${db.metric.length + 1}` };
      db.metric.push(saved);
      return { select: () => ({ single: async () => ({ data: saved, error: null }) }) };
    },
  }),
  rpc: async (_fn: string, args: Row) => {
    db.rpc.push(args);
    return { data: "ms-rpc", error: null };
  },
};

vi.mock("@/lib/infra/supabase/server", () => ({ getSupabaseService: () => svc }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { materializeVerifiedSnapshot } from "@/lib/ingest/materialize";
import type { SnapshotPayloadV1 } from "@/lib/ingest/payload-schema";
import type { GateResult } from "@/lib/ingest/gates";

const OP = "00000000-0000-4000-8000-0000000000a1";
const device = { device_id: "00000000-0000-4000-8000-0000000000d1", operator_id: OP };
const gate: GateResult = { decision: "accept", tier: "verified", reasons: [], signals: {} };

function payload(
  platform: string,
  [input, output, cacheRead, cacheCreate]: number[],
  end = "2026-10-21T04:54:04.917Z",
): SnapshotPayloadV1 {
  return {
    schema_version: "1.1",
    codename: "signal-test-guard",
    device_id: device.device_id,
    submitted_at: end,
    window: { type: "all_time", start: "2026-01-01T00:00:00.000Z", end },
    platform: { primary: platform, models: [] },
    core_metrics: { compression_ratio: 0.5, prompt_complexity: 10, cross_thread_score: 1, session_depth_avg: 5 },
    background_metrics: { message_volume: 10, account_age_days: 100, total_messages_lifetime: 1000 },
    raw_telemetry: {
      sessions_count: 10,
      turns_total: 100,
      tokens_total: input + output + cacheRead + cacheCreate,
      tokens_input_fresh: input,
      tokens_output: output,
      tokens_cache_read: cacheRead,
      tokens_cache_creation: cacheCreate,
      active_minutes_est: 60,
    },
    tier: "free",
    agent: { version: "test", ruleset_version: "sigrank-token-1", snapshot_hash: `h-${platform}-${input}`, public_key: "k" },
  } as unknown as SnapshotPayloadV1;
}

function boardRow(platform: string, [i, o, cr, cc]: number[], date = "2026-10-15"): Row {
  return {
    metric_snapshot_id: `prev-${platform}`,
    operator_id: OP,
    snapshot_date: date,
    window_type: "all_time",
    platform,
    source_submission_id: `src-${platform}`,
    window_start: "2026-01-01T00:00:00+00:00",
    window_end: `${date}T17:46:48.747+00:00`,
    input_tokens: i,
    output_tokens: o,
    cache_read_tokens: cr,
    cache_creation_tokens: cc,
    signa_rate: 1.23,
    class_tier: "C",
    ruleset_version: "sigrank-token-1",
  };
}

const latest = (platform: string) =>
  db.metric
    .filter((r) => r.platform === platform && r.window_type === "all_time")
    .sort((a, z) => String(z.snapshot_date).localeCompare(String(a.snapshot_date)))[0];

beforeEach(() => {
  db.metric = [];
  db.submissions = [];
  db.rpc = [];
});

describe("all-time guard in materializeVerifiedSnapshot", () => {
  it("growth goes through the normal RPC", async () => {
    db.metric.push(boardRow("claude", [10, 10, 100, 10]));
    const res = await materializeVerifiedSnapshot(payload("claude", [11, 12, 130, 14]), "sig", device, gate);
    expect(res).toEqual({ ok: true, metricSnapshotId: "ms-rpc" });
    expect(db.rpc).toHaveLength(1);
    expect(db.submissions).toHaveLength(0);
  });

  it("shorter windows are never guarded", async () => {
    const p = payload("claude", [1, 1, 1, 1]);
    p.window.type = "7d";
    db.metric.push(boardRow("claude", [10, 10, 100, 10]));
    await materializeVerifiedSnapshot(p, "sig", device, gate);
    expect(db.rpc).toHaveLength(1);
  });

  it("a shrunk scan carries the previous row forward and flags it", async () => {
    db.metric.push(boardRow("claude", [15_253_774, 24_705_080, 6_666_138_398, 236_615_433]));
    const res = await materializeVerifiedSnapshot(
      payload("claude", [901_878, 7_348_488, 2_637_272_656, 86_508_849]),
      "sig",
      device,
      gate,
    );
    expect(db.rpc).toHaveLength(0);
    expect(res.ok && res.allTimeGuard?.code).toBe("all_time_shrink_held");
    expect(res.ok && res.allTimeGuard?.severity).toBe("flag");

    // The scanned numbers stay on record as an unranked audit row.
    expect(db.submissions).toHaveLength(1);
    expect(db.submissions[0]).toMatchObject({ status: "validated", input_tokens: 901_878 });

    // The board's latest all_time row keeps the previous totals and provenance.
    expect(latest("claude")).toMatchObject({
      snapshot_date: "2026-10-21",
      input_tokens: 15_253_774,
      cache_read_tokens: 6_666_138_398,
      source_submission_id: "src-claude",
      window_end: "2026-10-15T17:46:48.747+00:00",
    });
    expect(latest("claude").metric_snapshot_id).not.toBe("prev-claude");
    expect(db.metric).toHaveLength(2); // the 10-15 row is untouched
  });

  it("multi becomes Σ platforms when a platform was held in the same scan", async () => {
    db.metric.push(
      boardRow("claude", [10, 10, 100, 10]),
      boardRow("codex", [5, 5, 50, 5]),
      boardRow("multi", [15, 15, 150, 15]),
    );
    await materializeVerifiedSnapshot(payload("claude", [8, 12, 120, 12]), "sig", device, gate);
    // codex grew → normal RPC; mirror what the RPC writes for the in-memory board.
    await materializeVerifiedSnapshot(payload("codex", [6, 6, 60, 6]), "sig", device, gate);
    db.metric.push({ ...boardRow("codex", [6, 6, 60, 6], "2026-10-21"), window_end: "2026-10-21T04:54:10.881+00:00" });

    const res = await materializeVerifiedSnapshot(payload("multi", [14, 18, 180, 18]), "sig", device, gate);
    expect(res.ok && res.allTimeGuard?.code).toBe("all_time_platform_sum");
    expect(latest("multi")).toMatchObject({
      snapshot_date: "2026-10-21",
      input_tokens: 16,
      output_tokens: 16,
      cache_read_tokens: 160,
      cache_creation_tokens: 16,
      source_submission_id: db.submissions.at(-1)?.submission_id,
    });
  });

  it("a multi scan with no held platform follows the plain rule", async () => {
    db.metric.push(boardRow("multi", [15, 15, 150, 15]));
    // Same-scan platform rows that were really scanned (window_end on the same date).
    db.metric.push({ ...boardRow("claude", [9, 9, 90, 9], "2026-10-21"), window_end: "2026-10-21T04:50:00+00:00" });
    const res = await materializeVerifiedSnapshot(payload("multi", [16, 16, 160, 16]), "sig", device, gate);
    expect(res).toEqual({ ok: true, metricSnapshotId: "ms-rpc" });
  });
});
