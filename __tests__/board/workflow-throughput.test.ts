import { describe, expect, it } from "vitest";
import { snapshotThroughput } from "@/lib/board/throughput";
import { includesBoardMode, resolveWorkflowMode } from "@/lib/board/workflow-mode";

describe("exact snapshot throughput", () => {
  const base = {
    inputTokens: 100,
    outputTokens: 300,
    cacheWriteTokens: 0,
    cacheReadTokens: 600,
    windowStart: "2026-10-01T00:00:00Z",
    windowEnd: "2026-10-03T00:00:00Z",
  };

  it("counts all four pillars over the actual elapsed days, including zero W", () => {
    expect(snapshotThroughput(base)).toEqual({
      processedTokens: 1000,
      processedTokensPerDay: 500,
      outputTokensPerDay: 150,
      periodDays: 2,
    });
  });

  it("does not estimate rates from missing pillars or invalid bounds", () => {
    expect(snapshotThroughput({ ...base, cacheWriteTokens: null })).toBeNull();
    expect(snapshotThroughput({ ...base, windowStart: null })).toBeNull();
    expect(snapshotThroughput({ ...base, windowEnd: base.windowStart })).toBeNull();
  });
});

describe("workflow board eligibility", () => {
  const hcm = {
    inputTokens: 1_000_000,
    outputTokens: 1_500_000,
    cacheWriteTokens: 2_000_000,
    cacheReadTokens: 20_000_000,
  };

  it("places HCM in HITL and does not call an outlier Agentic by ratio", () => {
    expect(resolveWorkflowMode(hcm)).toBe("hitl");
    const outlier = resolveWorkflowMode({ ...hcm, inputTokens: 100, outputTokens: 9_000_000 });
    expect(outlier).toBeNull();
    expect(includesBoardMode("all", outlier)).toBe(false);
  });

  it("requires a public evidence link to classify an agentic workflow", () => {
    expect(resolveWorkflowMode({ ...hcm, assessment: "agentic" })).toBeNull();
    const agentic = resolveWorkflowMode({ ...hcm, assessment: "agentic", evidenceUrl: "https://example.org/workflow" });
    expect(agentic).toBe("agentic");
    expect(includesBoardMode("agentic", agentic)).toBe(true);
    expect(includesBoardMode("hitl", agentic)).toBe(false);
    expect(includesBoardMode("all", agentic)).toBe(true);
    expect(resolveWorkflowMode({ ...hcm, inputTokens: 0, assessment: "agentic", evidenceUrl: "https://example.org/workflow" })).toBeNull();
  });
});
