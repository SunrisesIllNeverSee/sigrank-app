/**
 * PlatformAdoption — SVG horizontal bar chart of platform adoption counts.
 *
 * Each platform gets a bar proportional to its operator count. Median line
 * shows the midpoint. Pure inline SVG, no chart libraries.
 */

import type { PlatformAdoption as PlatformAdoptionData } from "@/lib/field/types";

const GOLD = "#c4923a";
const CASCADE = "#8b5cf6";
const ARCH = "#3b82f6";
const SEEK = "#10b981";
const THROUGHPUT = "#5b6472";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

const PLATFORM_COLORS: Record<string, string> = {
  anthropic: CASCADE,
  openai: ARCH,
  google: SEEK,
  other: THROUGHPUT,
  zhipu: GOLD,
  deepseek: "#e0a64a",
  minimax: "#c0392b",
  moonshot: "#7c3aed",
  unknown: MUT,
  xiaomi: "#f59e0b",
  alibaba: "#ef4444",
  xai: "#10b981",
  nvidia: "#76b900",
  bytedance: "#ec4899",
  mistral: "#ff6b35",
};

export interface PlatformAdoptionProps {
  platforms: PlatformAdoptionData[];
}

export default function PlatformAdoption({
  platforms,
}: PlatformAdoptionProps) {
  const sorted = [...platforms].sort((a, b) => b.count - a.count);
  if (sorted.length === 0) return null;

  const maxCount = Math.max(...sorted.map((p) => p.count));
  const medianCount = sorted.length > 0
    ? sorted[Math.floor(sorted.length / 2)].count
    : 0;

  // Layout
  const rowH = 26;
  const padT = 40;
  const padB = 14;
  const padL = 18;
  const labelW = 100;
  const valW = 70;
  const width = 800;
  const plotL = padL + labelW;
  const plotW = width - plotL - valW - padL;
  const height = padT + sorted.length * rowH + padB;

  const medianBarX = plotL + (medianCount / maxCount) * plotW;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Platform adoption horizontal bar chart"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={24} fontSize={13} fill={INK} fontWeight={700}>
        PLATFORM ADOPTION — OPERATOR COUNT BY PRIMARY MODEL
      </text>

      {/* Median line */}
      <line
        x1={medianBarX}
        y1={padT - 6}
        x2={medianBarX}
        y2={padT + sorted.length * rowH}
        stroke={GOLD}
        strokeWidth={1.5}
        strokeDasharray="5 3"
      />
      <text
        x={medianBarX}
        y={padT - 10}
        fontSize={9}
        fill={GOLD}
        textAnchor="middle"
        fontWeight={600}
      >
        median
      </text>

      {/* Bars */}
      {sorted.map((p, i) => {
        const y = padT + i * rowH;
        const cy = y + rowH / 2;
        const w = (p.count / maxCount) * plotW;
        const color = PLATFORM_COLORS[p.platform] ?? THROUGHPUT;
        return (
          <g key={p.platform}>
            {/* Label */}
            <text
              x={padL + labelW - 8}
              y={cy}
              dominantBaseline="middle"
              textAnchor="end"
              fontSize={11}
              fill={INK}
            >
              {p.platform}
            </text>
            {/* Track */}
            <rect
              x={plotL}
              y={y + 5}
              width={plotW}
              height={rowH - 10}
              fill={LINE}
              opacity={0.3}
              rx={2}
            />
            {/* Bar */}
            <rect
              x={plotL}
              y={y + 5}
              width={Math.max(2, w)}
              height={rowH - 10}
              fill={color}
              opacity={0.85}
              rx={2}
            />
            {/* Value */}
            <text
              x={width - padL}
              y={cy}
              dominantBaseline="middle"
              textAnchor="end"
              fontSize={11}
              fontWeight={700}
              fill={INK}
            >
              {p.count.toLocaleString()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
