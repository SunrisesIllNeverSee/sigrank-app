import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DualSignatureRadar, radarPercentile } from "@/components/live/DualSignatureRadar";

describe("radar cohort percentile", () => {
  it("uses relative standing rather than absolute magnitude", () => {
    expect(radarPercentile(2, [1, 2, 3])).toBe(0.5);
    expect(radarPercentile(3, [1, 2, 3])).toBe(5 / 6);
    expect(radarPercentile(1, [1, 2, 3])).toBe(1 / 6);
    expect(radarPercentile(2e9, [1e9, 2e9, 3e9])).toBe(0.5);
    expect(radarPercentile(1, [1, 2, 3], true)).toBeCloseTo(5 / 6);
  });
  it("shares ties and excludes unavailable measurements", () => {
    expect(radarPercentile(2, [1, 2, 2, 3])).toBe(0.5);
    expect(radarPercentile(2, [2, 2, 2])).toBe(0.5);
    expect(radarPercentile(2, [1, 2, 3, null, NaN])).toBe(0.5);
    expect(radarPercentile(null, [1, 2, 3])).toBeNull();
    expect(radarPercentile(1, [1, null])).toBeNull();
  });
  it("supports two measured peers without introducing another time window", () => {
    expect(radarPercentile(1, [1, 2])).toBe(0.25);
    expect(radarPercentile(2, [1, 2])).toBe(0.75);
    expect(radarPercentile(1, [1, 2], true)).toBe(0.75);
    expect(radarPercentile(2, [1, 2], true)).toBe(0.25);
    expect(radarPercentile(2, [2, 2])).toBe(0.5);
    expect(radarPercentile(2, [null, 2, NaN])).toBeNull();
  });

});

it("overlaps raw and metrics as distinct shapes on one grid", () => {
  const html = renderToStaticMarkup(createElement(DualSignatureRadar, {
    label: "Operator",
    raw: { input: 138e6, output: 201e6, cacheRead: 50e9, cacheWrite: 2.7e9, total: 53e9, cost: 0.53 },
    operator: { snr: 0.593, velocity: 1.46, leverage: 368, dev10x: 2.57, scaleV: 10.73, efficiency: 97.18 },
    cohort: [1, 2, 3, 4, 5].map((n) => ({
      raw: { input: n * 60e6, output: n * 80e6, cacheRead: n * 12e9, cacheWrite: n * 1e9, total: n * 15e9, cost: n * 0.2 },
      metrics: { snr: n * 0.2, velocity: n, leverage: n * 150, dev10x: n, scaleV: n * 3, efficiency: n * 20 },
    })),
  }));
  expect((html.match(/role="img"/g) ?? []).length).toBe(1);
  expect(html).toContain('data-series="RAW"');
  expect(html).toContain('data-series="METRICS"');
  expect(html).toContain('fill="#22d3ee"');
  expect(html).toContain('fill="#ffcd52"');
  const shapes = [...html.matchAll(/points="([^"]+)" fill="(?:#22d3ee|#ffcd52)"/g)];
  expect(shapes).toHaveLength(2);
  expect(shapes[0][1]).not.toBe(shapes[1][1]);
});


it("renders both signatures for a two-operator window and labels the small field", () => {
  const peers = [1, 2].map(n => ({
    raw: { input: n * 100, output: n * 200, cacheRead: n * 300, cacheWrite: n * 50, total: n * 650, cost: n },
    metrics: { snr: n * 0.3, velocity: n, leverage: n * 10, dev10x: n, scaleV: n * 2, efficiency: n * 20 },
  }));
  const html = renderToStaticMarkup(createElement(DualSignatureRadar, {
    label: "Window operator", raw: peers[0].raw, operator: peers[0].metrics, cohort: peers,
  }));
  expect(html).toContain('data-series="RAW"');
  expect(html).toContain('data-series="METRICS"');
  expect(html).toContain('SMALL FIELD');
  expect(html).not.toContain('UNAVAILABLE');
});


it("keeps nonzero area when raw wins only opposite axes and all metrics trail", () => {
  const raw = { input: 20, output: 33, cacheRead: 7200, cacheWrite: 219, total: 7480, cost: 0.47 };
  const metrics = { snr: 0.615, velocity: 1.6, leverage: 348, dev10x: 2.54, scaleV: 9.87, efficiency: 90 };
  const html = renderToStaticMarkup(createElement(DualSignatureRadar, {
    label: "Lower-ranked operator", raw, operator: metrics,
    cohort: [{ raw, metrics }, {
      raw: { input: 0.08, output: 40, cacheRead: 11800, cacheWrite: 100, total: 12000, cost: 0.4 },
      metrics: { snr: 0.998, velocity: 477, leverage: 140549, dev10x: 5.15, scaleV: 10.08, efficiency: 35766 },
    }],
  }));
  const shapes = [...html.matchAll(/points="([^"]+)" fill="(?:#22d3ee|#ffcd52)"/g)];
  expect(shapes).toHaveLength(2);
  for (const shape of shapes) {
    const points = shape[1].split(" ").map(p => p.split(",").map(Number));
    const area = Math.abs(points.reduce((sum, p, i) => {
      const next = points[(i + 1) % points.length];
      return sum + p[0] * next[1] - next[0] * p[1];
    }, 0) / 2);
    expect(area).toBeGreaterThan(900);
    expect(new Set(shape[1].split(" ")).size).toBe(6);
  }
  expect(shapes[0][1]).not.toBe(shapes[1][1]);
  expect(html).toContain("MIDPOINT %ILE");
});
