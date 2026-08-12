import React from "react";
import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { getLeaderboard } from "@/lib/board";
import { getStaticAllTimeBoard, staticEntriesToLeaderboardRows } from "@/lib/board/static-board";
import { BOARD_WINDOWS } from "@/lib/board/windows";
import { HallHero } from "@/components/hall/HallHero";
import { ComingSoonMarkers } from "@/components/hall/ComingSoonMarkers";
import { HallClient } from "@/components/hall/HallClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb } from "@/lib/jsonld";
import type { LeaderboardRow } from "@/lib/board";

export const metadata: Metadata = withOG({
  title: "Hall of Signal",
  description:
    "Triumphus Famae Et Gloriae — the permanent record of peak signal across the SigRank leaderboard.",
  path: "/hall",
});

// PERF (2026-08-12): page is now ISR (force-static + revalidate=300). The HTML
// is prerendered with all 4 windows of data and edge-cached — instant LCP.
// Platform/class/window filtering is handled client-side by HallClient via
// useSearchParams(), so dropdown changes are instant (no server round-trip).
// Previous setup (2026-07-31) used force-dynamic to read searchParams server-
// side, which gave a 3.4s LCP and 100% bounce rate (44 visitors, 44s median).
export const dynamic = "force-static";
export const revalidate = 300;

/**
 * /hall — Hall of Signal (D15 canonical route; /hall-of-signal redirects here).
 *
 * ISR page: fetches data for ALL 4 windows (30 rows each, unfiltered) at build
 * time, passes it to HallClient for client-side filtering by platform/class/window.
 * Default window = All time (the Hall is the all-time record book).
 */
export default async function HallPage() {
  // Pre-fetch base rows for all 4 windows (no class/platform filter).
  // Limit 30 per window gives headroom for platform/class filtering before
  // slicing to the top 10 per metric.
  const windowsData: Record<
    string,
    LeaderboardRow[]
  > = {};
  await Promise.all(
    BOARD_WINDOWS.map(async (w) => {
      if (w.enum === "all_time") {
        // Egress fix: all_time reads the static snapshot (no Supabase query).
        // Convert flat StaticBoardEntry[] → LeaderboardRow[] so sortValue,
        // recordValue, and isOutlierRow can access the nested shape they expect.
        const staticEntries = getStaticAllTimeBoard();
        windowsData[w.slug] = staticEntriesToLeaderboardRows(
          staticEntries.slice(0, 30),
        );
      } else {
        windowsData[w.slug] = await getLeaderboard({
          window: w.enum,
          windowFilter: true,
          limit: 30,
        });
      }
    }),
  );

  return (
    <div>
      <JsonLd data={breadcrumb([{ name: "Hall of Signal", path: "/hall" }])} />
      {/* HALL-1: animated masthead. */}
      <HallHero />

      {/* HALL-4/2/3: record ticker + filter dropdowns + 18 metric boards.
          All filtering is client-side (HallClient reads URL params). */}
      <HallClient windowsData={windowsData} />

      {/* ── What is the Hall? — moved to bottom (owner 2026-07-09) ── */}
      <section className="mx-auto mt-8 max-w-2xl px-4 pb-6">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The Hall of Signal is the permanent record of peak operator
          performance across the SigRank leaderboard. Where the leaderboard
          shows the current field, the Hall preserves the all-time best — the
          operators who achieved the highest yield, the cleanest cascades, and
          the most efficient token architecture on record. Entries are immutable
          once recorded.
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          The Hall updates as new snapshots are submitted. An operator who
          achieves a higher yield in a future session takes the record — the
          previous mark stands as a benchmark to beat. Class tiers (Burner,
          Builder, 10×er) are determined by yield thresholds, not raw output, so
          the Hall rewards efficiency architecture over brute-force token
          production.
        </p>
      </section>

      {/* HALL Task 6: coming-soon markers (Eras teaser · Season Leaders · Sessions) —
          the footer "On the horizon" area per HALL_DESIGN §2/§6/§7. Last child of the page. */}
      <div className="mt-12">
        <ComingSoonMarkers />
      </div>
    </div>
  );
}
