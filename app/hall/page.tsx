import React from "react";
import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { getLeaderboard } from "@/lib/board";
import { BOARD_WINDOWS } from "@/lib/board/windows";
import { HallHero } from "@/components/hall/HallHero";
import { ComingSoonMarkers } from "@/components/hall/ComingSoonMarkers";
import { HallClient } from "@/components/hall/HallClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";
import type { LeaderboardRow } from "@/lib/board";

export const metadata: Metadata = withOG({
  title: "Hall of Signal — Top AI Operators",
  description:
    "The top AI users in the world, ranked by measured token-cascade efficiency. Record-setting AI operators on the global SigRank leaderboard.",
  path: "/hall",
});

// PERF (2026-08-12): page is now ISR (force-static + revalidate=300). The HTML
// is prerendered with all 4 windows of data and edge-cached — instant LCP.
// Platform/class/window filtering is handled client-side by HallClient via
// useSearchParams(), so dropdown changes are instant (no server round-trip).
// Previous setup (2026-07-31) used force-dynamic to read searchParams server-
// side, which gave a 3.4s LCP and 100% bounce rate (44 visitors, 44s median).
//
// PERF (2026-09-02): Active all_time scope was fetching 1000 rows and passing
// ALL of them into RSC flight data (2.15MB HTML). Now filters for claimed
// operators server-side before serialization — ~22 rows instead of 1000.
// Other windows reduced from 100 to 50 (enough for top-10 boards + light
// platform/class filtering). Total SSR rows: ~22 + 50 + 3×50 = 172 (was 1400).
export const dynamic = "force-static";
export const revalidate = 300;

/**
 * /hall — Hall of Signal (D15 canonical route; /hall-of-signal redirects here).
 *
 * ISR page: fetches data for ALL 4 windows at build time, passes it to HallClient
 * for client-side filtering by platform/class/window.
 * Default window = All time (the Hall is the all-time record book).
 */
export default async function HallPage() {
  // Pre-fetch base rows for all 4 windows (no class/platform filter).
  // The Hall has two scopes:
  //   Active = claimed operators only (server-side filtered for all_time)
  //   All = same as Active — only claimed/live operators. The full seeded
  //         board (including unclaimed seed operators) lives on
  //         sigeconomy.com/all-time.
  // For all_time: fetch 1000 rows (claimed ops are buried below rank
  // 100), then filter for claimed && !retired SERVER-SIDE before passing to
  // the client — avoids serializing 1000 rows into RSC flight data.
  // For 7d/30d/90d: top 50 (claimed ops rank higher in recent windows).
  const windowsData: Record<string, LeaderboardRow[]> = {};
  const windowsDataAll: Record<string, LeaderboardRow[]> = {};
  await Promise.all(
    BOARD_WINDOWS.map(async (w) => {
      if (w.enum === "all_time") {
        // Active scope: fetch ALL snapshots (no window_type filter) so
        // operators who only submitted 7d/30d/90d also appear. Filter for
        // claimed server-side to avoid serializing 1000 rows.
        const activeRows = await getLeaderboard({
          window: w.enum,
          windowFilter: false,
          limit: 1000,
          operatorTotal: true,
        });
        windowsData[w.slug] = activeRows.filter(
          (r) => r.operator.claimed && r.operator.status !== "retired",
        );
        // All scope: same as Active — only claimed/live operators. The
        // full seeded board is on sigeconomy.com/all-time.
        windowsDataAll[w.slug] = windowsData[w.slug];
      } else {
        const liveRows = await getLeaderboard({
          window: w.enum,
          windowFilter: true,
          limit: 50,
          operatorTotal: true,
        });
        windowsData[w.slug] = liveRows;
        windowsDataAll[w.slug] = liveRows;
      }
    }),
  );

  return (
    <div>
      <JsonLd data={[
        breadcrumb([{ name: "Hall of Signal", path: "/hall" }]),
        faqPage([
          {
            question: "What is the Hall of Signal?",
            answer:
              "The Hall of Signal is the permanent record of peak signal across the SigRank leaderboard. It showcases the top AI operators by all-time Yield (Υ) across 18 metric boards — the record book for the best AI users measured by token cascade efficiency.",
          },
          {
            question: "Who qualifies for the Hall of Signal?",
            answer:
              "The Hall of Signal shows claimed operators with real verified submissions. Operators who have enrolled, submitted signed token telemetry snapshots, and have active status appear in the Hall. Seed and scraped data are excluded from the Active scope — only real users are in the record book.",
          },
          {
            question: "How many metric boards are in the Hall of Signal?",
            answer:
              "The Hall of Signal has 18 metric boards covering Yield, Leverage, Velocity, SNR, 10xDEV, Efficiency, Scale V, Cost per 1M tokens, Op Ratio, and more. Each board shows the top operators across 7-day, 30-day, 90-day, and all-time windows.",
          },
        ]),
      ]} />
      {/* HALL-1: animated masthead. */}
      <HallHero />

      {/* HALL-4/2/3: record ticker + filter dropdowns + 18 metric boards.
          All filtering is client-side (HallClient reads URL params). */}
      <HallClient windowsData={windowsData} windowsDataAll={windowsDataAll} />

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
