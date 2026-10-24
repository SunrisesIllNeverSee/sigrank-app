/**
 * The board TREND column has one source: the per-window, one-point-per-day
 * Yield series from /api/v1/board/trends. The per-operator history endpoint
 * returns several rows per date (one per platform/source, some Yield 0), so
 * its points are not a time series — letting mergeDetail copy that into
 * `trend` drew a fake same-day "crash" on the selected row.
 */
import { describe, expect, it } from "vitest";
import { mergeDetail } from "@/components/live/enrich";
import type { LiveOperator } from "@/lib/board/live-types";

describe("mergeDetail and the row trend", () => {
  it("does not overwrite the row trend with per-operator history points", () => {
    const base = { codename: "xoxo", trend: [] } as unknown as LiveOperator;
    const merged = mergeDetail(base, { trend: [977481.79, 976944.23, 977481.79, 976944.23], mv7: 2 });
    expect(merged.trend).toEqual([]);
    expect(merged.mv7).toBe(2); // other detail fields still merge
  });

  it("keeps an existing per-day series when detail arrives later", () => {
    const base = { codename: "a", trend: [10, 20, 30] } as unknown as LiveOperator;
    expect(mergeDetail(base, { trend: [5, 5, 5] }).trend).toEqual([10, 20, 30]);
  });
});
