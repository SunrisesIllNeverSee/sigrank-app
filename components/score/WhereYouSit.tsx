/**
 * WhereYouSit — the "where do you sit?" hook.
 *
 * Shows the 8 archetype yield ranges as a horizontal bar chart, from
 * Input-Heavy (0.02) to Cache Builders (1,825). The visual punchline:
 * there's a 90,000× spread between the worst and the best. Where are you?
 *
 * Pure inline SVG. Server component. No client JS.
 */

const ARCHETYPES = [
  { label: "Input-Heavy", sub: "6.3%", yield: 0.02, color: "#e74c3c" },
  { label: "The Field", sub: "59.8%", yield: 1.24, color: "#3498db" },
  { label: "Context Builders", sub: "19.4%", yield: 6.71, color: "#2ecc71" },
  { label: "Steady Cascaders", sub: "0.2%", yield: 13.5, color: "#00b894" },
  { label: "Cascade Operators", sub: "2.9%", yield: 135, color: "#a29bfe" },
  { label: "Cache Architects", sub: "8.5%", yield: 444, color: "#d4af37" },
  { label: "Cache Builders ★", sub: "2.9%", yield: 1825, color: "#e17055" },
  { label: "Outliers", sub: "7.0%", yield: 5237, color: "#6a6a6a" },
];

// Log scale: yield ranges from 0.02 to 5,237 — need compression
function yieldToWidth(y: number, maxLog: number, maxWidth: number): number {
  if (y <= 0) return 0;
  return Math.max(3, (Math.log10(y + 1) / maxLog) * maxWidth);
}

const MAX_LOG = Math.log10(5237 + 1);
const BAR_MAX_W = 280;
const BAR_H = 22;
const ROW_GAP = 8;
const LABEL_W = 130;
const START_X = LABEL_W + 10;

export default function WhereYouSit() {
  const totalH = ARCHETYPES.length * (BAR_H + ROW_GAP) + 40;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        Where do you sit?
      </div>
      <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
        The field separates into 8 archetypes. Yield ranges from{" "}
        <span className="font-bold text-text-primary">0.02</span> (Input-Heavy)
        {" "}to{" "}
        <span className="font-bold text-text-primary">5,237</span> (Outliers)
        {" "}— a{" "}
        <span className="font-bold text-gold">260,000× spread</span>.
        Your composition decides which one you are. Where are you?
      </p>

      <svg
        viewBox={`0 0 ${START_X + BAR_MAX_W + 70} ${totalH}`}
        className="mx-auto w-full max-w-xl"
        role="img"
        aria-label="Archetype yield comparison: 8 archetypes from Input-Heavy at 0.02 to Outliers at 5,237. A 260,000x spread."
      >
        {ARCHETYPES.map((arch, i) => {
          const y = i * (BAR_H + ROW_GAP) + 10;
          const w = yieldToWidth(arch.yield, MAX_LOG, BAR_MAX_W);
          const yieldLabel =
            arch.yield >= 1000
              ? `${(arch.yield / 1000).toFixed(1)}K`
              : arch.yield < 1
                ? arch.yield.toFixed(2)
                : arch.yield.toFixed(arch.yield < 10 ? 2 : 0);

          return (
            <g key={arch.label}>
              {/* Label */}
              <text
                x={LABEL_W}
                y={y + BAR_H / 2 + 4}
                textAnchor="end"
                fontSize="10"
                fontWeight="600"
                fill="#e9e3d5"
              >
                {arch.label}
              </text>
              <text
                x={LABEL_W}
                y={y + BAR_H / 2 + 14}
                textAnchor="end"
                fontSize="7"
                fill="#9e937c"
              >
                {arch.sub}
              </text>

              {/* Bar */}
              <rect
                x={START_X}
                y={y}
                width={w}
                height={BAR_H}
                fill={arch.color}
                fillOpacity="0.8"
                rx="3"
              />

              {/* Yield value */}
              <text
                x={START_X + w + 6}
                y={y + BAR_H / 2 + 4}
                fontSize="10"
                fontWeight="700"
                fill={arch.color}
              >
                Υ={yieldLabel}
              </text>
            </g>
          );
        })}

        {/* Spread callout */}
        <text
          x={START_X + BAR_MAX_W / 2}
          y={totalH - 8}
          textAnchor="middle"
          fontSize="9"
          fill="#9e937c"
        >
          log scale · 260,000× spread from worst to best
        </text>
      </svg>

      <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-center">
        <p className="font-sans text-sm leading-relaxed text-text-primary">
          <span className="font-bold text-gold">Paste four numbers</span>
          {" "}and find out which archetype you are. Takes 30 seconds.
        </p>
      </div>
    </div>
  );
}
