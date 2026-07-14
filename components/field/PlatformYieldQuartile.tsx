/**
 * PlatformYieldQuartile — SVG stacked bar chart.
 *
 * 4 yield quartiles (Q1-low → Q4-high) × top platforms. Each bar is a quartile;
 * segments are platform counts. Shows Claude/Anthropic dominance in the top
 * yield quartile. Pure inline SVG, no chart libraries.
 */

const CASCADE = "#8b5cf6";
const ARCH = "#3b82f6";
const SEEK = "#10b981";
const THROUGHPUT = "#5b6472";
const GOLD = "#c4923a";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface QuartilePlatformBreakdown {
  quartile: string;
  platforms: { platform: string; count: number }[];
}

export interface PlatformYieldQuartileProps {
  data: QuartilePlatformBreakdown[];
}

const PLATFORM_COLORS: Record<string, string> = {
  anthropic: CASCADE,
  openai: ARCH,
  google: SEEK,
  other: THROUGHPUT,
  zhipu: GOLD,
  deepseek: "#e0a64a",
};

const TOP_PLATFORMS = ["anthropic", "openai", "google", "zhipu", "deepseek", "other"];

export default function PlatformYieldQuartile({
  data,
}: PlatformYieldQuartileProps) {
  if (data.length === 0) return null;

  // Normalize: ensure each quartile has all top platforms (fill 0)
  const normalized = data.map((q) => {
    const map = new Map(q.platforms.map((p) => [p.platform, p.count]));
    return {
      quartile: q.quartile,
      platforms: TOP_PLATFORMS.map((p) => ({
        platform: p,
        count: map.get(p) ?? 0,
      })),
    };
  });

  const maxTotal = Math.max(
    ...normalized.map((q) =>
      q.platforms.reduce((sum, p) => sum + p.count, 0),
    ),
  );

  // Layout
  const width = 800;
  const height = 380;
  const padL = 56;
  const padR = 24;
  const padT = 56;
  const padB = 56;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const barW = plotW / normalized.length;
  const barGap = barW * 0.2;
  const innerBarW = barW - barGap;

  const yForCount = (c: number) => padT + plotH - (c / maxTotal) * plotH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Platform yield quartile stacked bar chart"
      style={{ background: BG, border: `1px solid ${LINE}` }}
    >
      {/* Title */}
      <text x={padL} y={26} fontSize={13} fill={CASCADE} fontWeight={700}>
        PLATFORM × YIELD QUARTILE — CLAUDE DOMINANCE IN TOP QUARTILE
      </text>

      {/* Y-axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + plotH - f * plotH;
        const val = Math.round(f * maxTotal);
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
              {val}
            </text>
          </g>
        );
      })}

      {/* Stacked bars */}
      {normalized.map((q, qi) => {
        const barX = padL + qi * barW + barGap / 2;
        let stackY = padT + plotH;
        return (
          <g key={`q-${qi}`}>
            {q.platforms.map((p, pi) => {
              const segH = (p.count / maxTotal) * plotH;
              const segY = stackY - segH;
              stackY = segY;
              const color = PLATFORM_COLORS[p.platform] ?? THROUGHPUT;
              return (
                <g key={`seg-${qi}-${pi}`}>
                  <rect
                    x={barX}
                    y={segY}
                    width={innerBarW}
                    height={Math.max(0, segH)}
                    fill={color}
                    opacity={0.85}
                  />
                  {segH > 14 && (
                    <text
                      x={barX + innerBarW / 2}
                      y={segY + segH / 2}
                      fontSize={9}
                      fill="#fff"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight={600}
                    >
                      {p.count}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Quartile label */}
            <text
              x={barX + innerBarW / 2}
              y={padT + plotH + 18}
              fontSize={11}
              fill={INK}
              textAnchor="middle"
              fontWeight={600}
            >
              {q.quartile}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      {TOP_PLATFORMS.map((p, i) => {
        const lx = padL + i * 110;
        const color = PLATFORM_COLORS[p] ?? THROUGHPUT;
        return (
          <g key={`leg-${p}`}>
            <rect
              x={lx}
              y={height - 22}
              width={10}
              height={10}
              rx={2}
              fill={color}
            />
            <text
              x={lx + 14}
              y={height - 13}
              fontSize={10}
              fill={INK}
              dominantBaseline="middle"
            >
              {p}
            </text>
          </g>
        );
      })}

      {/* Y-axis title */}
      <text
        x={16}
        y={padT + plotH / 2}
        fontSize={11}
        fill={INK}
        textAnchor="middle"
        transform={`rotate(-90 16 ${padT + plotH / 2})`}
      >
        Operator count
      </text>
    </svg>
  );
}
