import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DualSignatureRadar, radarPosition } from "@/components/live/DualSignatureRadar";

const facts = {
  label: "Example operator",
  raw: { input: 13e6, output: 23e6, cacheRead: 5.9e9, cacheWrite: 170e6, total: 6.1e9, cost: 0.46 },
  operator: { snr: 0.64, velocity: 1.78, leverage: 448, dev10x: 2.65, scaleV: 9.79, efficiency: 115.62 },
};
const render = (props: Parameters<typeof DualSignatureRadar>[0] = facts) => renderToStaticMarkup(createElement(DualSignatureRadar, props));
const shapes = (html: string) => [...html.matchAll(/points="([^"]+)" fill="(?:#22d3ee|#ffcd52)"/g)].map(m => m[1]);

describe("personal stat radar", () => {
  it("positions measurements against fixed display ranges, never peer ranks", () => {
    expect(radarPosition(0.64, 1)).toBe(0.64);
    expect(radarPosition(1.78, 50)).toBeCloseTo(0.0356);
    expect(radarPosition(0.46, 10)).toBeCloseTo(0.046);
    expect(radarPosition(1e6, 1e12, true)).toBeCloseTo(0.5);
    expect(radarPosition(1e9, 1e12, true)).toBeCloseTo(0.75);
  });
  it("keeps measured zero separate from unavailable values", () => {
    expect(radarPosition(0, 1)).toBe(0);
    for (const value of [null, NaN, Infinity, -1]) expect(radarPosition(value, 1)).toBeNull();
    expect(radarPosition(1, 0)).toBeNull();
  });
  it("renders overlapping distinct signatures without any field data", () => {
    const html = render();
    const p = shapes(html);
    expect(p).toHaveLength(2);
    expect(p[0]).not.toBe(p[1]);
    expect(html).toContain("SNR 64.0%");
    expect(html).toContain("OUTPUT 23.0M");
    expect(html).toContain("FIXED AXES");
    expect(html).not.toContain("percentile radar");
    expect(html).not.toContain("SMALL FIELD");
  });
  it("does not change geometry with unrelated operators or window labels", () => {
    const before = { ...facts, cohort: [], window: "all_time" };
    const after = { ...facts, cohort: [{ extreme: 1e20 }], window: "7d" };
    expect(shapes(render(before))).toEqual(shapes(render(after)));
  });
  it("changes the corresponding metric vertex when that user's stat changes", () => {
    const before = shapes(render());
    const after = shapes(render({ ...facts, operator: { ...facts.operator, velocity: 10 } }));
    expect(after[0]).toBe(before[0]);
    const changed = before[1].split(" ").map((p, i) => p !== after[1].split(" ")[i]);
    expect(changed).toEqual([false, true, false, false, false, false]);
  });
  it("marks capped points while keeping exact measurements accessible", () => {
    const html = render();
    expect(radarPosition(448, 200)).toBe(1);
    expect(html).toContain("LEVERAGE: 448");
    expect(html).toContain("exceeds display range; exact value preserved");
    expect(html).toContain('stroke="#ffffff"');
  });
  it("does not fabricate a complete shape when a measurement is missing", () => {
    const html = render({ ...facts, raw: { ...facts.raw, output: null } });
    expect(shapes(html)).toHaveLength(1);
    expect(html).toContain("RAW UNAVAILABLE");
    expect(html).toContain("OUTPUT —");
  });
});
