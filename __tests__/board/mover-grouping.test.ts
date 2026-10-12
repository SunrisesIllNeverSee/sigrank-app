import { describe, expect, it } from "vitest";
import type { LiveOperator } from "@/lib/board/live-types";
import { moverScopeMatches } from "@/components/live/MoversRail";

describe("Top Movers follows the leaderboard's HITL / Hybrid / Autonomous groups", () => {
  const op = (wf: LiveOperator["wf"]) => ({ wf } as LiveOperator);
  it("Hybrid shows the entire ranked operator cohort", () => {
    for (const mode of ["hitl", "hybrid", "agentic", null] as const) {
      expect(moverScopeMatches(op(mode), "hybrid")).toBe(true);
    }
  });
  it("HITL includes HCM and dual-assessed operators, not statistical outliers", () => {
    expect(moverScopeMatches(op("hitl"), "hitl")).toBe(true);
    expect(moverScopeMatches(op("hybrid"), "hitl")).toBe(true);
    expect(moverScopeMatches(op(null), "hitl")).toBe(false);
    expect(moverScopeMatches(op("agentic"), "hitl")).toBe(false);
  });
  it("Autonomous includes unresolved Outlier candidates, not HCM operators", () => {
    expect(moverScopeMatches(op(null), "agentic")).toBe(true);
    expect(moverScopeMatches(op("agentic"), "agentic")).toBe(true);
    expect(moverScopeMatches(op("hybrid"), "agentic")).toBe(true);
    expect(moverScopeMatches(op("hitl"), "agentic")).toBe(false);
  });
});
