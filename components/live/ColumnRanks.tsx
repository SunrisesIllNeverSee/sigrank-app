/**
 * components/live/ColumnRanks.tsx — profile slide 2 (STAT).
 *
 * Owner 2026-10-08 (graphic pass): numbered stats → a field-standing
 * chart. Every leaderboard column — the seven cascade metrics plus the
 * five raw token pillars — gets a row with the operator's value, a
 * field-position bar (the operator's marker inside the eligible field),
 * and their rank. Rank color carries medal semantics: #1 gold, #2
 * silver, #3 bronze. Eligibility matches the field median: nc rows and
 * absent measurements excluded from compounding columns, never zeroed;
 * raw pillars are real measurements so nc rows still rank there.
 */
import type { LiveOperator } from "@/lib/board/live-types";
import { numLev, numTotal, numYield, numvOf } from "./utils";

interface ColDef {
  name: string;
  display: (o: LiveOperator) => string;
  value: (o: LiveOperator) => number | null;
  /** compounding columns exclude nc rows from both value and field */
  compounding?: boolean;
}

const fmt = (n: number | null | undefined, digits = 2): string =>
  n != null && Number.isFinite(n) ? n.toFixed(digits) : "—";

const rawNum = (s: string | undefined): number | null => {
  if (!s || s === "—") return null;
  const v = numvOf(s);
  return Number.isFinite(v) && v > 0 ? v : null;
};

const effVal = (o: LiveOperator): number | null =>
  o.eff && o.eff !== "—" ? numvOf(o.eff) : null;

const CASCADE_COLS: ColDef[] = [
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
    display: (o) => fmt(o.vel),
    value: (o) => (Number.isFinite(o.vel) ? o.vel : null),
  },
  {
    name: "SNR",
    display: (o) =>
      Number.isFinite(o.snr) ? `${(o.snr * 100).toFixed(0)}%` : "—",
    value: (o) => (Number.isFinite(o.snr) ? o.snr : null),
  },
  {
    name: "10xDEV",
    display: (o) => (o.nc ? "—" : fmt(o.dev)),
    value: (o) => (o.nc ? null : Number.isFinite(o.dev) ? o.dev : null),
    compounding: true,
  },
  {
    name: "SCALE V",
    display: (o) => fmt(o.scalev, 1),
    value: (o) => (Number.isFinite(o.scalev) ? o.scalev : null),
  },
  {
    name: "EFFICIENCY",
    display: (o) => (o.eff && o.eff !== "—" ? o.eff : "—"),
    value: effVal,
  },
];

const RAW_COLS: ColDef[] = [
  {
    name: "Σ TOTAL",
    display: (o) => o.total,
    value: (o) => numTotal(o),
  },
  {
    name: "INPUT",
    display: (o) => o.raw.i,
    value: (o) => rawNum(o.raw.i),
  },
  {
    name: "OUTPUT",
    display: (o) => o.raw.o,
    value: (o) => rawNum(o.raw.o),
  },
  {
    name: "CACHE-R",
    display: (o) => o.raw.cr,
    value: (o) => rawNum(o.raw.cr),
  },
  {
    name: "CACHE-W",
    display: (o) => o.raw.cw,
    value: (o) => rawNum(o.raw.cw),
  },
];

const medalCls = (rank: number | null): string =>
  rank === 1 ? " g" : rank === 2 ? " s" : rank === 3 ? " b" : "";

function RankRow({
  c,
  op,
  ops,
}: {
  c: ColDef;
  op: LiveOperator;
  ops: LiveOperator[];
}) {
  const eligible = ops.filter(
    (o) => !(c.compounding && o.nc) && c.value(o) != null,
  );
  const v = c.value(op);
  const ahead =
    v != null && !(c.compounding && op.nc)
      ? eligible.filter((o) => (c.value(o) ?? -Infinity) > v).length
      : null;
  const rank = ahead != null ? ahead + 1 : null;
  /* field position: rank 1 → right edge (best), last → left edge */
  const pos =
    rank != null
      ? eligible.length > 1
        ? 1 - (rank - 1) / (eligible.length - 1)
        : 1
      : null;
  return (
    <div className="colrank-row">
      <span className="ck">{c.name}</span>
      <span className="cv">{c.display(op)}</span>
      <span
        className="cbar"
        role="img"
        aria-label={
          pos != null
            ? `${c.name}: field position ${(pos * 100).toFixed(0)}%`
            : `${c.name}: unranked`
        }
      >
        {pos != null && <i style={{ left: `${(pos * 100).toFixed(1)}%` }} />}
      </span>
      <span className={`cr${medalCls(rank)}`}>
        {rank != null ? `#${rank.toLocaleString()}` : "—"}
      </span>
    </div>
  );
}

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
      <header>
        COLUMN RANKS
        <span className="f5-idx">FIELD {ops.length.toLocaleString()}</span>
      </header>
      {CASCADE_COLS.map((c) => (
        <RankRow key={c.name} c={c} op={op} ops={ops} />
      ))}
      <header className="sub">RAW TOKENS</header>
      {RAW_COLS.map((c) => (
        <RankRow key={c.name} c={c} op={op} ops={ops} />
      ))}
    </section>
  );
}
