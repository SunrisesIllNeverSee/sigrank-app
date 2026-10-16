/* components/live/DualSignatureRadar.tsx — raw usage and derived metric
 * signatures overlap on one grid with paired axis labels and distinct colors.
 * Fixed per-axis display scales describe only the selected operator.
 * Token axes use log1p; derived metrics retain the original profile ranges.
 * Missing measurements stay unavailable without altering canonical scores.
 */
const AXES = [
  { key: "snr", cap: 1, log: false, name: "SNR" },
  { key: "velocity", cap: 50, log: false, name: "VELOCITY" },
  { key: "leverage", cap: 200, log: false, name: "LEVERAGE" },
  { key: "dev10x", cap: 5, log: false, name: "10xDEV" },
  { key: "scaleV", cap: 9, log: false, name: "SCALE V" },
  { key: "efficiency", cap: 5, log: false, name: "EFFICIENCY" },
] as const;

export interface SixAxisFacts {
  snr: number | null;
  velocity: number | null;
  leverage: number | null;
  dev10x: number | null;
  scaleV: number | null;
  efficiency: number | null;
}

export const radarPosition = (value: number | null, cap: number, logarithmic = false): number | null => {
  if (!good(value) || !good(cap) || cap === 0) return null;
  return Math.min(1, logarithmic ? Math.log1p(value) / Math.log1p(cap) : value / cap);
};

const formatValue = (value: number | null, key: string): string => {
  if (!good(value)) return "—";
  if (key === "cost") return `$${value.toFixed(2)}`;
  if (key === "snr") return `${(value * 100).toFixed(1)}%`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(2);
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
  { key: "input", cap: 1e12, log: true, name: "INPUT" },
  { key: "output", cap: 1e12, log: true, name: "OUTPUT" },
  { key: "cacheRead", cap: 1e12, log: true, name: "CACHE READ" },
  { key: "cacheWrite", cap: 1e12, log: true, name: "CACHE WRITE" },
  { key: "total", cap: 1e12, log: true, name: "TOTAL" },
  { key: "cost", cap: 10, log: false, name: "COST / 1M" },
] as const;

export function DualSignatureRadar({ operator, raw, label }: {
  operator: SixAxisFacts;
  raw: RawAxisFacts;
  label: string;
}) {
  const rawValues = RAW_AXES.map(a => raw[a.key]);
  const metricValues = AXES.map(a => operator[a.key]);
  const shapes = [
    { title: "RAW", color: "#22d3ee", axes: RAW_AXES, values: rawValues,
      points: rawValues.map((v, i) => radarPosition(v, RAW_AXES[i].cap, RAW_AXES[i].log)) },
    { title: "METRICS", color: THEME.operator, axes: AXES, values: metricValues,
      points: metricValues.map((v, i) => radarPosition(v, AXES[i].cap, AXES[i].log)) },
  ];
  return <div className="dusradar" title="Personal stats, not percentiles. Metrics use fixed ranges: SNR 0–1, velocity 0–50, leverage 0–200, 10xDEV 0–5, Scale V 0–9, efficiency 0–5. White outlined points exceed the display range; hover for exact values.">
    <svg viewBox="-22 0 315 291" role="img" aria-label={`${label}: personal raw usage and derived metrics radar on fixed axis scales`}>
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
          return <circle key={i} cx={x} cy={y} r="3" fill={shape.color} stroke={(shape.values[i] ?? 0) > shape.axes[i].cap ? "#ffffff" : undefined}>
            <title>{`${shape.title} · ${shape.axes[i].name}: ${shape.values[i]} · fixed ${shape.axes[i].log ? "logarithmic" : "linear"} axis 0–${shape.axes[i].cap}${(shape.values[i] ?? 0) > shape.axes[i].cap ? " · exceeds display range; exact value preserved" : ""}`}</title>
          </circle>;
        })}
      </g> : <text key={shape.title} x="12" y={shape.title === "RAW" ? 240 : 252} fill={shape.color} fontSize="8">{shape.title} UNAVAILABLE</text>)}
      {AXES.map((a, i) => {
        const [x, y] = pt(101, i);
        const anchor = i === 0 || i === 3 ? "middle" : i === 1 || i === 2 ? "start" : "end";
        return <g key={a.key}>
          <text x={x} y={y - 5} fill="#22d3ee" fontSize="8" textAnchor={anchor}>{RAW_AXES[i].name.replace("CACHE ", "")} {formatValue(rawValues[i], RAW_AXES[i].key)}</text>
          <text x={x} y={y + 7} fill={THEME.operator} fontSize="8" textAnchor={anchor}>{a.name} {formatValue(metricValues[i], a.key)}</text>
        </g>;
      })}
      <line x1="26" y1="267" x2="42" y2="267" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 2" />
      <text x="48" y="270" fill="#22d3ee" fontSize="8">RAW</text>
      <line x1="134" y1="267" x2="150" y2="267" stroke={THEME.operator} strokeWidth="2" />
      <text x="156" y="270" fill={THEME.operator} fontSize="8">METRICS</text>
      <text x="135" y="286" fill="#dee9ec" fontSize="6.5" textAnchor="middle">FIXED AXES · TOKENS LOG 0–1T · COST $0–10</text>
    </svg>
  </div>;
}
