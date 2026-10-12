/**
 * __tests__/board/snapshot-records.test.ts
 *
 * Coverage for getOperatorSnapshotRecords — the profile Snapshot History
 * read over snapshot_submissions. Mirrors the public snapshot-history API
 * contract, so the tests pin:
 *
 *   1. Visibility parity: unclaimed / retired / private operators expose no
 *      records, and no submission query is issued for them.
 *   2. Operator constraint: the snapshot_submissions read is always
 *      .eq("operator_id") + .eq("status", "scored") — never an unfiltered
 *      table scan, and bounded by the per-operator limit.
 *   3. Mapping fidelity: window/platform/pillars carry through; a null
 *      window_type stays null (never relabeled "all_time"); incomplete
 *      pillars produce null derived metrics — "unavailable" is never
 *      conflated with zero or a default.
 *   4. Provenance: workflow mode resolves via resolveWorkflowMode
 *      (hitl heuristic, assessed agentic/hybrid with https evidence);
 *      evidence URL + assessment timestamp ride along for agentic rows
 *      only — the same gating the public API applies.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Fixtures ────────────────────────────────────────────────────────────

const OP = {
  operator_id: "op-1",
  codename: "test-op",
  claimed: true,
  status: "active",
  profile_visibility: "public",
};

function sub(over: Record<string, unknown> = {}) {
  return {
    submission_id: "sub-1",
    submitted_at: "2026-10-01T12:00:00Z",
    window_type: "all_time",
    window_start: null,
    window_end: null,
    platform: "claude-code",
    ruleset_version: "rs-0.5",
    input_tokens: 100,
    output_tokens: 200,
    cache_creation_tokens: 50,
    cache_read_tokens: 2_000,
    workflow_mode: null,
    workflow_evidence_url: null,
    workflow_mode_version: null,
    mode_assessed_at: null,
    status: "scored",
    ...over,
  };
}

// share = 100/2350 ≈ 4.3% → inside the OCM band → hitl (hcm-v1 stamped)
const HITL_ROW = sub({ submission_id: "sub-hitl" });

// assessed agentic + https evidence → agentic, evidence carried
const AGENTIC_ROW = sub({
  submission_id: "sub-agentic",
  workflow_mode: "agentic",
  workflow_evidence_url: "https://example.org/attestation/1",
  workflow_mode_version: "amv-2",
  mode_assessed_at: "2026-10-01T12:30:00Z",
});

// assessed hybrid + https evidence → hybrid; provenance stays agentic-only
const HYBRID_ROW = sub({
  submission_id: "sub-hybrid",
  workflow_mode: "hybrid",
  workflow_evidence_url: "https://example.org/attestation/2",
  workflow_mode_version: "amv-2",
  mode_assessed_at: "2026-10-01T12:45:00Z",
});

// incomplete pillars → null derived metrics + null mode; null window kept
const PARTIAL_ROW = sub({
  submission_id: "sub-partial",
  window_type: null,
  window_start: "2026-09-01",
  window_end: "2026-09-30",
  platform: null,
  ruleset_version: null,
  input_tokens: null,
  output_tokens: null,
  cache_creation_tokens: null,
  cache_read_tokens: null,
});

// ── Counting fake ───────────────────────────────────────────────────────

interface ReqRec {
  table: string;
  filters: { op: string; col: string; val?: unknown }[];
  terminal: string;
}

let opFixture: typeof OP | null = OP;
let submissionRows: unknown[] = [];

function makeSb() {
  const requests: ReqRec[] = [];

  function pickRows(rec: ReqRec): unknown[] {
    switch (rec.table) {
      case "operators_public":
        return opFixture ? [opFixture] : [];
      case "snapshot_submissions":
        return submissionRows;
      default:
        return [];
    }
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
        return { data: pickRows(rec)[0] ?? null, error: null };
      },
      then: (res: (v: unknown) => unknown) => {
        rec.terminal = "await";
        requests.push(rec);
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
}));

const { getOperatorSnapshotRecords } = await import("@/lib/board/queries");
const requests = sb.__requests;

describe("getOperatorSnapshotRecords", () => {
  beforeEach(() => {
    opFixture = OP;
    submissionRows = [];
    requests.length = 0;
  });

  it("issues no submission query for unclaimed operators", async () => {
    opFixture = { ...OP, claimed: false };
    submissionRows = [HITL_ROW];
    const out = await getOperatorSnapshotRecords("test-op");
    expect(out).toEqual([]);
    expect(
      requests.filter((r) => r.table === "snapshot_submissions"),
    ).toHaveLength(0);
  });

  it("issues no submission query for retired or private operators", async () => {
    for (const over of [
      { status: "retired" },
      { profile_visibility: "private" },
    ]) {
      opFixture = { ...OP, ...over };
      requests.length = 0;
      const out = await getOperatorSnapshotRecords("test-op");
      expect(out).toEqual([]);
      expect(
        requests.filter((r) => r.table === "snapshot_submissions"),
      ).toHaveLength(0);
    }
  });

  it("constrains the read to the operator and scored status", async () => {
    submissionRows = [HITL_ROW];
    await getOperatorSnapshotRecords("test-op");
    const req = requests.find((r) => r.table === "snapshot_submissions");
    expect(req).toBeDefined();
    expect(
      req!.filters.some(
        (f) => f.op === "eq" && f.col === "operator_id" && f.val === "op-1",
      ),
    ).toBe(true);
    expect(
      req!.filters.some(
        (f) => f.op === "eq" && f.col === "status" && f.val === "scored",
      ),
    ).toBe(true);
  });

  it("maps a complete row with derived cascade metrics and hcm-v1 hitl", async () => {
    submissionRows = [HITL_ROW];
    const [r] = await getOperatorSnapshotRecords("test-op");
    expect(r.window).toBe("all_time");
    expect(r.platform).toBe("claude-code");
    expect(r.inputTokens).toBe(100);
    expect(r.outputTokens).toBe(200);
    expect(r.cacheCreateTokens).toBe(50);
    expect(r.cacheReadTokens).toBe(2_000);
    // Υ = (cache_read × output) / input² = (2000×200)/100² = 40
    expect(r.yield_).toBeCloseTo(40);
    expect(r.snr).not.toBeNull();
    expect(r.velocity).toBeCloseTo(2);
    expect(r.workflowMode).toBe("hitl");
    expect(r.workflowModeVersion).toBe("hcm-v1");
    expect(r.workflowEvidenceUrl).toBeNull();
    expect(r.modeAssessedAt).toBeNull();
  });

  it("keeps null windows and null pillars unavailable — derived metrics null", async () => {
    submissionRows = [PARTIAL_ROW];
    const [r] = await getOperatorSnapshotRecords("test-op");
    expect(r.window).toBeNull();
    expect(r.platform).toBe("other");
    expect(r.inputTokens).toBeNull();
    expect(r.outputTokens).toBeNull();
    expect(r.yield_).toBeNull();
    expect(r.snr).toBeNull();
    expect(r.velocity).toBeNull();
    expect(r.leverage).toBeNull();
    expect(r.workflowMode).toBeNull();
    expect(r.workflowModeVersion).toBeNull();
  });

  it("carries evidence URL + assessed-at for assessed agentic rows", async () => {
    submissionRows = [AGENTIC_ROW];
    const [r] = await getOperatorSnapshotRecords("test-op");
    expect(r.workflowMode).toBe("agentic");
    expect(r.workflowModeVersion).toBe("amv-2");
    expect(r.workflowEvidenceUrl).toBe("https://example.org/attestation/1");
    expect(r.modeAssessedAt).toBe("2026-10-01T12:30:00Z");
  });

  it("resolves assessed hybrid distinctly — never collapsed to agentic", async () => {
    submissionRows = [HYBRID_ROW];
    const [r] = await getOperatorSnapshotRecords("test-op");
    expect(r.workflowMode).toBe("hybrid");
    expect(r.workflowModeVersion).toBe("amv-2");
  });

  it("drops assessed agentic rows whose evidence is not https", async () => {
    submissionRows = [
      sub({
        submission_id: "sub-bad-evidence",
        workflow_mode: "agentic",
        workflow_evidence_url: "http://insecure.example/att",
      }),
    ];
    const [r] = await getOperatorSnapshotRecords("test-op");
    expect(r.workflowMode).toBeNull();
    expect(r.workflowEvidenceUrl).toBeNull();
  });
});
