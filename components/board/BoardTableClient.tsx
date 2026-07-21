"use client";

/**
 * BoardTableClient — client wrapper for the board table on ISR-cached pages.
 *
 * PERF (2026-07-21): The server now only sends the first 25 entries (page 0)
 * for SSR + SEO. This client fetches subsequent pages + the perPlatform dataset
 * via the /api/v1/leaderboard API when needed. This cuts /board/all from 3.8MB
 * to ~100KB.
 *
 * The server page is static (doesn't read searchParams → CDN-cached via
 * revalidate=3600). This client component reads useSearchParams to determine
 * the active platform filter + view mode.
 *
 * For the "off" board (allSnapshots), all entries are still passed from the
 * server (smaller dataset, no pagination needed).
 */

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/sigrank";
import { PLATFORM_DOMAIN_MAP, type PlatformUI } from "@/lib/constants";
import type { LeaderboardEntryWithPlatforms } from "@/lib/board/to-entry";

interface Props {
  /** First page of operatorTotal entries (25 rows) for SSR + SEO. */
  totalEntries: LeaderboardEntryWithPlatforms[];
  /** Total operator count (for pagination). */
  totalCount: number;
  /** allSnapshots entries (for the "off" board only). */
  offEntries?: LeaderboardEntryWithPlatforms[];
  /** The board window slug (7d/30d/90d/all/off). */
  window: string;
  /** The board window enum for API calls (e.g. "all_time"). */
  windowEnum?: string;
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
  offEntries,
  window: win,
  windowEnum,
}: Props) {
  const searchParams = useSearchParams();
  const isOff = win === "off";

  const platformFilter = normalizePlatform(searchParams.get("platform"));
  const viewPlatforms = searchParams.get("view") === "platforms";
  const platformLabel = platformLabelFor(platformFilter);

  // State for API-fetched entries (pages beyond 0, or perPlatform view)
  const [fetchedEntries, setFetchedEntries] = useState<
    LeaderboardEntryWithPlatforms[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  // Fetch perPlatform entries when ?view=platforms or a platform filter is active
  useEffect(() => {
    if (isOff || (!viewPlatforms && !platformFilter)) {
      setFetchedEntries(null);
      return;
    }
    if (!windowEnum) return;

    setLoading(true);
    const params = new URLSearchParams({
      metric: "yield",
      window: windowEnum,
      limit: "2000",
    });
    if (platformFilter) params.set("platform", platformFilter);

    fetch(`/api/v1/leaderboard?${params.toString()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => {
        // The API returns entries in a different shape — map them to
        // LeaderboardEntryWithPlatforms. The API already does perPlatform
        // when a platform filter is set.
        const entries = (d.entries ?? []).map(mapApiEntry);
        setFetchedEntries(entries);
      })
      .catch(() => setFetchedEntries([]))
      .finally(() => setLoading(false));
  }, [isOff, viewPlatforms, platformFilter, windowEnum]);

  if (isOff) {
    // "off" board: all entries passed from server, no API fetching.
    return (
      <LeaderboardTable
        entries={offEntries ?? []}
        totalUsers={offEntries?.length ?? 0}
        window={win}
        platform={platformLabel}
        view="total"
      />
    );
  }

  // Windowed board: use fetched entries if viewing platforms or filtering,
  // otherwise use the server-provided first page.
  let entries: LeaderboardEntryWithPlatforms[];
  if (viewPlatforms || platformFilter) {
    entries = fetchedEntries ?? [];
  } else {
    entries = totalEntries;
  }

  return (
    <LeaderboardTable
      entries={entries}
      totalUsers={viewPlatforms || platformFilter ? entries.length : totalCount}
      window={win}
      platform={platformLabel}
      view={viewPlatforms ? "platforms" : "total"}
    />
  );
}

/** Map an API leaderboard entry to the LeaderboardEntryWithPlatforms shape. */
function mapApiEntry(api: Record<string, unknown>): LeaderboardEntryWithPlatforms {
  return {
    rank: (api.rank as number) ?? 0,
    anonId: (api.display_name as string) ?? (api.codename as string) ?? "?",
    codename: (api.codename as string) ?? "?",
    signalClass: ((api.class_tier as string) ?? "BURNER") as any,
    platform: (api.platform as string) ?? undefined,
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
    acctAge: "—",
    lastSeen: (api.last_seen as string) ?? null,
    status: (api.status as string) ?? undefined,
    isSeed: (api.is_placeholder as boolean) ?? false,
    percentile: (api.percentile as number) ?? null,
  } as LeaderboardEntryWithPlatforms;
}
