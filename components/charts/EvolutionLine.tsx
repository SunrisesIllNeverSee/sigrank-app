"use client";

/*
 * EvolutionLine — a single-metric line chart over time. Gold line, subtle
 * gridlines, emphasized last-point dot.
 *
 * Pure inline SVG. Locked theme:
 *   gold #c4923a · line #332d20 · bone #e9e3d5 · muted #7d7461
 */

export interface EvolutionPoint {
  date: string;
  value: number;
}

export interface EvolutionLineProps {
  points: EvolutionPoint[];
  label: string;
  /** SVG width.  Default 480. */
  width?: number;
  /** SVG height. Default 180. */
  height?: number;
}

// Theme-reactive (owner 2026-06-19): CSS vars re-resolve when data-theme flips.
const GOLD = "rgb(var(--gold))";
const LINE = "rgb(var(--bg-border))";
const BONE = "rgb(var(--text-primary))";
const MUTED = "rgb(var(--text-muted))";

function fmtVal(n: number): string {
  if (!isFinite(n)) return "0";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

export default function EvolutionLine({
  points,
  label,
  width = 480,
  height = 180,
}: EvolutionLineProps) {
  const padL = 44;
  const padR = 14;
  const padT = 22;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  if (points.length === 0) {
    return (
      <div className="font-sans text-sm text-text-muted">{label}: no data</div>
    );
  }

  const vals = points.map((p) => p.value);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  // pad the range so a flat series still renders mid-band
  const span = rawMax - rawMin;
  const min = span === 0 ? rawMin - 1 : rawMin - span * 0.08;
  const max = span === 0 ? rawMax + 1 : rawMax + span * 0.08;
  const range = max - min || 1;

  const n = points.length;
  const xAt = (i: number) =>
    padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - min) / range) * plotH;

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(p.value).toFixed(2)}`,
    )
    .join(" ");

  const last = points[n - 1];
  const lastX = xAt(n - 1);
  const lastY = yAt(last.value);

  const gridLines = [0, 0.5, 1]; // bottom, mid, top of plot band

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={`${label} over time`}
      className="font-sans"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {/* title */}
      <text
        x={padL}
        y={14}
        fontSize={11}
        fill={MUTED}
        style={{ letterSpacing: "0.04em" }}
      >
        {label.toUpperCase()}
      </text>

      {/* horizontal gridlines + y labels */}
      {gridLines.map((t) => {
        const y = padT + plotH - t * plotH;
        const v = min + t * range;
        return (
          <g key={t}>
            <line
              x1={padL}
              y1={y.toFixed(2)}
              x2={width - padR}
              y2={y.toFixed(2)}
              stroke={LINE}
              strokeWidth={1}
              opacity={0.6}
            />
            <text
              x={padL - 6}
              y={y.toFixed(2)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={MUTED}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {fmtVal(v)}
            </text>
          </g>
        );
      })}

      {/* the line */}
      <path
        d={linePath}
        fill="none"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* last-point dot + halo */}
      <circle
        cx={lastX.toFixed(2)}
        cy={lastY.toFixed(2)}
        r={5}
        fill={GOLD}
        fillOpacity={0.2}
      />
      <circle cx={lastX.toFixed(2)} cy={lastY.toFixed(2)} r={3} fill={GOLD} />

      {/* x-axis end labels */}
      <text
        x={padL}
        y={height - 8}
        textAnchor="start"
        fontSize={10}
        fill={MUTED}
      >
        {points[0].date}
      </text>
      {n > 1 && (
        <text
          x={width - padR}
          y={height - 8}
          textAnchor="end"
          fontSize={10}
          fill={BONE}
        >
          {last.date}
        </text>
      )}
    </svg>
  );
}
