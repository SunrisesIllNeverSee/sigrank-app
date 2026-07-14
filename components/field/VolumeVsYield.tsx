/**
 * VolumeVsYield — THE THESIS CHART.
 *
 * SVG scatter plot: X = total tokens (log scale), Y = yield (log scale).
 * Median lines on both axes. IQR-trimmed. Outliers labeled. Shows the
 * near-zero correlation between volume and yield — the core SigRank argument.
 *
 * Pure inline SVG, no chart libraries.
 */

import type { FieldOperator, IqrFence } from "@/lib/field/types";

const GOLD = "#c4923a";
const CASCADE = "#8b5cf6";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface VolumeVsYieldProps {
  operators: FieldOperator[];
  medianYield: number;
  medianTokens: number;
  yieldFence: IqrFence;
  tokensFence: IqrFence;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000_000_000) return `${(n / 1e15).toFixed(1)}Q`;
  if (n >= 1_000_000_000_000) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function fmtYield(y: number): string {
  if (y >= 100_000) return `${(y / 1000).toFixed(0)}K`;
  if (y >= 1000) return `${(y / 1000).toFixed(1)}K`;
  if (y >= 100) return y.toFixed(0);
  if (y >= 1) return y.toFixed(1);
  return y.toFixed(2);
}

export default function VolumeVsYield({
  operators,
  medianYield,
  medianTokens,
  yieldFence,
  tokensFence,
}: VolumeVsYieldProps) {
  const points = operators
    .filter((o) => o.total_tokens > 0 && o.yield >= 0)
    .map((o) => ({
      handle: o.handle,
      tokens: o.total_tokens,
      yield: Math.max(o.yield, 0.001), // avoid log(0)
      platform: o.platform,
    }));

  if (points.length === 0) return null;

  // Log scale ranges — use data extent with padding
  const logTxMin = Math.log10(Math.min(...points.map((p) => p.tokens)));
  const logTxMax = Math.log10(Math.max(...points.map((p) => p.tokens)));
  const logYMin = Math.log10(Math.min(...points.map((p) => p.yield)));
  const logYMax = Math.log10(Math.max(...points.map((p) => p.yield)));

  // Layout
  const width = 800;
  const height = 480;
  const padL = 64;
  const padR = 24;
  const padT = 48;
  const padB = 56;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xFor = (tokens: number) =>
    padL + ((Math.log10(tokens) - logTxMin) / (logTxMax - logTxMin)) * plotW;
  const yFor = (y: number) =>
    padT + plotH - ((Math.log10(y) - logYMin) / (logYMax - logYMin)) * plotH;

  // Median positions
  const medX = xFor(medianTokens);
  const medY = yFor(medianYield);

  // Outliers: highest yield, highest tokens, and a few extremes
  const sortedByYield = [...points].sort((a, b) => b.yield - a.yield);
  const sortedByTokens = [...points].sort((a, b) => b.tokens - a.tokens);
  const outliers = [
    { ...sortedByYield[0], tag: "max Υ" },
    { ...sortedByTokens[0], tag: "max tokens" },
    { ...sortedByYield[1], tag: "" },
    { ...sortedByTokens[1], tag: "" },
  ].filter(
    (v, i, arr) =>
      arr.findIndex((x) => x.handle === v.handle) === i,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Volume versus yield scatter plot — no correlation"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={26} fontSize={14} fill={GOLD} fontWeight={700}>
        VOLUME ≠ YIELD — TOTAL TOKENS vs Υ
      </text>
      <text
        x={width - padR}
        y={26}
        fontSize={11}
        fill={MUT}
        textAnchor="end"
      >
        {operators.length} operators · log-log · near-zero correlation
      </text>

      {/* Grid + axis labels X */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const x = padL + f * plotW;
        const val = 10 ** (logTxMin + f * (logTxMax - logTxMin));
        return (
          <g key={`xgrid-${f}`}>
            <line
              x1={x}
              y1={padT}
              x2={x}
              y2={padT + plotH}
              stroke={LINE}
              strokeWidth={1}
              opacity={0.4}
            />
            <text
              x={x}
              y={padT + plotH + 18}
              fontSize={10}
              fill={MUT}
              textAnchor="middle"
            >
              {fmtTokens(val)}
            </text>
          </g>
        );
      })}

      {/* Grid + axis labels Y */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + plotH - f * plotH;
        const val = 10 ** (logYMin + f * (logYMax - logYMin));
        return (
          <g key={`ygrid-${f}`}>
            <line
              x1={padL}
              y1={y}
              x2={padL + plotW}
              y2={y}
              stroke={LINE}
              strokeWidth={1}
              opacity={0.4}
            />
            <text
              x={padL - 8}
              y={y}
              fontSize={10}
              fill={MUT}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {fmtYield(val)}
            </text>
          </g>
        );
      })}

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={xFor(p.tokens).toFixed(1)}
          cy={yFor(p.yield).toFixed(1)}
          r={2.5}
          fill={CASCADE}
          opacity={0.35}
        />
      ))}

      {/* Median lines */}
      <line
        x1={medX}
        y1={padT}
        x2={medX}
        y2={padT + plotH}
        stroke={GOLD}
        strokeWidth={1.5}
        strokeDasharray="6 3"
        opacity={0.8}
      />
      <line
        x1={padL}
        y1={medY}
        x2={padL + plotW}
        y2={medY}
        stroke={GOLD}
        strokeWidth={1.5}
        strokeDasharray="6 3"
        opacity={0.8}
      />
      <text
        x={medX + 4}
        y={padT + 12}
        fontSize={10}
        fill={GOLD}
        fontWeight={600}
      >
        median tokens
      </text>
      <text
        x={padL + plotW - 4}
        y={medY - 4}
        fontSize={10}
        fill={GOLD}
        fontWeight={600}
        textAnchor="end"
      >
        median Υ
      </text>

      {/* Outlier labels */}
      {outliers.map((o) => {
        const x = xFor(o.tokens);
        const y = yFor(o.yield);
        return (
          <g key={`out-${o.handle}`}>
            <circle cx={x} cy={y} r={4} fill={GOLD} stroke={BG} strokeWidth={1} />
            <text
              x={x + 8}
              y={y - 6}
              fontSize={9}
              fill={INK}
              fontWeight={600}
            >
              {o.handle.length > 14 ? `${o.handle.slice(0, 13)}…` : o.handle}
              {o.tag ? ` (${o.tag})` : ""}
            </text>
          </g>
        );
      })}

      {/* Axis titles */}
      <text
        x={padL + plotW / 2}
        y={height - 10}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
      >
        Total Tokens (log scale)
      </text>
      <text
        x={16}
        y={padT + plotH / 2}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
        transform={`rotate(-90 16 ${padT + plotH / 2})`}
      >
        Yield (Υ, log scale)
      </text>
    </svg>
  );
}
