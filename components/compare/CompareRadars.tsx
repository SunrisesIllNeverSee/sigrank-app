/**
 * components/compare/CompareRadars.tsx — CMP-RADARS (owner 2026-06-22).
 *
 * Dual-layer head-to-head radar pair, consuming TERM's CascadeRadar `variant`
 * ('ghost' | 'solid') support (shared component — LEAD does NOT edit it):
 *
 *   - RAW radar    — the 6 raw pillars (input·output·cr·cw·total·cost), A + B solid.
 *   - METRICS radar — the 8 cascade metrics (Υ·SNR·Lev·Vel·10xDEV·$1M·Eff·OpRatio),
 *     A + B solid, with each operator's RAW footprint underlaid as a 'ghost' layer
 *     (shadowed fill) so you read raw-shape behind refined-metric shape — the
 *     owner's "layer 1 raw shadowed / layer 2 metrics solid".
 *
 * Cost axes are lower-wins → pre-inverted so "better" reaches outward on both
 * radars (matches the ledger's diverging bars). Pure presentational server
 * component over two rows. Reads pillars off row.telemetry, metrics off cascade.
 */

import React from "react";
import type { LeaderboardRow } from "@/lib/board";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import CascadeRadar, {
  type CascadeRadarSeries,
} from "@/components/charts/CascadeRadar";

const A_COLOR = "rgb(var(--class-arch))"; // blue (was --accent=green; one green B + one blue A, owner 2026-06-27)
const B_COLOR = "rgb(var(--class-seeker))";

function nameOf(row: LeaderboardRow): string {
  return operatorDisplayName(row);
}

interface Axis {
  label: string;
  /** numeric value per operator */
  a: number;
  b: number;
  /** ceiling for normalization (max of both, ≥1) */
  max: number;
  /** false = lower-wins (cost); pre-invert before projecting */
  higherWins: boolean;
}

function rawAxes(a: LeaderboardRow, b: LeaderboardRow): Axis[] {
  const ta = a.telemetry;
  const tb = b.telemetry;
  const totA = ta
    ? ta.fresh_input + ta.output + ta.cache_read + ta.cache_create
    : 0;
  const totB = tb
    ? tb.fresh_input + tb.output + tb.cache_read + tb.cache_create
    : 0;
  const ca = a.snapshot.cascade;
  const cb = b.snapshot.cascade;
  const mk = (
    label: string,
    av: number,
    bv: number,
    higherWins = true,
  ): Axis => ({
    label,
    a: av,
    b: bv,
    max: Math.max(av, bv, 1),
    higherWins,
  });
  return [
    mk("Input", ta?.fresh_input ?? 0, tb?.fresh_input ?? 0),
    mk("Output", ta?.output ?? 0, tb?.output ?? 0),
    mk("CR", ta?.cache_read ?? 0, tb?.cache_read ?? 0),
    mk("CW", ta?.cache_create ?? 0, tb?.cache_create ?? 0),
    mk("Total", totA, totB),
    mk("Cost", ca?.costPerMillion ?? 0, cb?.costPerMillion ?? 0, false),
  ];
}

function metricAxes(a: LeaderboardRow, b: LeaderboardRow): Axis[] {
  const ca = a.snapshot.cascade;
  const cb = b.snapshot.cascade;
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0;
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c ? pick(c) : 0;
  const mk = (
    label: string,
    av: number,
    bv: number,
    higherWins = true,
  ): Axis => ({
    label,
    a: av,
    b: bv,
    max: Math.max(av, bv, 1),
    higherWins,
  });
  return [
    mk(
      "Υ Yield",
      comp(ca, (x) => x.yield_),
      comp(cb, (x) => x.yield_),
    ),
    // Leverage ↔ SNR swapped (owner) so the longer "Leverage" label sits where it
    // reads without clipping.
    mk(
      "Leverage",
      comp(ca, (x) => x.leverage),
      comp(cb, (x) => x.leverage),
    ),
    mk(
      "SNR",
      raw(ca, (x) => x.snr),
      raw(cb, (x) => x.snr),
    ),
    mk(
      "Velocity",
      raw(ca, (x) => x.velocity),
      raw(cb, (x) => x.velocity),
    ),
    mk(
      "10xDEV",
      comp(ca, (x) => x.dev10x ?? 0),
      comp(cb, (x) => x.dev10x ?? 0),
    ),
    // Efficacy ↔ $/1M swapped (owner) — keeps efficiency next to the cost axis and
    // moves the longer label off the clipping edge.
    mk(
      "Efficacy",
      raw(ca, (x) => x.efficiency),
      raw(cb, (x) => x.efficiency),
    ),
    mk(
      "$/1M",
      raw(ca, (x) => x.costPerMillion),
      raw(cb, (x) => x.costPerMillion),
      false,
    ),
    mk(
      "Op Ratio",
      comp(ca, (x) => x.leverage),
      comp(cb, (x) => x.leverage),
    ), // ranks by lead term
  ];
}

