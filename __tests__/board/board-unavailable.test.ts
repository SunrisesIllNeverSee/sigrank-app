/**
 * __tests__/board/board-unavailable.test.ts — "under construction" instead of
 * an empty board (2026-11-14, Supabase egress block / 402s).
 *
 *  - getLeaderboardResult() tells an unreadable database (unavailable: true)
 *    from a genuinely empty window (unavailable: false).
 *  - getLeaderboard() keeps its rows-only contract; strictLive callers (MCP /
 *    plugin) still get a thrown error.
 *  - the notice shows the copy and a link to /board/history, and is not a redirect.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({ mode: "error" as "error" | "empty" }));

vi.mock("@/lib/infra/supabase/server", () => {
  const q: Record<string, unknown> = {};
  const chain = () => q;
  for (const m of ["select", "eq", "in", "order", "rpc"]) q[m] = chain;
  q.range = () => q;
  q.then = (res: (v: unknown) => unknown) =>
    res(
      state.mode === "error"
        ? { data: null, error: { message: "402 Payment Required", code: "402" } }
        : { data: [], error: null },
    );
  const client = { from: () => q, rpc: () => q };
  return { getSupabaseServer: () => client, getSupabaseService: () => client };
});

import { getLeaderboard, getLeaderboardResult } from "@/lib/board/queries";
import { BoardUnderConstruction } from "@/app/board/[window]/board-under-construction";

describe("getLeaderboardResult: unavailable vs empty", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));

  for (const flag of ["", "1"]) {
    it(`database error -> unavailable (flag ${flag || "off"})`, async () => {
      vi.stubEnv("BOARD_DB_SELECTION", flag);
      state.mode = "error";
      const res = await getLeaderboardResult({ window: "30d", windowFilter: true, operatorTotal: true, claimedOnly: true, mode: "all" });
      expect(res).toEqual({ rows: [], unavailable: true });
      expect(await getLeaderboard({ window: "30d" })).toEqual([]);
    });

    it(`genuinely empty window -> NOT unavailable (flag ${flag || "off"})`, async () => {
      vi.stubEnv("BOARD_DB_SELECTION", flag);
      state.mode = "empty";
      const res = await getLeaderboardResult({ window: "30d", windowFilter: true, operatorTotal: true, mode: "all" });
      expect(res).toEqual({ rows: [], unavailable: false });
    });

    it(`strictLive keeps throwing (flag ${flag || "off"})`, async () => {
      vi.stubEnv("BOARD_DB_SELECTION", flag);
      state.mode = "error";
      await expect(getLeaderboardResult({ strictLive: true, window: "all_time" })).rejects.toBeTruthy();
      await expect(getLeaderboard({ strictLive: true, window: "all_time" })).rejects.toBeTruthy();
    });
  }
});

describe("BoardUnderConstruction", () => {
  it("shows the notice and a link to the original board", () => {
    render(React.createElement(BoardUnderConstruction, { heading: { a: "AI User ", b: "Leaderboard" } }));
    expect(screen.getByText(/Live board under construction — back shortly\./)).toBeTruthy();
    const link = screen.getByRole("link", { name: "See the original board" });
    expect(link.getAttribute("href")).toBe("/board/history");
    expect(screen.queryByText(/No operators on this board/)).toBeNull();
  });
});
