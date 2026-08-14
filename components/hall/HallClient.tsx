"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LeaderboardRow } from "@/lib/board";
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  CLASS_FILTER,
  type PlatformUI,
} from "@/lib/constants";
import { boardWindowBySlug } from "@/lib/board/windows";
import { DISPLAY_RAW, DISPLAY_METRICS } from "@/lib/identity/canon-ids";
import { sortValue } from "@/lib/analytics/sort-value";
import { isOutlierRow } from "@/lib/analytics/outlier-classify";
import { recordValue } from "@/lib/analytics/record-value";
import { HallHeader } from "./HallHeader";
import { MetricTopTen } from "./MetricTopTen";
import { RecordTicker } from "./RecordTicker";

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

interface Props {
  /** Pre-fetched data for all 4 windows (30 rows each, unfiltered). */
  windowsData: Record<string, LeaderboardRow[]>;
}

/**
 * HallClient — the interactive Hall of Signal board grid.
 *
 * Receives ALL 4 windows of unfiltered data from the static server page and
 * handles platform/class/window filtering entirely client-side via URL params.
 * This lets the /hall page be ISR (force-static + revalidate=300) so the HTML
 * is prerendered and edge-cached — instant LCP — while filtering stays instant
 * (no server round-trip on dropdown change).
 */
export function HallClient({ windowsData }: Props) {
  const sp = useSearchParams();
  // Avoid hydration mismatch: useSearchParams() returns null during SSR
  // prerender but the actual params on the client. Render with defaults
  // until mounted, then switch to URL params.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const classParam = (mounted ? sp.get("class") : null) ?? "all";
  const platformParam = mounted ? sp.get("platform") : null;
  const windowParam = (mounted ? sp.get("window") : null) ?? "all";

  const activeClass = classParam;
  const platform = coerce<PlatformUI>(
    platformParam,
    PLATFORM_UI,
    PLATFORM_DEFAULT,
  );
  const win = boardWindowBySlug(windowParam) ?? boardWindowBySlug("all")!;
  const windowSlug = win.slug;

  // Filter the selected window's data to REAL operators only (claimed + active),
  // then by platform + class (client-side). The Hall is for active users with
  // real verified submissions — not seed/scraped data (owner 2026-08-12).
  const baseRows = useMemo(() => {
    let rows: LeaderboardRow[] = (windowsData[win.slug] ?? []).filter(
      (r) => r.operator.claimed && r.operator.status !== "retired",
    );
    if (platform !== PLATFORM_DEFAULT) {
      const domain = platform.toLowerCase();
      rows = rows.filter(
        (r) => r.operator.primary_domain?.toLowerCase() === domain,
      );
    }
    if (activeClass !== "all") {
      rows = rows.filter(
        (r) =>
          r.snapshot.class_tier?.toLowerCase() === activeClass.toLowerCase(),
      );
    }
    return rows;
  }, [windowsData, win.slug, platform, activeClass]);

  // Sort into 18 boards (one base fetch, N in-memory sorts).
  const metricRows = useMemo(
    () =>
      ALL_BOARDS.map((b) =>
        [...baseRows]
          .sort((a, z) => sortValue(z, b.sort) - sortValue(a, b.sort))
          .slice(0, 10)
          .map((r, i) => ({ ...r, global_rank: i + 1 })),
      ),
    [baseRows],
  );

  // Record ticker — #1 holder of every board.
  const tickerItems = useMemo(
    () =>
      ALL_BOARDS.map((b, i) => {
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
      }).filter((x): x is NonNullable<typeof x> => x !== null),
    [metricRows],
  );

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
