import type { HistoryPoint } from "@/lib/board";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";
import type { CascadeMetrics } from "@/lib/analytics/cascade";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import type { TierProgress } from "@/lib/analytics/tier-progress";
import type { SignalClass } from "@/components/sigrank/types";
import { SignalClassBadge } from "@/components/sigrank";
import { ArchetypeChip } from "./ArchetypeChip";
import { OverviewChart } from "./OverviewChart";
import { TrophyRoom } from "./TrophyRoom";
import { FieldScatter } from "./FieldScatter";
import type { LeaderboardRow } from "@/lib/board";

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
  trophyCounts: TrophyCounts | null;
  tierProgress: TierProgress | null;
  boardRows: LeaderboardRow[];
  operatorCodename: string;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

const TIER_DESC: Record<string, string> = {
  TRANSMITTER: "The apex of the SigRank ladder. Verified signal transmission at scale — less than 0.1% of all operators reach this tier. The cascade is fully compounding: deep cache reuse, high velocity, and sustained yield across every metric. Transmitters set the benchmark the rest of the field measures against.",
  "ARCH+": "Elite compounding tier. The operator has built a deep, self-reinforcing cascade where cache reads dominate input, output scales beyond fresh context, and construction is actively expanding the context library. All three operating axes — leverage, velocity, and construction — are elevated without the usual tradeoffs. This is rare air.",
  ARCH: "Top-tier operator. The cascade is mature and self-sustaining. Cache reuse is the primary fuel source, output scales efficiently, and yield is consistently high. The operator has crossed into deep compounding territory where each session builds on accumulated context rather than starting fresh.",
  POWER: "High-volume operator with strong cascade efficiency. Leverage is well above field average — the operator reads far more from cache than they put in as fresh input. Velocity is climbing, meaning output is scaling relative to input. The operator is a serious competitor on the leaderboard.",
  BASE: "Established operator building toward compounding. The cascade is forming — cache reuse is growing, yield is positive, and the operator has moved beyond the early-stage grind. The foundation is solid; the next leap is sustained construction (building new context that future sessions will reuse).",
  SEEKER: "Early-stage operator accumulating context. The cascade is forming but not yet self-sustaining. Fresh input still carries significant weight, and leverage is modest. This is the learning phase — the operator is building the context library that will eventually compound. Most operators start here.",
  REFINER: "Mid-tier operator refining signal from noise. Leverage is growing — prior context is returning and supporting the workflow. The operator has moved past pure input-dependence and is beginning to benefit from accumulated context. The next step is deepening reuse and pushing velocity.",
  BEARER: "Active operator carrying meaningful signal load. The operator is consistently active with a growing token footprint. Reuse is established but not yet deep. The operator has momentum — the cascade is loading, and with sustained construction, leverage will accelerate.",
  IGNITER: "New operator — first signals detected. The spark of the cascade. The operator has submitted their first verified snapshots and appears on the leaderboard. Everything from here is accumulation: build context, develop reuse, and let the cascade compound. Every Transmitter started here.",
};

function tierBase(cls: SignalClass): string {
  return cls.split(" ").slice(0, -1).join(" ") || cls;
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
  trophyCounts,
  tierProgress,
  boardRows,
  operatorCodename,
}: Props) {
  const firstRank = history.length > 0 ? history[0].global_rank : 0;
  const lastRank =
    history.length > 0 ? history[history.length - 1].global_rank : globalRank;
  const deltaRank = lastRank - firstRank;
  const rankImproved = deltaRank < 0;
  const rankUnchanged = deltaRank === 0;
  const c = cascade;
  const tp = tierProgress;

  return (
    <div className="flex flex-col gap-4">
      {/* Trophy Room */}
      <TrophyRoom counts={trophyCounts} />

      {/* Tier + Archetype side by side — equal size */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Experience Tier box */}
        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          {/* Header — matches Trophy Room style */}
          <div className="flex items-center gap-2">
            <span className="text-base">🎖️</span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
              Experience Tier
            </h3>
          </div>

          {/* Progress bar at top */}
          {tp && tp.nextClass && (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                Progress to {tp.nextClass}
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                <div className="h-full rounded-full bg-accent" style={{ width: `${tp.progressPct.toFixed(1)}%` }} />
              </div>
              <span className="font-mono text-[10px] text-text-muted">
                {tp.progressPct.toFixed(0)}% · {fmtNum(tp.tokensToNext ?? 0)} tokens to next tier
              </span>
            </div>
          )}
          {tp && !tp.nextClass && (
            <span className="font-mono text-[10px] text-gold">
              Highest tier reached — no further promotion available
            </span>
          )}

          {/* Badge */}
          <div className="flex items-center gap-2">
            <SignalClassBadge signalClass={classTier} showFull size="md" />
            <span className="font-mono text-sm text-gold">Top {topPct.toFixed(2)}%</span>
          </div>

          {/* Description */}
          <p className="font-sans text-[12px] leading-relaxed text-text-secondary">
            {TIER_DESC[tierBase(classTier)] ?? ""}
          </p>

          {/* Field scatter — where this operator sits in the field */}
          <div className="mt-1 flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
              Field position — Υ Yield vs Rank
            </span>
            <FieldScatter boardRows={boardRows} operatorCodename={operatorCodename} />
          </div>
        </div>

        {/* Build Archetype box — equal shape */}
        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          {/* Header — matches Trophy Room style */}
          <div className="flex items-center gap-2">
            <span className="text-base">🧬</span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
              Build Archetype
            </h3>
          </div>

          {/* Chip */}
          <div className="flex items-center gap-2">
            {archetype ? (
              <ArchetypeChip archetype={archetype} />
            ) : (
              <span className="font-mono text-xs text-text-muted">—</span>
            )}
          </div>

          {/* Description */}
          {archetype && (
            <>
              <p className="font-sans text-[12px] leading-relaxed text-text-secondary">
                {archetype.blurb}
              </p>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  How this archetype is classified
                </span>
                <span className="font-mono text-[10px] leading-relaxed text-text-muted">
                  {archetype.definedBy}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  Family — the operating composition group
                </span>
                <span className="font-mono text-[10px] leading-relaxed text-text-muted">
                  {archetype.familyLabel}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Key Stats — full width */}
      <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">📊</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
            Key Stats
          </h3>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">Rank</span>
            <span className="font-mono text-base text-text-primary">#{globalRank}</span>
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
        {/* Competitive deltas */}
        {(deltaFromAvg != null || deltaFromTop != null) && (
          <div className="mt-3 flex flex-wrap gap-4 border-t border-bg-border-subtle pt-3">
            {deltaFromAvg != null && (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  vs. field average
                </span>
                <span className={`font-mono text-sm ${deltaFromAvg >= 0 ? "text-gold" : "text-text-secondary"}`}>
                  {deltaFromAvg >= 0 ? "▲" : "▼"} {Math.abs(deltaFromAvg).toFixed(1)}% {deltaFromAvg >= 0 ? "above" : "below"} average
                </span>
              </div>
            )}
            {deltaFromTop != null && (
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  vs. top operator
                </span>
                <span className="font-mono text-sm text-text-secondary">
                  {deltaFromTop > 0 ? "▼" : "▲"} {Math.abs(deltaFromTop).toFixed(1)}% {deltaFromTop > 0 ? "below" : "at"} top
                </span>
              </div>
            )}
          </div>
        )}
      </div>

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
