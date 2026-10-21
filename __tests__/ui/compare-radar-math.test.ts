import { describe, it, expect } from "vitest";
import {
  percentileRank, cascadeStages, tokenMix, logScale, sqrtShare,
  compactNumber, decadeLabel, percentilesFor, COMPOSITE_METRICS, type FieldSample,
} from "@/lib/compare/radar-math";

const blank: FieldSample = {
  yield_: null, snr: null, leverage: null, velocity: null, dev10x: null, cost: null,
  efficiency: null, opRatio: null, input: null, output: null, cacheWrite: null,
  cacheRead: null, total: null,
};

describe("percentileRank", () => {
  const field = [1, 2, 3, 4, 5];
  it("puts the top at 100 and the bottom at 0", () => {
    expect(percentileRank(5, field)).toBe(100);
    expect(percentileRank(1, field)).toBe(0);
    expect(percentileRank(3, field)).toBe(50);
  });
  it("inverts for lower-is-better", () => {
    expect(percentileRank(1, field, false)).toBe(100);
    expect(percentileRank(5, field, false)).toBe(0);
  });
  it("mid-ranks ties", () => {
    expect(percentileRank(2, [2, 2, 2])).toBe(50);
  });
  it("ignores nulls in the field and returns null for missing/underfilled", () => {
    expect(percentileRank(null, field)).toBeNull();
    expect(percentileRank(3, [3, null, undefined])).toBeNull();
    expect(percentileRank(5, [1, null, 5])).toBe(100);
  });
  it("is independent of an opponent: depends only on the field", () => {
    expect(percentileRank(10, [1, 10, 100, 1e7])).toBeCloseTo(33.33, 1);
  });
});

describe("percentilesFor", () => {
  it("inverts cost and keeps missing as null", () => {
    const f: FieldSample[] = [
      { ...blank, cost: 0.5, yield_: 10 },
      { ...blank, cost: 2, yield_: 20 },
      { ...blank, cost: 1, yield_: null },
    ];
    const pts = percentilesFor(f[0], f, COMPOSITE_METRICS);
    expect(pts.find((p) => p.key === "cost")!.pct).toBe(100);
    expect(pts.find((p) => p.key === "yield_")!.pct).toBe(0);
    expect(pts.find((p) => p.key === "snr")!.pct).toBeNull();
  });
});

describe("cascadeStages", () => {
  const s = { ...blank, input: 10, output: 40, cacheWrite: 80, cacheRead: 800 };
  it("computes stages and the telescope", () => {
    const c = cascadeStages(s);
    expect(c.transmission).toBe(4);
    expect(c.commitment).toBe(2);
    expect(c.reuse).toBe(10);
    expect(c.leverage).toBe(80);
    expect(c.transmission! * c.commitment! * c.reuse!).toBeCloseTo(c.leverage!);
    expect(c.yield_).toBe(320); // cr*out/in^2 = 800*40/100
    expect(c.yield_).toBeCloseTo((800 * 40) / 100);
  });
  it("is null where a pillar is missing or zero", () => {
    const c = cascadeStages({ ...s, cacheWrite: 0 });
    expect(c.commitment).toBeNull();
    expect(c.reuse).toBeNull();
    expect(c.leverage).toBe(80);
    expect(cascadeStages({ ...s, input: null }).yield_).toBeNull();
  });
});

describe("tokenMix", () => {
  it("sums to 100", () => {
    const m = tokenMix({ ...blank, input: 1, output: 2, cacheWrite: 3, cacheRead: 4 })!;
    expect(m.input + m.output + m.cacheWrite + m.cacheRead).toBeCloseTo(100);
    expect(m.cacheRead).toBe(40);
  });
  it("is null when any pillar is missing or total is 0", () => {
    expect(tokenMix({ ...blank, input: 1, output: 1, cacheWrite: null, cacheRead: 1 })).toBeNull();
    expect(tokenMix({ ...blank, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 })).toBeNull();
  });
});

describe("scales and formatting", () => {
  it("logScale snaps to decades and projects 0..1", () => {
    const s = logScale([3, 450, null, 9000]);
    expect(s.loExp).toBe(0);
    expect(s.hiExp).toBe(4);
    expect(s.project(1)).toBe(0);
    expect(s.project(100)).toBeCloseTo(0.5);
    expect(s.project(0)).toBeNull();
    expect(s.project(null)).toBeNull();
  });
  it("logScale handles sub-1 values, empty input and wide spans", () => {
    expect(logScale([0.02, 0.5]).loExp).toBe(-2);
    expect(logScale([]).ticks.length).toBeGreaterThan(1);
    const wide = logScale([0.5, 6e7]);
    expect(wide.ticks.at(-1)).toBe(wide.hiExp);
    expect((wide.hiExp - wide.loExp) % 2).toBe(0);
  });
  it("sqrtShare keeps small slices visible", () => {
    expect(sqrtShare(100)).toBe(1);
    expect(sqrtShare(1)).toBeCloseTo(0.1);
    expect(sqrtShare(null)).toBeNull();
  });
  it("compactNumber / decadeLabel", () => {
    expect(compactNumber(64_332_300)).toBe("64.3M");
    expect(compactNumber(15_500)).toBe("15.5K");
    expect(compactNumber(130_000)).toBe("130K");
    expect(compactNumber(7.74)).toBe("7.74");
    expect(compactNumber(null)).toBe("—");
    expect(decadeLabel(3)).toBe("1K");
    expect(decadeLabel(8)).toBe("100M");
    expect(decadeLabel(0)).toBe("1");
    expect(decadeLabel(-1)).toBe("0.1");
  });
});
