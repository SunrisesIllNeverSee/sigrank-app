import React from "react";
import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { getLeaderboard } from "@/lib/board";
import { getStaticAllTimeBoard } from "@/lib/board/static-board";
import { BOARD_WINDOWS, boardWindowBySlug } from "@/lib/board/windows";
import { HallHero } from "@/components/hall/HallHero";
import { ComingSoonMarkers } from "@/components/hall/ComingSoonMarkers";
import { HallHeader } from "@/components/hall/HallHeader";
import { MetricTopTen } from "@/components/hall/MetricTopTen";
import { RecordTicker } from "@/components/hall/RecordTicker";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb } from "@/lib/jsonld";
import { sortValue } from "@/lib/analytics/sort-value";
import { isOutlierRow } from "@/lib/analytics/outlier-classify";
import { recordValue } from "@/lib/analytics/record-value";
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  type PlatformUI,
} from "@/lib/constants";
import { DISPLAY_RAW, DISPLAY_METRICS } from "@/lib/identity/canon-ids";
import type { LeaderboardRow } from "@/lib/board";

export const metadata: Metadata = withOG({
  title: "Hall of Signal",
  description:
    "Triumphus Famae Et Gloriae — the permanent record of peak signal across the SigRank leaderboard.",
  path: "/hall",
});

// PERF (2026-07-31): page is now dynamic (reads searchParams on the server)
// so boards are server-rendered in the HTML — no Suspense skeleton fallback.
// The data layer is still cached via the in-memory memo cache (lib/board/memo).
// Previous setup used useSearchParams in a client component wrapped in
// Suspense, which meant the static HTML only showed loading skeletons and
// LCP waited for JS hydration (score 9).
export const dynamic = "force-dynamic";

/** Op-ratio variant board ids (Y.10–Y.12). */
const OP_RATIO_IDS = new Set(["Y.10", "Y.11", "Y.12"]);

const CASCADE_BOARDS = DISPLAY_METRICS.filter(
  (d) => !OP_RATIO_IDS.has(d.id),
).map((d) => ({ canonId: d.id, sort: d.key }));
const OP_RATIO_BOARDS = DISPLAY_METRICS.filter((d) =>
  OP_RATIO_IDS.has(d.id),
).map((d) => ({ canonId: d.id, sort: d.key }));
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({ canonId: d.id, sort: d.key }));
const ALL_BOARDS = [...CASCADE_BOARDS, ...OP_RATIO_BOARDS, ...RAW_BOARDS];

const DISPLAY_BY_ID: Record<string, (typeof DISPLAY_METRICS)[number]> =
  Object.fromEntries(
    [...DISPLAY_RAW, ...DISPLAY_METRICS].map((d) => [d.id, d]),
  );

function coerce<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

/**
 * /hall — Hall of Signal (D15 canonical route; /hall-of-signal redirects here).
 *
 * Server component: fetches data for ALL 4 windows, reads class/platform/window
 * filters from searchParams, filters + sorts into 18 boards, and renders them
 * server-side. The HallHeader client component handles the filter dropdowns.
 * Default window = All time (the Hall is the all-time record book).
 */
