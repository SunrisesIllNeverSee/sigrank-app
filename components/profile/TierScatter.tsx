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

// SigRank X visual palette
const GOLD = "#f0c862";
const GOLD_DARK = "#c4923a";
const GREEN_HEADER = "#5a8a5a";
const MUTED_GREEN = "#6e8a6e";
const TICK = "#8a9a8a";
const AXIS = "#4a5a4a";
const FIELD_DOT = "#4a5a4a";
const TIER_LINE = "#c4923a";
const MONO = "'Roboto Mono', ui-monospace, monospace";
const SANS = "'Roboto', sans-serif";

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

export function TierScatter({ boardRows, operatorCodename, tierThresholds, width = 320, height = 200 }: Props) {
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
      <div className="flex items-center justify-center rounded-md border border-bg-border" style={{ width: "100%", height }}>
        <span className="font-mono text-[10px] text-text-muted">Not enough operators to plot</span>
      </div>
    );
  }

  const padL = 44;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const W = width;
  const H = height;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Log scales
  const totals = points.map((p) => Math.log10(Math.max(1, p.total)));
  const yields = points.map((p) => Math.log10(Math.max(1, p.yield_)));
  const tMin = Math.min(...totals);
  const tMax = Math.max(...totals);
  const yMin = Math.min(...yields);
  const yMax = Math.max(...yields);
  const tPad = (tMax - tMin) * 0.08 || 1;
  const yPad = (yMax - yMin) * 0.08 || 1;
  const tLo = tMin - tPad;
  const tHi = tMax + tPad;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const xAt = (tLog: number) => padL + (innerW * (tLog - tLo)) / (tHi - tLo);
  const yAt = (yLog: number) => padT + innerH * (1 - (yLog - yLo) / (yHi - yLo));

  // Tier threshold lines
  const visibleThresholds = tierThresholds.filter(
    (t) => t.totalMin > 0 && Math.log10(t.totalMin) >= tLo && Math.log10(t.totalMin) <= tHi,
  );

  const tTickCount = 4;
  const tTicks = Array.from({ length: tTickCount }, (_, i) => tLo + ((tHi - tLo) * i) / (tTickCount - 1));
  const yTickCount = 3;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => yLo + ((yHi - yLo) * i) / (yTickCount - 1));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tier scatter — total tokens vs yield" style={{ fontVariantNumeric: "tabular-nums" }}>
      <defs>
        <linearGradient id="ts-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#080808" />
        </linearGradient>
        <linearGradient id="ts-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={GOLD_DARK} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>

      {/* background */}
      <rect width={W} height={H} fill="url(#ts-bg)" rx={4} />
      {/* gold top bar */}
      <rect x={0} y={0} width={W} height={2} fill="url(#ts-gold)" rx={4} />

      {/* header */}
      <text x={6} y={11} fontSize={7} fill={GREEN_HEADER} fontFamily={MONO} letterSpacing={2}>SIGRANK · TIER POSITION</text>

      {/* x gridlines + tick labels */}
      {tTicks.map((t, i) => {
        const x = xAt(t);
        const val = Math.pow(10, t);
        return (
          <g key={`tt-${i}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={AXIS} strokeDasharray="1 3" strokeWidth={0.5} opacity={0.5} />
            <text x={x} y={H - 8} textAnchor="middle" fontSize={7} fill={TICK} fontFamily={MONO}>{fmtTokens(val)}</text>
          </g>
        );
      })}

      {/* y tick labels */}
      {yTicks.map((t, i) => {
        const y = yAt(t);
        const val = Math.pow(10, t);
        return (
          <text key={`yt-${i}`} x={padL - 4} y={(y + 2.5).toFixed(2)} textAnchor="end" fontSize={7} fill={TICK} fontFamily={MONO}>
            {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
          </text>
        );
      })}

      {/* tier threshold lines */}
      {visibleThresholds.map((t, i) => {
        const x = xAt(Math.log10(t.totalMin));
        const isMajor = i < 5;
        return (
          <g key={`tier-${i}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={TIER_LINE} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.35} />
            {isMajor && (
              <text x={(x + 2).toFixed(2)} y={(padT + 8).toFixed(2)} fontSize={6} fill={TIER_LINE} fontFamily={MONO} opacity={0.7}>
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
            r={1.8}
            fill={FIELD_DOT}
            opacity={0.5}
          />
        );
      })}

      {/* highlight: you */}
      {points.filter((p) => p.isYou).map((p, i) => {
        const cx = xAt(Math.log10(Math.max(1, p.total)));
        const cy = yAt(Math.log10(Math.max(1, p.yield_)));
        return (
          <g key={`you-${i}`}>
            <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={8} fill={GOLD} opacity={0.12} />
            <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={4} fill={GOLD} stroke="#0d0d0d" strokeWidth={1.2} />
            <text x={(cx + 7).toFixed(2)} y={(cy + 3).toFixed(2)} fontSize={8} fill={GOLD} fontFamily={MONO} fontWeight="bold">
              YOU
            </text>
          </g>
        );
      })}

      {/* axis labels */}
      <text x={padL + innerW / 2} y={H - 1} textAnchor="middle" fontSize={7} fill={MUTED_GREEN} fontFamily={SANS}>
        TOTAL TOKENS (log) → tier threshold
      </text>
      <text x={3} y={padT + innerH / 2} textAnchor="middle" fontSize={7} fill={MUTED_GREEN} fontFamily={SANS} transform={`rotate(-90 3 ${padT + innerH / 2})`}>
        Υ YIELD (log)
      </text>
    </svg>
  );
}
