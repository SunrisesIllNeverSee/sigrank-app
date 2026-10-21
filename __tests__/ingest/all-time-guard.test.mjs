/**
 * __tests__/ingest/all-time-guard.test.mjs
 *
 * Spec-lock for lib/ingest/all-time-guard.ts: an operator's all_time board row
 * never shrinks when a later scan sees less local history (owner 2026-10-21).
 * Fixture numbers mirror a real 2026-10-15 → 2026-10-21 upload pair; the
 * operator is synthetic (privacy rule: no real handles in fixtures).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decideAllTime,
  shrunkPillars,
  covers,
  sumPillars,
} from "../../lib/ingest/all-time-guard.ts";

const P = (input, output, cacheRead, cacheCreate) => ({
  input,
  output,
  cacheRead,
  cacheCreate,
});

test("first all_time upload replaces", () => {
  assert.deepEqual(
    decideAllTime({ platform: "claude", next: P(1, 2, 3, 4), previous: null }),
    { action: "replace" },
  );
});

test("growth on every pillar replaces", () => {
  assert.deepEqual(
    decideAllTime({
      platform: "claude",
      next: P(11, 12, 130, 14),
      previous: P(10, 10, 100, 10),
    }),
    { action: "replace" },
  );
});

test("an unchanged scan replaces (equal is not a shrink)", () => {
  assert.deepEqual(
    decideAllTime({
      platform: "other",
      next: P(10, 10, 100, 10),
      previous: P(10, 10, 100, 10),
    }),
    { action: "replace" },
  );
});

test("shrink on every pillar holds the previous row", () => {
  assert.deepEqual(
    decideAllTime({
      platform: "codex",
      next: P(1, 1, 10, 1),
      previous: P(10, 10, 100, 10),
    }),
    { action: "hold", shrunk: ["input", "output", "cacheRead", "cacheCreate"] },
  );
});

test("mixed pillars: one shrink holds the whole row (no pillar mixing)", () => {
  assert.deepEqual(
    decideAllTime({
      platform: "claude",
      next: P(8, 12, 120, 12),
      previous: P(10, 10, 100, 10),
    }),
    { action: "hold", shrunk: ["input"] },
  );
});

test("multi with no same-scan platform rows follows the plain rule", () => {
  const previous = P(15, 15, 150, 15);
  assert.deepEqual(
    decideAllTime({ platform: "multi", next: P(16, 16, 160, 16), previous, scanPlatformSum: null }),
    { action: "replace" },
  );
  assert.deepEqual(
    decideAllTime({ platform: "multi", next: P(14, 16, 160, 16), previous, scanPlatformSum: null }),
    { action: "hold", shrunk: ["input"] },
  );
});

test("multi that covers its scan's platform rows replaces", () => {
  assert.deepEqual(
    decideAllTime({
      platform: "multi",
      next: P(17, 17, 170, 17),
      previous: P(15, 15, 150, 15),
      scanPlatformSum: P(16, 16, 160, 16),
    }),
    { action: "replace" },
  );
});

test("multi becomes Σ platforms when a platform was held this scan", () => {
  // claude held at its previous row, codex grew → the raw multi undercounts claude.
  const claudeHeld = P(10, 10, 100, 10);
  const codexNew = P(6, 6, 60, 6);
  const claudeScanned = P(8, 12, 120, 12);
  const decision = decideAllTime({
    platform: "multi",
    next: sumPillars([claudeScanned, codexNew]),
    previous: P(15, 15, 150, 15),
    scanPlatformSum: sumPillars([claudeHeld, codexNew]),
  });
  assert.deepEqual(decision, {
    action: "platform_sum",
    pillars: P(16, 16, 160, 16),
    shrunk: ["input"],
  });
});

test("multi holds when Σ platforms would still shrink the previous multi", () => {
  const decision = decideAllTime({
    platform: "multi",
    next: P(5, 20, 200, 20),
    previous: P(15, 15, 150, 15),
    scanPlatformSum: P(6, 20, 200, 20),
  });
  assert.deepEqual(decision, { action: "hold", shrunk: ["input"] });
});

test("first multi upload behind its scan's platform rows takes Σ", () => {
  assert.deepEqual(
    decideAllTime({
      platform: "multi",
      next: P(14, 18, 180, 18),
      previous: null,
      scanPlatformSum: P(16, 16, 160, 16),
    }),
    { action: "platform_sum", pillars: P(16, 16, 160, 16), shrunk: ["input"] },
  );
});

test("helpers: shrunkPillars / covers / sumPillars", () => {
  assert.deepEqual(shrunkPillars(P(2, 2, 2, 2), P(1, 3, 2, 1)), ["input", "cacheCreate"]);
  assert.equal(covers(P(2, 2, 2, 2), P(2, 2, 2, 2)), true);
  assert.equal(covers(P(2, 2, 1, 2), P(2, 2, 2, 2)), false);
  assert.deepEqual(sumPillars([]), P(0, 0, 0, 0));
});

// ── Fixture: a 2026-10-15 → 2026-10-21 upload pair where Claude and Codex logs
// older than ~9 days disappeared between scans (synthetic operator). ──────────

const PREV = {
  claude: P(15_253_774, 24_705_080, 6_666_138_398, 236_615_433),
  codex: P(2_179_716, 3_530_279, 803_927_424, 27_782_909),
  devin: P(0, 0, 0, 0), // that day's devin scan came back empty
  other: P(1_306_870, 17_830, 2_912_979, 0),
  multi: P(135_193_829, 216_861_745, 55_701_068_499, 2_791_578_661),
};
const NEXT = {
  claude: P(901_878, 7_348_488, 2_637_272_656, 86_508_849),
  codex: P(333_396, 2_716_509, 701_908_992, 22_283_682),
  devin: P(23_226_400, 189_248_353, 48_447_104_448, 2_628_994_897),
  other: P(1_306_870, 17_830, 2_912_979, 0),
  multi: P(25_766_329, 199_332_296, 51_791_336_645, 2_737_794_286),
};

test("fixture: shrunk Claude and Codex scans are held", () => {
  for (const platform of ["claude", "codex"]) {
    assert.deepEqual(
      decideAllTime({ platform, next: NEXT[platform], previous: PREV[platform] }),
      { action: "hold", shrunk: ["input", "output", "cacheRead", "cacheCreate"] },
      platform,
    );
  }
});

test("fixture: devin (grew from an empty row) and other (unchanged) replace", () => {
  for (const platform of ["devin", "other"]) {
    assert.deepEqual(
      decideAllTime({ platform, next: NEXT[platform], previous: PREV[platform] }),
      { action: "replace" },
      platform,
    );
  }
});

test("fixture: multi is held at the previous all-time totals", () => {
  // Guarded platform rows: claude + codex held, devin + other replaced.
  const scanPlatformSum = sumPillars([PREV.claude, PREV.codex, NEXT.devin, NEXT.other]);
  const decision = decideAllTime({
    platform: "multi",
    next: NEXT.multi,
    previous: PREV.multi,
    scanPlatformSum,
  });
  // Σ guarded platforms still has less fresh input than the previous multi
  // (that day's per-platform rows didn't add up to it), so multi holds.
  assert.deepEqual(decision, {
    action: "hold",
    shrunk: ["input", "output", "cacheRead", "cacheCreate"],
  });
});
