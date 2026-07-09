"use client";

/*
 * CascadeRadar — radar / spider chart of an operator's cascade fingerprint.
 *
 * Pure inline SVG, no chart libraries. Locked theme: gold stroke + faint gold
 * fill on bone-on-warm-black. Each axis is normalized 0..1 by its own `max`.
 *
 * Tokens (globals.css → locked palette):
 *   text-text-primary  bone   #e9e3d5
 *   text-gold          gold   #c4923a
 *   text-text-muted    muted  #7d7461
 *   bg-border          line   #332d20
 */

export interface CascadeRadarAxis {
  label: string;
  value: number;
  max: number;
}

/** A named, colored polygon overlaid on the same axes (CMP-3 head-to-head).
 * `color` accepts any CSS color incl. `rgb(var(--token))` so it stays theme-reactive. */
export interface CascadeRadarSeries {
  name: string;
  /** One value per axis; aligns positionally with `axes`. */
  values: number[];
  color: string;
  /** Render style (CMP dual-layer, owner 2026-06-22): 'solid' = stroked outline +
   * vertices (default); 'ghost' = translucent fill only, no stroke/vertices/legend —
   * a shadow layer that sits BEHIND the solid layer. */
  variant?: "solid" | "ghost";
}

export interface CascadeRadarProps {
  /** Single-series API (operator profile). Each axis self-normalizes by its own `max`. */
  values?: CascadeRadarAxis[];
  /** Multi-series API (CMP-3). When present, takes precedence over `values`:
   * `axes` define label+max (shared), `series` supply per-operator polygons + legend. */
  axes?: { label: string; max: number }[];
  series?: CascadeRadarSeries[];
  /** SVG viewport size (square). Default 320. */
  size?: number;
}

// Theme-reactive: SVG attrs resolve CSS vars at paint, so these re-resolve when
// data-theme flips (carbon/paper/railway) — chart follows the app theme (owner 2026-06-19).
const GOLD = "rgb(var(--gold))";
const LINE = "rgb(var(--bg-border))";
const INK = "rgb(var(--text-primary))";

export default function CascadeRadar({
  values,
  axes,
  series,
  size = 320,
}: CascadeRadarProps) {
  // Resolve to a unified shape. Multi-series (axes+series) takes precedence over
  // single-series (values). Single-series renders as one gold polygon (no legend),
  // preserving the operator-profile call site byte-for-byte.
  const multi = !!(axes && series && series.length > 0);
  const labels: string[] = multi
    ? axes!.map((a) => a.label)
    : (values ?? []).map((a) => a.label);
  const maxes: number[] = multi
    ? axes!.map((a) => a.max)
    : (values ?? []).map((a) => a.max);
  const polys: CascadeRadarSeries[] = multi
    ? series!
    : [{ name: "", values: (values ?? []).map((a) => a.value), color: GOLD }];

  const n = labels.length;
  if (n < 3) {
    return (
      <div className="font-sans text-sm text-text-muted">
        CascadeRadar needs at least 3 axes.
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  // leave room for labels around the rim
  const radius = size / 2 - 56;
  const rings = [0.25, 0.5, 0.75, 1];

  // angle for axis i, starting at top (12 o'clock), clockwise
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const point = (i: number, r: number): [number, number] => {
    const a = angleAt(i);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  const norm = (value: number, max: number) => {
    if (!max || !isFinite(max) || max <= 0) return 0;
    return Math.max(0, Math.min(1, value / max));
  };

  const pathFor = (vals: number[]) =>
    labels
      .map((_, i) => {
        const r = norm(vals[i] ?? 0, maxes[i]) * radius;
        const [x, y] = point(i, r);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      role="img"
      aria-label={
        multi ? "Operator comparison radar" : "Cascade fingerprint radar"
      }
      className="font-sans"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {/* concentric grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={labels
            .map((_, i) =>
              point(i, ring * radius)
                .map((v) => v.toFixed(2))
                .join(","),
            )
            .join(" ")}
          fill="none"
          stroke={LINE}
          strokeWidth={1}
          opacity={ring === 1 ? 0.9 : 0.5}
        />
      ))}

      {/* radial spokes */}
      {labels.map((_, i) => {
        const [x, y] = point(i, radius);
        return (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={x.toFixed(2)}
            y2={y.toFixed(2)}
            stroke={LINE}
            strokeWidth={1}
            opacity={0.4}
          />
        );
      })}

      {/* data polygons — ghost layers first (fill-only, drawn behind), then solid
          layers (stroked) on top. Ghost = the dual-layer shadow (raw); solid = metrics. */}
      {[...polys]
        .map((s, si) => ({ s, si }))
        .sort(
          (p, q) =>
            (p.s.variant === "ghost" ? 0 : 1) -
            (q.s.variant === "ghost" ? 0 : 1),
        )
        .map(({ s, si }) => {
          const ghost = s.variant === "ghost";
          return (
            <path
              key={`poly-${si}`}
              d={pathFor(s.values)}
              fill={s.color}
              fillOpacity={ghost ? 0.1 : multi ? 0.16 : 0.14}
              stroke={ghost ? "none" : s.color}
              strokeWidth={ghost ? 0 : 2}
              strokeLinejoin="round"
            />
          );
        })}

      {/* data vertices — solid layers only (ghosts stay vertex-free) */}
      {polys.map((s, si) =>
        s.variant === "ghost"
          ? null
          : labels.map((_, i) => {
              const [x, y] = point(
                i,
                norm(s.values[i] ?? 0, maxes[i]) * radius,
              );
              return (
                <circle
                  key={`pt-${si}-${i}`}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  r={3}
                  fill={s.color}
                />
              );
            }),
      )}

      {/* axis labels — bone */}
      {labels.map((label, i) => {
        const [lx, ly] = point(i, radius + 22);
        const cos = Math.cos(angleAt(i));
        const anchor =
          Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text
            key={`lbl-${i}`}
            x={lx.toFixed(2)}
            y={ly.toFixed(2)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={11}
            fill={INK}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {label}
          </text>
        );
      })}

      {/* legend — multi-series only, solid layers only (ghosts are implied shadows) */}
      {multi &&
        polys
          .filter((s) => s.variant !== "ghost")
          .map((s, si) => (
            <g key={`leg-${si}`}>
              <rect
                x={8}
                y={8 + si * 16}
                width={10}
                height={10}
                rx={2}
                fill={s.color}
              />
              <text
                x={22}
                y={17 + si * 16}
                fill={INK}
                fontSize={10}
                className="font-sans"
              >
                {s.name}
              </text>
            </g>
          ))}
    </svg>
  );
}
