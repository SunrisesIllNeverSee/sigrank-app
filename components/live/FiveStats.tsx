/* components/live/FiveStats.tsx — compact signal-history sparklines.
 *
 * Owner correction (2026-10-08, supersedes LB-G08's five-encoding grammar
 * for THIS module only): the compact strip is PURE LINE TRACES — five
 * small genuine time-series lines (Yield / Score / Rank / Leverage /
 * Velocity), distinct colors, consistent line-art style. No bars, no
 * histograms, no numeric-stat readouts — labels are series identifiers
 * only. Detailed numbers live in the profile + the large signal module.
 *
 * Data contract: true timestamped history only. Invalid/absent
 * timestamps are dropped (never index-as-date). Zero is a valid
 * measurement; null = missing, and gaps break the trace — a series with
 * <2 usable points renders an explicit NO HISTORY state, never a
 * fabricated trend. RANK plots inverted (a smaller rank number = a
 * better rank → draws higher).
 */
import { useEffect, useState } from "react";

export interface TimedMetricPoint {
  timestamp: number;
  value: number | null;
}
export interface FiveStatRow {
  name: "YIELD" | "SCORE" | "RANK" | "LEVERAGE" | "VELOCITY";
  display: string;
  history: TimedMetricPoint[];
}

/* per-series trace colors — distinct hues, consistent line weight */
const TRACE_COLORS: Record<FiveStatRow["name"], string> = {
  YIELD: "#b7ff25",
  SCORE: "#e6c967",
  RANK: "#68caeb",
  LEVERAGE: "#b391ef",
  VELOCITY: "#f0ac6a",
};
const good = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

/* Rotating variant (owner 2026-10-08): the compact strip moves under the
 * large Yield-overtime module and becomes a carousel — one metric's line
 * trace at a time, auto-cycling every 4s on the same cadence as the
 * honors deck. Clicking still expands that metric in the large chart
 * (SINGLE mode). Same data contract: gaps break, NO HISTORY when <2
 * usable points, RANK inverted. */
export function LineCarousel({
  rows,
  onSelect,
}: {
  rows: FiveStatRow[];
  onSelect?: (name: FiveStatRow["name"]) => void;
}) {
  const list = rows.slice(0, 5);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % Math.max(list.length, 1)), 4000);
    return () => clearInterval(t);
  }, [list.length]);
  const row = list[i % Math.max(list.length, 1)];
  if (!row) return null;
  return (
    <section className="f5stats f5-carousel" aria-label="Rotating line signals">
      <header>
        LINE SIGNALS · {row.name}
        <span className="f5-idx">
          {(i % Math.max(list.length, 1)) + 1}/{list.length}
        </span>
      </header>
      <button
        type="button"
        className="f5-carousel-stage"
        onClick={() => onSelect?.(row.name)}
        title={`Expand ${row.name} in the large history chart`}
      >
        <LineTrace row={row} tall />
      </button>
    </section>
  );
}

export function FiveStats({
  rows,
  selected,
  onSelect,
}: {
  rows: FiveStatRow[];
  /** addendum: clicking a row expands that metric into the large
      signal-history module (SINGLE mode). */
  selected?: FiveStatRow["name"];
  onSelect?: (name: FiveStatRow["name"]) => void;
}) {
  return (
    <section className="f5stats lines">
      <header>LINE SIGNALS</header>
      {rows.slice(0, 5).map((row) => {
        const body = (
          <>
            <span>{row.name}</span>
            <LineTrace row={row} />
          </>
        );
        return onSelect ? (
          <button
            type="button"
            className={`f5-stat-row${selected === row.name ? " selected" : ""}`}
            key={row.name}
            onClick={() => onSelect(row.name)}
            title={`Expand ${row.name} in the large history chart`}
          >
            {body}
          </button>
        ) : (
          <div className="f5-stat-row" key={row.name}>
            {body}
          </div>
        );
      })}
    </section>
  );
}

function LineTrace({ row, tall }: { row: FiveStatRow; tall?: boolean }) {
  const pts = [...row.history]
    .filter((p) => Number.isFinite(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
  const valid = pts.filter((p) => good(p.value));
  const VH = tall ? 52 : 23;
  const TOP = tall ? 6 : 2;
  const BOT = tall ? 46 : 21;
  const RNG = BOT - TOP;
  if (valid.length < 2)
    return <small className="f5-no-history">NO HISTORY</small>;
  const lo = Math.min(...valid.map((p) => p.value!));
  const hi = Math.max(...valid.map((p) => p.value!));
  const span = Math.max(hi - lo, 1e-9);
  const first = pts[0].timestamp;
  const last = pts[pts.length - 1].timestamp;
  const timeSpan = Math.max(1, last - first);
  const x = (t: number) => 2 + ((t - first) / timeSpan) * 102;
  /* rank inverts: a smaller rank number is better → draws higher */
  const y = (v: number) =>
    row.name === "RANK"
      ? TOP + ((v - lo) / span) * RNG
      : BOT - ((v - lo) / span) * RNG;
  const segments: string[] = [];
  let path = "";
  for (const p of pts) {
    if (!good(p.value)) {
      if (path) segments.push(path);
      path = "";
      continue;
    }
    const xx = x(p.timestamp).toFixed(2);
    const yy = y(p.value!).toFixed(2);
    path += (path ? " L" : "M") + xx + " " + yy;
  }
  if (path) segments.push(path);
  return (
    <svg
      viewBox={`0 0 106 ${VH}`}
      role="img"
      aria-label={`${row.name}: line-only observed history`}
    >
      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={TRACE_COLORS[row.name]}
          strokeWidth={tall ? "1.4" : "1.65"}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
