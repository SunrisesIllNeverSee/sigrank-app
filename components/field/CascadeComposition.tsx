/**
 * CascadeComposition — SVG stacked bars for 4 notable operators.
 *
 * Each operator gets a vertical bar stacked into 4 segments: input, output,
 * cache_write, cache_read. Shows the cascade architecture — how different
 * operators compose their token spend. Pure inline SVG, no chart libraries.
 */

import type { FieldOperator } from "@/lib/field/types";

const BOT = "#c0392b";
const SEEK = "#10b981";
const ARCH = "#3b82f6";
const CASCADE = "#8b5cf6";
const GOLD = "#c4923a";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface CascadeCompositionProps {
  operators: FieldOperator[];
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export default function CascadeComposition({
  operators,
}: CascadeCompositionProps) {
  if (operators.length === 0) return null;

  // Use log scale for each segment since values span orders of magnitude
  const segments = operators.map((o) => {
    const logVal = (v: number) => (v > 0 ? Math.log10(v) : 0);
    return {
      handle: o.handle,
      display: o.display_name,
      yield: o.yield,
      input: logVal(o.input_tokens),
      output: logVal(o.output_tokens),
      cacheWrite: logVal(o.cache_write_tokens),
      cacheRead: logVal(o.cache_read_tokens),
      total:
        logVal(o.input_tokens) +
        logVal(o.output_tokens) +
        logVal(o.cache_write_tokens) +
        logVal(o.cache_read_tokens),
    };
  });

  const maxTotal = Math.max(...segments.map((s) => s.total));

  // Layout
  const width = 800;
  const height = 400;
  const padL = 56;
  const padR = 24;
  const padT = 48;
  const padB = 72;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const barW = plotW / segments.length;
  const barGap = barW * 0.25;
  const innerBarW = barW - barGap;

  const SEGMENT_COLORS = [
    { key: "input", color: BOT, label: "Input" },
    { key: "output", color: SEEK, label: "Output" },
    { key: "cacheWrite", color: ARCH, label: "Cache Write" },
    { key: "cacheRead", color: CASCADE, label: "Cache Read" },
  ] as const;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Cascade composition stacked bars for notable operators"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={26} fontSize={13} fill={CASCADE} fontWeight={700}>
        CASCADE COMPOSITION — 4 NOTABLE OPERATORS
      </text>
      <text
        x={width - padR}
        y={26}
        fontSize={11}
        fill={MUT}
        textAnchor="end"
      >
        log-scaled segments · input / output / cacheWrite / cacheRead
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
            opacity={0.4}
          />
        );
      })}

      {/* Stacked bars */}
      {segments.map((s, si) => {
        const barX = padL + si * barW + barGap / 2;
        let stackY = padT + plotH;
        return (
          <g key={`op-${si}`}>
            {SEGMENT_COLORS.map((seg) => {
              const segH = (s[seg.key] / maxTotal) * plotH;
              const segY = stackY - segH;
              stackY = segY;
              return (
                <rect
                  key={seg.key}
                  x={barX}
                  y={segY}
                  width={innerBarW}
                  height={Math.max(0, segH)}
                  fill={seg.color}
                  opacity={0.85}
                />
              );
            })}
            {/* Operator label */}
            <text
              x={barX + innerBarW / 2}
              y={padT + plotH + 16}
              fontSize={10}
              fill={INK}
              textAnchor="middle"
              fontWeight={600}
            >
              {s.display.length > 14
                ? `${s.display.slice(0, 13)}…`
                : s.display}
            </text>
            <text
              x={barX + innerBarW / 2}
              y={padT + plotH + 30}
              fontSize={9}
              fill={GOLD}
              textAnchor="middle"
            >
              Υ {s.yield >= 1000 ? fmtTokens(s.yield) : s.yield.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {SEGMENT_COLORS.map((seg, i) => {
        const lx = padL + i * 120;
        return (
          <g key={`leg-${seg.key}`}>
            <rect
              x={lx}
              y={height - 22}
              width={10}
              height={10}
              rx={2}
              fill={seg.color}
            />
            <text
              x={lx + 14}
              y={height - 13}
              fontSize={10}
              fill={INK}
              dominantBaseline="middle"
            >
              {seg.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

