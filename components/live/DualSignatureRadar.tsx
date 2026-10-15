/* components/live/DualSignatureRadar.tsx — raw usage and derived metric
 * signatures overlap on one grid with paired axis labels and distinct colors.
 * Per-axis percentile positions use the loaded time-window cohort,
 * with shared positions for ties and lower-is-better cost direction.
 * Missing measurements are excluded without altering canonical scores.
 */
const AXES = [
  { key: "snr", name: "SNR" },
  { key: "velocity", name: "VELOCITY" },
  { key: "leverage", name: "LEVERAGE" },
  { key: "dev10x", name: "10xDEV" },
  { key: "scaleV", name: "SCALE V" },
  { key: "efficiency", name: "EFFICIENCY" },
] as const;

export interface SixAxisFacts {
  snr: number | null;
  velocity: number | null;
  leverage: number | null;
  dev10x: number | null;
  scaleV: number | null;
  efficiency: number | null;
}

export const radarPercentile = (value: number | null, field: (number | null)[], lowerIsBetter = false): number | null => {
  if (!good(value)) return null;
  const valid = field.filter(good);
  if (valid.length < 2) return null;
  const below = valid.filter(v => v < value).length;
  const tied = valid.filter(v => v === value).length;
  const position = Math.max(0, Math.min(1, (below + tied / 2) / valid.length));
  return lowerIsBetter ? 1 - position : position;
};

const THEME = { operator: "#ffcd52", grid: "#4d3a57" };

const pt = (r: number, i: number, c = 135): [number, number] => [
  c + Math.cos(-Math.PI / 2 + (i * Math.PI) / 3) * r,
  c + Math.sin(-Math.PI / 2 + (i * Math.PI) / 3) * r,
];
const joinPts = (pts: [number, number][]) =>
  pts.map((x) => x.map((v) => v.toFixed(1)).join(",")).join(" ");
const good = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

export interface RawAxisFacts {
  input: number | null;
  output: number | null;
  cacheRead: number | null;
  cacheWrite: number | null;
  total: number | null;
  cost: number | null;
}
const RAW_AXES = [
  { key: "input", name: "INPUT" },
  { key: "output", name: "OUTPUT" },
  { key: "cacheRead", name: "CACHE READ" },
  { key: "cacheWrite", name: "CACHE WRITE" },
  { key: "total", name: "TOTAL" },
  { key: "cost", name: "COST / 1M ↓" },
] as const;

export function DualSignatureRadar({ operator, raw, cohort, label }: {
  operator: SixAxisFacts;
  raw: RawAxisFacts;
  cohort: { raw: RawAxisFacts; metrics: SixAxisFacts | null }[];
  label: string;
}) {
  const rawValues = RAW_AXES.map(a => raw[a.key]);
  const metricValues = AXES.map(a => operator[a.key]);
  const shapes = [
    { title: "RAW", color: "#22d3ee", axes: RAW_AXES, values: rawValues,
      points: rawValues.map((v, i) => radarPercentile(v, cohort.map(p => p.raw[RAW_AXES[i].key]), i === 5)) },
    { title: "METRICS", color: THEME.operator, axes: AXES, values: metricValues,
      points: metricValues.map((v, i) => radarPercentile(v, cohort.map(p => p.metrics?.[AXES[i].key] ?? null))) },
  ];
  return <div className="dusradar">
    <svg viewBox="-22 0 315 291" role="img" aria-label={`${label}: overlapping raw usage and derived metrics percentile radar; loaded field of ${cohort.length} operators`}>
      <text x="12" y="16" fill="#dee9ec" fontSize="8">DUAL SIGNATURE · RAW + METRICS</text>
      {[0.25, 0.5, 0.75, 1].map(r => <polygon key={r}
        points={joinPts(AXES.map((_, i) => pt(75 * r, i)))} fill="none" stroke={THEME.grid} strokeWidth=".8" />)}
      {AXES.map((_, i) => {
        const [x, y] = pt(75, i);
        return <line key={i} x1="135" y1="135" x2={x} y2={y} stroke={THEME.grid} strokeWidth=".8" />;
      })}
      {shapes.map(shape => shape.points.every(v => v !== null) ? <g key={shape.title} data-series={shape.title}>
        <polygon points={joinPts(shape.points.map((v, i) => pt(75 * (v ?? 0), i)))}
          fill={shape.color} fillOpacity=".10" stroke={shape.color} strokeWidth="2.2"
          strokeDasharray={shape.title === "RAW" ? "4 2" : undefined} />
        {shape.points.map((v, i) => {
          const [x, y] = pt(75 * (v ?? 0), i);
          return <circle key={i} cx={x} cy={y} r="3" fill={shape.color}>
            <title>{`${shape.title} · ${shape.axes[i].name}: ${shape.values[i]} · ${((v ?? 0) * 100).toFixed(1)} percentile · ${cohort.filter(p => good(shape.title === "RAW" ? p.raw[RAW_AXES[i].key] : p.metrics?.[AXES[i].key])).length} measured operators`}</title>
          </circle>;
        })}
      </g> : <text key={shape.title} x="12" y={shape.title === "RAW" ? 240 : 252} fill={shape.color} fontSize="8">{shape.title} UNAVAILABLE</text>)}
      {AXES.map((a, i) => {
        const [x, y] = pt(101, i);
        const anchor = i === 0 || i === 3 ? "middle" : i === 1 || i === 2 ? "start" : "end";
        return <g key={a.key}>
          <text x={x} y={y - 5} fill="#22d3ee" fontSize="8" textAnchor={anchor}>{RAW_AXES[i].name}</text>
          <text x={x} y={y + 7} fill={THEME.operator} fontSize="8" textAnchor={anchor}>{a.name}</text>
        </g>;
      })}
      <line x1="26" y1="267" x2="42" y2="267" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 2" />
      <text x="48" y="270" fill="#22d3ee" fontSize="8">RAW</text>
      <line x1="134" y1="267" x2="150" y2="267" stroke={THEME.operator} strokeWidth="2" />
      <text x="156" y="270" fill={THEME.operator} fontSize="8">METRICS</text>
      <text x="135" y="286" fill="#dee9ec" fontSize="6.5" textAnchor="middle">MIDPOINT %ILE · {cohort.length < 3 ? "SMALL FIELD" : "FIELD"} {cohort.length} · EDGE 100 · COST ↓</text>
    </svg>
  </div>;
}
