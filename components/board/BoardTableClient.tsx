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
import type { LiveBoardSource } from "@/lib/board/live";
import liveStyles from "@/components/live-board/live-board.module.css";

interface Props {
  /** First page of operatorTotal entries (25 rows) for SSR + SEO. */
  totalEntries: LeaderboardEntryWithPlatforms[];
  /** Total operator count (for pagination). */
  totalCount: number;
  /** Baseline (unclaimed-but-eligible) operators in the population — The
   *  Field. Shown separately so the count never implies registered users. */
  baselineCount?: number;
  /** SSR provenance — the seed state of the strip; replaced by the meta of
   *  whichever fetched dataset is displayed. */
  source?: LiveBoardSource;
  /** SSR freshness ('YYYY-MM-DD'), paired with `source`. */
  sourceDate?: string | null;
  /** Window short label for the provenance strip, e.g. '30d' / 'all-time'. */
  windowShort?: string;
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

/** Provenance attached to every fetched slot — the API reports where the
 *  rows came from and how fresh they are, and the displayed labels must
 *  describe the displayed dataset, not the SSR render it replaced. */
interface FetchedMeta {
  source: LiveBoardSource | null;
  sourceDate: string | null;
  /** Eligible operators for this query's population (pre-limit). */
  population: number | null;
  /** Unclaimed-but-eligible baseline ops in the population (The Field). */
  baseline: number | null;
}

/** Read the provenance meta off a scope=live response body. */
function metaFromApi(d: Record<string, unknown>): FetchedMeta {
  return {
    source:
      d.source === "supabase" || d.source === "snapshot"
        ? d.source
        : d.source === "unavailable"
          ? "unavailable"
          : null,
    sourceDate: typeof d.source_date === "string" ? d.source_date : null,
    population: typeof d.population === "number" ? d.population : null,
    baseline:
      typeof d.baseline_population === "number" ? d.baseline_population : null,
  };
}

const SOURCE_LABEL: Record<LiveBoardSource, string> = {
  supabase: "Live data",
  snapshot: "Cached snapshot",
  unavailable: "Data unavailable",
};

export function BoardTableClient({
  totalEntries,
  totalCount,
  baselineCount: baselineProp,
  source: ssrSource,
  sourceDate: ssrSourceDate,
  windowShort,
  window: win,
  windowEnum,
}: Props) {
  const searchParams = useSearchParams();

  const platformFilter = normalizePlatform(searchParams.get("platform"));
  const viewPlatforms = searchParams.get("view") === "platforms";
  const platformLabel = platformLabelFor(platformFilter);

  // Fetched slots — keyed to the FULL query identity they were fetched for
  // (not just the window). Keying (not just reset) is required because soft
  // navigation preserves component state AND an in-flight fetch can commit
  // after the window/platform changed: an unkeyed slot would render the
  // previous query's rows under new chrome.
  //   breakdown — per-platform rows for ?view=platforms / ?platform=, keyed
  //     by (window, platform) so a platform switch never shows the previous
  //     platform's rows and a failed fetch retains last-good ONLY for the
  //     identical query.
  //   totals    — the complete totals dataset for the window. Written by the
  //     lazy-load (pagination) AND by realtime refresh — one slot, so the
  //     freshest write always displays and neither can shadow the other.
  const [breakdown, setBreakdown] = useState<{
    key: string;
    entries: LeaderboardEntryWithPlatforms[];
    /** Distinct live operators in this breakdown query (the honest "N of M"
     *  denominator — a platform filter shrinks M; per-platform rows can
     *  outnumber operators). */
    operators: number | null;
    meta: FetchedMeta;
  } | null>(null);
  const [totals, setTotals] = useState<{
    windowEnum: string;
    entries: LeaderboardEntryWithPlatforms[];
    meta: FetchedMeta;
  } | null>(null);
  // Separate loading flags — the breakdown fetch and the all-time lazy-load
  // are independent requests; one shared flag let a breakdown in flight
  // silently block pagination.
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [totalsLoading, setTotalsLoading] = useState(false);
  // Per-family error flags — a successful totals refresh must not erase the
  // error strip (and its Retry affordance) for an unresolved breakdown
  // failure on a platform view, and vice versa.
  const [totalsError, setTotalsError] = useState(false);
  const [breakdownError, setBreakdownError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  // Stale-response guards: only the newest request may commit. One sequence
  // per fetch family so a breakdown fetch can't cancel a totals lazy-load.
  const breakdownSeq = useRef(0);
  const totalsSeq = useRef(0);

  const resolvedWindowEnum = windowEnum ?? "all_time";
  // Full query identity for the breakdown slot — window + platform filter
  // (the breakdown mode is always 'platforms' for this slot). A response
  // from any other query can never render under the active selection.
  const breakdownKey = `${resolvedWindowEnum}|platforms|${platformFilter ?? ""}`;
  const breakdownForQuery =
    breakdown && breakdown.key === breakdownKey ? breakdown : null;
  const totalsForWindow =
    totals && totals.windowEnum === resolvedWindowEnum ? totals : null;

  // Fetch the COMPLETE totals dataset for the active window. Shared by the
  // pagination lazy-load AND the realtime refresh — one slot, so a refresh
  // can never truncate the displayed set to a page size, and a later page
  // fetch always updates what's on screen. `background` = realtime refresh:
  // same commit path, but failures keep the last-good data without flashing
  // the loading strip.
  const fetchTotals = useCallback(
    (opts: { background?: boolean } = {}) => {
      // No windowEnum = no live contract to fetch under (legacy SSR-only
      // render) — never guess a window. resolvedWindowEnum is the SSR-default
      // fallback used ONLY for slot-key projection, not for fetches.
      if (!windowEnum) return;
      const we = windowEnum;
      const seq = ++totalsSeq.current;
      const controller = new AbortController();
      if (!opts.background) setTotalsLoading(true);
      fetch(liveBoardUrl(we, "total"), {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error(`board fetch failed (${r.status})`);
          return r.json();
        })
        .then((d) => {
          if (controller.signal.aborted || totalsSeq.current !== seq) return;
          // A 200 with source:'unavailable' is a degraded payload, not a
          // successful empty board — never commit it over last-good data.
          if (!d || d.source === "unavailable") {
            setTotalsError(true);
            setTotalsLoading(false);
            return;
          }
          setTotals({
            windowEnum: we,
            entries: (d.entries ?? []).map(mapApiEntry),
            meta: metaFromApi(d),
          });
          setTotalsError(false);
          setTotalsLoading(false);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (totalsSeq.current !== seq) return;
          setTotalsError(true);
          setTotalsLoading(false);
        });
    },
    [windowEnum],
  );

  const loadTotals = useCallback(() => {
    // Already holding the complete totals dataset for this window (lazy load
    // or a realtime refresh wrote it) — pagination over it is client-side.
    if (totalsForWindow || totalsLoading) return;
    fetchTotals();
  }, [totalsForWindow, totalsLoading, fetchTotals]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page <= 0 || viewPlatforms || platformFilter) return;
      // No windowEnum = no live contract to fetch under (legacy SSR-only
      // render) — never guess a window for the fetch.
      if (!windowEnum) return;
      // Bounded windows SSR the full row set — the fetch is needed only when
      // the SSR slice may be incomplete (the all-time board caps at 400 rows)
      // or the totals slot hasn't been populated yet on a window that paginates.
      if (win === "all" || totalEntries.length < totalCount) loadTotals();
    },
    [
      win,
      viewPlatforms,
      platformFilter,
      windowEnum,
      totalEntries.length,
      totalCount,
      loadTotals,
    ],
  );

