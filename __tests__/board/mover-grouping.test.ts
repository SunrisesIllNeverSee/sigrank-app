import { describe, expect, it } from "vitest";
import type { LiveOperator } from "@/lib/board/live-types";
import { moverScopeMatches, MOVER_MODES, MOVER_SLOTS, moverSlideRows } from "@/components/live/MoversRail";

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


describe("five steady Top Movers slide contracts", () => {
  const mk = (
    name: string, wf: LiveOperator["wf"],
    mv7: number | null, mv24: number | null,
    tokens: number, leverage: number, dev: number,
    nc = false,
  ) => ({
    name, codename: name, handle: name, wf, mv7, mv24, nc,
    avatarUrl: null, verif: "unverified",
    total: tokens.toLocaleString(), opratioFull: nc ? null : leverage + ":1:2",
    num: { total: tokens, lev: leverage, dev }, dev,
  } as LiveOperator);
  const source = [
    mk("Alpha", "hitl", 8, 3, 100, 4, 0.6),
    mk("Bravo", null, null, 9, 300, 40, 1.6),
    mk("Charlie", "agentic", 4, null, 900, 400, 2.6),
    mk("Delta", "hitl", null, null, 0, 0, 0, true),
  ];

  it("has exactly 5 distinct slides in requested order", () => {
    expect(MOVER_MODES).toEqual(["7D", "24H", "Σ TOKENS", "OP RATIO", "10×DEV"]);
    expect(MOVER_SLOTS).toBe(5);
  });

  it.each(MOVER_MODES)("%s always has 5 named or TBD slots", mode => {
    const rows = moverSlideRows(source, undefined, "hybrid", mode);
    expect(rows).toHaveLength(5);
    for (const m of rows) {
      expect(m.name.trim()).not.toBe("");
      if (m.placeholder) {
        expect(m.name).toBe("TBD");
        expect(m.opIndex).toBeNull();
        expect(m.note).toBe("—");
      }
    }
  });

  it("distinguishes unavailable movements from fabricated zero scores", () => {
    const seven = moverSlideRows(source, undefined, "hitl", "7D");
    expect(seven[0].name).toBe("Alpha");
    expect(seven.slice(1).every(m => m.placeholder && m.name === "TBD")).toBe(true);
    const day = moverSlideRows(source, undefined, "agentic", "24H");
    expect(day[0].name).toBe("Bravo");
    expect(day.slice(1).every(m => m.placeholder)).toBe(true);
  });

  it("ranks raw token volume but excludes unknown/zero volume rows", () => {
    const rows = moverSlideRows(source, undefined, "hybrid", "Σ TOKENS");
    expect(rows.slice(0, 3).map(r => r.name)).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(rows[0].note).toBe("900");
    expect(rows[3].name).toBe("TBD");
  });

  it("uses actual full Op Ratio and 10×DEV, not artificial multipliers", () => {
    const ratio = moverSlideRows(source, undefined, "hybrid", "OP RATIO");
    expect(ratio.slice(0, 3).map(m => m.name)).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(ratio[0].note).toBe("400:1:2");
    expect(ratio[3].name).toBe("TBD");
    const dev = moverSlideRows(source, undefined, "hybrid", "10×DEV");
    expect(dev.slice(0, 3).map(m => m.name)).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(dev[0].note).toBe("2.60");
    expect(dev[3].placeholder).toBe(true);
  });

  it("preserves original operator indexes on filtered slides", () => {
    const hitl = moverSlideRows(source, undefined, "hitl", "Σ TOKENS");
    expect(hitl[0]).toMatchObject({ name: "Alpha", opIndex: 0 });
    const auto = moverSlideRows(source, undefined, "agentic", "Σ TOKENS");
    expect(auto.slice(0, 2).map(m => m.opIndex)).toEqual([2, 1]);
    expect(auto.slice(2).every(m => m.opIndex === null)).toBe(true);
  });

  it("fills completely empty populations with five noninteractive TBD rows", () => {
    for (const mode of MOVER_MODES) {
      const rows = moverSlideRows([], undefined, "hybrid", mode);
      expect(rows).toHaveLength(5);
      expect(rows.every(m => m.placeholder && m.name === "TBD" && m.opIndex === null)).toBe(true);
    }
  });
});
