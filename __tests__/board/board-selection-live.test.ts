/**
 * __tests__/board/board-selection-live.test.ts — OLD vs NEW against a REAL
 * database. Skipped unless BOARD_VERIFY_URL + BOARD_VERIFY_KEY are set; run it
 * with `node scripts/verify-board-selection.mjs` AFTER migration 0059 has been
 * applied to the database under test (preferably a branch or a copy first).
 * Read-only: it only SELECTs and calls the read-only functions.
 *
 * For every param combination the board callers use, it runs getLeaderboard
 * with BOARD_DB_SELECTION off (legacy: whole tables, JS pick) and on (SQL pick)
 * and asserts the LeaderboardRows are identical, then prints rows fetched.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import type { BoardParams } from "@/lib/board/mappers";

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
      // Ties on the sort value are unordered in the legacy path; compare the
      // rows keyed by operator so a tie reshuffle is not a false alarm, then
      // require identical values for every operator.
      const byOp = (rows: typeof legacy) =>
        new Map(rows.map((r) => [r.operator.operator_id, { ...r, global_rank: 0 }]));
      expect(byOp(sql)).toEqual(byOp(legacy));
      expect(sql.map((r) => r.snapshot.cascade?.yield_ ?? null)).toEqual(
        legacy.map((r) => r.snapshot.cascade?.yield_ ?? null),
      );
    });
  }
});
