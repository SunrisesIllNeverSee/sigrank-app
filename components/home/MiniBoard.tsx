import React from "react";
import Link from "next/link";
import type { LeaderboardRow } from "@/lib/data";

/**
 * MiniBoard — a compact top-5 leaderboard for one metric, for the landing-page
 * box rows. Server component; rows are pre-sorted/sliced by the caller via
 * getMetricLeaders(metric, { limit: 5 }), so this only formats + links.
 *
 * Each board is titled by its metric (Υ Yield / Leverage / 10xDEV / Volume) and
 * shows rank · operator · the metric value, with a gold bar proportional to the
 * top row (so the #1 reads as a full bar and the rest scale against it).
 */

export type MiniMetric = "yield" | "leverage" | "dev10x" | "volume";

const META: Record<MiniMetric, { title: string; glyph: string }> = {
  yield: { title: "Top Υ Yield", glyph: "Υ" },
  leverage: { title: "Top Leverage", glyph: "×" },
  dev10x: { title: "Top 10xDEV", glyph: "⚡" },
  volume: { title: "Top Volume", glyph: "tok" },
};

/** Pull the display value + a raw magnitude for a row under a given metric. */
function readMetric(
  row: LeaderboardRow,
  metric: MiniMetric,
): { value: string; raw: number } {
  const c = row.snapshot.cascade;
  switch (metric) {
    case "yield": {
      const v = c && !c.nonCompounding ? c.yield_ : 0;
      return {
        value: v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0),
        raw: v,
      };
    }
    case "leverage": {
      const v = c && !c.nonCompounding ? c.leverage : 0;
      return {
        value: v >= 1000 ? `${(v / 1000).toFixed(1)}K×` : `${v.toFixed(0)}×`,
        raw: v,
      };
    }
    case "dev10x": {
      const v = c && !c.nonCompounding && c.dev10x !== null ? c.dev10x : 0;
      return { value: v.toFixed(2), raw: v };
    }
    case "volume": {
      const v = row.operator.total_messages_lifetime;
      const b =
        v >= 1e9
          ? `${(v / 1e9).toFixed(1)}B`
          : v >= 1e6
            ? `${(v / 1e6).toFixed(1)}M`
            : v.toLocaleString("en-US");
      return { value: b, raw: v };
    }
  }
}

function label(row: LeaderboardRow): string {
  const op = row.operator;
  // Claimed → may show handle; else codename. Seed identities are public tokscale data.
  if (op.claimed && op.display_name) return op.display_name;
  return op.display_name ?? op.codename;
}

export function MiniBoard({
  metric,
  rows,
}: {
  metric: MiniMetric;
  rows: LeaderboardRow[];
}) {
  const meta = META[metric];
  const top5 = rows.slice(0, 5);
  const max = Math.max(...top5.map((r) => readMetric(r, metric).raw), 1);

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {meta.title}
        </span>
        <span className="font-mono text-[10px] text-gold">{meta.glyph}</span>
      </div>
      <ol className="flex flex-col gap-1">
        {top5.map((row) => {
          const m = readMetric(row, metric);
          const frac = Math.max(0.04, m.raw / max);
          return (
            <li key={row.operator.operator_id}>
              <Link
                href={`/user/${row.operator.codename}`}
                className="group flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-bg-elevated"
              >
                <span className="w-4 shrink-0 font-mono text-[10px] text-text-dim">
                  {row.global_rank}
                </span>
                <span className="min-w-0 flex-[1.4] truncate font-mono text-xs text-text-primary">
                  {label(row)}
                </span>
                <span className="relative hidden h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated sm:block">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gold/70"
                    style={{ width: `${frac * 100}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-[11px] font-medium text-text-secondary">
                  {m.value}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
