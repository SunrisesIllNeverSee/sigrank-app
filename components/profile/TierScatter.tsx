"use client";

import type { LeaderboardRow } from "@/lib/board";

interface TierThreshold {
  class: string;
  totalMin: number;
}

interface Props {
  boardRows: LeaderboardRow[];
  operatorCodename: string;
  tierThresholds: TierThreshold[];
  width?: number;
  height?: number;
}

const GOLD = "rgb(var(--gold))";
const MUTED = "rgb(var(--text-dim))";
const DIM = "rgb(var(--bg-border))";
const SURF = "rgb(var(--bg-surface))";
const ACCENT = "rgb(var(--accent))";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function totalTokens(r: LeaderboardRow): number {
  return (
    r.telemetry.fresh_input +
    r.telemetry.output +
    r.telemetry.cache_read +
    r.telemetry.cache_create
  );
}

export function TierScatter({ boardRows, operatorCodename, tierThresholds, width = 280, height = 160 }: Props) {
  const points = boardRows
    .filter((r) => r.snapshot.cascade && !r.pending)
    .map((r) => ({
      total: totalTokens(r),
      yield_: r.snapshot.cascade!.yield_,
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
          Not enough operators to plot
        </span>
      </div>
    );
  }

  const padL = 40;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const W = width;
  const H = height;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Log scales for both axes (tokens and yield span orders of magnitude)
  const totals = points.map((p) => Math.log10(Math.max(1, p.total)));
  const yields = points.map((p) => Math.log10(Math.max(1, p.yield_)));
  const tMin = Math.min(...totals);
  const tMax = Math.max(...totals);
  const yMin = Math.min(...yields);
  const yMax = Math.max(...yields);
  const tPad = (tMax - tMin) * 0.1 || 1;
  const yPad = (yMax - yMin) * 0.1 || 1;
  const tLo = tMin - tPad;
  const tHi = tMax + tPad;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const xAt = (tLog: number) => padL + (innerW * (tLog - tLo)) / (tHi - tLo);
  const yAt = (yLog: number) => padT + innerH * (1 - (yLog - yLo) / (yHi - yLo));

  // Tier threshold lines (convert to log)
  const visibleThresholds = tierThresholds.filter(
    (t) => t.totalMin > 0 && Math.log10(t.totalMin) >= tLo && Math.log10(t.totalMin) <= tHi,
  );

  // Ticks
  const tTickCount = 4;
  const tTicks = Array.from({ length: tTickCount }, (_, i) =>
    tLo + ((tHi - tLo) * i) / (tTickCount - 1),
  );
  const yTickCount = 3;
  const yTicks = Array.from({ length: yTickCount }, (_, i) =>
    yLo + ((yHi - yLo) * i) / (yTickCount - 1),
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Tier scatter — total tokens vs yield"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {/* gridlines + x labels (total tokens) */}
      {tTicks.map((t, i) => {
        const x = xAt(t);
        const val = Math.pow(10, t);
        return (
          <g key={`tt-${i}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={DIM} strokeDasharray="2 3" strokeWidth={0.5} opacity={0.4} />
            <text x={x} y={H - 6} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={MONO}>
              {fmtTokens(val)}
            </text>
          </g>
        );
      })}

      {/* y labels (yield) */}
      {yTicks.map((t, i) => {
        const y = yAt(t);
        const val = Math.pow(10, t);
        return (
          <text key={`yt-${i}`} x={padL - 4} y={(y + 3).toFixed(2)} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={MONO}>
            {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
          </text>
        );
      })}

      {/* tier threshold lines */}
      {visibleThresholds.map((t, i) => {
        const x = xAt(Math.log10(t.totalMin));
        const isMajor = i < 6; // only label the top few tiers
        return (
          <g key={`tier-${i}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={ACCENT} strokeWidth={0.6} strokeDasharray="4 2" opacity={0.3} />
            {isMajor && (
              <text x={(x + 2).toFixed(2)} y={(padT + 8).toFixed(2)} fontSize={7} fill={ACCENT} fontFamily={MONO} opacity={0.6}>
                {t.class}
              </text>
            )}
          </g>
        );
      })}

      {/* field dots */}
      {points.map((p, i) => {
        if (p.isYou) return null;
        return (
          <circle
            key={`d-${i}`}
            cx={xAt(Math.log10(Math.max(1, p.total))).toFixed(2)}
            cy={yAt(Math.log10(Math.max(1, p.yield_))).toFixed(2)}
            r={2}
            fill={MUTED}
            opacity={0.35}
          />
        );
      })}

      {/* highlight: you */}
      {points
        .filter((p) => p.isYou)
        .map((p, i) => {
          const cx = xAt(Math.log10(Math.max(1, p.total)));
          const cy = yAt(Math.log10(Math.max(1, p.yield_)));
          return (
            <g key={`you-${i}`}>
              <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={9} fill={GOLD} opacity={0.12} />
              <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={4.5} fill={GOLD} stroke={SURF} strokeWidth={1.5} />
            </g>
          );
        })}

      {/* axis labels */}
      <text x={padL + innerW / 2} y={H - 1} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={MONO}>
        TOTAL TOKENS (log)
      </text>
      <text x={4} y={padT + innerH / 2} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={MONO} transform={`rotate(-90 4 ${padT + innerH / 2})`}>
        Υ YIELD (log)
      </text>
    </svg>
  );
}
