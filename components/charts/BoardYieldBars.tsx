/**
 * BoardYieldBars — the per-window headline chart.
 *
 * A horizontal Υ-yield ranking for one window: each operator a bar, ordered by
 * yield (the board's primary metric). Bar widths use a sqrt scale so a dominant
 * operator (e.g. MO§ES on the 30d board) doesn't flatten the rest to invisibility
 * — the EXACT Υ value is labelled on every bar, so the number stays honest
 * regardless of bar length. Species-colored to tie the chart to the board's Υ heat.
 *
 * Pure inline SVG, locked palette (matches LeaderboardTable / _HEADER_LOCKED) —
 * NOT the app design tokens. One chart per window = "each chart its own page."
 */

import type { LeaderboardEntry } from "@/components/sigrank";

// Theme-reactive (owner 2026-06-20, L-THEME): chrome keys → app theme tokens so the
// per-window yield chart inherits the active theme (paper white/orange, not purple);
// species colors stay literal (semantic identity). SVG resolves rgb(var()) at paint.
const T = {
  field: "rgb(var(--bg-surface))",
  line: "rgb(var(--bg-border))",
  ink: "rgb(var(--text-primary))",
  gold: "rgb(var(--gold))",
  mut: "rgb(var(--text-muted))",
  casc: "#8b5cf6",
  arch: "#3b82f6",
  power: "#e0a64a",
  base: "#5b6472",
  rowLine: "rgb(var(--bg-border-subtle))",
};

const SPECIES: Record<string, string> = {
  casc: T.casc,
  arch: T.arch,
  power: T.power,
  base: T.base,
};

function speciesOf(cls: string): keyof typeof SPECIES {
  if (cls === "TRANSMITTER") return "casc";
  if (cls === "ARCH+" || cls === "ARCH") return "arch";
  if (cls === "POWER") return "power";
  return "base";
}

const fmtY = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : n >= 1000
      ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : n.toFixed(1);

export interface BoardYieldBarsProps {
  entries: LeaderboardEntry[];
  /** Window label, e.g. "30 day". */
  label: string;
}

export default function BoardYieldBars({
  entries,
  label,
}: BoardYieldBarsProps) {
  // Compounding rows only carry a yield; rank by it, take the headline few.
  const ranked = [...entries]
    .filter((e) => e.yield_ != null && e.yield_ > 0)
    .sort((a, b) => (b.yield_ ?? 0) - (a.yield_ ?? 0))
    .slice(0, 8);

  if (ranked.length === 0) {
    return (
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          width: "100%",
          background: T.field,
          border: `1px solid ${T.line}`,
          padding: 20,
          color: T.mut,
          fontFamily: "Roboto, -apple-system, system-ui, sans-serif",
          fontSize: 13,
        }}
      >
        Υ YIELD · {label.toUpperCase()} — no compounding operators in this
        window yet.
      </div>
    );
  }

  const maxY = Math.max(...ranked.map((e) => e.yield_ ?? 0));
  const sqrtMax = Math.sqrt(maxY) || 1;

  const rowH = 30;
  const padT = 38;
  const padB = 14;
  const padL = 18;
  const labelW = 188; // operator name column
  const valW = 96; // trailing Υ value column
  const width = 1180;
  const plotL = padL + labelW;
  const plotW = width - plotL - valW - padL;
  const height = padT + ranked.length * rowH + padB;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", width: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Yield ranking for the ${label} window`}
        style={{
          background: T.field,
          border: `1px solid ${T.line}`,
          fontFamily: "Roboto, -apple-system, system-ui, sans-serif",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <text
          x={padL}
          y={22}
          fontSize={12}
          fill={T.gold}
          style={{ letterSpacing: ".13em" }}
        >
          Υ YIELD · {label.toUpperCase()}
        </text>
        <text
          x={width - padL}
          y={22}
          fontSize={11}
          fill={T.mut}
          textAnchor="end"
        >
          ranked by yield — bars sqrt-scaled, values exact
        </text>

        {ranked.map((e, i) => {
          const y = padT + i * rowH;
          const cy = y + rowH / 2;
          const sp = speciesOf(e.signalClass);
          const w = Math.max(2, (Math.sqrt(e.yield_ ?? 0) / sqrtMax) * plotW);
          return (
            <g key={`${e.anonId}-${i}`}>
              {/* rank + operator name */}
              <text
                x={padL}
                y={cy}
                dominantBaseline="middle"
                fontSize={11}
                fill={T.mut}
              >
                {e.rank}
              </text>
              <text
                x={padL + 22}
                y={cy}
                dominantBaseline="middle"
                fontSize={12}
                fill={T.ink}
              >
                {e.anonId.length > 24 ? `${e.anonId.slice(0, 23)}…` : e.anonId}
              </text>
              {/* track + bar */}
              <rect
                x={plotL}
                y={y + 7}
                width={plotW}
                height={rowH - 14}
                fill={T.rowLine}
                rx={2}
              />
              <rect
                x={plotL}
                y={y + 7}
                width={w}
                height={rowH - 14}
                fill={SPECIES[sp]}
                rx={2}
              />
              {/* value */}
              <text
                x={width - padL}
                y={cy}
                dominantBaseline="middle"
                textAnchor="end"
                fontSize={12}
                fontWeight={700}
                fill={T.ink}
              >
                Υ {fmtY(e.yield_)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
