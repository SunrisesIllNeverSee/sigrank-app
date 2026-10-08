/* components/live/FiveStats.tsx — LB-G08 approved variant B (original
 * grammar, lime): the operator's five real graph types restored —
 *   YIELD jagged trace · SCORE dense bars · RANK stepped trace ·
 *   LEVERAGE histogram bars · VELOCITY line (dips stay dips).
 *
 * Data contract: true timestamped history only. Zero is a valid
 * measurement; null = missing, and gaps stay gaps — a series with <2
 * usable points renders an explicit NO HISTORY state, never a fabricated
 * trend.
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

const STROKE = "#b8fb58"; // approved lime tone
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
    <section className="f5stats lime">
      <header>STATS · SIGNAL HISTORY</header>
      {rows.slice(0, 5).map((row) => {
        const body = (
          <>
            <span>{row.name}</span>
            <MetricGraph row={row} />
            <b>{row.display}</b>
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

function MetricGraph({ row }: { row: FiveStatRow }) {
  const ordered = [...row.history].sort((a, b) => a.timestamp - b.timestamp);
  const finitePoints = ordered.filter(
    (pt) => Number.isFinite(pt.timestamp) && good(pt.value),
  );
  if (finitePoints.length < 2)
    return <small className="f5-no-history">NO HISTORY</small>;
  const lo = Math.min(...finitePoints.map((pt) => pt.value!));
  const hi = Math.max(...finitePoints.map((pt) => pt.value!));
  const span = Math.max(hi - lo, 1e-9);
  const h = 23;
  const first = ordered[0].timestamp;
  const last = ordered.at(-1)!.timestamp;
  const timeSpan = Math.max(1, last - first);
  const x = (t: number) => 2 + ((t - first) / timeSpan) * 102;
  const y = (v: number) =>
    row.name === "RANK" ? 2 + ((v - lo) / span) * 19 : h - 2 - ((v - lo) / span) * 19;
  const bars = row.name === "SCORE" || row.name === "LEVERAGE";
  if (bars)
    return (
      <svg
        viewBox="0 0 106 23"
        role="img"
        aria-label={`${row.name}: ${finitePoints.length} historical observations, bars`}
      >
        {finitePoints.map(({ timestamp, value }, i) => {
          const xx = x(timestamp);
          const yy = y(value!);
          const width =
            row.name === "SCORE" ? 1.7 : Math.min(6, 90 / finitePoints.length);
          return (
            <rect
              key={i}
              x={xx - width / 2}
              y={yy}
              width={width}
              height={Math.max(0.5, h - 1 - yy)}
              fill={STROKE}
              fillOpacity=".95"
            />
          );
        })}
      </svg>
    );
  const segments: string[] = [];
  let path = "";
  ordered.forEach((pt) => {
    if (!good(pt.value) || !Number.isFinite(pt.timestamp)) {
      if (path) segments.push(path);
      path = "";
      return;
    }
    const xx = x(pt.timestamp).toFixed(1);
    const yy = y(pt.value!).toFixed(1);
    if (!path) path = `M${xx} ${yy}`;
    else if (row.name === "RANK") path += ` H${xx} V${yy}`;
    else path += ` L${xx} ${yy}`;
  });
  if (path) segments.push(path);
  return (
    <svg
      viewBox="0 0 106 23"
      role="img"
      aria-label={`${row.name}: measured history trace`}
    >
      {segments.map((segment, i) => (
        <path key={i} d={segment} stroke={STROKE} strokeWidth="1.6" fill="none" />
      ))}
    </svg>
  );
}
