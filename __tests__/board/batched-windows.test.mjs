/**
 * __tests__/board/batched-windows.test.mjs
 *
 * Unit tests for the submission-based batch tracking model.
 * Tests the pure computation (computeBatchedWindowsFromRows) — no Supabase.
 *
 * Model:
 *   B0 = first submission's all-time pillars (baseline)
 *   D_n = max(0, S_n - S_{n-1}) per pillar (delta — never negative)
 *   90d = sum of batches <=90 days old
 *   all = B0 + D1 + D2 + ... (never decreases)
 *
 *   node --test __tests__/board/batched-windows.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ---- Inline mirror of lib/board/batched-windows.ts (pure functions) ----

const ZERO = { input: 0, output: 0, cacheCreate: 0, cacheRead: 0 };

function maxDelta(prev, curr) {
  return {
    input: Math.max(0, curr.input - prev.input),
    output: Math.max(0, curr.output - prev.output),
    cacheCreate: Math.max(0, curr.cacheCreate - prev.cacheCreate),
    cacheRead: Math.max(0, curr.cacheRead - prev.cacheRead),
  };
}

function addPillars(a, b) {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheCreate: a.cacheCreate + b.cacheCreate,
    cacheRead: a.cacheRead + b.cacheRead,
  };
}

function daysBetween(fromIso, toMs) {
  return Math.floor((toMs - new Date(fromIso).getTime()) / 86400000);
}

function computeBatchedWindowsFromRows(rows, nowMs = Date.now()) {
  if (rows.length === 0) return null;

  const byPlatform = new Map();
  for (const row of rows) {
    const platform = row.payload_json?.platform?.primary ?? "other";
    const arr = byPlatform.get(platform);
    if (arr) arr.push(row);
    else byPlatform.set(platform, [row]);
  }

  const perPlatform = {};
  let combined90d = { ...ZERO };
  let combinedAll = { ...ZERO };

  for (const [platform, platformRows] of byPlatform) {
    const batches = [];
    let prev = null;

    for (const row of platformRows) {
      const pillars = {
        input: row.input_tokens ?? 0,
        output: row.output_tokens ?? 0,
        cacheCreate: row.cache_creation_tokens ?? 0,
        cacheRead: row.cache_read_tokens ?? 0,
      };

      if (prev === null) {
        batches.push({
          date: row.submitted_at,
          type: "baseline",
          pillars,
          ageDays: daysBetween(row.submitted_at, nowMs),
        });
      } else {
        const delta = maxDelta(prev, pillars);
        batches.push({
          date: row.submitted_at,
          type: "delta",
          pillars: delta,
          ageDays: daysBetween(row.submitted_at, nowMs),
        });
      }
      prev = pillars;
    }

    let p90d = { ...ZERO };
    let pAll = { ...ZERO };
    for (const batch of batches) {
      pAll = addPillars(pAll, batch.pillars);
      if (batch.ageDays <= 90) p90d = addPillars(p90d, batch.pillars);
    }

    const baselineBatch = batches.find((b) => b.type === "baseline");
    perPlatform[platform] = {
      "90d": p90d,
      all: pAll,
      batches,
      submissionCount: platformRows.length,
      baselineDate: baselineBatch?.date ?? null,
    };

    combined90d = addPillars(combined90d, p90d);
    combinedAll = addPillars(combinedAll, pAll);
  }

  return {
    perPlatform,
    combined: { "90d": combined90d, all: combinedAll },
  };
}

// ---- Helpers ----

const DAY = 86400000;
const T0 = new Date("2026-01-01T00:00:00Z").getTime();

function mkRow(date, pillars, platform = "claude") {
  return {
    submitted_at: date,
    window_type: "all_time",
    input_tokens: pillars.input,
    output_tokens: pillars.output,
    cache_creation_tokens: pillars.cacheCreate,
    cache_read_tokens: pillars.cacheRead,
    payload_json: { platform: { primary: platform } },
  };
}

const P50M = { input: 40_000_000, output: 5_000_000, cacheCreate: 8_000_000, cacheRead: 2_000_000 };
const P55M = { input: 44_000_000, output: 6_000_000, cacheCreate: 10_000_000, cacheRead: 3_000_000 };
const P60M = { input: 48_000_000, output: 7_000_000, cacheCreate: 12_000_000, cacheRead: 4_000_000 };
const P65M = { input: 52_000_000, output: 8_000_000, cacheCreate: 14_000_000, cacheRead: 5_000_000 };
const P75M = { input: 60_000_000, output: 10_000_000, cacheCreate: 20_000_000, cacheRead: 8_000_000 };

// ── Tests ───────────────────────────────────────────────────────────────────

test("empty rows → null", () => {
  assert.equal(computeBatchedWindowsFromRows([]), null);
});

test("single submission → baseline = all-time, 90d = all if age <=90", () => {
  const rows = [mkRow("2026-01-01T00:00:00Z", P50M)];
  const result = computeBatchedWindowsFromRows(rows, T0 + 30 * DAY);
  assert.ok(result);
  assert.deepEqual(result.perPlatform.claude.all, P50M);
  assert.deepEqual(result.perPlatform.claude["90d"], P50M);
  assert.equal(result.perPlatform.claude.submissionCount, 1);
  assert.equal(result.perPlatform.claude.baselineDate, "2026-01-01T00:00:00Z");
});

test("two submissions → delta = difference, all = baseline + delta", () => {
  const rows = [
    mkRow("2026-01-01T00:00:00Z", P50M),
    mkRow("2026-01-31T00:00:00Z", P60M),
  ];
  const result = computeBatchedWindowsFromRows(rows, T0 + 60 * DAY);
  assert.ok(result);

  const claude = result.perPlatform.claude;
  assert.equal(claude.submissionCount, 2);
  assert.equal(claude.batches[0].type, "baseline");
  assert.equal(claude.batches[1].type, "delta");

  // Delta = P60M - P50M per pillar
  const expectedDelta = {
    input: 8_000_000,
    output: 2_000_000,
    cacheCreate: 4_000_000,
    cacheRead: 2_000_000,
  };
  assert.deepEqual(claude.batches[1].pillars, expectedDelta);

  // all = baseline + delta = P60M
  assert.deepEqual(claude.all, P60M);

  // 90d = both batches (30d and 60d old, both <=90)
  assert.deepEqual(claude["90d"], P60M);
});

test("file deletion → delta = 0, all-time preserved", () => {
  // Day 0: 50M. Day 30: 60M. Day 60: 55M (files deleted — total went DOWN).
  const rows = [
    mkRow("2026-01-01T00:00:00Z", P50M),
    mkRow("2026-01-31T00:00:00Z", P60M),
    mkRow("2026-03-01T00:00:00Z", P55M),
  ];
  const result = computeBatchedWindowsFromRows(rows, T0 + 95 * DAY);
  assert.ok(result);

  const claude = result.perPlatform.claude;
  // Delta 2 = max(0, P55M - P60M) = 0 for all pillars that decreased
  assert.deepEqual(claude.batches[2].pillars, {
    input: 0,
    output: 0,
    cacheCreate: 0,
    cacheRead: 0,
  });

  // all = P50M + (P60M-P50M) + 0 = P60M (preserved — didn't shrink to P55M)
  assert.deepEqual(claude.all, P60M);
});

test("baseline expires from 90d after 90 days", () => {
  const rows = [
    mkRow("2026-01-01T00:00:00Z", P50M),  // baseline, day 0
    mkRow("2026-01-31T00:00:00Z", P60M),  // delta 1, day 30
    mkRow("2026-03-01T00:00:00Z", P75M),  // delta 2, day 60
  ];
  // Query at day 95 — baseline is 95 days old → expired from 90d
  const result = computeBatchedWindowsFromRows(rows, T0 + 95 * DAY);
  assert.ok(result);

  const claude = result.perPlatform.claude;
  // all = P50M + D1 + D2 = P75M
  assert.deepEqual(claude.all, P75M);

  // 90d = D1 (65 days old ✓) + D2 (35 days old ✓) — baseline expired
  const d1 = { input: 8_000_000, output: 2_000_000, cacheCreate: 4_000_000, cacheRead: 2_000_000 };
  const d2 = { input: 12_000_000, output: 3_000_000, cacheCreate: 8_000_000, cacheRead: 4_000_000 };
  assert.deepEqual(claude["90d"], addPillars(d1, d2));
});

test("multiple platforms → per-platform + combined", () => {
  const rows = [
    mkRow("2026-01-01T00:00:00Z", P50M, "claude"),
    mkRow("2026-01-01T00:00:00Z", { input: 10_000_000, output: 1_000_000, cacheCreate: 2_000_000, cacheRead: 500_000 }, "codex"),
  ];
  const result = computeBatchedWindowsFromRows(rows, T0 + 30 * DAY);
  assert.ok(result);

  assert.ok(result.perPlatform.claude);
  assert.ok(result.perPlatform.codex);

  // Combined = sum of both platforms
  assert.deepEqual(result.combined.all, {
    input: 50_000_000,
    output: 6_000_000,
    cacheCreate: 10_000_000,
    cacheRead: 2_500_000,
  });
});

test("combined 90d = sum of all platforms' 90d", () => {
  const rows = [
    mkRow("2026-01-01T00:00:00Z", P50M, "claude"),
    mkRow("2026-01-31T00:00:00Z", P60M, "claude"),
    mkRow("2026-01-15T00:00:00Z", { input: 5_000_000, output: 500_000, cacheCreate: 1_000_000, cacheRead: 100_000 }, "codex"),
  ];
  // Query at day 60
  const result = computeBatchedWindowsFromRows(rows, T0 + 60 * DAY);
  assert.ok(result);

  const claude90d = result.perPlatform.claude["90d"];
  const codex90d = result.perPlatform.codex["90d"];
  assert.deepEqual(result.combined["90d"], addPillars(claude90d, codex90d));
});

test("all-time never decreases across many submissions with deletions", () => {
  // Simulate: submit every 30 days for a year, with file deletions
  const rows = [
    mkRow("2026-01-01T00:00:00Z", P50M),  // baseline
    mkRow("2026-01-31T00:00:00Z", P60M),  // +10M delta
    mkRow("2026-03-01T00:00:00Z", P55M),  // files deleted → delta=0
    mkRow("2026-03-31T00:00:00Z", P65M),  // +10M new delta
    mkRow("2026-05-01T00:00:00Z", P60M),  // files deleted → delta=0
    mkRow("2026-05-31T00:00:00Z", P75M),  // +15M new delta
  ];
  const result = computeBatchedWindowsFromRows(rows, T0 + 365 * DAY);
  assert.ok(result);

  const claude = result.perPlatform.claude;
  // Deltas (max(0, curr-prev) per pillar):
  //   D1 = max(0, P60M-P50M) = {8M, 2M, 4M, 2M}
  //   D2 = max(0, P55M-P60M) = {0, 0, 0, 0}  (deletion → zero delta)
  //   D3 = max(0, P65M-P55M) = {8M, 2M, 4M, 2M}  (new work after deletion)
  //   D4 = max(0, P60M-P65M) = {0, 0, 0, 0}  (another deletion)
  //   D5 = max(0, P75M-P60M) = {12M, 3M, 8M, 4M}
  //
  // all = P50M + D1 + 0 + D3 + 0 + D5
  //     = {40+8+0+8+0+12, 5+2+0+2+0+3, 8+4+0+4+0+8, 2+2+0+2+0+4}
  //     = {68M, 12M, 24M, 10M}
  //
  // KEY: this is MORE than the latest on-disk total (P75M = {60M,10M,20M,8M})
  // because the batch model preserves tokens from deleted files.
  // The on-disk total lost ~15M to deletions; the batch model kept them.
  assert.deepEqual(claude.all, {
    input: 68_000_000,
    output: 12_000_000,
    cacheCreate: 24_000_000,
    cacheRead: 10_000_000,
  });
  assert.equal(claude.submissionCount, 6);
});

test("unknown platform defaults to 'other'", () => {
  const rows = [{
    submitted_at: "2026-01-01T00:00:00Z",
    window_type: "all_time",
    input_tokens: 1000,
    output_tokens: 100,
    cache_creation_tokens: 200,
    cache_read_tokens: 50,
    payload_json: null,  // no platform info
  }];
  const result = computeBatchedWindowsFromRows(rows, T0 + 30 * DAY);
  assert.ok(result);
  assert.ok(result.perPlatform.other);
});

test("batch ageDays computed correctly", () => {
  const rows = [mkRow("2026-01-01T00:00:00Z", P50M)];
  const result = computeBatchedWindowsFromRows(rows, T0 + 45 * DAY);
  assert.ok(result);
  assert.equal(result.perPlatform.claude.batches[0].ageDays, 45);
});