export default async function HallPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; platform?: string; window?: string }>;
}) {
  const sp = await searchParams;
  const classParam = sp.class ?? "all";
  const platformParam = sp.platform ?? null;
  const windowParam = sp.window ?? "all";

  const activeClass = classParam;
  const platform = coerce<PlatformUI>(
    platformParam,
    PLATFORM_UI,
    PLATFORM_DEFAULT,
  );
  const win = boardWindowBySlug(windowParam) ?? boardWindowBySlug("all")!;
  const windowSlug = win.slug;

  // Pre-fetch base rows for all 4 windows (no class/platform filter).
  // Limit 30 per window gives headroom for platform/class filtering before
  // slicing to the top 10 per metric.
  const windowsData: Record<
    string,
    Awaited<ReturnType<typeof getLeaderboard>>
  > = {};
  await Promise.all(
    BOARD_WINDOWS.map(async (w) => {
      if (w.enum === "all_time") {
        // Egress fix: all_time reads the static snapshot (no Supabase query).
        const staticEntries = getStaticAllTimeBoard();
        windowsData[w.slug] = staticEntries.slice(0, 30) as unknown as Awaited<ReturnType<typeof getLeaderboard>>;
      } else {
        windowsData[w.slug] = await getLeaderboard({
          window: w.enum,
          windowFilter: true,
          limit: 30,
        });
      }
    }),
  );

  // Select the right window's data, then filter by class + platform.
  let baseRows: LeaderboardRow[] = windowsData[win.slug] ?? [];
  if (platform !== PLATFORM_DEFAULT) {
    const domain = platform.toLowerCase();
    baseRows = baseRows.filter(
      (r) => r.operator.primary_domain?.toLowerCase() === domain,
    );
  }
  if (activeClass !== "all") {
    baseRows = baseRows.filter(
      (r) => r.snapshot.class_tier?.toLowerCase() === activeClass.toLowerCase(),
    );
  }

  // Sort into 18 boards (one base fetch, N in-memory sorts).
  const metricRows = ALL_BOARDS.map((b) =>
    [...baseRows]
      .sort((a, z) => sortValue(z, b.sort) - sortValue(a, b.sort))
      .slice(0, 10)
      .map((r, i) => ({ ...r, global_rank: i + 1 })),
  );

  // Record ticker — #1 holder of every board.
  const tickerItems = ALL_BOARDS.map((b, i) => {
    const top = metricRows[i]?.[0];
    if (!top) return null;
    const v = recordValue(top, b.canonId);
    if (v === "—") return null;
    return {
      board: DISPLAY_BY_ID[b.canonId]?.ticker ?? b.canonId,
      holder: top.operator.display_name || top.operator.codename,
      value: v,
      href: `/user/${top.operator.codename}`,
      outlier: isOutlierRow(top),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div>
      <JsonLd data={breadcrumb([{ name: "Hall of Signal", path: "/hall" }])} />
      {/* HALL-1: animated masthead. */}
      <HallHero />

      {/* HALL-4: record-highlights ticker (under the hero, above the filter block). */}
      <div className="mb-6">
        <RecordTicker items={tickerItems} />
      </div>

      {/* HALL-2: real platform / window / class dropdowns (URL-param driven). */}
      <div className="mb-8">
        <HallHeader
          platform={platform}
          windowSlug={windowSlug}
          classScope={activeClass}
        />
      </div>

      {/* Cascade Records — peak holders on every cascade metric (Y.01–Y.09). */}
      <h2 className="mb-1 font-mono text-lg font-bold tracking-wide text-text-primary">
        Cascade Records
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        The peak holders on every cascade metric. As the 730 windows fill, these
        become the all-time record book — who held the highest Υ, the deepest
        sessions, the cleanest signal.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CASCADE_BOARDS.map((b, i) => (
          <MetricTopTen
            key={b.canonId}
            canonId={b.canonId}
            rows={metricRows[i]}
          />
        ))}
      </div>

      {/* Operating Ratio Records — peak holders on the op-ratio variants
          (Y.10–Y.12): best overall, best cache, best output. */}
      <h2 className="mb-1 mt-10 font-mono text-lg font-bold tracking-wide text-text-primary">
        Operating Ratio Records
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        The operators with the strongest operating-ratio terms — the highest
        cache leverage, the cleanest cache efficiency, and the highest output
        velocity in the c:i:o composition.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {OP_RATIO_BOARDS.map((b, i) => (
          <MetricTopTen
            key={b.canonId}
            canonId={b.canonId}
            rows={metricRows[CASCADE_BOARDS.length + i]}
          />
        ))}
      </div>

      {/* Raw Records — peak holders on the raw token pillars (T.xx + $/1M). */}
      <h2 className="mb-1 mt-10 font-mono text-lg font-bold tracking-wide text-text-primary">
        Raw Records
      </h2>
      <p className="mb-4 max-w-2xl font-sans text-sm text-text-muted">
        The biggest raw token throughput — who pushed the most input, output,
        and cache, and who runs the cheapest wallet ($/1M).
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RAW_BOARDS.map((b, i) => (
          <MetricTopTen
            key={b.canonId}
            canonId={b.canonId}
            rows={metricRows[CASCADE_BOARDS.length + OP_RATIO_BOARDS.length + i]}
          />
        ))}
      </div>

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
