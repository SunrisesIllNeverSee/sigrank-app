/**
 * PillarFlowDiagram — visual explainer of the four token pillars.
 *
 * Shows how tokens flow through the model:
 *   Input (fresh) ──┐
 *                   ├──→ [MODEL] ──→ Output (the answer)
 *   Cache Read ─────┘            │
 *                                ├──→ Cache Write (save for next turn)
 *                                └────→ (to user)
 *   Cache Write ──→ Cache Read (next turn)
 *
 * Pure inline SVG. Server component. No client JS. Theme-aware via
 * CSS variables (rgb() wrapper around --var tokens).
 *
 * The four pillar colors:
 *   Input       = #5b6472 (slate — fresh, costly)
 *   Cache Read  = #2ec4a0 (teal — reused, cheap)
 *   Cache Write = #f07030 (orange — saved, investment)
 *   Output      = #c4923a (gold — the product)
 */

const PILLAR_COLORS = {
  input: "#5b6472",
  cacheRead: "#2ec4a0",
  cacheWrite: "#f07030",
  output: "#c4923a",
  model: "#1a1a2e",
  modelStroke: "#3a3a4e",
  arrow: "#5a5a6a",
};

export default function PillarFlowDiagram() {
  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        The four pillars
      </div>
      <p className="max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
        Every turn, tokens flow through the model in four ways. Two go in
        (fresh input + reused cache). Two come out (the answer + saved
        context). The ratio between them is your cascade.
      </p>

      <svg
        viewBox="0 0 600 360"
        className="w-full max-w-xl"
        role="img"
        aria-label="Four pillar flow diagram: input and cache read enter the model, output and cache write leave. Cache write feeds back into cache read on the next turn."
      >
        {/* ── Input node (left top) ── */}
        <rect
          x="20" y="40" width="130" height="50" rx="8"
          fill={PILLAR_COLORS.input} fillOpacity="0.15"
          stroke={PILLAR_COLORS.input} strokeWidth="1.5"
        />
        <text x="85" y="62" textAnchor="middle" fontSize="13" fontWeight="700" fill={PILLAR_COLORS.input}>
          Input
        </text>
        <text x="85" y="78" textAnchor="middle" fontSize="9" fill={PILLAR_COLORS.input} fillOpacity="0.8">
          fresh tokens · $3/M
        </text>

        {/* ── Cache Read node (left bottom) ── */}
        <rect
          x="20" y="200" width="130" height="50" rx="8"
          fill={PILLAR_COLORS.cacheRead} fillOpacity="0.15"
          stroke={PILLAR_COLORS.cacheRead} strokeWidth="1.5"
        />
        <text x="85" y="222" textAnchor="middle" fontSize="13" fontWeight="700" fill={PILLAR_COLORS.cacheRead}>
          Cache Read
        </text>
        <text x="85" y="238" textAnchor="middle" fontSize="9" fill={PILLAR_COLORS.cacheRead} fillOpacity="0.8">
          reused context · $0.30/M
        </text>

        {/* ── Model node (center) ── */}
        <rect
          x="235" y="105" width="130" height="80" rx="12"
          fill={PILLAR_COLORS.model}
          stroke={PILLAR_COLORS.modelStroke} strokeWidth="2"
        />
        <text x="300" y="140" textAnchor="middle" fontSize="16" fontWeight="700" fill="#e9e3d5">
          MODEL
        </text>
        <text x="300" y="160" textAnchor="middle" fontSize="9" fill="#9e937c">
          processes tokens
        </text>

        {/* ── Output node (right top) ── */}
        <rect
          x="450" y="40" width="130" height="50" rx="8"
          fill={PILLAR_COLORS.output} fillOpacity="0.15"
          stroke={PILLAR_COLORS.output} strokeWidth="1.5"
        />
        <text x="515" y="62" textAnchor="middle" fontSize="13" fontWeight="700" fill={PILLAR_COLORS.output}>
          Output
        </text>
        <text x="515" y="78" textAnchor="middle" fontSize="9" fill={PILLAR_COLORS.output} fillOpacity="0.8">
          the answer · $15/M
        </text>

        {/* ── Cache Write node (right bottom) ── */}
        <rect
          x="450" y="200" width="130" height="50" rx="8"
          fill={PILLAR_COLORS.cacheWrite} fillOpacity="0.15"
          stroke={PILLAR_COLORS.cacheWrite} strokeWidth="1.5"
        />
        <text x="515" y="222" textAnchor="middle" fontSize="13" fontWeight="700" fill={PILLAR_COLORS.cacheWrite}>
          Cache Write
        </text>
        <text x="515" y="238" textAnchor="middle" fontSize="9" fill={PILLAR_COLORS.cacheWrite} fillOpacity="0.8">
          saved context · $3.75/M
        </text>

        {/* ── Arrows: Input → Model ── */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={PILLAR_COLORS.arrow} />
          </marker>
          <marker id="arrowhead-teal" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={PILLAR_COLORS.cacheRead} />
          </marker>
          <marker id="arrowhead-gold" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={PILLAR_COLORS.output} />
          </marker>
          <marker id="arrowhead-orange" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={PILLAR_COLORS.cacheWrite} />
          </marker>
        </defs>

        <line x1="150" y1="65" x2="230" y2="125" stroke={PILLAR_COLORS.arrow} strokeWidth="1.5" markerEnd="url(#arrowhead)" />
        <text x="175" y="85" fontSize="8" fill={PILLAR_COLORS.input} fillOpacity="0.7">enters</text>

        {/* ── Arrow: Cache Read → Model ── */}
        <line x1="150" y1="225" x2="230" y2="165" stroke={PILLAR_COLORS.cacheRead} strokeWidth="1.5" markerEnd="url(#arrowhead-teal)" />
        <text x="160" y="200" fontSize="8" fill={PILLAR_COLORS.cacheRead} fillOpacity="0.7">reused</text>

        {/* ── Arrow: Model → Output ── */}
        <line x1="370" y1="125" x2="445" y2="65" stroke={PILLAR_COLORS.output} strokeWidth="1.5" markerEnd="url(#arrowhead-gold)" />
        <text x="395" y="85" fontSize="8" fill={PILLAR_COLORS.output} fillOpacity="0.7">generates</text>

        {/* ── Arrow: Model → Cache Write ── */}
        <line x1="370" y1="165" x2="445" y2="225" stroke={PILLAR_COLORS.cacheWrite} strokeWidth="1.5" markerEnd="url(#arrowhead-orange)" />
        <text x="395" y="205" fontSize="8" fill={PILLAR_COLORS.cacheWrite} fillOpacity="0.7">saves</text>

        {/* ── Feedback loop: Cache Write → Cache Read (next turn) ── */}
        <path
          d="M 515 250 Q 515 310 300 310 Q 85 310 85 250"
          fill="none"
          stroke={PILLAR_COLORS.cacheRead}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#arrowhead-teal)"
        />
        <text x="300" y="335" textAnchor="middle" fontSize="9" fill={PILLAR_COLORS.cacheRead} fillOpacity="0.7">
          next turn: saved context becomes reusable context
        </text>

        {/* ── Output → user ── */}
        <text x="515" y="110" textAnchor="middle" fontSize="8" fill={PILLAR_COLORS.output} fillOpacity="0.5">
          ↓ to you
        </text>
      </svg>

      {/* ── Cost asymmetry callout ── */}
      <div className="flex items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
        <span className="font-mono text-xs text-text-muted">⚡</span>
        <p className="font-sans text-xs leading-relaxed text-text-secondary">
          Cache read costs{" "}
          <span className="font-bold text-text-primary">$0.30/M</span> —
          10× cheaper than fresh input at{" "}
          <span className="font-bold text-text-primary">$3/M</span>.
          The cascade is the art of replacing input with cache read.
        </p>
      </div>
    </div>
  );
}
