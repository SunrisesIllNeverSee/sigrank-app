/**
 * LeverageVsVelocity — SVG scatter plot.
 *
 * X = leverage (cache_read / input), Y = velocity (output / input).
 * Median crosshair. IQR-trimmed axes. The "yield = area of rectangle" concept
 * — leverage × velocity approximates how much cached context amplifies output.
 *
 * Pure inline SVG, no chart libraries.
 */

import type { FieldOperator, IqrFence } from "@/lib/field/types";

const GOLD = "#c4923a";
const CASCADE = "#8b5cf6";
const ARCH = "#3b82f6";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface LeverageVsVelocityProps {
  operators: FieldOperator[];
  medianLeverage: number;
  medianVelocity: number;
  leverageFence: IqrFence;
  velocityFence: IqrFence;
}

export default function LeverageVsVelocity({
  operators,
  medianLeverage,
  medianVelocity,
  leverageFence,
  velocityFence,
}: LeverageVsVelocityProps) {
  // IQR-trim: keep points within fence bounds (lower clamped to 0)
  const points = operators
    .filter((o) => o.leverage > 0 && o.velocity > 0)
    .filter(
      (o) =>
        o.leverage <= leverageFence.upper &&
        o.velocity <= velocityFence.upper,
    )
    .map((o) => ({
      leverage: o.leverage,
      velocity: o.velocity,
      yield: o.yield,
    }));

  if (points.length === 0) return null;

  const maxX = Math.max(...points.map((p) => p.leverage));
  const maxY = Math.max(...points.map((p) => p.velocity));

  // Layout
  const width = 800;
  const height = 420;
  const padL = 60;
  const padR = 24;
  const padT = 44;
  const padB = 52;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xFor = (v: number) => padL + (v / maxX) * plotW;
  const yFor = (v: number) => padT + plotH - (v / maxY) * plotH;

  const medX = xFor(medianLeverage);
  const medY = yFor(medianVelocity);

  // Color points by yield quartile (higher yield = more gold)
  const maxLogYield = Math.log10(Math.max(...points.map((p) => Math.max(p.yield, 0.01))));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Leverage versus velocity scatter plot with median crosshair"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={26} fontSize={13} fill={CASCADE} fontWeight={700}>
        LEVERAGE × VELOCITY — THE YIELD RECTANGLE
      </text>
      <text
        x={width - padR}
        y={26}
        fontSize={11}
        fill={MUT}
        textAnchor="end"
      >
        IQR-trimmed · {points.length} operators
      </text>

      {/* Grid X */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const x = padL + f * plotW;
        return (
          <g key={`xg-${f}`}>
            <line
              x1={x}
              y1={padT}
              x2={x}
              y2={padT + plotH}
              stroke={LINE}
              strokeWidth={1}
              opacity={0.4}
            />
            <text
              x={x}
              y={padT + plotH + 18}
              fontSize={10}
              fill={MUT}
              textAnchor="middle"
            >
              {(f * maxX).toFixed(0)}×
            </text>
          </g>
        );
      })}

      {/* Grid Y */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + plotH - f * plotH;
        return (
          <g key={`yg-${f}`}>
            <line
              x1={padL}
              y1={y}
              x2={padL + plotW}
              y2={y}
              stroke={LINE}
              strokeWidth={1}
              opacity={0.4}
            />
            <text
              x={padL - 8}
              y={y}
              fontSize={10}
              fill={MUT}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {(f * maxY).toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Data points — colored by yield */}
      {points.map((p, i) => {
        const yieldRatio =
          Math.log10(Math.max(p.yield, 0.01)) / maxLogYield;
        const color =
          yieldRatio > 0.66 ? GOLD : yieldRatio > 0.33 ? CASCADE : ARCH;
        return (
          <circle
            key={`lv-${i}`}
            cx={xFor(p.leverage).toFixed(1)}
            cy={yFor(p.velocity).toFixed(1)}
            r={2.5}
            fill={color}
            opacity={0.4}
          />
        );
      })}

      {/* Median crosshair */}
      <line
        x1={medX}
        y1={padT}
        x2={medX}
        y2={padT + plotH}
        stroke={GOLD}
        strokeWidth={1.5}
        strokeDasharray="5 3"
        opacity={0.7}
      />
      <line
        x1={padL}
        y1={medY}
        x2={padL + plotW}
        y2={medY}
        stroke={GOLD}
        strokeWidth={1.5}
        strokeDasharray="5 3"
        opacity={0.7}
      />
      <text x={medX + 4} y={padT + 12} fontSize={10} fill={GOLD} fontWeight={600}>
        median L
      </text>
      <text
        x={padL + plotW - 4}
        y={medY - 4}
        fontSize={10}
        fill={GOLD}
        fontWeight={600}
        textAnchor="end"
      >
        median velocity
      </text>

      {/* Axis titles */}
      <text
        x={padL + plotW / 2}
        y={height - 10}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
      >
        Leverage (cache_read / input)
      </text>
      <text
        x={16}
        y={padT + plotH / 2}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
        transform={`rotate(-90 16 ${padT + plotH / 2})`}
      >
        Velocity (output / input)
      </text>
    </svg>
  );
}
