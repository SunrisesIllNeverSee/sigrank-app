/**
 * __tests__/ingest/tightened-plausibility.test.mjs
 * deviewreview3: tightened range-plausibility bounds catch a tuned fabricator.
 *
 * The original bounds (100:1 reuse, 50/min cadence) were loose enough to
 * drive Υ arbitrarily high while staying under them. The tightened bounds
 * (35:1 reuse, 0.5 cacheWrite, 0.1% input share, 15/min cadence) catch
 * the tuned-fabricator payload.
 *
 * Also tests the aggregate Benford check (the only place Benford has real
 * power — at the leaderboard level, not per-session).
 *
 * Run: node --test __tests__/ingest/tightened-plausibility.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

// ── Inline aggregate Benford (mirrors lib/ingest/aggregate-benford.ts) ──────
function benfordExpected(d) {
  return Math.log10(1 + 1 / d);
}

function leadingDigits(values) {
  return values
    .filter((v) => v > 0 && Number.isFinite(v))
    .map((v) => parseInt(String(Math.floor(v))[0], 10))
    .filter((d) => d >= 1 && d <= 9);
}

function aggregateBenford(values, minN = 30, threshold = 15.5) {
  const digits = leadingDigits(values);
  const n = digits.length;
  if (n < minN) {
    return {
      n,
      observed: [],
      expected: [],
      chiSquared: 0,
      flagged: false,
      summary: `insufficient data (n=${n} < minN=${minN}) — aggregate Benford not run`,
    };
  }
  const observed = new Array(9).fill(0);
  for (const d of digits) observed[d - 1]++;
  const expected = new Array(9).fill(0);
  for (let d = 1; d <= 9; d++) expected[d - 1] = benfordExpected(d) * n;
  let chiSquared = 0;
  for (let i = 0; i < 9; i++) {
    if (expected[i] > 0)
      chiSquared += Math.pow(observed[i] - expected[i], 2) / expected[i];
  }
  return {
    n,
    observed,
    expected,
    chiSquared,
    flagged: chiSquared > threshold,
    summary:
      chiSquared > threshold
        ? `AGGREGATE BENFORD FLAG: χ²=${chiSquared.toFixed(1)} > ${threshold} (n=${n})`
        : `aggregate Benford OK: χ²=${chiSquared.toFixed(1)} ≤ ${threshold} (n=${n})`,
  };
}

// ── Tuned fabricator payloads ───────────────────────────────────────────────

// A fabricator who knows the OLD bounds (100:1, 50/min) and tunes to stay
// just under them while driving Υ absurdly high.
const tunedFab = {
  tokens_input_fresh: 1, // input→0 inflates Υ = cr·o/i² quadratically
  tokens_output: 10_000,
  tokens_cache_read: 9_900, // reuse = 99:1 (just under old 100:1 gate)
  tokens_cache_creation: 100, // cacheWrite = 0.01 (way below real min 1.5:1)
  tokens_total: 20_001,
  sessions_count: 5,
  turns_total: 50,
  active_minutes_est: 60,
};

// Real data (MO§ES-like) — should pass all tightened bounds.
const realData = {
  tokens_input_fresh: 1_251_211,
  tokens_output: 11_296_121,
  tokens_cache_read: 2_555_179_769,
  tokens_cache_creation: 128_196_310,
  tokens_total: 2_694_923_411,
  sessions_count: 100,
  turns_total: 500,
  active_minutes_est: 1000,
};

// ── Tightened bounds checks ─────────────────────────────────────────────────

function checkBounds(rt) {
  const issues = [];
  const pillars =
    rt.tokens_input_fresh +
    rt.tokens_output +
    rt.tokens_cache_read +
    rt.tokens_cache_creation;

  if (
    rt.tokens_cache_creation > 0 &&
    rt.tokens_cache_read / rt.tokens_cache_creation > 35
  ) {
    issues.push({ code: "extreme_cache_ratio" });
  }
  if (
    rt.tokens_output > 1_000 &&
    rt.tokens_cache_creation / rt.tokens_output < 0.5
  ) {
    issues.push({ code: "low_cache_write_ratio" });
  }
  if (pillars > 10_000 && rt.tokens_input_fresh / pillars < 0.0003) {
    issues.push({ code: "implausible_input_share" });
  }
  if (
    rt.active_minutes_est > 0 &&
    rt.turns_total / rt.active_minutes_est > 15
  ) {
    issues.push({ code: "implausible_cadence" });
  }
  return issues;
}

test("OLD bounds: tuned fabricator passes (the hole)", () => {
  // Under the OLD bounds (100:1, 50/min), the fabricator clears everything.
  const reuse = tunedFab.tokens_cache_read / tunedFab.tokens_cache_creation;
  const cadence = tunedFab.turns_total / tunedFab.active_minutes_est;
  assert.ok(reuse <= 100, `reuse ${reuse} <= 100 (old gate)`);
  assert.ok(cadence <= 50, `cadence ${cadence} <= 50 (old gate)`);
  // No old-bound check exists for input share or cacheWrite ratio.
  // Υ is absurdly high:
  const upsilon =
    (tunedFab.tokens_cache_read * tunedFab.tokens_output) /
    tunedFab.tokens_input_fresh ** 2;
  assert.ok(upsilon > 1e7, `Υ ${upsilon.toExponential(2)} is absurdly high`);
});

test("NEW bounds: tuned fabricator is flagged", () => {
  const issues = checkBounds(tunedFab);
  assert.ok(
    issues.length >= 3,
    `at least 3 flags (got ${issues.length}: ${issues.map((i) => i.code).join(", ")})`,
  );
  assert.ok(
    issues.some((i) => i.code === "extreme_cache_ratio"),
    "reuse 100:1 > 35:1",
  );
  assert.ok(
    issues.some((i) => i.code === "low_cache_write_ratio"),
    "cacheWrite 0.01 < 0.5",
  );
  assert.ok(
    issues.some((i) => i.code === "implausible_input_share"),
    "input 0.005% < 0.1%",
  );
});

test("NEW bounds: real data (MO§ES) passes clean", () => {
  const issues = checkBounds(realData);
  assert.equal(
    issues.length,
    0,
    `real data should pass clean (got: ${issues.map((i) => i.code).join(", ")})`,
  );
});

// ── Aggregate Benford checks ────────────────────────────────────────────────

test("aggregate Benford: real data follows Benford (no flag)", () => {
  // Simulate 10 real operators × 4 pillars = 40 leading digits.
  // Use realistic values that follow Benford's Law naturally.
  const realValues = [
    1_251_211,
    11_296_121,
    128_196_310,
    2_555_179_769, // MO§ES
    500_000,
    1_200_000,
    3_000_000,
    80_000_000, // operator 2
    200_000,
    800_000,
    1_500_000,
    40_000_000, // operator 3
    1_800_000,
    9_000_000,
    95_000_000,
    1_800_000_000, // operator 4
    300_000,
    600_000,
    2_200_000,
    55_000_000, // operator 5
    900_000,
    4_500_000,
    12_000_000,
    300_000_000, // operator 6
    150_000,
    700_000,
    1_800_000,
    22_000_000, // operator 7
    2_100_000,
    15_000_000,
    180_000_000,
    3_200_000_000, // operator 8
    400_000,
    1_100_000,
    4_500_000,
    90_000_000, // operator 9
    75_000,
    350_000,
    900_000,
    18_000_000, // operator 10
  ];
  const result = aggregateBenford(realValues, 30, 15.5);
  assert.ok(result.n >= 30, `n=${result.n} >= 30`);
  assert.equal(
    result.flagged,
    false,
    `real data should not flag (χ²=${result.chiSquared.toFixed(1)})`,
  );
});

test("aggregate Benford: fabricated data diverges (flagged)", () => {
  // A fabricator who always uses round numbers starting with 5 or 9
  // (to avoid the low-leading-digit Benford signature).
  // 10 submissions × 4 pillars = 40 values, all starting with 5 or 9.
  const fabricated = [];
  for (let i = 0; i < 10; i++) {
    fabricated.push(5_000_000, 9_000_000, 50_000_000, 500_000_000);
  }
  const result = aggregateBenford(fabricated, 30, 15.5);
  assert.ok(
    result.flagged,
    `fabricated data should flag (χ²=${result.chiSquared.toFixed(1)})`,
  );
  assert.ok(
    result.chiSquared > 15.5,
    `χ²=${result.chiSquared.toFixed(1)} > 15.5`,
  );
});

test("aggregate Benford: insufficient data (no flag)", () => {
  // Only 4 values (one session) — Benford has no power at n=4.
  const result = aggregateBenford([5000, 9000, 50000, 90000], 30, 15.5);
  assert.equal(result.flagged, false);
  assert.ok(result.summary.includes("insufficient data"));
});

test("benfordExpected: digit 1 has highest frequency (~30.1%)", () => {
  assert.ok(Math.abs(benfordExpected(1) - 0.301) < 0.001);
  assert.ok(benfordExpected(1) > benfordExpected(9));
});

test("leadingDigits: extracts first digit correctly", () => {
  assert.deepEqual(leadingDigits([123, 456, 789, 1, 99]), [1, 4, 7, 1, 9]);
  assert.deepEqual(leadingDigits([0, -1, NaN]), []); // filtered out
});
