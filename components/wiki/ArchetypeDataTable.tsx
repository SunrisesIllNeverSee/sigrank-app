/**
 * ArchetypeDataTable — the finalized 10-archetype dataset table for the wiki.
 *
 * Renders the full population statistics from public/data/archetypes.json as
 * a formatted table: name, family, n, %, median yield/leverage/velocity,
 * four-pillar composition, top platform. Server component — reads the JSON
 * at build time.
 */

import archetypesRaw from "@/public/data/archetypes.json";

interface ArchetypeRow {
  archetype_id: number;
  key: string;
  name: string;
  family: string;
  family_label: string;
  description: string;
  defined_by: string;
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
}

const ARCHETYPE_COLORS: Record<string, string> = {
  CONVERGENT: "#9b59b6",
  KINETIC: "#e74c3c",
  "INPUT-BOUND": "#3498db",
  PRIMING: "#5dade2",
  CONTEXTUAL: "#48c9b0",
  "DEEP READER": "#2ecc71",
  ARCHIVIST: "#27ae60",
  BUILDER: "#f39c12",
  RECURSIVE: "#d4af37",
  AMPLIFIER: "#c0392b",
};

function fmtNum(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(2);
}

export function ArchetypeDataTable() {
  const data = archetypesRaw as {
    n_operators: number;
    n_clustered: number;
    archetypes: ArchetypeRow[];
  };
  const total = data.n_clustered;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-sm font-bold text-text-primary">
        Population statistics
      </h3>
      <p className="max-w-2xl font-sans text-xs text-text-muted">
        From the OCM cut ({total.toLocaleString()} operators). Each archetype
        is a deterministic classification — no clustering, no randomness.
        Medians are per-archetype; composition is the median four-pillar split.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-bg-border">
              <th className="py-2 pr-3 text-text-muted">Archetype</th>
              <th className="py-2 pr-3 text-text-muted">Family</th>
              <th className="py-2 pr-3 text-right text-text-muted">N</th>
              <th className="py-2 pr-3 text-right text-text-muted">%</th>
              <th className="py-2 pr-3 text-right text-text-muted">Yield</th>
              <th className="py-2 pr-3 text-right text-text-muted">Lev</th>
              <th className="py-2 pr-3 text-right text-text-muted">Vel</th>
              <th className="py-2 pr-3 text-right text-text-muted">CR%</th>
              <th className="py-2 pr-3 text-right text-text-muted">CW%</th>
              <th className="py-2 pr-3 text-right text-text-muted">I%</th>
              <th className="py-2 pr-3 text-right text-text-muted">O%</th>
              <th className="py-2 pr-3 text-text-muted">Platform</th>
            </tr>
          </thead>
          <tbody>
            {data.archetypes.map((arch) => {
              const color = ARCHETYPE_COLORS[arch.name] ?? "#888";
              const pct = ((arch.n / total) * 100).toFixed(1);
              return (
                <tr
                  key={arch.key}
                  className="border-b border-bg-border-subtle last:border-b-0"
                >
                  <td className="py-2 pr-3">
                    <span style={{ color }} className="font-bold">
                      {arch.name}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-text-secondary">
                    {arch.family_label}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.n}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {pct}%
                  </td>
                  <td className="py-2 pr-3 text-right text-text-primary">
                    {arch.yield_median.toFixed(2)}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.leverage_median.toFixed(1)}x
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.velocity_median.toFixed(3)}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.cache_read_pct.toFixed(1)}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.cache_write_pct.toFixed(1)}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.input_pct.toFixed(2)}
                  </td>
                  <td className="py-2 pr-3 text-right text-text-secondary">
                    {arch.output_pct.toFixed(2)}
                  </td>
                  <td className="py-2 pr-3 text-text-muted">
                    {arch.top_platform}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="font-sans text-[11px] text-text-dim">
        CR% = cache-read % of total tokens. CW% = cache-write %. I% = input %.
        O% = output %. Yield = median Υ. Lev = median leverage (cache_read/input).
        Vel = median velocity (output/input). Population = {total.toLocaleString()}{" "}
        operators (OCM cut, outliers excluded).
      </p>
    </section>
  );
}
