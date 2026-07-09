/**
 * components/compare/CompareLedger.tsx — CMP-LEDGER (owner 2026-06-22).
 *
 * The head-to-head ledger, built to the owner's ASCII template:
 *
 *   ┌──────────┬─────────────┬──────────┐
 *   │  USER 1  │    DATA     │  USER 2  │   ← header is the matchup box (separate)
 *   ├──────────┼──────┬──────┼──────────┤
 *   │  val     │  RAW (6)    │  val     │   input·output·cr·cw·total·cost
 *   │  val     │  METRICS(8) │  val     │   Υ·SNR·Lev·Vel·10xDEV·$1M·Efficacy·OpRatio
 *   ├──────────┼─────────────┼──────────┤
 *   │          │   TOTAL     │          │
 *   └──────────┴─────────────┴──────────┘
 *
 * Each row: A value (left) · metric label (center) · B value (right), with a
 * diverging bar UNDER the label spanning the row — A grows left, B grows right,
 * "better" always reaches outward (lower-wins inverted). The winning side's value
 * is colored, the losing bar dimmed.
 *
 * Rows derive from the canonical shared display set (lib/canon/ids.ts) so the
 * metric set can't drift from the rest of the site. The METRICS section follows
 * the owner's compare-specific 8-row view (Scale V omitted — it's profile-only,
 * per owner 2026-06-21). The TOTAL row sums the 4 raw pillars (the ∑ pillar).
 *
 * Pure presentational server component over two rows — reads pillars off
 * row.telemetry and metrics off row.snapshot.cascade. No fetch, no facade edits.
 */

import React from "react";
import type { LeaderboardRow } from "@/lib/data";
import { operatorDisplayName } from "@/lib/compare/operator-name";
import { CanonId } from "@/components/ui/CanonId";
import { DISPLAY_RAW, DISPLAY_METRICS } from "@/lib/canon/ids";

const A_COLOR = "rgb(var(--class-arch))"; // blue (was --accent=green; one green B + one blue A, owner 2026-06-27)
const B_COLOR = "rgb(var(--class-seeker))";

/** The owner's compare METRICS view: the 8 rows from the ASCII, in order.
 * (Scale V intentionally omitted — profile-only per owner 2026-06-21.) */
const METRIC_VIEW = [
  "Y.01",
  "Y.02",
  "Y.03",
  "Y.04",
  "Y.05",
  "Y.07",
  "Y.08",
  "Y.09",
];
const DISPLAY_METRICS_COMPARE = METRIC_VIEW.map((id) =>
  DISPLAY_METRICS.find((m) => m.id === id)!,
).filter(Boolean);

function nameOf(row: LeaderboardRow): string {
  return operatorDisplayName(row);
}

const fmtInt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : n.toFixed(0);

interface LedgerRow {
  id: string;
  label: string;
  /** numeric value for A / B, or null when not derivable (e.g. non-compounding). */
  a: number | null;
  b: number | null;
  /** display string for A / B (Op Ratio is a string; others format numbers). */
  aStr: string;
  bStr: string;
  higherWins: boolean;
  /** ceiling used to project the diverging bar (max of the two, ≥1). */
  scale: number;
}

/** Pull a numeric value for a display-set key off a row (telemetry + cascade). */
function valueFor(key: string, row: LeaderboardRow): number | null {
  const c = row.snapshot.cascade;
  const t = row.telemetry;
  const total = t
    ? t.fresh_input + t.output + t.cache_read + t.cache_create
    : 0;
  switch (key) {
    // raw pillars (off telemetry)
    case "input":
      return t ? t.fresh_input : null;
    case "output":
      return t ? t.output : null;
    case "cacheRead":
      return t ? t.cache_read : null;
    case "cacheWrite":
      return t ? t.cache_create : null;
    case "totalTokens":
      return total;
    // cascade metrics (off snapshot.cascade)
    case "costPerMillion":
      return c ? c.costPerMillion : null;
    case "yield_":
      return c && !c.nonCompounding ? c.yield_ : null;
    case "snr":
      return c ? c.snr : null;
    case "leverage":
      return c && !c.nonCompounding ? c.leverage : null;
    case "velocity":
      return c ? c.velocity : null;
    case "dev10x":
      return c && !c.nonCompounding && c.dev10x !== null ? c.dev10x : null;
    case "efficiency":
      return c ? c.efficiency : null;
    case "opRatio":
      // Op Ratio ranks by lead term (leverage) — sortable per owner; the string
      // is rendered separately. (Same rule as facade sortValue + the board.)
      return c && !c.nonCompounding ? c.leverage : null;
    default:
      return null;
  }
}

/** Display string for a key (Op Ratio = its composition string; rest = formatted). */
function displayFor(key: string, row: LeaderboardRow): string {
  const c = row.snapshot.cascade;
  const v = valueFor(key, row);
  if (key === "opRatio") return c && !c.nonCompounding ? c.opRatio : "—";
  if (v === null) return "—";
  switch (key) {
    case "input":
    case "output":
    case "cacheRead":
    case "cacheWrite":
    case "totalTokens":
      return fmtInt(v);
    case "costPerMillion":
      return `$${v.toFixed(2)}`;
    case "yield_":
      return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0);
    case "snr":
      return `${(v * 100).toFixed(1)}%`;
    case "leverage":
      return v >= 1000 ? `${(v / 1000).toFixed(1)}K×` : `${v.toFixed(0)}×`;
    case "velocity":
      return v >= 10 ? v.toFixed(1) : v.toFixed(2);
    case "dev10x":
    case "efficiency":
      return v.toFixed(2);
    default:
      return v.toFixed(2);
  }
}

