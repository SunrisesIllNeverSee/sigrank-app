"use client";

/**
 * BoardTableClient — client wrapper for the board table on ISR-cached pages.
 *
 * PERF (2026-07-21): The server only sends the first 25 entries (page 0)
 * for SSR + SEO. This client fetches subsequent pages + the perPlatform
 * dataset via /api/v1/leaderboard when needed, keeping /board/all small.
 *
 * The server page is static (doesn't read searchParams → CDN-cached via
 * revalidate=3600). This client component reads useSearchParams to determine
 * the active platform filter + view mode.
 *
 * LIVE CONTRACT (2026-09-26): every fetch now sends `scope=live` +
 * `breakdown=total|platforms` so the API applies the SAME live population
 * (claimed operators + The Field — lib/board/live.ts) and the SAME collapse
 * the server render used. Before this, client fetches silently switched to
 * the unclaimed-inclusive legacy scope and a different aggregation, so
 * pagination/filtering showed a different board than the SSR page.
 *
 * Resilience (same pass): fetches are abortable (rapid window/filter changes
 * can't commit stale data), failures surface a visible error strip with a
 * Retry affordance, and the last good dataset stays on screen instead of
 * silently emptying the table.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/sigrank";
import { PLATFORM_DOMAIN_MAP, type PlatformUI } from "@/lib/constants";
import type { LeaderboardEntryWithPlatforms } from "@/lib/board/to-entry";
import { useBoardRealtime } from "@/lib/board/use-board-realtime";
import { toSignalClass } from "@/components/sigrank/types";

interface Props {
  /** First page of operatorTotal entries (25 rows) for SSR + SEO. */
  totalEntries: LeaderboardEntryWithPlatforms[];
  /** Total operator count (for pagination). */
  totalCount: number;
  /** The board window slug (7d/30d/90d/all). */
  window: string;
  /** The board window enum for API calls (e.g. "all_time"). */
  windowEnum?: string;
}

/** Build the live-scope API URL. `breakdown` selects the collapse shape:
 *  'total' = one operator-total row per live operator; 'platforms' = one row
 *  per (operator × platform). A platform filter narrows within the breakdown. */
function liveBoardUrl(
  windowEnum: string,
  breakdown: "total" | "platforms",
  opts: { platform?: string | null; limit?: number } = {},
): string {
  const params = new URLSearchParams({
    metric: "yield",
    window: windowEnum,
    scope: "live",
    breakdown,
    limit: String(opts.limit ?? 2000),
  });
  if (opts.platform) params.set("platform", opts.platform);
  return `/api/v1/leaderboard?${params.toString()}`;
}

/** Resolve the ?platform= search param to its UI label. */
function platformLabelFor(domain: string | null): PlatformUI {
  if (!domain) return "All";
  const entry = (
    Object.entries(PLATFORM_DOMAIN_MAP) as [PlatformUI, string | null][]
  ).find(([, d]) => d?.toLowerCase() === domain);
  return entry ? entry[0] : "All";
}

/** Normalize a ?platform= search param to a lowercase domain, or null. */
function normalizePlatform(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (!v || v === "all") return null;
  const domains = new Set(
    (Object.values(PLATFORM_DOMAIN_MAP).filter(Boolean) as string[]).map((d) =>
      d.toLowerCase(),
    ),
  );
  return domains.has(v) ? v : null;
}

