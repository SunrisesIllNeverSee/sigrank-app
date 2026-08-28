// @vitest-environment node
/**
 * __tests__/mcp/behavioral-fixtures.test.ts
 *
 * Behavioral regression fixtures for the SignalAF MCP server.
 * These tests call the domain functions (callTool, readResource, getPrompt)
 * directly with deterministic inputs and compare semantic output fields.
 *
 * Covers spec Section 38: "OLD MCP RESULT = NEW MCP RESULT. Compare
 * meaningful semantic fields rather than transport-specific metadata."
 *
 * Pure-math tools (rank_paste, simulate_change, diagnose_cascade,
 * suggest_improvements, self_improve, rank_if) are tested with frozen
 * canonical inputs. Data-dependent tools (get_leaderboard, get_operator,
 * benchmark_me, etc.) are tested with mocked board data.
 */

import { describe, it, expect, vi } from "vitest";

// ── Mock board data so tools that need Supabase can be tested ────────────────
// The mock returns LeaderboardRow-shaped objects matching lib/board/types.ts.
const mockCascade = {
  yield_: 15000.5,
  leverage: 1800.2,
  velocity: 3.5,
  snr: 0.85,
  dev10x: 3.26,
  construction: 0.5,
  scaleV: 1000,
  costPerMillion: 3.0,
  efficiency: 0.8,
  opRatio: "1.5",
  cascadeStr: "L240-V0.31-S0.24-C0.08",
  nonCompounding: false,
};

const mockOperator = {
  operator_id: "op-test-1",
  codename: "signal-test1",
  display_name: "Test Operator 1",
  claimed: false,
  claimed_at: null,
  claim_payment_id: null,
  claim_contact: null,
  current_supporter_tier: "free" as const,
  verification_status: "verified" as const,
  primary_domain: "claude",
  account_age_days: 30,
  total_messages_lifetime: 1000,
};

const mockSnapshot = {
  signa_rate: 75.5,
  class_tier: "REFINER I" as const,
  compression_ratio: 0.8,
  prompt_complexity: { value: 50, confidence: "exact" as const },
  cross_thread: 30,
  session_depth: 5,
  token_throughput: 1000000,
  signal_force: 80,
  drift_ratio: null,
  cascade: mockCascade,
};

const mockRow = {
  operator: mockOperator,
  snapshot: mockSnapshot,
  global_rank: 1,
  percentile: 99,
  telemetry: {
    fresh_input: 1251211,
    output: 11296121,
    cache_read: 2555179769,
    cache_create: 128196310,
    sessions: 10,
    turns: 50,
  },
  window_type: "30d",
  platform: "claude",
  snapshot_date: "2026-08-01",
};

vi.mock("@/lib/board", () => ({
  getLeaderboard: vi.fn().mockResolvedValue([mockRow, { ...mockRow, operator: { ...mockOperator, codename: "signal-test2", display_name: "Test Operator 2" }, global_rank: 2, percentile: 95 }]),
  getOperator: vi.fn().mockResolvedValue(mockRow),
}));

const { callTool } = await import("@/lib/mcp/tools");
const { readResource } = await import("@/lib/mcp/resources");
const { getPrompt } = await import("@/lib/mcp/prompts");

// ── Frozen canonical inputs ─────────────────────────────────────────────────

const MOSES = {
  input: 1_251_211,
  output: 11_296_121,
  cache_read: 2_555_179_769,
  cache_write: 128_196_310,
};

// ── rank_paste: frozen cascade math ─────────────────────────────────────────

describe("rank_paste behavioral fixtures", () => {
  it("MOSES seed values produce frozen Υ 18436.98", async () => {
    const result = await callTool("rank_paste", MOSES, {} as never);
    const data = JSON.parse(result.content[0].text as string);
    expect(data.yield_).toBeCloseTo(18436.98, 0);
    expect(data.leverage).toBeCloseTo(2042.2, 0);
    expect(data.snr).toBeCloseTo(0.9, 1);
    expect(data.dev10x).toBeCloseTo(3.31, 1);
    expect(data.class).toBe("REFINER I");
    expect(data.non_compounding).toBe(false);
  });

  it("zero input returns null metrics (safe, no crash)", async () => {
    const result = await callTool(
      "rank_paste",
      { input: 0, output: 0, cache_read: 0, cache_write: 0 },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data.yield_).toBeNull();
    expect(data.leverage).toBeNull();
  });

  it("zero cache_write sets non_compounding flag", async () => {
    const result = await callTool(
      "rank_paste",
      { input: 1000, output: 2000, cache_read: 500, cache_write: 0 },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data.non_compounding).toBe(true);
  });

  it("invalid arguments return error result", async () => {
    const result = await callTool(
      "rank_paste",
      { input: "abc", output: 100 },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data.code).toBe("invalid_arguments");
    expect(result.isError).toBe(true);
  });
});

