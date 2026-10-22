import { describe, it, expect } from "vitest";
import {
  rotoPoints, referenceIndexes, scoreRadarField, radarFractions, RADAR_KINDS,
} from "@/lib/radar/points";
import type { LeaderboardRow } from "@/lib/board/types";

function row(codename: string, rank: number, p: [number, number, number, number], extra: Partial<{ nonCompounding: boolean; cost: number }> = {}): LeaderboardRow {
  const [i, o, cw, cr] = p;
  const lev = cr / i;
  const vel = o / i;
  return {
    operator: { codename, display_name: codename } as LeaderboardRow["operator"],
    snapshot: {
      cascade: {
        yield_: lev * vel, velocity: vel, leverage: lev, construction: cw / cr, snr: o / (i + o),
        dev10x: Math.log10(lev), scaleV: Math.log10(i + o + cw + cr), costPerMillion: extra.cost ?? 1,
        efficiency: 1, opRatio: "", cascadeStr: "", nonCompounding: extra.nonCompounding ?? false,
      },
    } as LeaderboardRow["snapshot"],
    global_rank: rank,
    percentile: 0,
    telemetry: { fresh_input: i, output: o, cache_create: cw, cache_read: cr, sessions: 0, turns: 0 },
  };
}

describe("rotoPoints", () => {
  it("gives the best N and the worst 1", () => {
    expect(rotoPoints(5, [1, 2, 3, 4])).toBe(5);
    expect(rotoPoints(1, [2, 3, 4, 5])).toBe(1);
  });
  it("flips for less-is-outward axes", () => {
    expect(rotoPoints(1, [2, 3, 4, 5], -1)).toBe(5);
  });
  it("gives half a point per tie and skips missing values", () => {
    expect(rotoPoints(3, [3, 1, null, undefined])).toBe(2.5);
    expect(rotoPoints(null, [1, 2])).toBeNull();
  });
});

describe("referenceIndexes", () => {
  it("picks first, floor((first + last) / 2) and last", () => {
    expect(referenceIndexes(22)).toEqual({ first: 0, middle: 10, last: 21 });
    expect(referenceIndexes(14)).toEqual({ first: 0, middle: 6, last: 13 });
    expect(referenceIndexes(1)).toEqual({ first: 0, middle: 0, last: 0 });
    expect(referenceIndexes(0)).toBeNull();
  });
});

describe("scoreRadarField", () => {
  const rows = [
    row("c", 3, [100, 10, 50, 1000]),
    row("a", 1, [10, 100, 500, 100000]),
    row("b", 2, [50, 50, 100, 10000], { cost: 0.5 }),
  ];
  it("scores live radars among the other operators on an N-point scale", () => {
    const f = scoreRadarField(rows, "dock");
    expect(f.max).toBe(3);
    expect(f.size).toBe(3);
    expect(f.points.a).toEqual([3, 3, 3, 3, 3]);
    expect(f.points.c).toEqual([1, 1, 1, 1, 1]);
    expect(f.labels).toEqual(RADAR_KINDS.dock.map((d) => d.label));
  });
  it("draws references for the first, middle and last operator by rank", () => {
    const f = scoreRadarField(rows, "dock");
    expect(f.refs.map((r) => [r.role, r.name, r.rank])).toEqual([
      ["first", "a", 1], ["middle", "b", 2], ["last", "c", 3],
    ]);
  });
  it("scores less-is-outward axes the other way", () => {
    const f = scoreRadarField(rows, "composite");
    const cost = f.labels.indexOf("Cost per 1M");
    expect(f.points.b[cost]).toBe(3);
  });
  it("keeps non-compounding metrics missing", () => {
    const f = scoreRadarField([...rows, row("d", 4, [5, 5, 5, 5], { nonCompounding: true })], "dock");
    expect(f.points.d[0]).toBeNull();
    expect(f.points.d[2]).not.toBeNull();
  });
  it("scores the raw ring against the seed league of 100", () => {
    const f = scoreRadarField(rows, "raw");
    expect(f.pool).toBe("seed100");
    expect(f.max).toBe(101);
    for (const pts of Object.values(f.points)) {
      for (const p of pts) expect(p === null || (p >= 1 && p <= 101)).toBe(true);
    }
  });
});

describe("radarFractions", () => {
  it("maps points to 0..1 and keeps missing", () => {
    expect(radarFractions([22, 11, null], 22)).toEqual([1, 0.5, null]);
  });
});
