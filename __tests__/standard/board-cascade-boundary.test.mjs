import test from "node:test";
import assert from "node:assert/strict";

import { computeCascadeMetrics } from "../../lib/analytics/cascade.ts";
import { cascade } from "token-cascade";

function close(actual, expected, tolerance, label) {
  assert.notEqual(expected, null, `${label}: canonical value unexpectedly null`);
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: local=${actual} canonical=${expected} tolerance=${tolerance}`,
  );
}

test("board/read-time cascade agrees with TTEOP facade on positive-domain core metrics", () => {
  const vectors = [
    { input: 1_251_211, output: 11_296_121, cacheCreate: 128_196_310, cacheRead: 2_555_179_769 },
    { input: 1_000, output: 5_000, cacheCreate: 500, cacheRead: 3_000 },
    { input: 125, output: 77, cacheCreate: 40, cacheRead: 900 },
  ];

  for (const p of vectors) {
    const local = computeCascadeMetrics(p);
    const canonical = cascade(p.input, p.output, p.cacheCreate, p.cacheRead);

    // The board path intentionally keeps unrounded display precision; token-cascade
    // applies TTEOP canonical rounding. Compare within half of each canonical unit.
    close(local.yield_, canonical.yield, 0.005, "yield");
    close(local.leverage, canonical.leverage, 0.05, "leverage");
    close(local.velocity, canonical.velocity, 0.0005, "velocity");
    close(local.snr, canonical.snr, 0.00005, "snr");
    close(local.dev10x, canonical.dev10x, 0.005, "dev10x");
  }
});

test("board/read-time 10xDEV preserves TTEOP all-four-pillars gate", () => {
  const local = computeCascadeMetrics({
    input: 100,
    output: 50,
    cacheCreate: 0,
    cacheRead: 200,
  });
  const canonical = cascade(100, 50, 0, 200);

  assert.equal(local.nonCompounding, true);
  assert.equal(local.dev10x, null);
  assert.equal(canonical.dev10x, null);
});
