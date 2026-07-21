/**
 * YieldQuartileBoxPlot — SVG box plots: 4 metrics × 4 yield quartiles.
 *
 * Each group is a yield quartile (Q1-low → Q4-high). Within each group, 4
 * box plots for yield, leverage, velocity, and SNR. Box = IQR (Q1–Q3), line
 * = median (approximated as midpoint of Q1/Q3), whiskers = fence bounds.
 * Pure inline SVG, no chart libraries.
 */

import type { YieldQuartile } from "@/lib/analytics/field-types";

const GOLD = "#c4923a";
const CASCADE = "#8b5cf6";
const ARCH = "#3b82f6";
const SEEK = "#10b981";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface YieldQuartileBoxPlotProps {
  quartiles: YieldQuartile[];
}

const METRICS = [
  { key: "yield", label: "Υ Yield", color: GOLD },
  { key: "leverage", label: "Leverage", color: CASCADE },
  { key: "velocity", label: "Velocity", color: ARCH },
  { key: "snr", label: "SNR", color: SEEK },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

export default function YieldQuartileBoxPlot({
  quartiles,
}: YieldQuartileBoxPlotProps) {
  if (quartiles.length === 0) return null;

  // For each metric, compute a global max (upper fence) for scaling
  const metricMaxes: Record<MetricKey, number> = {} as Record<MetricKey, number>;
  for (const m of METRICS) {
    metricMaxes[m.key] = Math.max(
      ...quartiles.map((q) => q[m.key].upper),
    );
  }

  // Layout
  const width = 800;
  const height = 420;
  const padL = 60;
  const padR = 24;
  const padT = 48;
  const padB = 56;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const groupW = plotW / quartiles.length;
  const boxW = 18;
  const boxGap = 6;
  const groupInnerW = METRICS.length * (boxW + boxGap) - boxGap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Yield quartile box plots for 4 metrics"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={26} fontSize={13} fill={GOLD} fontWeight={700}>
        YIELD QUARTILE BOX PLOTS — 4 METRICS × 4 QUARTILES
      </text>
      <text
        x={width - padR}
        y={26}
        fontSize={11}
        fill={MUT}
        textAnchor="end"
      >
        box = IQR · line = median · whiskers = fences
      </text>

      {/* Y-axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + plotH - f * plotH;
        return (
          <line
            key={`yg-${f}`}
            x1={padL}
            y1={y}
            x2={padL + plotW}
            y2={y}
            stroke={LINE}
            strokeWidth={1}
            opacity={0.3}
          />
        );
      })}

      {/* Box plots */}
      {quartiles.map((q, qi) => {
        const groupX = padL + qi * groupW;
        const groupCenter = groupX + groupW / 2;
        return (
          <g key={`q-${qi}`}>
            {METRICS.map((m, mi) => {
              const fence = q[m.key];
              const max = metricMaxes[m.key] || 1;
              const x =
                groupCenter -
                groupInnerW / 2 +
                mi * (boxW + boxGap);
              const cx = x + boxW / 2;

              // Scale: 0 at bottom, max at top
              const yFor = (v: number) =>
                padT + plotH - (Math.max(0, v) / max) * plotH;

              const lowerY = yFor(fence.lower);
              const q1Y = yFor(fence.q1);
              const q3Y = yFor(fence.q3);
              const upperY = yFor(fence.upper);
              const medianY = yFor((fence.q1 + fence.q3) / 2);

              return (
                <g key={`box-${qi}-${m.key}`}>
                  {/* Whiskers */}
                  <line
                    x1={cx}
                    y1={lowerY}
                    x2={cx}
                    y2={q1Y}
                    stroke={m.color}
                    strokeWidth={1}
                    opacity={0.6}
                  />
                  <line
                    x1={cx}
                    y1={q3Y}
                    x2={cx}
                    y2={upperY}
                    stroke={m.color}
                    strokeWidth={1}
                    opacity={0.6}
                  />
                  {/* Whisker caps */}
                  <line
                    x1={cx - 5}
                    y1={lowerY}
                    x2={cx + 5}
                    y2={lowerY}
                    stroke={m.color}
                    strokeWidth={1}
                    opacity={0.6}
                  />
                  <line
                    x1={cx - 5}
                    y1={upperY}
                    x2={cx + 5}
                    y2={upperY}
                    stroke={m.color}
                    strokeWidth={1}
                    opacity={0.6}
                  />
                  {/* Box (IQR) */}
                  <rect
                    x={x}
                    y={q3Y}
                    width={boxW}
                    height={Math.max(0, q1Y - q3Y)}
                    fill={m.color}
                    fillOpacity={0.25}
                    stroke={m.color}
                    strokeWidth={1.5}
                  />
                  {/* Median line */}
                  <line
                    x1={x}
                    y1={medianY}
                    x2={x + boxW}
                    y2={medianY}
                    stroke={m.color}
                    strokeWidth={2}
                  />
                </g>
              );
            })}
            {/* Quartile label */}
            <text
              x={groupCenter}
              y={padT + plotH + 18}
              fontSize={11}
              fill={INK}
              textAnchor="middle"
              fontWeight={600}
            >
              {q.label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {METRICS.map((m, i) => {
        const lx = padL + i * 120;
        return (
          <g key={`leg-${m.key}`}>
            <rect
              x={lx}
              y={height - 22}
              width={10}
              height={10}
              rx={2}
              fill={m.color}
              fillOpacity={0.25}
              stroke={m.color}
              strokeWidth={1.5}
            />
            <text
              x={lx + 14}
              y={height - 13}
              fontSize={10}
              fill={INK}
              dominantBaseline="middle"
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Y-axis title */}
      <text
        x={16}
        y={padT + plotH / 2}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
        transform={`rotate(-90 16 ${padT + plotH / 2})`}
      >
        Normalized value (per-metric scale)
      </text>
    </svg>
  );
}
