"use client";

import { useState } from "react";
import type { HistoryPoint } from "@/lib/board";

type Mode = "both" | "metrics" | "raw";

interface Props {
  history: HistoryPoint[];
  fieldAvgYield?: number | null;
  height?: number;
}

const GOLD = "rgb(var(--gold))";
const BLUE = "rgb(var(--class-arch))";
const LINE = "rgb(var(--bg-border))";
const MUTED = "rgb(var(--text-muted))";
const BONE = "rgb(var(--text-primary))";
const SURF = "rgb(var(--bg-surface))";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const x0 = pts[i - 1].x,
      y0 = pts[i - 1].y;
    const x1 = pts[i].x,
      y1 = pts[i].y;
    const mx = (x0 + x1) / 2;
    d += ` C${mx.toFixed(2)},${y0.toFixed(2)} ${mx.toFixed(2)},${y1.toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
  }
  return d;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function OverviewChart({ history, fieldAvgYield, height = 260 }: Props) {
  const [mode, setMode] = useState<Mode>("both");

  if (history.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-bg-border bg-bg-surface"
        style={{ height }}
      >
        <span className="font-mono text-xs text-text-muted">
          Not enough history yet — need at least two snapshots to chart trajectory.
        </span>
      </div>
    );
  }

  const W = 1040;
  const H = height;
  const padL = 48;
  const padR = 56;
  const padT = 36;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const dates = history.map((h) => h.date);
  const xAt = (i: number) =>
    padL + (innerW * i) / Math.max(1, dates.length - 1);

  // Raw series: 4 individual pillars
  const inputVals = history.map((h) => h.input_tokens ?? 0);
  const outputVals = history.map((h) => h.output_tokens ?? 0);
  const cacheReadVals = history.map((h) => h.cache_read_tokens ?? 0);
  const cacheWriteVals = history.map((h) => h.cache_creation_tokens ?? 0);
  const rawTotalVals = history.map(
    (h) =>
      (h.input_tokens ?? 0) +
      (h.output_tokens ?? 0) +
      (h.cache_read_tokens ?? 0) +
      (h.cache_creation_tokens ?? 0),
  );
  // Derived series: Υ Yield
  const yieldVals = history.map((h) => h.yield_);

  const showRaw = mode === "both" || mode === "raw";
  const showMetrics = mode === "both" || mode === "metrics";

  // Y-scales (independent — dual axis)
  const allRaw = [...inputVals, ...outputVals, ...cacheReadVals, ...cacheWriteVals, ...rawTotalVals];
  const rawMin = Math.min(...allRaw);
  const rawMax = Math.max(...allRaw);
  const rawRange = rawMax - rawMin || 1;
  const rawPad = rawRange * 0.15;
  const rawLo = Math.max(0, rawMin - rawPad);
  const rawHi = rawMax + rawPad;
  const rawScale = rawHi - rawLo || 1;
  const rawYAt = (v: number) =>
    padT + innerH * (1 - (v - rawLo) / rawScale);

  const yMin = Math.min(...yieldVals);
  const yMax = Math.max(...yieldVals);
  const yRange = yMax - yMin || 1;
  const yPad = yRange * 0.15;
  const yLo = Math.max(0, yMin - yPad);
  const yHi = yMax + yPad;
  const yScale = yHi - yLo || 1;
  const yieldYAt = (v: number) =>
    padT + innerH * (1 - (v - yLo) / yScale);

  const rawColors = {
    input: "rgb(156 196 255)",    // accent blue
    output: "rgb(196 146 58)",    // gold
    cacheRead: "rgb(167 139 250)", // purple
    cacheWrite: "rgb(52 211 153)", // green
  };
  const rawSeries = [
    { key: "input", vals: inputVals, color: rawColors.input, label: "Input" },
    { key: "output", vals: outputVals, color: rawColors.output, label: "Output" },
    { key: "cacheRead", vals: cacheReadVals, color: rawColors.cacheRead, label: "Cache R" },
    { key: "cacheWrite", vals: cacheWriteVals, color: rawColors.cacheWrite, label: "Cache W" },
  ];
  const rawPaths = rawSeries.map((s) => ({
    ...s,
    coords: s.vals.map((v, i) => ({ x: xAt(i), y: rawYAt(v) })),
  }));
  const yieldCoords = yieldVals.map((v, i) => ({ x: xAt(i), y: yieldYAt(v) }));

  const yieldPath = smoothPath(yieldCoords);
  const baseline = padT + innerH;

  const yieldArea =
    yieldPath +
    ` L${yieldCoords[yieldCoords.length - 1].x.toFixed(2)},${baseline} L${yieldCoords[0].x.toFixed(2)},${baseline} Z`;

  // Y ticks (4 steps each)
  const rawTicks = Array.from(
    { length: 5 },
    (_, i) => rawLo + (rawScale * i) / 4,
  );
  const yieldTicks = Array.from(
    { length: 5 },
    (_, i) => yLo + (yScale * i) / 4,
  );

  const hasField =
    fieldAvgYield != null && Number.isFinite(fieldAvgYield) && fieldAvgYield > 0;
  const fieldY = hasField ? yieldYAt(fieldAvgYield!) : 0;

  const btnBase =
    "px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors";
  const btnActive = "border-gold text-gold";
  const btnInactive = "border-bg-border text-text-muted hover:text-text-secondary";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode("both")}
          className={`${btnBase} rounded border ${
            mode === "both" ? btnActive : btnInactive
          }`}
        >
          Both
        </button>
        <button
          type="button"
          onClick={() => setMode("metrics")}
          className={`${btnBase} rounded border ${
            mode === "metrics" ? btnActive : btnInactive
          }`}
        >
          Metrics
        </button>
        <button
          type="button"
          onClick={() => setMode("raw")}
          className={`${btnBase} rounded border ${
            mode === "raw" ? btnActive : btnInactive
          }`}
        >
          Raw
        </button>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Operator trajectory — raw pillars and derived yield"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <defs>
          <linearGradient id="ov-grad-raw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.24} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ov-grad-yield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.24} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* title */}
        <text
          x={padL}
          y={16}
          fontSize={11}
          fill={MUTED}
          style={{ letterSpacing: "0.04em" }}
          fontFamily={MONO}
        >
          TRAJECTORY · RAW TOKENS &amp; Υ YIELD
        </text>

        {/* legend */}
        <g>
          {showRaw && rawPaths.map((s, i) => (
            <g key={`leg-${s.key}`}>
              <rect
                x={W - padR - 280 + i * 60}
                y={8}
                width={8}
                height={8}
                rx={1}
                fill={s.color}
              />
              <text
                x={W - padR - 270 + i * 60}
                y={15}
                fill={BONE}
                fontSize={9}
                fontFamily={MONO}
              >
                {s.label}
              </text>
            </g>
          ))}
          {showMetrics && (
            <>
              <rect
                x={W - padR - 50}
                y={8}
                width={8}
                height={8}
                rx={1}
                fill={GOLD}
              />
              <text
                x={W - padR - 40}
                y={15}
                fill={BONE}
                fontSize={9}
                fontFamily={MONO}
              >
                Υ Yield
              </text>
            </>
          )}
        </g>

        {/* gridlines + left y-labels (raw) */}
        {showRaw &&
          rawTicks.map((t, i) => {
            const y = rawYAt(t);
            return (
              <g key={`rt-${i}`}>
                <line
                  x1={padL}
                  y1={y.toFixed(2)}
                  x2={W - padR}
                  y2={y.toFixed(2)}
                  stroke={LINE}
                  strokeDasharray="2 4"
                  strokeWidth={1}
                />
                <text
                  x={padL - 6}
                  y={y.toFixed(2)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill={BLUE}
                  fontFamily={MONO}
                >
                  {fmtTokens(t)}
                </text>
              </g>
            );
          })}

        {/* right y-labels (yield) — only when metrics visible */}
        {showMetrics &&
          yieldTicks.map((t, i) => {
            const y = yieldYAt(t);
            return (
              <text
                key={`yt-${i}`}
                x={W - padR + 6}
                y={y.toFixed(2)}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={9}
                fill={GOLD}
                fontFamily={MONO}
              >
                {t >= 1000 ? `${(t / 1000).toFixed(1)}K` : t.toFixed(0)}
              </text>
            );
          })}

        {/* field baseline */}
        {showMetrics && hasField && (
          <>
            <line
              x1={padL}
              y1={fieldY.toFixed(2)}
              x2={W - padR}
              y2={fieldY.toFixed(2)}
              stroke={MUTED}
              strokeWidth={1.2}
              strokeDasharray="5 3"
              opacity={0.6}
            />
            <text
              x={padL + 4}
              y={(fieldY - 5).toFixed(2)}
              textAnchor="start"
              fontSize={9}
              fill={MUTED}
              fontFamily={MONO}
            >
              Field avg {fieldAvgYield!.toFixed(1)}
            </text>
          </>
        )}

        {/* raw lines — 4 individual pillars */}
        {showRaw &&
          rawPaths.map((s) => {
            const path = smoothPath(s.coords);
            if (!path) return null;
            return (
              <path
                key={`raw-${s.key}`}
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            );
          })}

        {/* yield area + line */}
        {showMetrics && yieldPath && (
          <>
            <path d={yieldArea} fill="url(#ov-grad-yield)" stroke="none" />
            <path
              d={yieldPath}
              fill="none"
              stroke={GOLD}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* raw data points — last point of each series */}
        {showRaw &&
          rawPaths.map((s) => {
            const last = s.coords[s.coords.length - 1];
            if (!last) return null;
            return (
              <circle
                key={`rp-${s.key}`}
                cx={last.x.toFixed(2)}
                cy={last.y.toFixed(2)}
                r={3}
                fill={s.color}
                stroke={SURF}
                strokeWidth={1}
              />
            );
          })}

        {/* yield data points */}
        {showMetrics &&
          yieldCoords.map((c, i) => {
            const isLast = i === yieldCoords.length - 1;
            return (
              <circle
                key={`yp-${i}`}
                cx={c.x.toFixed(2)}
                cy={c.y.toFixed(2)}
                r={isLast ? 4 : 2.5}
                fill={isLast ? GOLD : SURF}
                stroke={GOLD}
                strokeWidth={1.5}
              />
            );
          })}

        {/* x-axis labels */}
        {dates.map((d, i) => (
          <text
            key={`x-${i}`}
            x={xAt(i).toFixed(2)}
            y={H - 7}
            textAnchor="middle"
            fontSize={9}
            fill={MUTED}
            fontFamily={MONO}
          >
            {d.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
