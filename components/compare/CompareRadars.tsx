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
import CascadeRadar, { type CascadeRadarSeries } from "@/components/charts/CascadeRadar";
import { compareClassPalette } from "./compare-palette";

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

/** Each person's report owns their raw and metric radar, using the same
 * two-person normalization for comparable scale, without mixing A/B outlines. */
function RadarBlock({
  title,
  axes,
  side,
  name,
  color,
}: {
  title: string;
  axes: Axis[];
  side: "a" | "b";
  name: string;
  color: string;
}) {
  const radarAxes = axes.map(ax => ({
    label: ax.label + (ax.higherWins ? " ↑" : " ↓"),
    max: ax.max,
  }));
  const series: CascadeRadarSeries[] = [{
    name,
    values: axes.map(ax => proj(ax, ax[side])),
    color,
    variant: "solid",
  }];
  return (
    <div className="cmp-radar rounded-lg border border-bg-border bg-bg-surface">
      <h3 className="cmp-radar-heading" style={{ color }}>{title}</h3>
      <CascadeRadar axes={radarAxes} series={series} size={280} />
    </div>
  );
}

/** Two stat types under ONE operator's matchup report.
 * side=a or b; no one-stat-type-across-both-users comparison grouping. */
export function CompareRadars({
  a,
  b,
  side,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
  side: "a" | "b";
}) {
  const person = side === "a" ? a : b;
  const name = nameOf(person);
  const color = compareClassPalette(person.snapshot.class_tier).color;
  return (
    <div className="cmp-operator-radars" data-compare-operator={side}>
      <RadarBlock title="Raw · I/O/W/R" axes={rawAxes(a, b)}
        side={side} name={name} color={color} />
      <RadarBlock title="Cascade · Metrics" axes={metricAxes(a, b)}
        side={side} name={name} color={color} />
    </div>
  );
}
