import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DualSignatureRadar, radarPercentile } from "@/components/live/DualSignatureRadar";

describe("radar cohort percentile", () => {
  it("uses relative standing rather than absolute magnitude", () => {
    expect(radarPercentile(2, [1, 2, 3])).toBe(0.5);
    expect(radarPercentile(3, [1, 2, 3])).toBe(1);
    expect(radarPercentile(1, [1, 2, 3])).toBe(0);
    expect(radarPercentile(2e9, [1e9, 2e9, 3e9])).toBe(0.5);
    expect(radarPercentile(1, [1, 2, 3], true)).toBe(1);
  });
  it("shares ties and excludes unavailable measurements", () => {
    expect(radarPercentile(2, [1, 2, 2, 3])).toBe(0.5);
    expect(radarPercentile(2, [2, 2, 2])).toBe(0.5);
    expect(radarPercentile(2, [1, 2, 3, null, NaN])).toBe(0.5);
    expect(radarPercentile(null, [1, 2, 3])).toBeNull();
    expect(radarPercentile(1, [1, null])).toBeNull();
  });
  it("supports two measured peers without introducing another time window", () => {
    expect(radarPercentile(1, [1, 2])).toBe(0);
    expect(radarPercentile(2, [1, 2])).toBe(1);
    expect(radarPercentile(1, [1, 2], true)).toBe(1);
    expect(radarPercentile(2, [1, 2], true)).toBe(0);
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
