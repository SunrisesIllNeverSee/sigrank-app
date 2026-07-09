import type { ScoredSnapshot } from "@/lib/scoring/types";

/**
 * MetricRadar — hand-rolled SVG pentagon radar of the Core 5, normalized to each
 * metric's display range. Zero dependencies; themes via CSS vars. Server
 * component. Sharp/modern: hairline grid rings + axes, one brand-gold polygon,
 * tiny mono axis labels. (CompareTable ships the two-operator overlay version;
 * this is the single-operator profile shape.)
 */

interface Props {
  snapshot: ScoredSnapshot;
  /** SVG size in user units (square; width fills the container). */
  size?: number;
}

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

export function MetricRadar({ snapshot: s, size = 240 }: Props) {
  const axes = [
    { label: "COMP", canon: "M.01", value: s.compression_ratio, max: 1 },
    { label: "PC", canon: "M.02", value: s.prompt_complexity.value, max: 100 },
    { label: "CT", canon: "M.03", value: s.cross_thread, max: 100 },
    { label: "SD", canon: "M.04", value: s.session_depth, max: 30 },
    // TT (M.05 token-throughput) removed 2026-06-26 — word-era metric, muted from §IGNA;
    // it was fed the raw total (e.g. 2.19B) which pegged this axis (max 20000) and distorted
    // the radar. 4-axis radar until §IGNA recal defines any replacement.
  ];

  const center = size / 2;
  const radius = center - 34;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const vertex = (i: number, dist: number) => ({
    x: center + dist * Math.cos(angle(i)),
    y: center + dist * Math.sin(angle(i)),
  });

  const polygon = axes
    .map((a, i) => {
      const norm = Math.max(0, Math.min(1, a.value / a.max));
      const p = vertex(i, norm * radius);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full"
      role="img"
      aria-label="Core 5 metric radar"
    >
      {/* grid rings */}
      {[0.33, 0.66, 1].map((f) => (
        <polygon
          key={f}
          points={axes
            .map((_, i) => {
              const p = vertex(i, radius * f);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgb(var(--bg-border) / 0.7)"
          strokeWidth={1}
        />
      ))}

      {/* axes */}
      {axes.map((_, i) => {
        const p = vertex(i, radius);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgb(var(--bg-border-subtle))"
            strokeWidth={1}
          />
        );
      })}

      {/* value polygon */}
      <polygon
        points={polygon}
        fill="rgb(var(--gold) / 0.18)"
        stroke="rgb(var(--gold))"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* axis labels */}
      {axes.map((a, i) => {
        const p = vertex(i, radius + 16);
        return (
          <text
            key={a.canon}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgb(var(--text-secondary))"
            fontSize={10}
            fontWeight={600}
            fontFamily={MONO}
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
