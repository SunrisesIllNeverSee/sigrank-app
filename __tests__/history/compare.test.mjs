/**
 * __tests__/history/compare.test.mjs — historical-only compare helper.
 *
 *   node --experimental-strip-types --test __tests__/history/compare.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compareEntries } from "../../lib/history/compare.ts";

const rows = JSON.parse(readFileSync("data/history/board-all_time-2026-07-31.json", "utf8")).entries;
const byRank = (r) => rows.find((e) => e.rank === r);
const nullYield = rows.find((e) => e.yield_ === null);
const KEYS = ["totalTokens", "yield_", "snr", "velocity", "leverage", "dev10x", "efficiency", "costPerMillion"];

test("higher value wins per metric", () => {
  const out = compareEntries(byRank(1), byRank(2), KEYS);
  const y = out.find((r) => r.key === "yield_");
  assert.deepEqual(y, { key: "yield_", a: byRank(1).yield_, b: byRank(2).yield_, higher: "a" });
  assert.equal(out.length, KEYS.length);
});

test("a null on either side is not compared", () => {
  const y = compareEntries(nullYield, byRank(1), KEYS).find((r) => r.key === "yield_");
  assert.equal(y.a, null);
  assert.equal(y.higher, null);
});

test("an entry against itself ties on every non-null metric", () => {
  for (const r of compareEntries(byRank(5), byRank(5), KEYS)) {
    assert.equal(r.higher, r.a == null ? null : "tie");
  }
});
