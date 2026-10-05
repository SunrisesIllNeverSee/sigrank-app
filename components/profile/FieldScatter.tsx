"use client";

import type { LeaderboardRow } from "@/lib/board";

interface Props {
  boardRows: LeaderboardRow[];
  operatorCodename: string;
  width?: number;
  height?: number;
}

const GOLD = "rgb(var(--gold))";
const MUTED = "rgb(var(--text-dim))";
const DIM = "rgb(var(--bg-border))";
const SURF = "rgb(var(--bg-surface))";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function fmtYield(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function FieldScatter({ boardRows, operatorCodename, width = 280, height = 140 }: Props) {
  // Extract yield + rank for all ranked operators
  const points = boardRows
    .filter((r) => r.snapshot.cascade && !r.pending)
    .map((r) => ({
      yield_: r.snapshot.cascade!.yield_,
      rank: r.global_rank,
      codename: r.operator.codename,
      isYou: r.operator.codename === operatorCodename,
    }));

  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-bg-border"
        style={{ width: "100%", height }}
      >
        <span className="font-mono text-[10px] text-text-muted">
          Not enough operators to plot field position
        </span>
      </div>
    );
  }

  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 22;
  const W = width;
  const H = height;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Use log scale for yield (values span orders of magnitude)
  const yields = points.map((p) => Math.log10(Math.max(1, p.yield_)));
  const yMin = Math.min(...yields);
  const yMax = Math.max(...yields);
  const yRange = yMax - yMin || 1;
  const yPad = yRange * 0.1;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const ranks = points.map((p) => p.rank);
  const rMax = Math.max(...ranks);
  const rMin = Math.min(...ranks);
  const rRange = rMax - rMin || 1;

  const xAt = (yieldLog: number) =>
    padL + (innerW * (yieldLog - yLo)) / (yHi - yLo);
  const yAt = (rank: number) =>
    padT + innerH * (1 - (rank - rMin) / rRange);

  // Yield tick labels (convert log back to linear)
  const tickCount = 3;
  const yieldTicks = Array.from({ length: tickCount }, (_, i) =>
    yLo + ((yHi - yLo) * i) / (tickCount - 1),
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Field scatter — operator yield vs rank"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {/* gridlines + x labels (yield) */}
      {yieldTicks.map((t, i) => {
        const x = xAt(t);
        const val = Math.pow(10, t);
        return (
          <g key={`yt-${i}`}>
            <line
              x1={x.toFixed(2)}
              y1={padT}
              x2={x.toFixed(2)}
              y2={padT + innerH}
              stroke={DIM}
              strokeDasharray="2 3"
              strokeWidth={0.5}
              opacity={0.5}
            />
            <text
              x={x.toFixed(2)}
              y={H - 6}
              textAnchor="middle"
              fontSize={8}
              fill={MUTED}
              fontFamily={MONO}
            >
              {fmtYield(val)}
            </text>
          </g>
        );
      })}

      {/* y-axis label */}
      <text
        x={4}
        y={padT + innerH / 2}
        textAnchor="middle"
        fontSize={8}
        fill={MUTED}
        fontFamily={MONO}
        transform={`rotate(-90 4 ${padT + innerH / 2})`}
      >
        RANK
      </text>

      {/* field dots */}
      {points.map((p, i) => {
        if (p.isYou) return null;
        return (
          <circle
            key={`d-${i}`}
            cx={xAt(Math.log10(Math.max(1, p.yield_))).toFixed(2)}
            cy={yAt(p.rank).toFixed(2)}
            r={2}
            fill={MUTED}
            opacity={0.4}
          />
        );
      })}

      {/* highlight: you */}
      {points
        .filter((p) => p.isYou)
        .map((p, i) => {
          const cx = xAt(Math.log10(Math.max(1, p.yield_)));
          const cy = yAt(p.rank);
          return (
            <g key={`you-${i}`}>
              <circle
                cx={cx.toFixed(2)}
                cy={cy.toFixed(2)}
                r={8}
                fill={GOLD}
                opacity={0.15}
              />
              <circle
                cx={cx.toFixed(2)}
                cy={cy.toFixed(2)}
                r={4}
                fill={GOLD}
                stroke={SURF}
                strokeWidth={1.5}
              />
              <text
                x={(cx + 8).toFixed(2)}
                y={(cy + 3).toFixed(2)}
                fontSize={9}
                fill={GOLD}
                fontFamily={MONO}
                fontWeight="bold"
              >
                #{p.rank}
              </text>
            </g>
          );
        })}

      {/* x-axis label */}
      <text
        x={padL + innerW / 2}
        y={H - 1}
        textAnchor="middle"
        fontSize={8}
        fill={MUTED}
        fontFamily={MONO}
      >
        Υ YIELD (log)
      </text>
    </svg>
  );
}
