import { describe, expect, it } from "vitest";
import { medalLeaders } from "@/components/live/medal-leaders";
import type { LiveOperator } from "@/lib/board/live-types";

function operator(codename: string, values: Partial<LiveOperator> = {}): LiveOperator {
  return {
    codename, name: codename, nc: false,
    yield: "—", lev: "—", total: "—", cost: "—", eff: "—",
    snr: NaN, vel: NaN, dev: NaN, scalev: NaN,
    raw: { i: "—", o: "—", cr: "—", cw: "—" },
    num: { yield: NaN, lev: NaN, total: NaN, cost: NaN },
    ...values,
  } as LiveOperator;
}

describe("board medal leaders", () => {
  it("fills medal decks from metric standings rather than percentile bands", () => {
    const rows = [
      operator("a", { pct: 100, snr: .9, scalev: 1, vel: 2 }),
      operator("b", { pct: 50, snr: .8, scalev: 3, vel: 1 }),
      operator("c", { pct: 0, snr: .7, scalev: 2, vel: 3 }),
    ];
    const decks = medalLeaders(rows);
    expect(decks.map((d) => d.list.length)).toEqual([3, 3, 3]);
    expect(decks[0].list.map((x) => x.operator.codename).sort()).toEqual(["a", "b", "c"]);
  });

  it("awards cheaper cost first and counts its canonical metric only once", () => {
    const rows = [3, 1, 2].map((cost) => operator(String(cost), {
      cost: `$${cost}`, num: { yield: NaN, lev: NaN, total: NaN, cost },
    }));
    expect(medalLeaders(rows).map((d) => d.list.map((x) => [x.operator.codename, x.count])))
      .toEqual([[["1", 1]], [["2", 1]], [["3", 1]]]);
  });

  it("does not award missing or nonfinite measurements or invent extra holders", () => {
    const rows = [operator("missing"), operator("infinite", { snr: Infinity }),
      operator("measured", { snr: .8 })];
    expect(medalLeaders(rows).map((d) => d.list.map((x) => x.operator.codename)))
      .toEqual([["measured"], [], []]);
    expect(medalLeaders([]).every((d) => d.list.length === 0)).toBe(true);
  });

  it("excludes non-compounding cascade medals but retains measured raw pillars", () => {
    const row = operator("nc", {
      nc: true, yield: "20", lev: "10", dev: 1,
      raw: { i: "10", o: "—", cr: "20", cw: "—" },
      num: { yield: 20, lev: 10, total: NaN, cost: NaN, i: 10, cr: 20 },
    });
    expect(medalLeaders([row])[0].list[0].count).toBe(2);
  });

  it("uses exact values when rounded labels tie", () => {
    const rows = [1.001, 1.002].map((cost) => operator(String(cost), {
      cost: "$1.00", num: { yield: NaN, lev: NaN, total: NaN, cost },
    })).reverse();
    expect(medalLeaders(rows)[0].list[0].operator.codename).toBe("1.001");
  });
});
