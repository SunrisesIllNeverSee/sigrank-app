/**
 * __tests__/board/board-selection-live.test.ts — OLD vs NEW against a REAL
 * database. Skipped unless BOARD_VERIFY_URL + BOARD_VERIFY_KEY are set; run it
 * with `node scripts/verify-board-selection.mjs` AFTER migration 0059 has been
 * applied to the database under test (preferably a branch or a copy first).
 * Read-only: it only SELECTs and calls the read-only functions.
 *
 * For every param combination the board callers use, it runs getLeaderboard
 * with BOARD_DB_SELECTION off (legacy: whole tables, JS pick) and on (SQL pick)
 * and asserts the LeaderboardRows are equivalent (see the tie note below).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import type { BoardParams } from "@/lib/board/mappers";
import { sortValue } from "@/lib/analytics/sort-value";
import { SORT_DEFAULT } from "@/lib/constants";

const live = Boolean(process.env.BOARD_VERIFY_URL && process.env.BOARD_VERIFY_KEY);

const WINDOWS = ["7d", "30d", "90d", "all_time"];
const COMBOS: [string, BoardParams][] = [];
for (const w of WINDOWS) {
  COMBOS.push(
    [`board ${w}`, { window: w, windowFilter: w !== "all_time", operatorTotal: true, claimedOnly: true, mode: "all" }],
    [`claimed pref ${w}`, { window: w, windowFilter: false, operatorTotal: true, claimedOnly: true, mode: "all" }],
    [`windowFilter ${w}`, { window: w, windowFilter: true, limit: 1000 }],
    [`perPlatform ${w}`, { window: w, windowFilter: true, perPlatform: true }],
    [`operatorTotal ${w}`, { window: w, windowFilter: true, operatorTotal: true }],
  );
}
COMBOS.push(["default", {}], ["operatorTotal", { operatorTotal: true }]);

describe.skipIf(!live)("board selection: legacy vs DB selection on a live database", () => {
  afterEach(() => vi.unstubAllEnvs());
  for (const [name, params] of COMBOS) {
    it(name, async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.BOARD_VERIFY_URL!);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.BOARD_VERIFY_KEY!);
      vi.resetModules();
      const { fetchLeaderboardOrThrow } = await import("@/lib/board/queries");
      vi.stubEnv("BOARD_DB_SELECTION", "");
      const legacy = await fetchLeaderboardOrThrow(params);
      vi.stubEnv("BOARD_DB_SELECTION", "1");
      const sql = await fetchLeaderboardOrThrow(params);
      console.log(`[live] ${name}: legacy ${legacy.length} rows, sql ${sql.length} rows`);
      expect(sql.length).toBe(legacy.length);
      // The legacy path orders same-date rows by whatever order Postgres pages
      // them out, so two things are arbitrary there and deterministic in SQL:
      //   - order inside a tie group (rows with an equal sort value, e.g. every
      //     non-compounding operator sorts at -1), and the rank/percentile that
      //     follow from it;
      //   - the order of the operatorTotal `platforms` badge for same-day
      //     submissions.
      // Everything else must match: the same sort-value sequence, and the same
      // rows inside every tie group. (Live-checked against prod 2026-11-16:
      // 22/22 combos equivalent.)
      const sort = params.sort ?? SORT_DEFAULT;
      const va = legacy.map((r) => sortValue(r, sort));
      const vb = sql.map((r) => sortValue(r, sort));
      expect(vb).toEqual(va);
      const norm = (r: (typeof legacy)[number]) => {
        const x = r as typeof r & { platforms?: string[] };
        return JSON.stringify({
          ...x,
          global_rank: 0,
          percentile: 0,
          platforms: x.platforms ? [...x.platforms].sort() : undefined,
        });
      };
      for (let k = 0; k < va.length; ) {
        let j = k;
        while (j < va.length && va[j] === va[k]) j++;
        expect(sql.slice(k, j).map(norm).sort()).toEqual(legacy.slice(k, j).map(norm).sort());
        k = j;
      }
    });
  }
});
