import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

/**
 * BoardTableClient behavioral tests — the live-board fetch/state contract.
 *
 * These exercise the three defects Codex reproduced against the real
 * component with controlled API responses:
 *   1. breakdown slot keyed only by window → a failed platform=B fetch left
 *      platform=A rows rendered under B's label.
 *   2. realtime refresh requested limit=25 → replaced the displayed dataset
 *      with a truncated first page, and later page fetches were shadowed.
 *   3. source/source_date/population were discarded — a 200
 *      source:'unavailable' was treated as a legitimate empty board.
 */

// ── Mutable search params (the "platform switch" lever) ──────────────────
let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => currentParams,
  usePathname: () => "/board/all",
}));

// ── Realtime capture — the test triggers the refresh callback directly ────
let realtimeRefresh: (() => void) | null = null;
vi.mock("@/lib/board/use-board-realtime", () => ({
  useBoardRealtime: (opts: { onRefresh: () => void }) => {
    realtimeRefresh = opts.onRefresh;
  },
}));

// ── Thin LeaderboardTable stub — the table itself is separately tested; here
//    we need to observe WHICH entries/meta BoardTableClient hands it. ──────
vi.mock("@/components/sigrank", () => ({
  LeaderboardTable: (props: {
    entries: { codename: string }[];
    totalUsers?: number;
    baselineCount?: number;
    view?: string;
    onPageChange?: (p: number) => void;
  }) => (
    <div data-testid="lb-table" data-view={props.view}>
      <div data-testid="row-count">{props.entries.length}</div>
      {props.entries.map((e, i) => (
        <div key={`${e.codename}-${i}`} data-testid="row">
          {e.codename}
        </div>
      ))}
      <div data-testid="total-users">{String(props.totalUsers)}</div>
      <div data-testid="baseline">{String(props.baselineCount)}</div>
      <button type="button" onClick={() => props.onPageChange?.(1)}>
        next-page
      </button>
    </div>
  ),
}));

import { BoardTableClient } from "@/components/board/BoardTableClient";
import type { LeaderboardEntryWithPlatforms } from "@/lib/board/to-entry";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeEntry(codename: string): LeaderboardEntryWithPlatforms {
  return {
    rank: 1,
    percentile: null,
    anonId: codename,
    codename,
    signalClass: "IGNITER I",
    isSeed: false,
    yield_: 10,
    leverage: null,
    dev10x: null,
    velocity: null,
    acctAge: "—",
    lastSeen: null,
  } as LeaderboardEntryWithPlatforms;
}

function apiEntry(codename: string, extra: Record<string, unknown> = {}) {
  return {
    rank: 1,
    codename,
    display_name: codename,
    claimed: true,
    class_tier: "IGNITER I",
    platforms: ["claude"],
    ...extra,
  };
}

function apiResponse(
  entries: Record<string, unknown>[],
  meta: Record<string, unknown> = {},
) {
  return {
    metric: "yield",
    scope: "live",
    source: "supabase",
    source_date: "2026-09-26",
    population: entries.length,
    baseline_population: 0,
    operators_returned: entries.length,
    returned_rows: entries.length,
    entries,
    ...meta,
  };
}

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  realtimeRefresh = null;
  currentParams = new URLSearchParams();
});

function renderBoard(
  opts: {
    totalEntries?: LeaderboardEntryWithPlatforms[];
    totalCount?: number;
    baselineCount?: number;
    window?: string;
    windowEnum?: string;
  } = {},
) {
  const totalEntries =
    opts.totalEntries ??
    Array.from({ length: 3 }, (_, i) => makeEntry(`ssr-op-${i}`));
  return render(
    <BoardTableClient
      totalEntries={totalEntries}
      totalCount={opts.totalCount ?? totalEntries.length}
      baselineCount={opts.baselineCount ?? 0}
      window={opts.window ?? "all"}
      windowEnum={opts.windowEnum ?? "all_time"}
    />,
  );
}

