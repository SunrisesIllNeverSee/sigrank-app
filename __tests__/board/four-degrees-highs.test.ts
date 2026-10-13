import { describe, expect, it } from "vitest";
import type { LeaderboardRow } from "@/lib/board/types";
import { fourDegreesHighs } from "@/lib/share/four-degrees-highs";

const row = (workflow: LeaderboardRow["workflow_mode"], yield_: number, leverage: number, velocity: number, placeholder = false) => ({
  workflow_mode: workflow, operator: { codename: `op-${yield_}`, isPlaceholder: placeholder },
  snapshot: { cascade: { yield_, leverage, velocity, snr: 0.5, dev10x: 2, efficiency: 4, nonCompounding: false } },
}) as LeaderboardRow;

describe("Four Degrees cohort highs", () => {
  it("calculates separate metric highs and uses the Yield leader's operating ratio", () => {
    const highs = fourDegreesHighs([row("hitl", 10, 100, 0.5), row("hitl", 5, 200, 2), row("agentic", 999, 999, 999)], "hitl");
    expect(highs?.yield_).toBe("10");
    expect(highs?.leverage).toBe("200×");
    expect(highs?.velocity).toBe("2");
    expect(highs?.opRatio).toBe("100 : 1 : 0.5");
  });
  it("matches board cohort overlap/review rules and excludes placeholder data", () => {
    const rows = [row("hybrid", 10, 20, 1), row(null, 15, 30, 2), row("agentic", 999, 999, 999, true)];
    expect(fourDegreesHighs(rows, "hitl")?.yield_).toBe("10");
    expect(fourDegreesHighs(rows, "agentic")?.yield_).toBe("15");
    expect(fourDegreesHighs([], "agentic")).toBeNull();
  });
});
