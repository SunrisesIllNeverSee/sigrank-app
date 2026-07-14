"use client";

/**
 * HallContentClient — client wrapper for the Hall of Signal content.
 *
 * The server page is static (doesn't read searchParams → CDN-cached via
 * revalidate=300). This client component reads useSearchParams to determine
 * the active class/platform/window filters, then selects + filters from the
 * pre-fetched data (all 4 windows, no class/platform filter) passed by the
 * server. No API calls needed — all data is pre-fetched.
 *
 * The server fetches base rows for all 4 windows (limit 30 for headroom).
 * This client filters by class/platform, sorts into 18 boards using sortValue,
 * and renders the ticker + MetricTopTen boards.
 */

import React from "react";
import { useSearchParams } from "next/navigation";
import type { LeaderboardRow } from "@/lib/data";
import { sortValue } from "@/lib/data/sort-value";
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  type PlatformUI,
} from "@/lib/constants";
import { boardWindowBySlug } from "@/lib/data/windows";
import { isOutlierRow } from "@/lib/data/outlier-classify";
import { DISPLAY_RAW, DISPLAY_METRICS } from "@/lib/canon/ids";
import { recordValue } from "@/lib/hall/record-value";
import { HallHeader } from "@/components/hall/HallHeader";
import { MetricTopTen } from "@/components/hall/MetricTopTen";
import { RecordTicker } from "@/components/hall/RecordTicker";

/** Op-ratio variant board ids (Y.10–Y.12) — split out of DISPLAY_METRICS so they
 *  render in their own "Operating Ratio Records" section. */
const OP_RATIO_IDS = new Set(["Y.10", "Y.11", "Y.12"]);

const CASCADE_BOARDS = DISPLAY_METRICS.filter(
  (d) => !OP_RATIO_IDS.has(d.id),
).map((d) => ({
  canonId: d.id,
  sort: d.key,
}));
const OP_RATIO_BOARDS = DISPLAY_METRICS.filter((d) =>
  OP_RATIO_IDS.has(d.id),
).map((d) => ({
  canonId: d.id,
  sort: d.key,
}));
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({ canonId: d.id, sort: d.key }));
const ALL_BOARDS = [...CASCADE_BOARDS, ...OP_RATIO_BOARDS, ...RAW_BOARDS];

const DISPLAY_BY_ID: Record<string, (typeof DISPLAY_METRICS)[number]> =
  Object.fromEntries(
    [...DISPLAY_RAW, ...DISPLAY_METRICS].map((d) => [d.id, d]),
  );

interface Props {
  /** Base rows for all 4 windows, keyed by window slug. No class/platform filter
   *  applied (the client filters). Limit 30 per window for headroom. */
  windowsData: Record<string, LeaderboardRow[]>;
}

/** Coerce a raw search param to a known union member, else the fallback. */
function coerce<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function HallContentClient({ windowsData }: Props) {
  const searchParams = useSearchParams();

  const classParam = searchParams.get("class") ?? "all";
  const platformParam = searchParams.get("platform");
  const windowParam = searchParams.get("window") ?? "all";

  const activeClass = classParam;
  const platform = coerce<PlatformUI>(
    platformParam,
    PLATFORM_UI,
    PLATFORM_DEFAULT,
  );
  const win = boardWindowBySlug(windowParam) ?? boardWindowBySlug("all")!;
  const windowSlug = win.slug;

  // Select the right window's data, then filter by class + platform.
  let baseRows = windowsData[win.slug] ?? [];
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

  // Sort into 18 boards (same as the server did: one base fetch, N in-memory sorts).
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
    <>
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
    </>
  );
}
