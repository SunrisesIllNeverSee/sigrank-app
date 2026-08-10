/**
 * TierLadderDistribution — the finalized 24-stage experience ladder dataset
 * for the wiki.
 *
 * Renders the full population distribution from
 * public/data/class-distribution-reference.json as a formatted table + bar
 * chart: stage name, observed token ranges, operator count, and a
 * horizontal bar showing relative population. Server component.
 */

import classDistRaw from "@/public/data/class-distribution-reference.json";

interface StageRow {
  stage: string;
  totalMin_inclusive: number;
  observed_min_total_tokens: number;
  observed_max_total_tokens: number;
  operators: number;
}

const TIER_COLORS: Record<string, string> = {
  "ARCH+": "#e74c3c",
  ARCH: "#e67e22",
  POWER: "#f39c12",
  BASE: "#2ecc71",
  SEEKER: "#1abc9c",
  REFINER: "#3498db",
  BEARER: "#9b59b6",
  IGNITER: "#7f8c8d",
};

function tierOf(stage: string): string {
  return stage.split(" ")[0];
}

function fmtTokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toString();
}

export function TierLadderDistribution() {
  const data = classDistRaw as { stages: StageRow[] };
  const stages = data.stages;
  const maxOps = Math.max(...stages.map((s) => s.operators));
  const totalOps = stages.reduce((sum, s) => sum + s.operators, 0);

  // Group by tier for summary
  const tierGroups: Record<string, number> = {};
  for (const s of stages) {
    const t = tierOf(s.stage);
    tierGroups[t] = (tierGroups[t] ?? 0) + s.operators;
  }
  const tierOrder = ["ARCH+", "ARCH", "POWER", "BASE", "SEEKER", "REFINER", "BEARER", "IGNITER"];

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-sm font-bold text-text-primary">
        24-stage distribution
      </h3>
      <p className="max-w-2xl font-sans text-xs text-text-muted">
        Canonical classifier applied to all {totalOps.toLocaleString()} eligible
        operators. Stage populations follow Option C target shares (not
        equal-population): each base tier has a different target percentage,
        then divides approximately into thirds (III, II, I). Observed min/max
        are empirical ranges within each stage, not classifier thresholds.
      </p>

      {/* Tier summary bars */}
      <div className="flex flex-col gap-1">
        {tierOrder.map((tier) => {
          const count = tierGroups[tier] ?? 0;
          const pct = ((count / totalOps) * 100).toFixed(1);
          const width = (count / maxOps) * 100;
          const color = TIER_COLORS[tier] ?? "#888";
          return (
            <div key={tier} className="flex items-center gap-2">
              <span
                className="w-16 shrink-0 font-mono text-xs font-bold"
                style={{ color }}
              >
                {tier}
              </span>
              <div className="relative h-5 flex-1 rounded-sm bg-bg-surface">
                <div
                  className="absolute left-0 top-0 h-full rounded-sm"
                  style={{ width: `${width}%`, background: color, opacity: 0.7 }}
                />
                <span className="absolute left-2 top-0 flex h-full items-center font-mono text-[10px] text-text-primary">
                  {count} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full 24-stage table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-bg-border">
              <th className="py-2 pr-3 text-text-muted">Stage</th>
              <th className="py-2 pr-3 text-right text-text-muted">Observed min</th>
              <th className="py-2 pr-3 text-right text-text-muted">Observed max</th>
              <th className="py-2 pr-3 text-right text-text-muted">Operators</th>
              <th className="py-2 pr-3 text-text-muted">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => {
              const tier = tierOf(s.stage);
              const color = TIER_COLORS[tier] ?? "#888";
              const width = (s.operators / maxOps) * 100;
              return (
                <tr
                  key={s.stage}
                  className="border-b border-bg-border-subtle last:border-b-0"
                >
                  <td className="py-1.5 pr-3">
                    <span style={{ color }} className="font-bold">
                      {s.stage}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right text-text-secondary">
                    {fmtTokens(s.observed_min_total_tokens)}
                  </td>
                  <td className="py-1.5 pr-3 text-right text-text-secondary">
                    {fmtTokens(s.observed_max_total_tokens)}
                  </td>
                  <td className="py-1.5 pr-3 text-right text-text-secondary">
                    {s.operators}
                  </td>
                  <td className="py-1.5 pr-3">
                    <div className="h-3 w-full rounded-sm bg-bg-surface">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${width}%`,
                          background: color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="font-sans text-[11px] text-text-dim">
        Observed min/max are empirical token ranges within each stage under the
        canonical classifier (experience_ladder.json). Stage populations differ
        by design — each base tier has a different target share (Option C).
        TRANSMITTER is not shown here — it is a peak badge, not a ladder stage.
      </p>
    </section>
  );
}