/** Project an axis value outward (lower-wins inverted), clamped to [0, max]. */
function proj(ax: Axis, v: number): number {
  const c = Math.max(0, Math.min(ax.max, v));
  return ax.higherWins ? c : ax.max - c;
}

function RadarBlock({
  title,
  axes,
  aName,
  bName,
  ghost,
}: {
  title: string;
  axes: Axis[];
  aName: string;
  bName: string;
  /** optional ghost backdrop — per-axis 0..1 footprints (mapped onto each axis max) */
  ghost?: { a: number[]; b: number[] };
}) {
  // Direction arrow per axis: ↑ = higher is better, ↓ = lower is better (cost/$1M).
  // The radar already pre-inverts lower-wins axes so "better" reaches outward; the arrow
  // just tells the reader which way the underlying value is good (owner 2026-06-24).
  const radarAxes = axes.map((ax) => ({
    label: `${ax.label} ${ax.higherWins ? "↑" : "↓"}`,
    max: ax.max,
  }));
  const series: CascadeRadarSeries[] = [];
  if (ghost) {
    // Ghost values are 0..1 footprints; multiply by each axis's own max so the
    // radar's per-axis normalize() maps them back to the right radius. Pushed
    // first so the variant-sort still draws them behind the solid layers.
    series.push({
      name: `${aName} raw`,
      values: ghost.a.map((v, i) => v * (axes[i]?.max ?? 1)),
      color: A_COLOR,
      variant: "ghost",
    });
    series.push({
      name: `${bName} raw`,
      values: ghost.b.map((v, i) => v * (axes[i]?.max ?? 1)),
      color: B_COLOR,
      variant: "ghost",
    });
  }
  series.push({
    name: aName,
    values: axes.map((ax) => proj(ax, ax.a)),
    color: A_COLOR,
    variant: "solid",
  });
  series.push({
    name: bName,
    values: axes.map((ax) => proj(ax, ax.b)),
    color: B_COLOR,
    variant: "solid",
  });

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-bg-border bg-bg-surface p-4">
      <span className="font-sans text-[11px] uppercase tracking-widest text-text-muted">
        {title}
      </span>
      <CascadeRadar axes={radarAxes} series={series} size={300} />
      <span className="font-sans text-[10px] text-text-muted">
        ↑ higher is better · ↓ lower is better (cost) — both reach outward when
        good
      </span>
    </div>
  );
}

export function CompareRadars({
  a,
  b,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
}) {
  const aName = nameOf(a);
  const bName = nameOf(b);
  const rAxes = rawAxes(a, b);
  const mAxes = metricAxes(a, b);

  // Ghost backdrop on the METRICS radar = each operator's RAW footprint,
  // normalized 0..1 per raw axis, then mapped onto the metric radar's scale.
  // It's an intentional footprint (approximate), not a precise overlay.
  const ghostA = rAxes.map((ax) => proj(ax, ax.a) / ax.max);
  const ghostB = rAxes.map((ax) => proj(ax, ax.b) / ax.max);
  // Pad/truncate ghost to the metric axis count (8) so positional align holds.
  const fit = (arr: number[]) =>
    Array.from({ length: mAxes.length }, (_, i) => arr[i % arr.length] ?? 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RadarBlock title="Raw shape" axes={rAxes} aName={aName} bName={bName} />
      <RadarBlock
        title="Metric shape"
        axes={mAxes}
        aName={aName}
        bName={bName}
        ghost={{ a: fit(ghostA), b: fit(ghostB) }}
      />
    </div>
  );
}
