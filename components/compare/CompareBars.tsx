/**
 * components/compare/CompareBars.tsx — diverging head-to-head bars (CMP-4).
 *
 * Complements the CompareTable radar: the radar shows overall *shape*, these bars
 * show per-axis *magnitude* — for each metric, A grows leftward from a center
 * baseline and B rightward, split by each operator's share of the combined value
 * on that axis. "Better" always reaches outward (lower-wins axes like $/1M are
 * inverted before splitting), so the longer side is the stronger operator.
 *
 * Pure presentational server component — reuses CompareTable's canonical
 * buildRows()/winnerOf()/nameOf() so there is ONE source of truth for the metric
 * set, formatting, and winner logic. Colors match the radar: accent = A,
 * class-seeker = B (theme-reactive via rgb(var(--token))).
 */

import React from "react";
import type { LeaderboardRow } from "@/lib/board";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { CanonId } from "@/components/ui/CanonId";
import CascadeRadar, {
  type CascadeRadarSeries,
} from "@/components/charts/CascadeRadar";

const A_COLOR = "rgb(var(--accent))";
const B_COLOR = "rgb(var(--class-seeker))";

// Head-to-head metric rows — self-contained here (the old CompareTable was archived
// 2026-06-22; CompareBars is the only surviving consumer, so the helpers live with it).
interface MetricRow {
  label: string;
  canonId: string;
  a: number;
  b: number;
  higherWins: boolean;
  fmt: (v: number) => string;
  radarMax: number;
}

/** Cascade head-to-head rows (Υ-layer). Reads snapshot.cascade; $/1M is lower-wins. */
function buildRows(a: LeaderboardRow, b: LeaderboardRow): MetricRow[] {
  const ca = a.snapshot.cascade;
  const cb = b.snapshot.cascade;
  const yield_ = (c: typeof ca) => (c && !c.nonCompounding ? c.yield_ : 0);
  const lev = (c: typeof ca) => (c && !c.nonCompounding ? c.leverage : 0);
  const dev = (c: typeof ca) =>
    c && !c.nonCompounding && c.dev10x !== null ? c.dev10x : 0;
  const snr = (c: typeof ca) => (c ? c.snr : 0);
  const vel = (c: typeof ca) => (c ? c.velocity : 0);
  const cost = (c: typeof ca) => (c ? c.costPerMillion : 0);
  return [
    {
      label: "Υ Yield",
      canonId: "Υ",
      a: yield_(ca),
      b: yield_(cb),
      higherWins: true,
      fmt: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)),
      radarMax: Math.max(yield_(ca), yield_(cb), 1),
    },
    {
      label: "SNR",
      canonId: "M.01",
      a: snr(ca),
      b: snr(cb),
      higherWins: true,
      fmt: (v) => `${(v * 100).toFixed(1)}%`,
      radarMax: 1,
    },
    {
      label: "Leverage",
      canonId: "Cr/I",
      a: lev(ca),
      b: lev(cb),
      higherWins: true,
      fmt: (v) =>
        v >= 1000 ? `${(v / 1000).toFixed(1)}K×` : `${v.toFixed(0)}×`,
      radarMax: Math.max(lev(ca), lev(cb), 1),
    },
    {
      label: "Velocity",
      canonId: "O/I",
      a: vel(ca),
      b: vel(cb),
      higherWins: true,
      fmt: (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2)),
      radarMax: Math.max(vel(ca), vel(cb), 1),
    },
    {
      label: "10xDEV",
      canonId: "⚡",
      a: dev(ca),
      b: dev(cb),
      higherWins: true,
      fmt: (v) => v.toFixed(2),
      radarMax: 5,
    },
    {
      label: "$ / 1M",
      canonId: "$",
      a: cost(ca),
      b: cost(cb),
      higherWins: false,
      fmt: (v) => `$${v.toFixed(2)}`,
      radarMax: Math.max(cost(ca), cost(cb), 1),
    },
  ];
}

