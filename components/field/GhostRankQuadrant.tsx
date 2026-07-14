/**
 * GhostRankQuadrant — SVG scatter quadrant chart.
 *
 * X = total tokens (log scale), Y = yield (log scale). Median split lines on
 * both axes divide the field into four quadrants. Q2 (low volume, high yield)
 * is the "ghost rank" region — operators invisible on volume-based leaderboards
 * but dominant on yield. Q2 operators are plotted in cyan; all others in gray.
 * The top 5 ghost-rank operators are labeled with leader lines.
 *
 * Pure inline SVG, no chart libraries.
 */

import type { FieldOperator, GhostRank, FieldMedians } from "@/lib/field/types";

const GOLD = "#c4923a";
const CYAN = "#10b981";
const GRAY = "#5b6472";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface GhostRankQuadrantProps {
  operators: FieldOperator[];
  ghostRanks: GhostRank[];
  medians: FieldMedians;
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

export default function GhostRankQuadrant({
  operators,
  ghostRanks,
  medians,
}: GhostRankQuadrantProps) {
  const ghostHandles = new Set(ghostRanks.map((g) => g.handle));

  const points = operators
    .filter((o) => o.total_tokens > 0 && o.yield > 0)
    .map((o) => ({
      handle: o.handle,
      tokens: o.total_tokens,
      yield: o.yield,
      isGhost: ghostHandles.has(o.handle),
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
  const medTokens = Math.max(medians.total_tokens, 10 ** logTxMin);
  const medYield = Math.max(medians.yield, 10 ** logYMin);
  const medX = xFor(medTokens);
  const medY = yFor(medYield);

  // Top 5 ghost-rank operators by yield for labeling
  const topGhosts = [...ghostRanks]
    .sort((a, b) => b.yield - a.yield)
    .slice(0, 5)
    .map((g) => ({
      handle: g.handle,
      tokens: g.total_tokens,
      yield: g.yield,
    }));

  // Stagger label vertical offsets to avoid overlap
  const labelOffsets = [-28, -20, -12, -4, 4];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Ghost-rank outreach quadrant — Q2 operators highlighted"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={26} fontSize={14} fill={CYAN} fontWeight={700}>
        GHOST RANKS — Q2: LOW VOLUME, HIGH YIELD
      </text>
      <text
        x={width - padR}
        y={26}
        fontSize={11}
        fill={MUT}
        textAnchor="end"
      >
        {points.length} operators · log-log · median split
      </text>

      {/* Quadrant background tints */}
      <rect
        x={padL}
        y={padT}
        width={medX - padL}
        height={medY - padT}
        fill={CYAN}
        opacity={0.06}
      />
      <rect
        x={medX}
        y={padT}
        width={padL + plotW - medX}
        height={medY - padT}
        fill={GOLD}
        opacity={0.03}
      />
      <rect
        x={padL}
        y={medY}
        width={medX - padL}
        height={padT + plotH - medY}
        fill={GRAY}
        opacity={0.03}
      />
      <rect
        x={medX}
        y={medY}
        width={padL + plotW - medX}
        height={padT + plotH - medY}
        fill={GRAY}
        opacity={0.03}
      />

      {/* Quadrant labels */}
      <text x={padL + 8} y={padT + 16} fontSize={10} fill={CYAN} fontWeight={700}>
        Q2 · ghost ranks
      </text>
      <text
        x={padL + plotW - 8}
        y={padT + 16}
        fontSize={10}
        fill={GOLD}
        fontWeight={600}
        textAnchor="end"
      >
        Q1 · high vol, high yield
      </text>
      <text
        x={padL + 8}
        y={padT + plotH - 8}
        fontSize={10}
        fill={MUT}
        fontWeight={600}
      >
        Q3 · low vol, low yield
      </text>
      <text
        x={padL + plotW - 8}
        y={padT + plotH - 8}
        fontSize={10}
        fill={MUT}
        fontWeight={600}
        textAnchor="end"
      >
        Q4 · high vol, low yield
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

      {/* Data points — gray for non-ghost, cyan for ghost */}
      {points.map((p, i) => (
        <circle
          key={`pt-${i}`}
          cx={xFor(p.tokens).toFixed(1)}
          cy={yFor(p.yield).toFixed(1)}
          r={p.isGhost ? 3.5 : 2.5}
          fill={p.isGhost ? CYAN : GRAY}
          opacity={p.isGhost ? 0.85 : 0.4}
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

      {/* Top 5 ghost-rank labels with leader lines */}
      {topGhosts.map((g, i) => {
        const x = xFor(g.tokens);
        const y = yFor(g.yield);
        const labelY = y + labelOffsets[i];
        const labelX = x + 14;
        const shortHandle =
          g.handle.length > 16 ? `${g.handle.slice(0, 15)}…` : g.handle;
        return (
          <g key={`ghost-label-${g.handle}`}>
            <line
              x1={x}
              y1={y}
              x2={labelX - 2}
              y2={labelY}
              stroke={CYAN}
              strokeWidth={0.75}
              opacity={0.6}
            />
            <circle
              cx={x}
              cy={y}
              r={4}
              fill={CYAN}
              stroke={BG}
              strokeWidth={1}
            />
            <text
              x={labelX}
              y={labelY}
              fontSize={9}
              fill={INK}
              fontWeight={600}
              dominantBaseline="middle"
            >
              {shortHandle}
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
