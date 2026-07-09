"use client";

/**
 * BoardTableClient — client wrapper for the board table on ISR-cached pages.
 *
 * The server page is static (doesn't read searchParams → CDN-cached via
 * revalidate=300). This client component reads useSearchParams to determine
 * the active platform filter + view mode, then selects + filters from the
 * two pre-fetched entry sets (operatorTotal + perPlatform) passed by the
 * server. No API calls needed — all data is pre-fetched.
 *
 * For the "off" board (allSnapshots), platform filtering is already client-side
 * in LeaderboardTable, so we just pass the entries through with the URL state.
 */

import React from "react";
import { useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/sigrank";
import { PLATFORM_DOMAIN_MAP, type PlatformUI } from "@/lib/constants";
import type { LeaderboardEntryWithPlatforms } from "@/lib/leaderboard/to-entry";

interface Props {
  /** operatorTotal entries (one row per operator, the default board). */
  totalEntries: LeaderboardEntryWithPlatforms[];
  /** perPlatform entries (one row per operator×platform, for ?view=platforms). */
  platformEntries: LeaderboardEntryWithPlatforms[];
  /** allSnapshots entries (for the "off" board only). */
  offEntries?: LeaderboardEntryWithPlatforms[];
  /** The board window slug (7d/30d/90d/all/off). */
  window: string;
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
  platformEntries,
  offEntries,
  window: win,
}: Props) {
  const searchParams = useSearchParams();
  const isOff = win === "off";

  const platformFilter = normalizePlatform(searchParams.get("platform"));
  const viewPlatforms = searchParams.get("view") === "platforms";
  const platformLabel = platformLabelFor(platformFilter);

  if (isOff) {
    // "off" board: LeaderboardTable already filters client-side via its own
    // useState + useMemo. Just pass the entries + URL-driven initial state.
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

  // Windowed board: select the right dataset + filter by platform.
  let entries: LeaderboardEntryWithPlatforms[];
  if (viewPlatforms) {
    entries = platformEntries;
    if (platformFilter) {
      entries = entries.filter((e) => e.primaryDomain === platformFilter);
    }
  } else {
    entries = totalEntries;
    if (platformFilter) {
      entries = entries.filter((e) => e.primaryDomain === platformFilter);
    }
  }

  return (
    <LeaderboardTable
      entries={entries}
      totalUsers={entries.length}
      window={win}
      platform={platformLabel}
      view={viewPlatforms ? "platforms" : "total"}
    />
  );
}