function winnerOf(row: MetricRow): "a" | "b" | "tie" {
  if (row.a === row.b) return "tie";
  return (row.higherWins ? row.a > row.b : row.a < row.b) ? "a" : "b";
}

function nameOf(row: LeaderboardRow): string {
  return operatorDisplayName(row);
}

/** A operator's share (0..1) of the combined "outward" magnitude on this axis.
 * Lower-wins axes are inverted so "better" is always the larger projected value.
 * Falls back to a 50/50 split when both project to zero (avoids 0/0 → NaN). */
function shareA(r: MetricRow): number {
  const clamp = (v: number) => Math.max(0, Math.min(r.radarMax, v));
  const proj = (v: number) => (r.higherWins ? clamp(v) : r.radarMax - clamp(v));
  const pa = proj(r.a);
  const pb = proj(r.b);
  const sum = pa + pb;
  if (sum <= 0) return 0.5;
  return pa / sum;
}

export function CompareBars({
  a,
  b,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
}) {
  const rows = buildRows(a, b);
  const aName = nameOf(a);
  const bName = nameOf(b);

  // Own radar for the bars box (owner 2026-06-22). Same build as CompareTable's:
  // shared axes (label + radarMax) + two colored series, with lower-wins axes
  // pre-inverted so "better" reaches outward.
  const radarAxes = rows.map((r) => ({ label: r.label, max: r.radarMax }));
  const proj = (r: MetricRow, v: number) => {
    const clamped = Math.max(0, Math.min(r.radarMax, v));
    return r.higherWins ? clamped : r.radarMax - clamped;
  };
  const radarSeries: CascadeRadarSeries[] = [
    { name: aName, values: rows.map((r) => proj(r, r.a)), color: A_COLOR },
    { name: bName, values: rows.map((r) => proj(r, r.b)), color: B_COLOR },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[11px] uppercase tracking-wide text-text-muted">
          Head-to-head by metric
        </span>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: A_COLOR }}
            />
            <span className="text-text-secondary">{aName}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: B_COLOR }}
            />
            <span className="text-text-secondary">{bName}</span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-2.5 rounded-lg border border-bg-border bg-bg-surface p-4">
          {rows.map((r) => {
            const sa = shareA(r);
            const aPct = sa * 100;
            const bPct = (1 - sa) * 100;
            const w = winnerOf(r);
            return (
              <div
                key={r.canonId}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
              >
                {/* axis label + canon id */}
                <span className="font-sans text-xs text-text-secondary">
                  {r.label}
                  <CanonId id={r.canonId} />
                </span>
                {/* values: A | B */}
                <span className="text-right font-mono text-[11px] tabular-nums">
                  <span
                    className={
                      w === "a" ? "text-text-accent" : "text-text-muted"
                    }
                  >
                    {r.fmt(r.a)}
                  </span>
                  <span className="mx-1 text-text-dim">·</span>
                  <span
                    className={
                      w === "b" ? "text-class-seeker" : "text-text-muted"
                    }
                  >
                    {r.fmt(r.b)}
                  </span>
                </span>
                {/* diverging bar spanning both columns */}
                <div className="col-span-2 flex h-2 overflow-hidden rounded-full bg-bg-base">
                  <div className="flex h-full grow justify-end">
                    <div
                      className="h-full rounded-l-full transition-[width]"
                      style={{
                        width: `${aPct}%`,
                        background: A_COLOR,
                        opacity: w === "b" ? 0.45 : 1,
                      }}
                    />
                  </div>
                  <div className="h-full w-px bg-bg-border" aria-hidden />
                  <div className="flex h-full grow">
                    <div
                      className="h-full rounded-r-full transition-[width]"
                      style={{
                        width: `${bPct}%`,
                        background: B_COLOR,
                        opacity: w === "a" ? 0.45 : 1,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bars box's own radar (owner 2026-06-22). */}
        <div className="flex flex-col items-center gap-2 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-sans text-[11px] uppercase tracking-wide text-text-muted">
            Shape
          </span>
          <CascadeRadar axes={radarAxes} series={radarSeries} size={240} />
        </div>
      </div>
    </section>
  );
}