function buildRow(
  m: { id: string; name: string; key: string; lowerIsBetter?: boolean },
  a: LeaderboardRow,
  b: LeaderboardRow,
): LedgerRow {
  const av = valueFor(m.key, a);
  const bv = valueFor(m.key, b);
  const scale = Math.max(av ?? 0, bv ?? 0, 1);
  return {
    id: m.id,
    label: m.name,
    a: av,
    b: bv,
    aStr: displayFor(m.key, a),
    bStr: displayFor(m.key, b),
    higherWins: !m.lowerIsBetter,
    scale,
  };
}

function winnerOf(r: LedgerRow): "a" | "b" | "tie" {
  if (r.a === null || r.b === null || r.a === r.b) return "tie";
  return (r.higherWins ? r.a > r.b : r.a < r.b) ? "a" : "b";
}

/** A's outward share (0..1). Lower-wins inverted so "better" is always longer. */
function shareA(r: LedgerRow): number {
  if (r.a === null && r.b === null) return 0.5;
  const clamp = (v: number | null) => Math.max(0, Math.min(r.scale, v ?? 0));
  const proj = (v: number | null) =>
    r.higherWins ? clamp(v) : r.scale - clamp(v);
  const pa = proj(r.a);
  const pb = proj(r.b);
  const sum = pa + pb;
  return sum <= 0 ? 0.5 : pa / sum;
}

/** One ledger line: A value · centered label+canon · B value, diverging bar under. */
function Line({ row }: { row: LedgerRow }) {
  const w = winnerOf(row);
  const sa = shareA(row);
  return (
    <div className="grid grid-cols-[1fr_minmax(140px,1.4fr)_1fr] items-center gap-x-3 py-2.5">
      {/* A value (right-aligned, toward center) */}
      <span
        className={
          "text-right font-mono text-base tabular-nums " +
          (w === "a" ? "font-bold text-text-accent" : "text-text-muted")
        }
      >
        {row.aStr}
      </span>
      {/* center label + canon id */}
      <span className="text-center font-sans text-sm font-medium text-text-secondary">
        {row.label}
        <CanonId id={row.id} />
      </span>
      {/* B value (left-aligned, toward center) */}
      <span
        className={
          "text-left font-mono text-base tabular-nums " +
          (w === "b" ? "font-bold text-class-seeker" : "text-text-muted")
        }
      >
        {row.bStr}
      </span>
      {/* diverging bar across all three columns */}
      <div className="col-span-3 mt-1.5 flex h-3 overflow-hidden rounded-full bg-bg-base">
        <div className="flex h-full grow justify-end">
          <div
            className="h-full rounded-l-full transition-[width]"
            style={{
              width: `${sa * 100}%`,
              background: A_COLOR,
              opacity: w === "b" ? 0.4 : 1,
            }}
          />
        </div>
        <div className="h-full w-px bg-bg-border" aria-hidden />
        <div className="flex h-full grow">
          <div
            className="h-full rounded-r-full transition-[width]"
            style={{
              width: `${(1 - sa) * 100}%`,
              background: B_COLOR,
              opacity: w === "a" ? 0.4 : 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** A banded section header spanning the center column (RAW / METRICS / TOTAL). */
function Band({ title }: { title: string }) {
  return (
    <div className="grid grid-cols-[1fr_minmax(140px,1.4fr)_1fr] items-center py-1.5">
      <span aria-hidden />
      <span className="text-center font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {title}
      </span>
      <span aria-hidden />
    </div>
  );
}

export function CompareLedger({
  a,
  b,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
}) {
  const aName = nameOf(a);
  const bName = nameOf(b);
  const rawRows = DISPLAY_RAW.map((m) => buildRow(m, a, b));
  const metricRows = DISPLAY_METRICS_COMPARE.map((m) => buildRow(m, a, b));

  // TOTAL row = the ∑ pillar (sum of 4 raw), shown as its own banded footer.
  const totalRow = buildRow(
    { id: "T.05", name: "Total tokens", key: "totalTokens" },
    a,
    b,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-bg-border bg-bg-surface">
      {/* column header: A name | DATA | B name */}
      <div className="grid grid-cols-[1fr_minmax(140px,1.4fr)_1fr] items-baseline gap-x-3 border-b border-bg-border bg-bg-base/40 px-4 py-2.5">
        <span className="text-right font-mono text-xs font-bold text-text-accent">
          {aName}
        </span>
        <span className="text-center font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Data
        </span>
        <span className="text-left font-mono text-xs font-bold text-class-seeker">
          {bName}
        </span>
      </div>

      <div className="px-4 pb-2 pt-1">
        <Band title="Raw" />
        {rawRows.map((r) => (
          <Line key={r.id} row={r} />
        ))}

        <Band title="Metrics" />
        {metricRows.map((r) => (
          <Line key={r.id} row={r} />
        ))}
      </div>

      {/* TOTAL footer band */}
      <div className="border-t border-bg-border bg-bg-base/40 px-4 py-2">
        <div className="grid grid-cols-[1fr_minmax(140px,1.4fr)_1fr] items-center gap-x-3">
          <span
            className={
              "text-right font-mono text-sm tabular-nums " +
              (winnerOf(totalRow) === "a"
                ? "font-bold text-text-accent"
                : "text-text-secondary")
            }
          >
            {totalRow.aStr}
          </span>
          <span className="text-center font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Total
          </span>
          <span
            className={
              "text-left font-mono text-sm tabular-nums " +
              (winnerOf(totalRow) === "b"
                ? "font-bold text-class-seeker"
                : "text-text-secondary")
            }
          >
            {totalRow.bStr}
          </span>
        </div>
      </div>
    </section>
  );
}
