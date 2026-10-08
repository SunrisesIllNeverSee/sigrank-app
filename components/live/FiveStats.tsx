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

function LineTrace({ row }: { row: FiveStatRow }) {
  const pts = [...row.history]
    .filter((p) => Number.isFinite(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);
  const valid = pts.filter((p) => good(p.value));
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
      ? 2 + ((v - lo) / span) * 19
      : 21 - ((v - lo) / span) * 19;
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
      viewBox="0 0 106 23"
      role="img"
      aria-label={`${row.name}: line-only observed history`}
    >
      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={TRACE_COLORS[row.name]}
          strokeWidth="1.65"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
