/**
 * CascadeSnowball — visual showing how the cascade compounds across turns.
 *
 * Four turns side by side (1, 5, 15, 50), each showing the four pillars
 * as stacked bars. The visual punchline: fresh input shrinks to almost
 * nothing while cache read grows enormous. The snowball.
 *
 * Pure inline SVG. Server component. No client JS.
 */

const TURNS = [
  {
    label: "Turn 1",
    sublabel: "Input-Heavy",
    input: 500,
    cacheRead: 0,
    cacheWrite: 500,
    output: 800,
    yield: "0.02",
  },
  {
    label: "Turn 5",
    sublabel: "The Field",
    input: 80,
    cacheRead: 2000,
    cacheWrite: 2080,
    output: 1200,
    yield: "1.2",
  },
  {
    label: "Turn 15",
    sublabel: "Cache Architect",
    input: 12,
    cacheRead: 50000,
    cacheWrite: 50012,
    output: 8000,
    yield: "444",
  },
  {
    label: "Turn 50",
    sublabel: "Cache Builder ★",
    input: 2,
    cacheRead: 2500000,
    cacheWrite: 2500002,
    output: 15000,
    yield: "1,825",
  },
];

// Bar dimensions
const BAR_W = 50;
const BAR_MAX_H = 140;
const GAP = 70;
const START_X = 50;

// Colors (matching PillarFlowDiagram)
const COLORS = {
  input: "#5b6472",
  cacheRead: "#2ec4a0",
  cacheWrite: "#f07030",
  output: "#c4923a",
};

// Log scale for bar heights (token counts span 2 → 2.5M, need compression)
function barHeight(value: number, maxLog: number): number {
  if (value <= 0) return 0;
  const logVal = Math.log10(value + 1);
  return Math.max(2, (logVal / maxLog) * BAR_MAX_H);
}

const MAX_LOG = Math.log10(2500000 + 1);

export default function CascadeSnowball() {
  const totalWidth = START_X * 2 + TURNS.length * BAR_W + (TURNS.length - 1) * GAP;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        The cascade
      </div>
      <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
        Each turn, output becomes cache write, which becomes cache read
        for the next turn. Fresh input shrinks. Cache grows. Output
        compounds. This is the snowball.
      </p>

      <svg
        viewBox={`0 0 ${totalWidth} 280`}
        className="mx-auto w-full max-w-xl"
        role="img"
        aria-label="Cascade snowball diagram: four turns showing fresh input shrinking to near-zero while cache read grows enormous. Yield compounds from 0.02 to 1,825."
      >
        {TURNS.map((turn, i) => {
          const x = START_X + i * (BAR_W + GAP);
          const cx = x + BAR_W / 2;
          const baseY = 200;

          const hInput = barHeight(turn.input, MAX_LOG);
          const hCacheRead = barHeight(turn.cacheRead, MAX_LOG);
          const hCacheWrite = barHeight(turn.cacheWrite, MAX_LOG);
          const hOutput = barHeight(turn.output, MAX_LOG);

          return (
            <g key={turn.label}>
              {/* Turn label */}
              <text x={cx} y="25" textAnchor="middle" fontSize="12" fontWeight="700" fill="#e9e3d5">
                {turn.label}
              </text>
              <text x={cx} y="40" textAnchor="middle" fontSize="9" fill="#9e937c">
                {turn.sublabel}
              </text>

              {/* Input bar (left) */}
              <rect x={x} y={baseY - hInput} width={BAR_W / 2 - 2} height={hInput} fill={COLORS.input} rx="2" />
              <text x={x + BAR_W / 4} y={baseY + 14} textAnchor="middle" fontSize="7" fill={COLORS.input}>
                I
              </text>

              {/* Cache Read bar (center-left) */}
              <rect x={x + BAR_W / 2} y={baseY - hCacheRead} width={BAR_W / 2 - 2} height={hCacheRead} fill={COLORS.cacheRead} rx="2" />
              <text x={x + BAR_W * 0.75} y={baseY + 14} textAnchor="middle" fontSize="7" fill={COLORS.cacheRead}>
                CR
              </text>

              {/* Cache Write (small bar to the right, offset) */}
              <rect x={x + BAR_W + 2} y={baseY - hCacheWrite} width={8} height={hCacheWrite} fill={COLORS.cacheWrite} rx="1" opacity="0.6" />

              {/* Output (small bar further right) */}
              <rect x={x + BAR_W + 12} y={baseY - hOutput} width={8} height={hOutput} fill={COLORS.output} rx="1" opacity="0.6" />

              {/* Baseline */}
              <line x1={x - 5} y1={baseY} x2={x + BAR_W + 22} y2={baseY} stroke="#2a2a2a" strokeWidth="1" />

              {/* Yield label */}
              <text x={cx} y={baseY + 32} textAnchor="middle" fontSize="10" fontWeight="700" fill="#c4923a">
                Υ={turn.yield}
              </text>

              {/* Arrow to next turn */}
              {i < TURNS.length - 1 && (
                <path
                  d={`M ${x + BAR_W + 25} ${baseY - 20} Q ${(x + BAR_W + 25 + i * (BAR_W + GAP) + BAR_W + GAP) / 2 + 10} ${baseY - 50} ${x + BAR_W + GAP - 5} ${baseY - 20}`}
                  fill="none"
                  stroke="#3a3a4e"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                />
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${START_X}, 255)`}>
          <rect x="0" y="0" width="8" height="8" fill={COLORS.input} rx="1" />
          <text x="12" y="8" fontSize="8" fill="#9e937c">Input</text>

          <rect x="55" y="0" width="8" height="8" fill={COLORS.cacheRead} rx="1" />
          <text x="67" y="8" fontSize="8" fill="#9e937c">Cache Read</text>

          <rect x="135" y="0" width="8" height="8" fill={COLORS.cacheWrite} rx="1" />
          <text x="147" y="8" fontSize="8" fill="#9e937c">Cache Write</text>

          <rect x="215" y="0" width="8" height="8" fill={COLORS.output} rx="1" />
          <text x="227" y="8" fontSize="8" fill="#9e937c">Output</text>
        </g>
      </svg>

      <p className="mx-auto max-w-xl font-sans text-xs leading-relaxed text-text-muted">
        By turn 50, fresh input is 2 tokens. Cache read is 2.5 million.
        The model already knows the whole project. You stopped
        re-explaining. The cascade compounds on its own.
      </p>
    </div>
  );
}
