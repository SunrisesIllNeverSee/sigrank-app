/**
 * FieldSNRDistribution — SVG histogram of SNR (signal-to-noise ratio).
 *
 * 20 buckets across the IQR-trimmed SNR range. Median line in gold. IQR fence
 * boundaries dashed. Pure inline SVG, no chart libraries.
 */

import type { FieldOperator, IqrFence } from "@/lib/field/types";

const GOLD = "#c4923a";
const SEEK = "#10b981";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface FieldSNRDistributionProps {
  operators: FieldOperator[];
  median: number;
  fence: IqrFence;
}

export default function FieldSNRDistribution({
  operators,
  median,
  fence,
}: FieldSNRDistributionProps) {
  const snrs = operators.map((o) => o.snr).filter((s) => s > 0);
  if (snrs.length === 0) return null;

  // Use a log scale for SNR since values span 0.0001 to 0.3+
  const logMin = Math.log10(Math.min(...snrs));
  const logMax = Math.log10(Math.max(...snrs));
  const range = logMax - logMin || 1;
  const buckets = 20;
  const bucketW = range / buckets;

  const counts = new Array(buckets).fill(0);
  for (const s of snrs) {
    const idx = Math.min(
      buckets - 1,
      Math.floor((Math.log10(s) - logMin) / bucketW),
    );
    counts[idx]++;
  }
  const maxCount = Math.max(...counts);

  // Layout
  const width = 800;
  const height = 340;
  const padL = 56;
  const padR = 24;
  const padT = 44;
  const padB = 52;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const barW = plotW / buckets;
  const xForBucket = (i: number) => padL + i * barW;
  const yForCount = (c: number) => padT + plotH - (c / maxCount) * plotH;

  // Median position (log scale)
  const medianX =
    padL + ((Math.log10(median) - logMin) / range) * plotW;

  // IQR fence positions
  const fenceLowerX =
    padL +
    ((Math.log10(Math.max(fence.lower, 10 ** logMin)) - logMin) / range) *
      plotW;
  const fenceUpperX =
    padL +
    ((Math.log10(Math.min(fence.upper, 10 ** logMax)) - logMin) / range) *
      plotW;

  const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="SNR distribution histogram with median and IQR fences"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={24} fontSize={13} fill={SEEK} fontWeight={700}>
        SNR DISTRIBUTION — {operators.length} HUMAN OPERATORS
      </text>
      <text
        x={width - padR}
        y={24}
        fontSize={11}
        fill={MUT}
        textAnchor="end"
      >
        log scale · 20 buckets
      </text>

      {/* Y-axis grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + plotH - f * plotH;
        return (
          <g key={`grid-${f}`}>
            <line
              x1={padL}
              y1={y}
              x2={padL + plotW}
              y2={y}
              stroke={LINE}
              strokeWidth={1}
              opacity={0.5}
            />
            <text
              x={padL - 8}
              y={y}
              fontSize={10}
              fill={MUT}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {Math.round(f * maxCount)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {counts.map((c, i) => {
        const x = xForBucket(i);
        const y = yForCount(c);
        const h = padT + plotH - y;
        const bucketCenter = logMin + (i + 0.5) * bucketW;
        const isMedianBucket =
          Math.abs(bucketCenter - Math.log10(median)) < bucketW;
        return (
          <rect
            key={`bar-${i}`}
            x={x + 1}
            y={y}
            width={barW - 2}
            height={Math.max(0, h)}
            fill={isMedianBucket ? GOLD : SEEK}
            opacity={isMedianBucket ? 0.9 : 0.55}
            rx={1}
          />
        );
      })}

      {/* IQR fence lines (dashed) */}
      <line
        x1={fenceLowerX}
        y1={padT}
        x2={fenceLowerX}
        y2={padT + plotH}
        stroke={MUT}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <line
        x1={fenceUpperX}
        y1={padT}
        x2={fenceUpperX}
        y2={padT + plotH}
        stroke={MUT}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <text
        x={fenceLowerX}
        y={padT - 6}
        fontSize={9}
        fill={MUT}
        textAnchor="middle"
      >
        Q1
      </text>
      <text
        x={fenceUpperX}
        y={padT - 6}
        fontSize={9}
        fill={MUT}
        textAnchor="middle"
      >
        Q3
      </text>

      {/* Median line (gold) */}
      <line
        x1={medianX}
        y1={padT - 12}
        x2={medianX}
        y2={padT + plotH}
        stroke={GOLD}
        strokeWidth={2}
      />
      <text
        x={medianX}
        y={padT - 16}
        fontSize={11}
        fill={GOLD}
        textAnchor="middle"
        fontWeight={700}
      >
        median {fmtPct(median)}
      </text>

      {/* X-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const x = padL + f * plotW;
        const val = 10 ** (logMin + f * range);
        return (
          <text
            key={`xlab-${f}`}
            x={x}
            y={padT + plotH + 18}
            fontSize={10}
            fill={MUT}
            textAnchor="middle"
          >
            {fmtPct(val)}
          </text>
        );
      })}
      <text
        x={padL + plotW / 2}
        y={height - 8}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
      >
        Signal-to-Noise Ratio (output / (input + output))
      </text>
    </svg>
  );
}