export function BoardTableClient({
  totalEntries,
  totalCount,
  window: win,
  windowEnum,
}: Props) {
  const searchParams = useSearchParams();

  const platformFilter = normalizePlatform(searchParams.get("platform"));
  const viewPlatforms = searchParams.get("view") === "platforms";
  const platformLabel = platformLabelFor(platformFilter);

  // Fetched slots — each a different row shape, each keyed to the window it
  // was fetched for. Keying (not just reset) is required because soft
  // navigation /board/all → /board/30d preserves component state AND a fetch
  // in flight during the transition can commit AFTER the window changed:
  // an unkeyed slot would render the previous window's rows under new chrome.
  //   breakdown       — per-platform rows for ?view=platforms / ?platform=
  //   refreshedTotals — Realtime-refreshed first page of the totals board
  //   fullBoard       — lazy-loaded full dataset for the all-time board
  const [breakdown, setBreakdown] = useState<{
    windowEnum: string;
    entries: LeaderboardEntryWithPlatforms[];
    /** Distinct live operators in this breakdown query (the honest "N of M"
     *  denominator — a platform filter shrinks M; per-platform rows can
     *  outnumber operators). */
    operators: number | null;
  } | null>(null);
  const [refreshedTotals, setRefreshedTotals] = useState<{
    windowEnum: string;
    entries: LeaderboardEntryWithPlatforms[];
  } | null>(null);
  const [fullBoard, setFullBoard] = useState<{
    windowEnum: string;
    entries: LeaderboardEntryWithPlatforms[];
  } | null>(null);
  // Separate loading flags — the breakdown fetch and the all-time lazy-load
  // are independent requests; one shared flag let a breakdown in flight
  // silently block pagination.
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [totalsLoading, setTotalsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  // Stale-response guards: only the newest request may commit. One sequence
  // per fetch family so a breakdown fetch can't cancel a totals lazy-load.
  const breakdownSeq = useRef(0);
  const totalsSeq = useRef(0);

  const resolvedWindowEnum = windowEnum ?? "all_time";
  const fullBoardForWindow =
    fullBoard && fullBoard.windowEnum === resolvedWindowEnum
      ? fullBoard.entries
      : null;
  const refreshedTotalsForWindow =
    refreshedTotals && refreshedTotals.windowEnum === resolvedWindowEnum
      ? refreshedTotals.entries
      : null;
  const breakdownForWindow =
    breakdown && breakdown.windowEnum === resolvedWindowEnum
      ? breakdown
      : null;

  // Lazy-load the full all_time dataset when the user paginates beyond page 0.
  // scope=live&breakdown=total = the same claimed+Field population and the
  // same operator-total collapse the SSR page rendered. Abortable + sequence
  // guarded like the breakdown path — a slow response arriving after a window
  // change can no longer commit the wrong window's rows.
  const loadTotals = useCallback(() => {
    if (fullBoardForWindow || totalsLoading) return;
    const we = resolvedWindowEnum;
    const seq = ++totalsSeq.current;
    const controller = new AbortController();
    setTotalsLoading(true);
    setFetchError(false);
    fetch(liveBoardUrl(we, "total"), {
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`board fetch failed (${r.status})`);
        return r.json();
      })
      .then((d) => {
        if (controller.signal.aborted || totalsSeq.current !== seq) return;
        setFullBoard({
          windowEnum: we,
          entries: (d.entries ?? []).map(mapApiEntry),
        });
        setTotalsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (totalsSeq.current !== seq) return;
        setFetchError(true);
        setTotalsLoading(false);
      });
  }, [fullBoardForWindow, totalsLoading, resolvedWindowEnum]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && win === "all") loadTotals();
    },
    [win, loadTotals],
  );

  // If the window changes while a totals fetch is in flight, invalidate it —
  // its commit guard also keys on windowEnum, this just frees the flag early.
  // refreshedTotals + breakdown are keyed slots too: a realtime/breakdown
  // response landing after a window change is discarded at render time by the
  // windowEnum check, and stale slots never match the new window.
  useEffect(() => {
    setTotalsLoading(false);
    setBreakdownLoading(false);
    totalsSeq.current += 1;
    breakdownSeq.current += 1;
  }, [resolvedWindowEnum]);

  // Refetch the first page from the API (Realtime refresh). Live scope keeps
  // the refreshed rows consistent with the SSR population. Note: the server
  // memoizes live reads (~1h TTL) so "refresh" means latest-memoized, not
  // just-now — the page's provenance strip is the honest freshness signal.
  const refreshFirstPage = useCallback(() => {
    if (!windowEnum) return;
    const we = windowEnum;
    fetch(liveBoardUrl(we, "total", { limit: 25 }), {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return; // transient failure → keep the last good data
        setRefreshedTotals({
          windowEnum: we,
          entries: (d.entries ?? []).map(mapApiEntry),
        });
      })
      .catch(() => {});
  }, [windowEnum]);

  // Realtime: subscribe to metric_snapshots changes. No-op when realtime is
  // disabled/unavailable — the board simply shows the ISR render.
  useBoardRealtime({ onRefresh: refreshFirstPage });

  // Fetch the per-platform breakdown when ?view=platforms or a platform filter
  // is active. scope=live&breakdown=platforms is the contract the SSR page
  // can't express via URL alone — the server hands the collapse to the API.
  useEffect(() => {
    if (!viewPlatforms && !platformFilter) {
      setBreakdown(null);
      return;
    }
    if (!windowEnum) return;

    const seq = ++breakdownSeq.current;
    const controller = new AbortController();
    setBreakdownLoading(true);
    setFetchError(false);

    fetch(
      liveBoardUrl(windowEnum, "platforms", { platform: platformFilter }),
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`board fetch failed (${r.status})`);
        return r.json();
      })
      .then((d) => {
        if (controller.signal.aborted || breakdownSeq.current !== seq) return;
        setBreakdown({
          windowEnum,
          entries: (d.entries ?? []).map(mapApiEntry),
          operators:
            typeof d.operators_returned === "number"
              ? d.operators_returned
              : null,
        });
        setBreakdownLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (breakdownSeq.current !== seq) return;
        // Keep the last good breakdown on screen; flag the failure so the
        // user sees a retry affordance instead of a silently stale table.
        setFetchError(true);
        setBreakdownLoading(false);
      });
    return () => controller.abort();
    // retryTick re-runs this effect on demand (error-strip Retry button).
  }, [viewPlatforms, platformFilter, windowEnum, retryTick]);

  // Windowed board: platform views use breakdown rows; a Realtime refresh
  // swaps the totals first page; the all-time board swaps to the lazy-loaded
  // dataset once fetched. Every fetched slot is keyed to the window it came
  // from — a response from the previous window can never render here.
  let entries: LeaderboardEntryWithPlatforms[];
  if (viewPlatforms || platformFilter) {
    // Fetched breakdown rows — or empty while loading/failed (the error strip
    // communicates the failure; never substitute the totals population here).
    entries = breakdownForWindow?.entries ?? [];
  } else if (refreshedTotalsForWindow) {
    entries = refreshedTotalsForWindow;
  } else if (win === "all" && fullBoardForWindow) {
    entries = fullBoardForWindow;
  } else {
    entries = totalEntries;
  }

  // While the first breakdown request is in flight, fall back to the window's
  // live operator count (right population scope) instead of flashing "0".
  const totalUsers =
    viewPlatforms || platformFilter
      ? (breakdownForWindow?.operators ?? totalCount)
      : totalCount;

  const loading = breakdownLoading || totalsLoading;

  return (
    <div>
      {fetchError ? (
        <div
          role="alert"
          className="mb-3 flex items-center gap-3 rounded border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-text-secondary"
        >
          <span>
            Board data could not be refreshed — showing the last successful
            load.
          </span>
          <button
            type="button"
            className="rounded border border-bg-border px-2 py-0.5 text-text-primary hover:border-gold"
            onClick={() => {
              setFetchError(false);
              if (viewPlatforms || platformFilter) setRetryTick((t) => t + 1);
              else loadTotals();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
      {loading ? (
        <p
          aria-live="polite"
          className="mb-2 text-[11px] text-text-muted"
        >
          Loading {win === "all" ? "all-time" : win} board…
        </p>
      ) : null}
      <LeaderboardTable
        entries={entries}
        totalUsers={totalUsers}
        window={win}
        platform={platformLabel}
        view={viewPlatforms ? "platforms" : "total"}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

/** Map an API leaderboard entry to LeaderboardEntryWithPlatforms — field parity
 *  with lib/board/to-entry.ts so fetched rows render identically to SSR rows:
 *  platforms set, @handle subLabel, primary domain, acct age, window, status,
 *  last_seen, and the shared canonical class coercer (IGNITER III default —
 *  the old mapper's "BURNER" fallback named a class that doesn't exist).
 *  isSeed uses `claimed` (the seed signal that works for DB rows; the old
 *  `is_placeholder` flag is mock-path-only). */
function mapApiEntry(api: Record<string, unknown>): LeaderboardEntryWithPlatforms {
  const handle = (api.handle as string) ?? null;
  const primaryDomain = (api.primary_domain as string) ?? null;
  const acctDays = api.account_age_days as number | null;
  const platforms = api.platforms as string[] | undefined;
  return {
    rank: (api.rank as number) ?? 0,
    percentile: (api.percentile as number) ?? null,
    anonId: (api.display_name as string) ?? (api.codename as string) ?? "?",
    codename: (api.codename as string) ?? "?",
    subLabel: handle ? `@${handle}` : (primaryDomain ?? undefined),
    location: (api.location as string) ?? undefined,
    signalClass: toSignalClass((api.class_tier as string) ?? null),
    platform: (api.platform as string) ?? undefined,
    window: (api.window as string) ?? undefined,
    yield_: (api.yield_ as number) ?? null,
    leverage: (api.leverage as number) ?? null,
    snr: (api.snr as number) ?? undefined,
    dev10x: (api.dev10x as number) ?? null,
    velocity: (api.velocity as number) ?? null,
    signalForce: (api.signal_force as number) ?? undefined,
    scaleV: (api.scale_v as number) ?? null,
    input: (api.input_tokens as number) ?? null,
    output: (api.output_tokens as number) ?? null,
    cacheRead: (api.cache_read_tokens as number) ?? null,
    cacheWrite: (api.cache_creation_tokens as number) ?? null,
    totalTokens: (api.total_tokens as number) ?? null,
    costPerMillion: (api.cost_per_million as number) ?? null,
    efficiency: (api.efficiency as number) ?? null,
    opRatio: (api.op_ratio as string) ?? undefined,
    snRatio: (api.compression_ratio as number) ?? undefined,
    messageVolume: (api.message_volume as number) ?? undefined,
    sessionDepth: (api.session_depth as number) ?? undefined,
    promptComplexity: (api.prompt_complexity as number) ?? undefined,
    threadsRecalled: (api.cross_thread as number) ?? undefined,
    compositeScore: (api.signa_rate as number) ?? undefined,
    acctAge: acctDays != null ? `${acctDays}d` : "—",
    lastSeen: (api.last_seen as string) ?? null,
    status: (api.status as string) ?? undefined,
    isSeed: api.claimed === false,
    ...(platforms && platforms.length > 0 ? { platforms } : {}),
    primaryDomain: primaryDomain?.toLowerCase(),
  } as LeaderboardEntryWithPlatforms;
}
