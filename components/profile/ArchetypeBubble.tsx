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

interface BubblePoint {
  leverage: number;
  velocity: number;
  construction: number;
  codename: string;
  isYou: boolean;
}

export function ArchetypeBubble({ boardRows, operatorCodename, width = 280, height = 180 }: Props) {
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

  const padL = 40;
  const padR = 16;
  const padT = 10;
  const padB = 26;
  const W = width;
  const H = height;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Leverage: log scale (spans 0 to 100+)
  const levVals = points.map((p) => Math.log10(Math.max(1, p.leverage)));
  const levMin = Math.min(...levVals);
  const levMax = Math.max(...levVals);
  const levPad = (levMax - levMin) * 0.1 || 1;
  const levLo = levMin - levPad;
  const levHi = levMax + levPad;

  // Velocity: log scale (spans 0.01 to 5+)
  const velVals = points.map((p) => Math.log10(Math.max(0.001, p.velocity)));
  const velMin = Math.min(...velVals);
  const velMax = Math.max(...velVals);
  const velPad = (velMax - velMin) * 0.1 || 1;
  const velLo = velMin - velPad;
  const velHi = velMax + velPad;

  // Construction: bubble size (0 to ~0.1+)
  const constrVals = points.map((p) => p.construction);
  const constrMax = Math.max(...constrVals) || 0.1;

  const xAt = (levLog: number) => padL + (innerW * (levLog - levLo)) / (levHi - levLo);
  const yAt = (velLog: number) => padT + innerH * (1 - (velLog - velLo) / (velHi - velLo));
  const rAt = (constr: number) => 2 + (constr / constrMax) * 8;

  // Quadrant dividers — median lines
  const levMed = levVals.sort((a, b) => a - b)[Math.floor(levVals.length / 2)];
  const velMed = velVals.sort((a, b) => a - b)[Math.floor(velVals.length / 2)];

  // Ticks
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

  // Quadrant labels
  const quadLabels = [
    { x: xAt(levHi) - 2, y: yAt(velHi) + 10, text: "DEEP+FAST", anchor: "end" },
    { x: xAt(levLo) + 2, y: yAt(velHi) + 10, text: "INPUT+FAST", anchor: "start" },
    { x: xAt(levHi) - 2, y: yAt(velLo) - 4, text: "DEEP+SLOW", anchor: "end" },
    { x: xAt(levLo) + 2, y: yAt(velLo) - 4, text: "INPUT+SLOW", anchor: "start" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Archetype bubble — leverage vs velocity vs construction" style={{ fontVariantNumeric: "tabular-nums" }}>
      {/* quadrant dividers */}
      <line x1={xAt(levMed)} y1={padT} x2={xAt(levMed)} y2={padT + innerH} stroke={DIM} strokeDasharray="3 3" strokeWidth={0.5} opacity={0.5} />
      <line x1={padL} y1={yAt(velMed)} x2={padL + innerW} y2={yAt(velMed)} stroke={DIM} strokeDasharray="3 3" strokeWidth={0.5} opacity={0.5} />

      {/* quadrant labels */}
      {quadLabels.map((q, i) => (
        <text key={`q-${i}`} x={q.x.toFixed(2)} y={q.y.toFixed(2)} textAnchor={q.anchor as "start" | "end"} fontSize={7} fill={MUTED} fontFamily={MONO} opacity={0.5}>
          {q.text}
        </text>
      ))}

      {/* x ticks (leverage) */}
      {levTicks.map((t, i) => {
        const x = xAt(t);
        return (
          <g key={`lt-${i}`}>
            <line x1={x} y1={padT} x2={x} y2={padT + innerH} stroke={DIM} strokeDasharray="1 4" strokeWidth={0.4} opacity={0.3} />
            <text x={x.toFixed(2)} y={H - 10} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={MONO}>{fmtLev(t)}</text>
          </g>
        );
      })}

      {/* y ticks (velocity) */}
      {velTicks.map((t, i) => {
        const y = yAt(t);
        return (
          <text key={`vt-${i}`} x={padL - 4} y={(y + 3).toFixed(2)} textAnchor="end" fontSize={8} fill={MUTED} fontFamily={MONO}>{fmtVel(t)}</text>
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
            fill={MUTED}
            opacity={0.2}
            stroke={MUTED}
            strokeWidth={0.5}
            strokeOpacity={0.4}
          />
        );
      })}

      {/* highlight: you */}
      {points
        .filter((p) => p.isYou)
        .map((p, i) => {
          const cx = xAt(Math.log10(Math.max(1, p.leverage)));
          const cy = yAt(Math.log10(Math.max(0.001, p.velocity)));
          const r = rAt(p.construction);
          return (
            <g key={`you-${i}`}>
              <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={(r + 4).toFixed(2)} fill={GOLD} opacity={0.1} />
              <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)} fill={GOLD} opacity={0.4} stroke={GOLD} strokeWidth={1.5} />
            </g>
          );
        })}

      {/* axis labels */}
      <text x={padL + innerW / 2} y={H - 1} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={MONO}>
        LEVERAGE (log) → reuse depth
      </text>
      <text x={4} y={padT + innerH / 2} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={MONO} transform={`rotate(-90 4 ${padT + innerH / 2})`}>
        VELOCITY (log) → generation
      </text>

      {/* bubble size legend */}
      <text x={W - padR} y={H - 10} textAnchor="end" fontSize={7} fill={MUTED} fontFamily={MONO} opacity={0.6}>
        ○ bubble = construction
      </text>
    </svg>
  );
}
