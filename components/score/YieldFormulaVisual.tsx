/**
 * YieldFormulaVisual — visual breakdown of Υ = leverage × velocity.
 *
 * Shows the formula as a visual equation:
 *   Input ──→ [velocity = O / I] ←── Output
 *   Input ──→ [leverage = CR / I] ←── Cache Read
 *   velocity × leverage = YIELD
 *
 * Plus a compact "where you sit" comparison bar showing yield ranges
 * for The Field vs Cache Architects vs Cache Builders.
 *
 * Pure inline SVG. Server component. No client JS.
 */

const COLORS = {
  input: "#5b6472",
  output: "#c4923a",
  cacheRead: "#2ec4a0",
  yield: "#f07030",
  box: "#1a1a2e",
  boxStroke: "#3a3a4e",
  text: "#e9e3d5",
  muted: "#9e937c",
};

const ARCHETYPE_YIELDS = [
  { label: "Input-Heavy", yield: 0.02, color: "#e74c3c", width: 2 },
  { label: "The Field", yield: 1.24, color: "#3498db", width: 8 },
  { label: "Context Builders", yield: 6.71, color: "#2ecc71", width: 14 },
  { label: "Cache Architects", yield: 444, color: "#d4af37", width: 30 },
  { label: "Cache Builders ★", yield: 1825, color: "#e17055", width: 48 },
];

export default function YieldFormulaVisual() {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        The yield formula
      </div>
      <p className="max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
        Yield (Υ) is the headline number. It measures how much your
        cascade compounds. Two factors: how much you reuse (leverage)
        and how much you produce (velocity).
      </p>

      <svg
        viewBox="0 0 560 200"
        className="w-full max-w-xl"
        role="img"
        aria-label="Yield formula: velocity (output divided by input) times leverage (cache read divided by input) equals yield."
      >
        {/* ── Velocity box ── */}
        <rect x="30" y="20" width="160" height="50" rx="8" fill={COLORS.box} stroke={COLORS.boxStroke} strokeWidth="1.5" />
        <text x="110" y="42" textAnchor="middle" fontSize="11" fontWeight="700" fill={COLORS.text}>
          velocity
        </text>
        <text x="110" y="58" textAnchor="middle" fontSize="10" fill={COLORS.muted}>
          = Output ÷ Input
        </text>

        {/* Input → velocity */}
        <line x1="15" y1="45" x2="28" y2="45" stroke={COLORS.input} strokeWidth="1.5" />
        <text x="10" y="38" textAnchor="middle" fontSize="8" fill={COLORS.input}>I</text>

        {/* Output → velocity */}
        <line x1="195" y1="45" x2="208" y2="45" stroke={COLORS.output} strokeWidth="1.5" />
        <text x="213" y="38" textAnchor="middle" fontSize="8" fill={COLORS.output}>O</text>

        {/* ── Leverage box ── */}
        <rect x="30" y="90" width="160" height="50" rx="8" fill={COLORS.box} stroke={COLORS.boxStroke} strokeWidth="1.5" />
        <text x="110" y="112" textAnchor="middle" fontSize="11" fontWeight="700" fill={COLORS.text}>
          leverage
        </text>
        <text x="110" y="128" textAnchor="middle" fontSize="10" fill={COLORS.muted}>
          = Cache Read ÷ Input
        </text>

        {/* Input → leverage */}
        <line x1="15" y1="115" x2="28" y2="115" stroke={COLORS.input} strokeWidth="1.5" />
        <text x="10" y="108" textAnchor="middle" fontSize="8" fill={COLORS.input}>I</text>

        {/* Cache Read → leverage */}
        <line x1="195" y1="115" x2="208" y2="115" stroke={COLORS.cacheRead} strokeWidth="1.5" />
        <text x="218" y="108" textAnchor="middle" fontSize="8" fill={COLORS.cacheRead}>CR</text>

        {/* ── Multiply sign ── */}
        <text x="250" y="85" textAnchor="middle" fontSize="20" fontWeight="700" fill={COLORS.muted}>
          ×
        </text>

        {/* ── Yield box (result) ── */}
        <rect x="280" y="55" width="120" height="50" rx="8" fill={COLORS.yield} fillOpacity="0.15" stroke={COLORS.yield} strokeWidth="2" />
        <text x="340" y="77" textAnchor="middle" fontSize="13" fontWeight="700" fill={COLORS.yield}>
          Υ Yield
        </text>
        <text x="340" y="93" textAnchor="middle" fontSize="9" fill={COLORS.muted}>
          leverage × velocity
        </text>

        {/* ── Equals arrow ── */}
        <line x1="405" y1="80" x2="430" y2="80" stroke={COLORS.yield} strokeWidth="1.5" />
        <text x="445" y="84" fontSize="11" fontWeight="700" fill={COLORS.yield}>
          your rank
        </text>

        {/* ── Archetype yield comparison bar ── */}
        <text x="10" y="175" fontSize="9" fill={COLORS.muted}>
          Where you sit:
        </text>
        {ARCHETYPE_YIELDS.map((arch, i) => {
          const x = 90 + i * 85;
          return (
            <g key={arch.label}>
              <rect x={x} y="165" width={arch.width} height="12" fill={arch.color} rx="2" opacity="0.8" />
              <text x={x + arch.width / 2} y="190" textAnchor="middle" fontSize="7" fill={COLORS.muted}>
                {arch.label}
              </text>
              <text x={x + arch.width / 2} y="160" textAnchor="middle" fontSize="8" fontWeight="700" fill={arch.color}>
                {arch.yield >= 1000 ? `${(arch.yield / 1000).toFixed(1)}K` : arch.yield.toFixed(arch.yield < 1 ? 2 : 1)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded border border-bg-border bg-bg-surface px-3 py-2">
          <div className="font-mono text-xs text-text-muted">velocity</div>
          <div className="font-mono text-sm font-bold text-text-primary">
            O ÷ I
          </div>
          <div className="font-sans text-[10px] text-text-dim">
            output per fresh input
          </div>
        </div>
        <div className="rounded border border-bg-border bg-bg-surface px-3 py-2">
          <div className="font-mono text-xs text-text-muted">leverage</div>
          <div className="font-mono text-sm font-bold text-text-primary">
            CR ÷ I
          </div>
          <div className="font-sans text-[10px] text-text-dim">
            cache reuse per fresh input
          </div>
        </div>
        <div className="rounded border border-bg-border bg-bg-surface px-3 py-2">
          <div className="font-mono text-xs text-text-muted">yield</div>
          <div className="font-mono text-sm font-bold text-gold">
            lev × vel
          </div>
          <div className="font-sans text-[10px] text-text-dim">
            the headline number
          </div>
        </div>
        <div className="rounded border border-bg-border bg-bg-surface px-3 py-2">
          <div className="font-mono text-xs text-text-muted">field median</div>
          <div className="font-mono text-sm font-bold text-text-primary">
            1.24
          </div>
          <div className="font-sans text-[10px] text-text-dim">
            the 59.8% center of mass
          </div>
        </div>
      </div>
    </div>
  );
}
