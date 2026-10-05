"use client";

import type { LeaderboardRow } from "@/lib/board";

interface Props {
  boardRows: LeaderboardRow[];
  operatorCodename: string;
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
const MONO = "'Roboto Mono', ui-monospace, monospace";
const SANS = "'Roboto', sans-serif";

// Archetype colors from sigrank-x graphics
const ARCH_COLORS: Record<string, string> = {
  convergent: "#9b59b6",
  kinetic: "#e74c3c",
  "input-bound": "#95a5a6",
  priming: "#5dade2",
  contextual: "#48c9b0",
  "deep-reader": "#2ecc71",
  archivist: "#27ae60",
  builder: "#f39c12",
  recursive: "#e67e22",
  amplifier: "#f0c862",
};

interface BubblePoint {
  leverage: number;
  velocity: number;
  construction: number;
  codename: string;
  isYou: boolean;
  archetypeKey?: string;
}

export function ArchetypeBubble({ boardRows, operatorCodename, width = 320, height = 220 }: Props) {
  const points: BubblePoint[] = boardRows
    .filter((r) => r.snapshot.cascade && !r.pending)
    .map((r) => {
      const c = r.snapshot.cascade!;
      return {
        leverage: c.leverage,
        velocity: c.velocity,
        construction: c.construction,
        codename: r.operator.codename,
        isYou: r.operator.codename === operatorCodename,
      };
    });

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
  const levVals = points.map((p) => Math.log10(Math.max(1, p.leverage)));
  const velVals = points.map((p) => Math.log10(Math.max(0.001, p.velocity)));
  const levMin = Math.min(...levVals);
  const levMax = Math.max(...levVals);
  const velMin = Math.min(...velVals);
  const velMax = Math.max(...velVals);
  const levPad = (levMax - levMin) * 0.08 || 1;
  const velPad = (velMax - velMin) * 0.08 || 1;
  const levLo = levMin - levPad;
  const levHi = levMax + levPad;
  const velLo = velMin - velPad;
  const velHi = velMax + velPad;

  const constrVals = points.map((p) => p.construction);
  const constrMax = Math.max(...constrVals) || 0.1;

  const xAt = (levLog: number) => padL + (innerW * (levLog - levLo)) / (levHi - levLo);
  const yAt = (velLog: number) => padT + innerH * (1 - (velLog - velLo) / (velHi - velLo));
  const rAt = (constr: number) => 1.5 + (constr / constrMax) * 7;

  // Median dividers
  const sortedLev = [...levVals].sort((a, b) => a - b);
  const sortedVel = [...velVals].sort((a, b) => a - b);
  const levMed = sortedLev[Math.floor(sortedLev.length / 2)];
  const velMed = sortedVel[Math.floor(sortedVel.length / 2)];

  const levTicks = Array.from({ length: 4 }, (_, i) => levLo + ((levHi - levLo) * i) / 3);
  const velTicks = Array.from({ length: 4 }, (_, i) => velLo + ((velHi - velLo) * i) / 3);

  function fmtLev(v: number): string {
    const val = Math.pow(10, v);
    if (val >= 100) return `${val.toFixed(0)}×`;
    if (val >= 10) return `${val.toFixed(0)}×`;
    return `${val.toFixed(1)}×`;
  }
  function fmtVel(v: number): string {
    const val = Math.pow(10, v);
    if (val >= 1) return val.toFixed(1);
    return val.toFixed(2);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Archetype bubble — leverage vs velocity vs construction" style={{ fontVariantNumeric: "tabular-nums" }}>
      <defs>
        <linearGradient id="ab-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#080808" />
        </linearGradient>
        <linearGradient id="ab-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={GOLD_DARK} />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>

      {/* background */}
      <rect width={W} height={H} fill="url(#ab-bg)" rx={4} />
      {/* gold top bar */}
      <rect x={0} y={0} width={W} height={2} fill="url(#ab-gold)" rx={4} />

      {/* header */}
      <text x={6} y={11} fontSize={7} fill={GREEN_HEADER} fontFamily={MONO} letterSpacing={2}>SIGRANK · OPERATING PLANE</text>

      {/* quadrant dividers */}
      <line x1={xAt(levMed)} y1={padT} x2={xAt(levMed)} y2={padT + innerH} stroke={AXIS} strokeDasharray="2 3" strokeWidth={0.5} opacity={0.6} />
      <line x1={padL} y1={yAt(velMed)} x2={padL + innerW} y2={yAt(velMed)} stroke={AXIS} strokeDasharray="2 3" strokeWidth={0.5} opacity={0.6} />

      {/* quadrant labels */}
      <text x={(xAt(levHi) - 2).toFixed(2)} y={(yAt(velHi) + 8).toFixed(2)} textAnchor="end" fontSize={6} fill={MUTED_GREEN} fontFamily={MONO} opacity={0.5}>DEEP+FAST</text>
      <text x={(xAt(levLo) + 2).toFixed(2)} y={(yAt(velHi) + 8).toFixed(2)} textAnchor="start" fontSize={6} fill={MUTED_GREEN} fontFamily={MONO} opacity={0.5}>INPUT+FAST</text>
      <text x={(xAt(levHi) - 2).toFixed(2)} y={(yAt(velLo) - 3).toFixed(2)} textAnchor="end" fontSize={6} fill={MUTED_GREEN} fontFamily={MONO} opacity={0.5}>DEEP+SLOW</text>
      <text x={(xAt(levLo) + 2).toFixed(2)} y={(yAt(velLo) - 3).toFixed(2)} textAnchor="start" fontSize={6} fill={MUTED_GREEN} fontFamily={MONO} opacity={0.5}>INPUT+SLOW</text>

      {/* x ticks */}
      {levTicks.map((t, i) => {
        const x = xAt(t);
        return (
          <g key={`lt-${i}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={AXIS} strokeDasharray="1 4" strokeWidth={0.4} opacity={0.3} />
            <text x={x.toFixed(2)} y={H - 8} textAnchor="middle" fontSize={7} fill={TICK} fontFamily={MONO}>{fmtLev(t)}</text>
          </g>
        );
      })}

      {/* y ticks */}
      {velTicks.map((t, i) => {
        const y = yAt(t);
        return (
          <text key={`vt-${i}`} x={padL - 4} y={(y + 2.5).toFixed(2)} textAnchor="end" fontSize={7} fill={TICK} fontFamily={MONO}>{fmtVel(t)}</text>
        );
      })}

      {/* field bubbles */}
      {points.map((p, i) => {
        if (p.isYou) return null;
        const cx = xAt(Math.log10(Math.max(1, p.leverage)));
        const cy = yAt(Math.log10(Math.max(0.001, p.velocity)));
        const r = rAt(p.construction);
        return (
          <circle
            key={`b-${i}`}
            cx={cx.toFixed(2)}
            cy={cy.toFixed(2)}
            r={r.toFixed(2)}
            fill={FIELD_DOT}
            opacity={0.25}
            stroke={FIELD_DOT}
            strokeWidth={0.4}
            strokeOpacity={0.4}
          />
        );
      })}

      {/* highlight: you */}
      {points.filter((p) => p.isYou).map((p, i) => {
        const cx = xAt(Math.log10(Math.max(1, p.leverage)));
        const cy = yAt(Math.log10(Math.max(0.001, p.velocity)));
        const r = rAt(p.construction);
        return (
          <g key={`you-${i}`}>
            <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={(r + 4).toFixed(2)} fill={GOLD} opacity={0.1} />
            <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)} fill={GOLD} opacity={0.5} stroke={GOLD} strokeWidth={1.2} />
            <text x={(cx + r + 4).toFixed(2)} y={(cy + 3).toFixed(2)} fontSize={8} fill={GOLD} fontFamily={MONO} fontWeight="bold">YOU</text>
          </g>
        );
      })}

      {/* axis labels */}
      <text x={padL + innerW / 2} y={H - 1} textAnchor="middle" fontSize={7} fill={MUTED_GREEN} fontFamily={SANS}>
        LEVERAGE (log) → reuse depth
      </text>
      <text x={3} y={padT + innerH / 2} textAnchor="middle" fontSize={7} fill={MUTED_GREEN} fontFamily={SANS} transform={`rotate(-90 3 ${padT + innerH / 2})`}>
        VELOCITY (log) → generation
      </text>

      {/* bubble size legend */}
      <text x={W - padR} y={H - 8} textAnchor="end" fontSize={6} fill={MUTED_GREEN} fontFamily={MONO} opacity={0.6}>
        ○ bubble = construction
      </text>
    </svg>
  );
}
