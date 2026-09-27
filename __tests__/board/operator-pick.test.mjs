/**
 * __tests__/board/operator-pick.test.mjs
 *
 * Lock tests for the deterministic snapshot pick (lib/board/mappers.ts
 * pickPerKey — consumed by operatorTotalCollapse / latestPerOperator /
 * latestPerOperatorPlatform). Mirrors the pure logic in JS — the same
 * discipline windows.test.mjs uses (no TypeScript path aliases). If the
 * ladder changes, update this mirror in lockstep.
 *
 * Bug under test (2026-09-27): an upload stamps every window_type × platform
 * row with the SAME snapshot_date. ORDER BY snapshot_date DESC leaves those
 * rows in a same-date tie Postgres resolves arbitrarily — /board/all rendered
 * MO§ES™'s 7d multi row (input 1.5M) instead of all_time multi (116.8M), and
 * his profile landed on 90d. The ladder: preferWindow+multi > preferWindow >
 * any-window multi > latest any; same-date same-bucket ties break on
 * metric_snapshot_id — a TOTAL order independent of input order.
 *
 *   node --test __tests__/board/operator-pick.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ---- Inline mirror of lib/board/mappers.ts pickPerKey (keep in sync) ----
function pickPerKey(rows, keyOf, preferWindow) {
  const buckets = new Map();
  const better = (r, cur) =>
    !cur ||
    r.snapshot_date > cur.snapshot_date ||
    (r.snapshot_date === cur.snapshot_date &&
      (r.metric_snapshot_id ?? "") > (cur.metric_snapshot_id ?? ""));
  for (const r of rows) {
    const key = keyOf(r);
    let b = buckets.get(key);
    if (!b) {
      b = [undefined, undefined, undefined, undefined];
      buckets.set(key, b);
    }
    const i =
      (preferWindow != null && r.window_type === preferWindow ? 0 : 2) +
      (r.platform === "multi" ? 0 : 1);
    if (better(r, b[i])) b[i] = r;
  }
  const out = new Map();
  for (const [key, b] of buckets) {
    const pick = b[0] ?? b[1] ?? b[2] ?? b[3];
    if (pick) out.set(key, pick);
  }
  return out;
}
const collapse = (rows, preferWindow) =>
  pickPerKey(rows, (r) => r.operator_id, preferWindow);
// ---- end mirror ----

const snap = (op, window, platform, date, id) => ({
  operator_id: op,
  window_type: window,
  platform,
  snapshot_date: date,
  metric_snapshot_id: id,
});

// The real MO§ES™ 2026-09-26 corpus shape: 4 windows × multi, all one date.
const MOSES_SAME_DATE = [
  snap("m", "all_time", "multi", "2026-09-26", "id-at"),
  snap("m", "90d", "multi", "2026-09-26", "id-90"),
  snap("m", "7d", "multi", "2026-09-26", "id-7"),
  snap("m", "30d", "multi", "2026-09-26", "id-30"),
];

test("all-time board picks the all_time row — regardless of tie order", () => {
  // Every possible arrival order must land on the same row.
  for (const rows of [
    MOSES_SAME_DATE,
    [...MOSES_SAME_DATE].reverse(),
    [MOSES_SAME_DATE[2], MOSES_SAME_DATE[0], MOSES_SAME_DATE[3], MOSES_SAME_DATE[1]],
  ]) {
    const pick = collapse(rows, "all_time").get("m");
    assert.equal(pick.window_type, "all_time");
  }
});

test("preferWindow beats a NEWER row in another window", () => {
  // An all_time row from last week must outrank today's 7d row on /board/all —
  // 'all' is the lifetime accumulation, not 'whatever snapshot is newest'.
  const rows = [
    snap("m", "7d", "multi", "2026-09-26", "id-new"),
    snap("m", "all_time", "multi", "2026-09-09", "id-old"),
  ];
  assert.equal(collapse(rows, "all_time").get("m").snapshot_date, "2026-09-09");
});

test("operator with NO preferWindow row falls back to latest multi", () => {
  const rows = [
    snap("m", "7d", "multi", "2026-09-26", "id-a"),
    snap("m", "30d", "claude", "2026-09-20", "id-b"),
  ];
  const pick = collapse(rows, "all_time").get("m");
  assert.equal(pick.window_type, "7d"); // freshest multi wins the fallback
});

test("preferWindow single-platform beats another window's multi total", () => {
  // all_time+codex (their lifetime on codex) outranks 7d+multi on the all board.
  const rows = [
    snap("m", "7d", "multi", "2026-09-26", "id-a"),
    snap("m", "all_time", "codex", "2026-09-26", "id-b"),
  ];
  assert.equal(collapse(rows, "all_time").get("m").platform, "codex");
});

test("no preferWindow: 'multi' preferred over a same-date platform row", () => {
  // The legacy API path: same-date all_time codex vs all_time multi —
  // multi IS the operator's total, it must win deterministically.
  const rows = [
    snap("m", "all_time", "codex", "2026-09-26", "id-a"),
    snap("m", "all_time", "multi", "2026-09-26", "id-b"),
  ];
  assert.equal(collapse(rows).get("m").platform, "multi");
});

test("same (window,platform,date) duplicates resolve on metric_snapshot_id", () => {
  const rows = [
    snap("m", "all_time", "multi", "2026-09-26", "aaaa"),
    snap("m", "all_time", "multi", "2026-09-26", "bbbb"),
  ];
  assert.equal(collapse(rows, "all_time").get("m").metric_snapshot_id, "bbbb");
  // …and the pick is identical if Postgres returns the rows in reverse order.
  assert.equal(
    collapse([...rows].reverse(), "all_time").get("m").metric_snapshot_id,
    "bbbb",
  );
});

test("windowed boards: preferWindow is the pre-filtered window", () => {
  // /board/30d input is already narrowed to window_type='30d' — the ladder
  // must be a no-op (picks the 30d multi, not some other window's row).
  const rows = [
    snap("m", "30d", "multi", "2026-09-26", "id-a"),
    snap("m", "30d", "devin", "2026-09-26", "id-b"),
  ];
  assert.equal(collapse(rows, "30d").get("m").platform, "multi");
});

test("per-platform keying: each (op, platform) keeps its own row", () => {
  const byOpPlatform = pickPerKey(
    MOSES_SAME_DATE,
    (r) => `${r.operator_id}|${r.platform ?? "∅"}`,
    "all_time",
  );
  assert.equal(byOpPlatform.size, 1); // all four are 'multi'
  const mixed = [
    snap("m", "all_time", "claude", "2026-09-26", "id-c"),
    snap("m", "7d", "claude", "2026-09-26", "id-d"),
    ...MOSES_SAME_DATE,
  ];
  const keyed = pickPerKey(
    mixed,
    (r) => `${r.operator_id}|${r.platform ?? "∅"}`,
    "all_time",
  );
  assert.equal(keyed.size, 2);
  assert.equal(keyed.get("m|claude").window_type, "all_time");
  assert.equal(keyed.get("m|multi").window_type, "all_time");
});
