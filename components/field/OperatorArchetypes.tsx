/**
 * OperatorArchetypes — 8 archetype cards from archetypes.json.
 *
 * Renders a responsive grid of cards, one per archetype, showing: name,
 * operator count + percentage, median yield/leverage/velocity, four-pillar
 * composition (as mini stacked bar), top platform, and 3-5 example handles.
 *
 * Data is loaded server-side from public/data/archetypes.json and passed in
 * as props by the page.
 */

import Link from "next/link";

export interface ArchetypeData {
  archetype_id: number;
  name: string;
  description: string;
  n: number;
  yield_median: number;
  leverage_median: number;
  velocity_median: number;
  snr_median: number;
  input_pct: number;
  output_pct: number;
  cache_read_pct: number;
  cache_write_pct: number;
  total_tokens_median: number;
  tokens_per_day_median: number;
  top_platform: string;
  sample_handles: string[];
  overlay?: boolean;
}

export interface OperatorArchetypesProps {
  archetypes: ArchetypeData[];
  totalOperators: number;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  "The Field": "#3498db",
  "Context Builders": "#2ecc71",
  "Cache Architects": "#d4af37",
  "Input-Heavy Operators": "#e74c3c",
  "Cache Builders": "#e17055",
  "Cascade Operators": "#a29bfe",
  "Steady Cascaders": "#00b894",
  "Outliers": "#6a6a6a",
};

export default function OperatorArchetypes({
  archetypes,
  totalOperators,
}: OperatorArchetypesProps) {
  // Sort by operator count descending (largest archetype first).
  // Overlay archetypes (e.g. Outliers) sort to the end regardless of n,
  // since they are dual-labeled categories on top of the K-Means clusters.
  const sorted = [...archetypes].sort((a, b) => {
    if (a.overlay && !b.overlay) return 1;
    if (!a.overlay && b.overlay) return -1;
    return b.n - a.n;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sorted.map((arch) => {
          const color = ARCHETYPE_COLORS[arch.name] ?? "#3498db";
          const pct = ((arch.n / totalOperators) * 100).toFixed(1);
          const composition = [
            { label: "Input", pct: arch.input_pct * 100, color: "#3498db" },
            { label: "Output", pct: arch.output_pct * 100, color: "#e17055" },
            { label: "Cache Read", pct: arch.cache_read_pct * 100, color: "#d4af37" },
            { label: "Cache Write", pct: arch.cache_write_pct * 100, color: "#00b894" },
          ];

          return (
            <div
              key={arch.archetype_id}
              className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3
                    className="font-sans text-lg font-bold"
                    style={{ color }}
                  >
                    {arch.name}
                  </h3>
                  <p className="font-mono text-xs text-text-muted">
                    n={arch.n.toLocaleString()} ({pct}%)
                  </p>
                </div>
                <div
                  className="rounded px-2 py-1 font-mono text-xs font-bold"
                  style={{
                    color,
                    backgroundColor: `${color}22`,
                  }}
                >
                  {arch.yield_median >= 1000
                    ? `${(arch.yield_median / 1000).toFixed(1)}K`
                    : arch.yield_median.toFixed(2)}{" "}
                  Y
                </div>
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed text-text-secondary">
                {arch.description}
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <div className="text-text-muted">Leverage</div>
                  <div className="font-bold text-text-primary">
                    {arch.leverage_median.toFixed(1)}x
                  </div>
                </div>
                <div>
                  <div className="text-text-muted">Velocity</div>
                  <div className="font-bold text-text-primary">
                    {arch.velocity_median.toFixed(2)}x
                  </div>
                </div>
                <div>
                  <div className="text-text-muted">SNR</div>
                  <div className="font-bold text-text-primary">
                    {arch.snr_median.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Composition mini bar */}
              <div>
                <div className="mb-1 font-mono text-xs text-text-muted">
                  Token composition
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded">
                  {composition.map((c) => (
                    <div
                      key={c.label}
                      style={{
                        width: `${c.pct}%`,
                        backgroundColor: c.color,
                      }}
                      title={`${c.label}: ${c.pct.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Example handles */}
              {arch.sample_handles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {arch.sample_handles.slice(0, 5).map((handle) => (
                    <Link
                      key={handle}
                      href={`/user/${handle}`}
                      className="rounded border border-bg-border px-2 py-0.5 font-mono text-xs text-text-secondary transition-colors hover:border-gold hover:text-gold"
                    >
                      {handle}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted">
        Archetypes emerge from K-Means clustering on log(yield, leverage,
        velocity, SNR) with RobustScaler. 7 human groups arise from a hybrid
        approach: 3 yield tiers + composition sub-shapes. The 8th (Outliers)
        is an overlay category from input/total ratio analysis — some
        outliers also appear in other archetypes. Silhouette = 0.625.
      </p>
    </div>
  );
}
