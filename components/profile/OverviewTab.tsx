import type { HistoryPoint } from "@/lib/board";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";
import type { SignalClass } from "@/components/sigrank/types";
import { SignalClassBadge } from "@/components/sigrank";
import { ArchetypeChip } from "./ArchetypeChip";
import { OverviewChart } from "./OverviewChart";

interface Props {
  history: HistoryPoint[];
  classTier: SignalClass;
  archetype: BuildArchetype | null;
  fieldAvgYield?: number | null;
  globalRank: number;
}

export function OverviewTab({
  history,
  classTier,
  archetype,
  fieldAvgYield,
  globalRank,
}: Props) {
  // Δ-rank: change from first to last snapshot (lower = better)
  const firstRank = history.length > 0 ? history[0].global_rank : 0;
  const lastRank =
    history.length > 0 ? history[history.length - 1].global_rank : globalRank;
  const deltaRank = lastRank - firstRank;
  const rankImproved = deltaRank < 0;
  const rankUnchanged = deltaRank === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Identity columns: CLASS + ARCHETYPE */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            Experience Tier
          </span>
          <div className="flex items-center gap-2">
            <SignalClassBadge signalClass={classTier} showFull />
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            Build Archetype
          </span>
          <div className="flex items-center gap-2">
            {archetype ? (
              <ArchetypeChip archetype={archetype} />
            ) : (
              <span className="font-mono text-xs text-text-muted">—</span>
            )}
          </div>
          {archetype && (
            <p className="font-sans text-xs leading-relaxed text-text-muted">
              {archetype.blurb}
            </p>
          )}
        </div>
      </div>

      {/* Δ-rank gutter indicator */}
      {history.length >= 2 && !rankUnchanged && (
        <div className="flex items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            Rank trajectory
          </span>
          <span
            className={`font-mono text-sm ${rankImproved ? "text-gold" : "text-text-secondary"}`}
          >
            {rankImproved ? "▲" : "▼"} {Math.abs(deltaRank)}{" "}
            {rankImproved ? "positions gained" : "positions lost"}
          </span>
          <span className="font-mono text-xs text-text-muted">
            #{firstRank} → #{lastRank}
          </span>
        </div>
      )}

      {/* Trajectory chart with Both/Metrics/Raw toggle */}
      <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
          Cascade Trajectory
        </h3>
        <OverviewChart history={history} fieldAvgYield={fieldAvgYield} />
      </div>
    </div>
  );
}