describe("BoardTableClient — query-keyed fetched slots", () => {
  it("never shows platform A rows under platform B after a failed fetch", async () => {
    currentParams = new URLSearchParams("platform=claude");
    fetchMock.mockImplementation((url: string) => {
      const u = new URL(url, "http://x");
      if (u.searchParams.get("platform") === "codex") {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        } as Response);
      }
      return okJson(
        apiResponse([apiEntry("claude-op")], { operators_returned: 1 }),
      );
    });

    const { rerender } = renderBoard();
    await waitFor(() => expect(screen.getByText("claude-op")).toBeTruthy());
    expect(screen.getByTestId("row-count").textContent).toBe("1");

    // Switch platform → the Codex fetch fails.
    currentParams = new URLSearchParams("platform=codex");
    rerender(
      <BoardTableClient
        totalEntries={[makeEntry("ssr-op-0")]}
        totalCount={1}
        window="all"
        windowEnum="all_time"
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeTruthy(),
    );
    // The failed Codex query must NOT inherit Claude's rows — empty + error.
    expect(screen.queryByText("claude-op")).toBeNull();
    expect(screen.getByTestId("row-count").textContent).toBe("0");
  });

  it("realtime refresh keeps the complete dataset (never truncates to a page)", async () => {
    const thirty = Array.from({ length: 30 }, (_, i) =>
      makeEntry(`op-${String(i).padStart(2, "0")}`),
    );
    const urls: string[] = [];
    fetchMock.mockImplementation((url: string) => {
      urls.push(url);
      const u = new URL(url, "http://x");
      const limit = Number(u.searchParams.get("limit") ?? "2000");
      // Honor the requested limit like the API does — if the client ever
      // regresses to limit=25 the mock serves a truncated dataset.
      return okJson(
        apiResponse(
          thirty.slice(0, limit).map((e) => apiEntry(e.codename)),
          { population: 30 },
        ),
      );
    });

    renderBoard({ totalEntries: thirty, totalCount: 30 });
    expect(screen.getByTestId("row-count").textContent).toBe("30");

    // Realtime event → background refresh must request the COMPLETE dataset.
    await React.act(async () => realtimeRefresh?.());
    await waitFor(() => expect(urls.length).toBeGreaterThan(0));
    expect(urls[0]).toContain("limit=2000");
    expect(screen.getByTestId("row-count").textContent).toBe("30");

    // Pagination after a refresh: the totals slot is already complete — no
    // refetch needed, and the full set stays displayed.
    fireEvent.click(screen.getByText("next-page"));
    await waitFor(() =>
      expect(screen.getByTestId("row-count").textContent).toBe("30"),
    );
  });

  it("page fetch after refresh still updates the displayed dataset", async () => {
    // SSR sends only the first page; realtime refresh lands first, then the
    // user paginates — the page fetch must not be shadowed by the refresh slot.
    const thirty = Array.from({ length: 30 }, (_, i) =>
      makeEntry(`op-${String(i).padStart(2, "0")}`),
    );
    fetchMock.mockImplementation((url: string) => {
      const u = new URL(url, "http://x");
      const limit = Number(u.searchParams.get("limit") ?? "2000");
      return okJson(
        apiResponse(
          thirty.slice(0, limit).map((e) => apiEntry(e.codename)),
          { population: 30 },
        ),
      );
    });

    renderBoard({
      totalEntries: thirty.slice(0, 25),
      totalCount: 30,
      window: "all",
      windowEnum: "all_time",
    });
    expect(screen.getByTestId("row-count").textContent).toBe("25");

    // Paginate → lazy-load pulls the complete dataset into the totals slot.
    fireEvent.click(screen.getByText("next-page"));
    await waitFor(() =>
      expect(screen.getByTestId("row-count").textContent).toBe("30"),
    );

    // Realtime refresh afterwards updates the SAME slot — still complete.
    await React.act(async () => realtimeRefresh?.());
    await waitFor(() =>
      expect(screen.getByTestId("row-count").textContent).toBe("30"),
    );
  });

  it("bounded window realtime refresh is not truncated either", async () => {
    const thirty = Array.from({ length: 30 }, (_, i) =>
      makeEntry(`op-${String(i).padStart(2, "0")}`),
    );
    const urls: string[] = [];
    fetchMock.mockImplementation((url: string) => {
      urls.push(url);
      const u = new URL(url, "http://x");
      const limit = Number(u.searchParams.get("limit") ?? "2000");
      return okJson(
        apiResponse(
          thirty.slice(0, limit).map((e) => apiEntry(e.codename)),
          { population: 30 },
        ),
      );
    });

    renderBoard({
      totalEntries: thirty,
      totalCount: 30,
      window: "30d",
      windowEnum: "30d",
    });
    await React.act(async () => realtimeRefresh?.());
    await waitFor(() => expect(urls.length).toBeGreaterThan(0));
    expect(urls[0]).toContain("window=30d");
    expect(urls[0]).toContain("limit=2000");
    expect(screen.getByTestId("row-count").textContent).toBe("30");
  });
});

describe("BoardTableClient — provenance handling", () => {
  it("labels snapshot-sourced fetched data instead of leaving SSR 'live' chrome", async () => {
    const ssr = [makeEntry("ssr-op-0"), makeEntry("ssr-op-1")];
    fetchMock.mockImplementation(() =>
      okJson(
        apiResponse([apiEntry("snap-op-0"), apiEntry("snap-op-1")], {
          source: "snapshot",
          source_date: "2026-09-20",
          population: 7,
          baseline_population: 1,
        }),
      ),
    );

    renderBoard({ totalEntries: ssr, totalCount: 2 });
    await React.act(async () => realtimeRefresh?.());

    await waitFor(() =>
      expect(screen.getByText(/Cached snapshot/i)).toBeTruthy(),
    );
    expect(screen.getByText(/captured 2026-09-20/)).toBeTruthy();
    // Counts follow the fetched dataset, not the SSR render.
    expect(screen.getByTestId("total-users").textContent).toBe("7");
    expect(screen.getByTestId("baseline").textContent).toBe("1");
    expect(screen.getByText("snap-op-0")).toBeTruthy();
  });

  it("source:'unavailable' keeps last-good rows and flags the error", async () => {
    const ssr = [makeEntry("ssr-op-0"), makeEntry("ssr-op-1")];
    fetchMock.mockImplementation(() =>
      okJson(
        apiResponse([], {
          source: "unavailable",
          source_date: null,
          population: 0,
        }),
      ),
    );

    renderBoard({ totalEntries: ssr, totalCount: 2 });
    await React.act(async () => realtimeRefresh?.());

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    // The degraded 200 did not replace the good data with an empty board.
    expect(screen.getByTestId("row-count").textContent).toBe("2");
    expect(screen.getByText("ssr-op-0")).toBeTruthy();
  });
});
