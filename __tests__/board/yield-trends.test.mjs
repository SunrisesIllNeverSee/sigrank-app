/**
 * Board TREND column — Yield history derived from the raw token pillars.
 *
 * metric_snapshots stores pillars only (no yield_ / cascade columns); Yield is
 * derived on read with computeCascadeMetrics, exactly like the board's Yield
 * column (lib/board/mappers.ts). Selecting a non-existent column made the
 * trends endpoint 503 and left every sparkline empty.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildYieldTrends, TREND_COLUMNS } from "../../lib/board/yield-trends.ts";

const row = (operator_id, snapshot_date, i, o, cw, cr, platform = "claude") => ({
  operator_id, snapshot_date, platform,
  input_tokens: i, output_tokens: o, cache_creation_tokens: cw, cache_read_tokens: cr,
});

test("derives Yield = cache_read × output / input² per day, oldest first", () => {
  const trends = buildYieldTrends(
    [row("a", "2026-10-02", 10, 20, 5, 100), row("a", "2026-10-01", 10, 10, 5, 100)],
    new Map([["a", "alpha"]]),
  );
  assert.deepEqual(trends, { alpha: [10, 20] });
});

test("skips non-compounding (cache_write = 0) and legacy pillar-less rows, like the Yield column", () => {
  const trends = buildYieldTrends(
    [
      row("a", "2026-10-01", 10, 10, 0, 100),
      row("a", "2026-10-02", null, null, null, null),
      row("a", "2026-10-03", 10, 10, 5, 100),
    ],
    new Map([["a", "alpha"]]),
  );
  assert.deepEqual(trends, { alpha: [10] });
});

test("prefers the multi-platform rollup when a day has several platform rows", () => {
  const trends = buildYieldTrends(
    [row("a", "2026-10-01", 10, 10, 5, 100, "claude"), row("a", "2026-10-01", 10, 30, 5, 100, "multi")],
    new Map([["a", "alpha"]]),
  );
  assert.deepEqual(trends, { alpha: [30] });
});

test("keeps the most recent 40 points and drops operators without a codename", () => {
  const rows = Array.from({ length: 45 }, (_, d) =>
    row("a", `2026-09-${String(d + 1).padStart(2, "0")}`, 10, d + 1, 5, 100));
  rows.push(row("ghost", "2026-10-01", 10, 10, 5, 100));
  const trends = buildYieldTrends(rows, new Map([["a", "alpha"]]));
  assert.equal(trends.alpha.length, 40);
  assert.equal(trends.alpha[0], 6); // Yield = (100/10)·((d+1)/10) = d+1; points 6..45 kept
  assert.equal("ghost" in trends, false);
});

test("trends route selects only columns that exist on metric_snapshots", async () => {
  const route = await readFile(new URL("../../app/api/v1/board/trends/route.ts", import.meta.url), "utf8");
  assert.match(route, /\.select\(TREND_COLUMNS\)/);
  for (const col of TREND_COLUMNS.split(",")) {
    assert.ok(
      ["operator_id", "snapshot_date", "platform", "input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens"].includes(col),
      `${col} is not a metric_snapshots column`,
    );
  }
});
