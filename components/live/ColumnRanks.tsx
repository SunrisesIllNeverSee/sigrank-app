/**
 * components/live/ColumnRanks.tsx — profile slide 2 (STAT).
 *
 * Owner 2026-10-08: the slide that faces the dual radar shows the
 * operator's numbered stats — value + field rank per leaderboard
 * column. Ranks are computed against the same eligibility rules the
 * field median uses: non-compounding rows and absent measurements are
 * excluded, never zeroed. "—" marks inapplicable columns.
 */
import type { LiveOperator } from "@/lib/board/live-types";
import { numLev, numYield } from "./utils";

interface ColDef {
  name: string;
  /** display string for the selected operator */
  display: (o: LiveOperator) => string;
  /** numeric value for ranking — null/undefined/NaN = absent */
  value: (o: LiveOperator) => number | null;
  /** compounding columns exclude nc rows from both value and field */
  compounding?: boolean;
  /** formatting for the field's rank fraction denominator context */
}

const fmt = (n: number | null, digits = 2): string | null =>
  n != null && Number.isFinite(n) ? n.toFixed(digits) : null;

const effVal = (o: LiveOperator): number | null =>
  o.eff && o.eff !== "—" ? Number.parseFloat(o.eff.replace(/[^0-9.]/g, "")) : null;

const COLS: ColDef[] = [
  {
    name: "YIELD",
    display: (o) => (o.nc ? "—" : o.yield),
    value: (o) => (o.nc ? null : numYield(o)),
    compounding: true,
  },
  {
    name: "LEVERAGE",
    display: (o) => (o.nc ? "—" : o.lev),
    value: (o) => (o.nc ? null : numLev(o)),
    compounding: true,
  },
  {
    name: "VELOCITY",
    display: (o) => fmt(o.vel) ?? "—",
    value: (o) => (Number.isFinite(o.vel) ? o.vel : null),
  },
  {
    name: "SNR",
    display: (o) => (Number.isFinite(o.snr) ? `${(o.snr * 100).toFixed(0)}%` : "—"),
    value: (o) => (Number.isFinite(o.snr) ? o.snr : null),
  },
  {
    name: "10xDEV",
    display: (o) => (o.nc ? "—" : fmt(o.dev) ?? "—"),
    value: (o) => (o.nc ? null : Number.isFinite(o.dev) ? o.dev : null),
    compounding: true,
  },
  {
    name: "SCALE V",
    display: (o) => fmt(o.scalev, 1) ?? "—",
    value: (o) => (Number.isFinite(o.scalev) ? o.scalev : null),
  },
  {
    name: "EFFICIENCY",
    display: (o) => (o.eff && o.eff !== "—" ? o.eff : "—"),
    value: effVal,
  },
];

export function ColumnRanks({
  op,
  ops,
}: {
  op: LiveOperator | null;
  ops: LiveOperator[];
}) {
  if (!op) return <p className="drill-note">— SELECT AN OPERATOR</p>;
  return (
    <section className="colranks" aria-label="Operator column rankings">
      <header>COLUMN RANKS · FIELD {ops.length.toLocaleString()}</header>
      {COLS.map((c) => {
        const eligible = ops.filter(
          (o) => !(c.compounding && o.nc) && c.value(o) != null,
        );
        const v = c.value(op);
        const ahead =
          v != null && !(c.compounding && op.nc)
            ? eligible.filter((o) => (c.value(o) ?? -Infinity) > v).length
            : null;
        const rank = ahead != null ? ahead + 1 : null;
        return (
          <div className="colrank-row" key={c.name}>
            <span className="ck">{c.name}</span>
            <span className="cv">{c.display(op)}</span>
            <span className="cr">
              {rank != null ? `#${rank.toLocaleString()}` : "—"}
              <small>
                {rank != null ? ` / ${eligible.length.toLocaleString()}` : ""}
              </small>
            </span>
          </div>
        );
      })}
    </section>
  );
}