  // If the window changes while a totals fetch is in flight, invalidate it —
  // its commit guard also keys on windowEnum, this just frees the flag early.
  // breakdown is keyed by full query identity too: a response landing after
  // a window/platform change is discarded at render time by the key check.
  useEffect(() => {
    setTotalsLoading(false);
    setBreakdownLoading(false);
    totalsSeq.current += 1;
    breakdownSeq.current += 1;
  }, [resolvedWindowEnum]);

  // Realtime refresh = the same complete-dataset fetch, run in the
  // background. A realtime event can never shrink the board to a page.
  const refreshTotals = useCallback(
    () => fetchTotals({ background: true }),
    [fetchTotals],
  );

  // Realtime: subscribe to metric_snapshots changes. No-op when realtime is
  // disabled/unavailable — the board simply shows the ISR render.
  useBoardRealtime({ onRefresh: refreshTotals });

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
    const key = `${windowEnum}|platforms|${platformFilter ?? ""}`;
    setBreakdownLoading(true);
    setBreakdownError(false);

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
        // source:'unavailable' is a degraded 200, not a successful empty —
        // keep the last-good slot (keyed to ITS query, so a different
        // platform's rows still can't render) and surface the error strip.
        if (!d || d.source === "unavailable") {
          setBreakdownError(true);
          setBreakdownLoading(false);
          return;
        }
        setBreakdown({
          key,
          entries: (d.entries ?? []).map(mapApiEntry),
          operators:
            typeof d.operators_returned === "number"
              ? d.operators_returned
              : null,
          meta: metaFromApi(d),
        });
        setBreakdownLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (breakdownSeq.current !== seq) return;
        // Keep the last good breakdown on screen; flag the failure so the
        // user sees a retry affordance instead of a silently stale table.
        setBreakdownError(true);
        setBreakdownLoading(false);
      });
    return () => controller.abort();
    // retryTick re-runs this effect on demand (error-strip Retry button).
  }, [viewPlatforms, platformFilter, windowEnum, retryTick]);

  // Platform views use breakdown rows; the totals view shows the complete
  // fetched dataset once present (lazy load or realtime refresh) over the
  // SSR first page. Every fetched slot is keyed to the query it came from —
  // a response from a different window/platform can never render here.
  let entries: LeaderboardEntryWithPlatforms[];
  let displayed: FetchedMeta | null = null;
  const platformView = viewPlatforms || Boolean(platformFilter);
  if (platformView) {
    // Fetched breakdown rows — or empty while loading/failed (the error strip
    // communicates the failure; never substitute the totals population here).
    entries = breakdownForQuery?.entries ?? [];
    displayed = breakdownForQuery?.meta ?? null;
  } else if (totalsForWindow) {
    entries = totalsForWindow.entries;
    displayed = totalsForWindow.meta;
  } else {
    entries = totalEntries;
  }

  // ── Provenance strip ────────────────────────────────────────────────
  // All volatile "what am I looking at" chrome lives here, inside the client
  // island, driven by the meta of the dataset actually on screen. The SSR
  // header deliberately renders no source/freshness claims — otherwise a
  // supabase→snapshot fetch would leave stale "Live data" text attached to
  // rows the server never sent.
  const shownSource = displayed?.source ?? ssrSource ?? "supabase";
  const shownDate = displayed ? displayed.sourceDate : (ssrSourceDate ?? null);
  // Platform views count what the filter actually returned; the totals view
  // shows the eligible population of the displayed dataset (SSR prop until a
  // fetch supersedes it). A failed/absent breakdown reads 0, not the SSR
  // total — the strip must describe the displayed dataset, and that's empty.
  const distinctOpsInRows = new Set(entries.map((e) => e.codename)).size;
  const shownOps = platformView
    ? (breakdownForQuery?.operators ?? distinctOpsInRows)
    : (displayed?.population ?? totalCount);
  // Baseline counts only ever describe rows on screen: on platform views,
  // count The Field (isSeed = unclaimed-but-eligible) among displayed
  // entries — baseline_population is pre-filter and would assert membership
  // the platform filter may have excluded.
  const baselineInRows = new Set(
    entries.filter((e) => e.isSeed).map((e) => e.codename),
  ).size;
  const shownBaseline = platformView
    ? baselineInRows
    : (displayed?.baseline ?? baselineProp ?? 0);
  const claimedShown = Math.max(0, shownOps - shownBaseline);
  const dotClass =
    shownSource === "supabase"
      ? liveStyles.liveDot
      : shownSource === "snapshot"
        ? `${liveStyles.liveDot} ${liveStyles.liveDotStale}`
        : `${liveStyles.liveDot} ${liveStyles.liveDotDown}`;

  // Per-family errors: the strip shows the failure for the view being
  // rendered; a totals refresh success can't erase an open breakdown error.
  const activeError = platformView ? breakdownError : totalsError;
  const loading = breakdownLoading || totalsLoading;

  return (
    <div>
      <p
        className={liveStyles.provenance}
        style={{ margin: "0 0 0.9rem" }}
        role="status"
        aria-live="polite"
      >
        <span className={dotClass}>{SOURCE_LABEL[shownSource]}</span>
        <span aria-hidden="true" className={liveStyles.sep}>
          ·
        </span>
        {platformView ? (
          <span>
            <strong>{shownOps}</strong>{" "}
            {shownOps === 1 ? "operator" : "operators"}
            {platformFilter && platformLabel ? ` on ${platformLabel}` : ""}
            {entries.length > shownOps
              ? ` · ${entries.length} platform rows`
              : ""}
            {shownBaseline > 0 ? ` incl. ${shownBaseline} baseline` : ""}
          </span>
        ) : (
          <span>
            <strong>{claimedShown}</strong> claimed{" "}
            {claimedShown === 1 ? "operator" : "operators"}
            {shownBaseline > 0 ? (
              <>
                {" "}
                + <strong>{shownBaseline}</strong> baseline
              </>
            ) : null}
          </span>
        )}
        {windowShort ? (
          <>
            <span aria-hidden="true" className={liveStyles.sep}>
              ·
            </span>
            <span>
              window <strong>{windowShort}</strong>
            </span>
          </>
        ) : null}
        {shownSource === "supabase" && shownDate ? (
          <>
            <span aria-hidden="true" className={liveStyles.sep}>
              ·
            </span>
            <span>
              snapshots through <strong>{shownDate}</strong>
            </span>
          </>
        ) : null}
        {shownSource === "snapshot" ? (
          <>
            <span aria-hidden="true" className={liveStyles.sep}>
              ·
            </span>
            <span>
              {shownDate ? (
                <>
                  captured <strong>{shownDate}</strong>
                </>
              ) : (
                "captured date unknown"
              )}{" "}
              — live data temporarily unavailable
            </span>
          </>
        ) : null}
      </p>
      {activeError ? (
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
              if (platformView) {
                setBreakdownError(false);
                setRetryTick((t) => t + 1);
              } else {
                setTotalsError(false);
                fetchTotals();
              }
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
      {loading ? (
        <p aria-live="polite" className="mb-2 text-[11px] text-text-muted">
          Loading{" "}
          {platformView
            ? platformFilter
              ? `${platformLabel ?? platformFilter} results`
              : "platform breakdown"
            : `${win === "all" ? "all-time" : win} board`}
          …
        </p>
      ) : null}
      <LeaderboardTable
        entries={entries}
        totalUsers={shownOps}
        baselineCount={shownBaseline}
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