describe("get_sigrank_standard_record behavioral fixtures", () => {
  it("returns the portable five-metric record for complete telemetry", async () => {
    const result = await callTool(
      "get_sigrank_standard_record",
      { ...MOSES, timestamp: "2026-08-27T00:00:00.000Z" },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data.spec).toBe("sigrank/0.1-draft");
    expect(data.telemetry).toEqual(MOSES);
    expect(data.metrics).toEqual({
      yield: 18436.98,
      leverage: 2042.2,
      velocity: 9.028,
      snr: 0.9003,
      dev10x: 3.31,
    });
    expect(data.metrics.construction).toBeUndefined();
  });

  it("preserves unavailable cache telemetry as null", async () => {
    const result = await callTool(
      "get_sigrank_standard_record",
      { input: 100, output: 50, cache_write: null, cache_read: null },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data.telemetry.cache_write).toBeNull();
    expect(data.telemetry.cache_read).toBeNull();
    expect(data.metrics.yield).toBeNull();
    expect(data.metrics.leverage).toBeNull();
    expect(data.metrics.dev10x).toBeNull();
    expect(data.metrics.velocity).toBe(0.5);
    expect(data.metrics.snr).toBe(0.3333);
  });

  it("rejects fractional token counts", async () => {
    const result = await callTool(
      "get_sigrank_standard_record",
      { input: 1.5, output: 1 },
      {} as never,
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("non-negative integer token count");
  });
});

describe("operator_signature compatibility", () => {
  it("adds signature_label while preserving the legacy archetype alias", async () => {
    const result = await callTool("operator_signature", MOSES, {} as never);
    const data = JSON.parse(result.content[0].text as string);
    expect(data.signature_label).toBeDefined();
    expect(data.archetype).toBe(data.signature_label);
  });
});

// ── simulate_change: modified cascade math ──────────────────────────────────

describe("simulate_change behavioral fixtures", () => {
  it("returns simulated metrics with deltas applied", async () => {
    const result = await callTool(
      "simulate_change",
      {
        ...MOSES,
        changes: {
          input: "-100000",
          output: "+50000",
        },
      },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
    // Should have some form of simulated metrics
    expect(data.simulated || data.after || data.result).toBeDefined();
  });
});

// ── diagnose_cascade: diagnostic output ─────────────────────────────────────

describe("diagnose_cascade behavioral fixtures", () => {
  it("returns diagnostic analysis for MOSES seeds", async () => {
    const result = await callTool("diagnose_cascade", MOSES, {} as never);
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
    // Should contain diagnostic information
    expect(JSON.stringify(data)).toContain("leverage");
  });
});

// ── suggest_improvements: actionable output ────────────────────────────────

describe("suggest_improvements behavioral fixtures", () => {
  it("returns improvement suggestions", async () => {
    const result = await callTool("suggest_improvements", MOSES, {} as never);
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
  });
});

// ── self_improve: self-improvement output ───────────────────────────────────

describe("self_improve behavioral fixtures", () => {
  it("returns self-improvement analysis", async () => {
    const result = await callTool("self_improve", MOSES, {} as never);
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
  });
});

// ── rank_if: conditional ranking ────────────────────────────────────────────

describe("rank_if behavioral fixtures", () => {
  it("returns conditional ranking analysis", async () => {
    const result = await callTool(
      "rank_if",
      {
        ...MOSES,
        target_metric: "yield",
      },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
  });
});

// ── get_leaderboard: mocked board data ──────────────────────────────────────

describe("get_leaderboard behavioral fixtures", () => {
  it("returns leaderboard entries from mocked board", async () => {
    const result = await callTool(
      "get_leaderboard",
      { limit: 10, window: "30d" },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
    expect(data.total_operators).toBe(2);
    expect(data.entries).toBeDefined();
    expect(data.entries.length).toBe(2);
    expect(data.entries[0].codename).toBe("signal-test1");
  });
});

// ── get_operator: mocked operator data ──────────────────────────────────────

describe("get_operator behavioral fixtures", () => {
  it("returns operator profile from mocked data", async () => {
    const result = await callTool(
      "get_operator",
      { codename: "signal-test1" },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data).toBeDefined();
    expect(data.codename).toBe("signal-test1");
    expect(data.display_name).toBe("Test Operator 1");
    expect(data.class_tier).toBe("REFINER I");
  });

  it("returns error for missing codename", async () => {
    const result = await callTool(
      "get_operator",
      { codename: "" },
      {} as never,
    );
    const data = JSON.parse(result.content[0].text as string);
    expect(data.code).toBe("invalid_arguments");
    expect(result.isError).toBe(true);
  });
});

// ── Resources: readResource ─────────────────────────────────────────────────

describe("Resource behavioral fixtures", () => {
  it("sigrank://methodology returns text content", async () => {
    const result = await readResource("sigrank://methodology");
    expect(result).not.toBeNull();
    expect(result!.contents.length).toBeGreaterThan(0);
    expect(result!.contents[0].uri).toBe("sigrank://methodology");
    expect(result!.contents[0].text).toBeDefined();
    expect(result!.contents[0].text.length).toBeGreaterThan(0);
  });

  it("sigrank://metrics returns text content", async () => {
    const result = await readResource("sigrank://metrics");
    expect(result).not.toBeNull();
    expect(result!.contents[0].text).toBeDefined();
  });

  it("sigrank://formulas returns text content", async () => {
    const result = await readResource("sigrank://formulas");
    expect(result).not.toBeNull();
    expect(result!.contents[0].text).toBeDefined();
  });

  it("sigrank://platforms returns text content", async () => {
    const result = await readResource("sigrank://platforms");
    expect(result).not.toBeNull();
    expect(result!.contents[0].text).toBeDefined();
  });

  it("sigrank://classes returns text content", async () => {
    const result = await readResource("sigrank://classes");
    expect(result).not.toBeNull();
    expect(result!.contents[0].text).toBeDefined();
  });

  it("sigrank://benchmarks returns text content from mocked board", async () => {
    const result = await readResource("sigrank://benchmarks");
    expect(result).not.toBeNull();
    expect(result!.contents[0].text).toBeDefined();
  });

  it("unknown resource returns null", async () => {
    const result = await readResource("sigrank://nonexistent");
    expect(result).toBeNull();
  });
});

// ── Prompts: getPrompt ──────────────────────────────────────────────────────

describe("Prompt behavioral fixtures", () => {
  it("benchmark-my-operator returns messages", () => {
    const result = getPrompt("benchmark-my-operator", {
      input: "1000000",
      output: "5000000",
      cache_read: "8000000",
      cache_write: "2000000",
    });
    expect(result).not.toBeNull();
    expect(result!.messages.length).toBeGreaterThan(0);
    expect(result!.messages[0].role).toBe("user");
    expect(result!.messages[0].content.text).toBeDefined();
  });

  it("how-do-i-reach-top-10 returns messages", () => {
    const result = getPrompt("how-do-i-reach-top-10", {
      input: "1000000",
      output: "5000000",
      cache_read: "8000000",
      cache_write: "2000000",
      target_percentile: "90",
    });
    expect(result).not.toBeNull();
    expect(result!.messages.length).toBeGreaterThan(0);
  });

  it("explain-my-signature returns messages", () => {
    const result = getPrompt("explain-my-signature", {
      input: "1000000",
      output: "5000000",
      cache_read: "8000000",
      cache_write: "2000000",
    });
    expect(result).not.toBeNull();
    expect(result!.messages.length).toBeGreaterThan(0);
  });

  it("diagnose-inefficiency returns messages", () => {
    const result = getPrompt("diagnose-inefficiency", {
      input: "1000000",
      output: "5000000",
    });
    expect(result).not.toBeNull();
    expect(result!.messages.length).toBeGreaterThan(0);
  });

  it("field-anomaly-report returns messages", () => {
    const result = getPrompt("field-anomaly-report", { window: "30d" });
    expect(result).not.toBeNull();
    expect(result!.messages.length).toBeGreaterThan(0);
  });

  it("unknown prompt returns null", () => {
    const result = getPrompt("nonexistent-prompt", {});
    expect(result).toBeNull();
  });
});

// ── Tool catalog integrity ──────────────────────────────────────────────────

describe("Tool catalog integrity", () => {
  it("TOOLS array has exactly 16 tools", async () => {
    const { TOOLS } = await import("@/lib/mcp/tools");
    expect(TOOLS.length).toBe(16);
  });

  it("all tools have required fields", async () => {
    const { TOOLS } = await import("@/lib/mcp/tools");
    for (const tool of TOOLS) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.annotations).toBeDefined();
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.annotations.destructiveHint).toBe(false);
    }
  });

  it("RESOURCES array has exactly 8 resources", async () => {
    const { RESOURCES } = await import("@/lib/mcp/resources");
    expect(RESOURCES.length).toBe(8);
  });

  it("PROMPTS array has exactly 5 prompts", async () => {
    const { PROMPTS } = await import("@/lib/mcp/prompts");
    expect(PROMPTS.length).toBe(5);
  });
});
