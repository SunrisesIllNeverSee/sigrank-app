import type { HistoryPoint } from "@/lib/board";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";
import type { CascadeMetrics } from "@/lib/analytics/cascade";
import type { SignalClass } from "@/components/sigrank/types";
import { SignalClassBadge } from "@/components/sigrank";
import { ArchetypeChip } from "./ArchetypeChip";
import { OverviewChart } from "./OverviewChart";

interface Props {
  history: HistoryPoint[];
  classTier: SignalClass;
  archetype: BuildArchetype | null;
  cascade: CascadeMetrics | null;
  fieldAvgYield?: number | null;
  globalRank: number;
  topPct: number;
  platform: string | null;
  accountAgeDays: number | null;
  lifetimeTurns: number | null;
  deltaFromAvg: number | null;
  deltaFromTop: number | null;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

const TIER_DESC: Record<string, string> = {
  TRANSMITTER: "The apex — verified signal transmission at scale.",
  "ARCH+": "Top-tier operator. Deep compounding cascade with sustained yield.",
  ARCH: "Top-tier operator. Deep compounding cascade with sustained yield.",
  POWER: "High-volume operator with strong cascade efficiency.",
  BASE: "Established operator building toward compounding.",
  SEEKER: "Early-stage operator accumulating context. The cascade is forming.",
  REFINER: "Mid-tier operator refining signal from noise.",
  BEARER: "Active operator carrying meaningful signal load.",
  IGNITER: "New operator — first signals detected. The spark.",
};

function tierDesc(cls: SignalClass): string {
  const base = cls.split(" ").slice(0, -1).join(" ");
  return TIER_DESC[base] ?? TIER_DESC[cls] ?? "";
}

export function OverviewTab({
  history,
  classTier,
  archetype,
  cascade,
  fieldAvgYield,
  globalRank,
  topPct,
  platform,
  accountAgeDays,
  lifetimeTurns,
  deltaFromAvg,
  deltaFromTop,
}: Props) {
  const firstRank = history.length > 0 ? history[0].global_rank : 0;
  const lastRank =
    history.length > 0 ? history[history.length - 1].global_rank : globalRank;
  const deltaRank = lastRank - firstRank;
  const rankImproved = deltaRank < 0;
  const rankUnchanged = deltaRank === 0;
  const c = cascade;

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: identity + key stats */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Identity: CLASS + ARCHETYPE */}
        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
              Experience Tier
            </span>
            <div className="flex items-center gap-2">
              <SignalClassBadge signalClass={classTier} showFull size="md" />
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-text-muted">
              {tierDesc(classTier)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
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
              <p className="font-sans text-[11px] leading-relaxed text-text-muted">
                {archetype.blurb}
              </p>
            )}
          </div>
        </div>

        {/* Key stats grid */}
        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            Key Stats
          </span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Rank</span>
              <span className="font-mono text-lg text-text-primary">#{globalRank}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Percentile</span>
              <span className="font-mono text-sm text-gold">Top {topPct.toFixed(2)}%</span>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-bg-elevated">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(topPct, 100)}%` }} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Platform</span>
              <span className="font-mono text-sm text-text-secondary">{platform ?? "—"}</span>
            </div>
            {c && (
              <>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Υ Yield</span>
                  <span className="font-mono text-sm text-gold">
                    {c.yield_ >= 1_000 ? `${(c.yield_ / 1_000).toFixed(1)}K` : c.yield_.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Leverage</span>
                  <span className="font-mono text-sm text-text-secondary">
                    {c.leverage >= 1_000 ? `${(c.leverage / 1_000).toFixed(1)}K` : c.leverage.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">10xDEV</span>
                  <span className="font-mono text-sm text-text-secondary">
                    {c.dev10x !== null ? c.dev10x.toFixed(2) : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">SNR</span>
                  <span className="font-mono text-sm text-text-secondary">{(c.snr * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Velocity</span>
                  <span className="font-mono text-sm text-text-secondary">
                    {c.velocity >= 10 ? c.velocity.toFixed(1) : c.velocity.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">$ / 1M</span>
                  <span className="font-mono text-sm text-text-secondary">${c.costPerMillion.toFixed(2)}</span>
                </div>
              </>
            )}
            {accountAgeDays != null && (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Account age</span>
                <span className="font-mono text-sm text-text-secondary">{accountAgeDays}d</span>
              </div>
            )}
            {lifetimeTurns != null && (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Turns</span>
                <span className="font-mono text-sm text-text-secondary">{fmtNum(lifetimeTurns)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Competitive deltas */}
      {(deltaFromAvg != null || deltaFromTop != null) && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          {deltaFromAvg != null && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                vs. field average
              </span>
              <span className={`font-mono text-sm ${deltaFromAvg >= 0 ? "text-gold" : "text-text-secondary"}`}>
                {deltaFromAvg >= 0 ? "▲" : "▼"} {Math.abs(deltaFromAvg).toFixed(1)}% {deltaFromAvg >= 0 ? "above" : "below"} average
              </span>
            </div>
          )}
          {deltaFromTop != null && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
                vs. top operator
              </span>
              <span className="font-mono text-sm text-text-secondary">
                {deltaFromTop > 0 ? "▼" : "▲"} {Math.abs(deltaFromTop).toFixed(1)}% {deltaFromTop > 0 ? "below" : "at"} top
              </span>
            </div>
          )}
        </div>
      )}

      {/* Δ-rank trajectory */}
      {history.length >= 2 && !rankUnchanged && (
        <div className="flex items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            Rank trajectory
          </span>
          <span className={`font-mono text-sm ${rankImproved ? "text-gold" : "text-text-secondary"}`}>
            {rankImproved ? "▲" : "▼"} {Math.abs(deltaRank)} {rankImproved ? "positions gained" : "positions lost"}
          </span>
          <span className="font-mono text-xs text-text-muted">
            #{firstRank} → #{lastRank}
          </span>
        </div>
      )}

      {/* Trajectory chart */}
      <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
          Cascade Trajectory
        </h3>
        <OverviewChart history={history} fieldAvgYield={fieldAvgYield} />
      </div>
    </div>
  );
}
