/**
 * components/compare/CompareRadarSvg.tsx — small server-rendered radar used by
 * the /compare composites and head-to-head band. Inline SVG, no client JS.
 *
 * Axes are drawn clockwise from 12 o'clock. Each layer supplies 0..1 radial
 * positions (null = missing: no vertex, the outline skips that axis). A layer may
 * carry its own axis count (the ghost pentagon of raw pillars under an 8-axis
 * metrics radar). Colours come from the workspace theme variables via classes in
 * compare-workspace.css, so every workspace theme restyles the grid and text.
 */
import type { ReactNode } from "react";

export interface RadarLine {
  text: string;
  color?: string;
  bold?: boolean;
  muted?: boolean;
  /** native tooltip for this line */
  title?: string;
}

export interface RadarAxis {
  lines: RadarLine[];
  title?: string;
}

export interface RadarRing {
  /** 0..1 */
  r: number;
  label?: string;
}

export interface RadarLayer {
  name: string;
  color: string;
  /** one 0..1 value (or null) per axis of THIS layer */
  points: (number | null)[];
  ghost?: boolean;
  /** native tooltip per vertex */
  titles?: string[];
}

const UPSILON = "Υ";

/** Render text with Υ in a serif face so it reads as Greek upsilon, not Latin Y. */
function glyphText(text: string): ReactNode {
  if (!text.includes(UPSILON)) return text;
  return text.split(UPSILON).flatMap((part, i, arr) => {
    const out: ReactNode[] = [part];
    if (i < arr.length - 1) {
      out.push(
        <tspan key={i} className="cmp-rd-upsilon">
          {UPSILON}
        </tspan>,
      );
    }
    return out;
  });
}

export function RadarSvg({
  width,
  height,
  cx,
  cy,
  radius,
  axes,
  rings,
  layers,
  ariaLabel,
  labelGap = 10,
  lineHeight = 11.5,
}: {
  width: number;
  height: number;
  cx: number;
  cy: number;
  radius: number;
  axes: RadarAxis[];
  rings: RadarRing[];
  layers: RadarLayer[];
  ariaLabel: string;
  labelGap?: number;
  lineHeight?: number;
}) {
  const n = axes.length;
  const ang = (i: number, count: number) => -Math.PI / 2 + (i * 2 * Math.PI) / count;
  const pt = (i: number, count: number, f: number): [number, number] => [
    cx + Math.cos(ang(i, count)) * radius * f,
    cy + Math.sin(ang(i, count)) * radius * f,
  ];
  const fmt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  const shapePath = (layer: RadarLayer) => {
    const c = layer.points.length;
    const pts = layer.points
      .map((v, i) => (v === null ? null : pt(i, c, v)))
      .filter((p): p is [number, number] => p !== null);
    if (pts.length < 2) return null;
    return { pts, closed: pts.length >= 3 };
  };

  // ghost layers first so solid layers draw on top
  const ordered = [...layers].sort((a, b) => Number(!!b.ghost) - Number(!!a.ghost));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      className="cmp-rd-svg"
    >
      {rings.map((ring, k) => (
        <polygon
          key={`ring-${k}`}
          className={ring.r >= 1 ? "cmp-rd-ring cmp-rd-rim" : "cmp-rd-ring"}
          points={axes.map((_, i) => fmt(pt(i, n, ring.r))).join(" ")}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, n, 1);
        return <line key={`sp-${i}`} className="cmp-rd-spoke" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      {rings.map((ring, k) =>
        ring.label ? (
          <text
            key={`rl-${k}`}
            className="cmp-rd-tick"
            x={cx + 3}
            y={cy - radius * ring.r + 9}
          >
            {ring.label}
          </text>
        ) : null,
      )}

      {ordered.map((layer) => {
        const shape = shapePath(layer);
        const c = layer.points.length;
        return (
          <g key={layer.name + (layer.ghost ? "-ghost" : "")} data-layer={layer.ghost ? "ghost" : "solid"}>
            {shape && shape.closed ? (
              <polygon
                points={shape.pts.map(fmt).join(" ")}
                fill={layer.color}
                fillOpacity={layer.ghost ? 0.12 : 0.17}
                stroke={layer.color}
                strokeOpacity={layer.ghost ? 0.4 : 1}
                strokeWidth={layer.ghost ? 1 : 2}
                strokeDasharray={layer.ghost ? "3 3" : undefined}
                strokeLinejoin="round"
              />
            ) : shape ? (
              <polyline
                points={shape.pts.map(fmt).join(" ")}
                fill="none"
                stroke={layer.color}
                strokeWidth={2}
              />
            ) : null}
            {layer.points.map((v, i) => {
              if (v === null) return null;
              const [x, y] = pt(i, c, v);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={layer.ghost ? 2.2 : 3.4}
                  fill={layer.ghost ? "none" : layer.color}
                  stroke={layer.color}
                  strokeOpacity={layer.ghost ? 0.7 : 0}
                  strokeWidth={1}
                >
                  {layer.titles?.[i] ? <title>{layer.titles[i]}</title> : null}
                </circle>
              );
            })}
          </g>
        );
      })}

      {axes.map((axis, i) => {
        const a = ang(i, n);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const [px, py] = pt(i, n, 1);
        const lx = px + cos * labelGap;
        const ly = py + sin * labelGap;
        const anchor = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
        const count = axis.lines.length;
        // first baseline of the block
        let y0: number;
        if (sin < -0.5) y0 = ly - (count - 1) * lineHeight - 2;
        else if (sin > 0.5) y0 = ly + lineHeight * 0.85;
        else y0 = ly - ((count - 1) * lineHeight) / 2 + 3.5;
        return (
          <g key={`ax-${i}`}>
            {axis.title ? <title>{axis.title}</title> : null}
            {axis.lines.map((line, j) => (
              <text
                key={j}
                x={lx}
                y={y0 + j * lineHeight}
                textAnchor={anchor}
                className={
                  "cmp-rd-label" +
                  (j === 0 && !line.color ? " cmp-rd-name" : "") +
                  (line.muted ? " cmp-rd-muted" : "") +
                  (line.bold ? " cmp-rd-bold" : "")
                }
                style={line.color ? { fill: line.color } : undefined}
              >
                {line.title ? <title>{line.title}</title> : null}
                {glyphText(line.text)}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Visually hidden data table — the accessible equivalent of a radar. */
export function RadarTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <table className="cmp-sr">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) =>
              j === 0 ? (
                <th key={j} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={j}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
