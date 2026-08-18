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
import { TierScatter } from "./TierScatter";
import { ArchetypeBubble } from "./ArchetypeBubble";
import type { LeaderboardRow } from "@/lib/board";
import { RS05_CLASS_THRESHOLDS } from "@/lib/analytics/ruleset";

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

// Richer archetype descriptions: why it matters + characteristics
const ARCHETYPE_CONTEXT: Record<string, { why: string; characteristics: string[] }> = {
  convergent: {
    why: "The rarest composition. All three cascade axes — reuse, generation, and construction — are firing simultaneously. This is the signature of an operator who has solved the full problem: they read deeply from cache, generate at scale, and actively build new context for future sessions. Most operators max out one or two axes; convergent operators don't have to choose.",
    characteristics: [
      "Deep cache reuse (leverage P80+)",
      "High generation (velocity P80+)",
      "Active construction (construction P80+)",
      "No axis tradeoffs — all three elevated",
    ],
  },
  kinetic: {
    why: "Generation is the defining feature. Output approaches or exceeds fresh input, meaning the operator is transmitting more signal than they consume. This is the profile of an operator whose context library is mature enough that they spend most of their energy producing, not accumulating. High-velocity operators climb the yield leaderboard fast.",
    characteristics: [
      "Output ≥ 80% of fresh input",
      "Transmission-dominated composition",
      "Mature context library driving generation",
      "Yield scales with velocity, not just leverage",
    ],
  },
  "input-bound": {
    why: "The cascade hasn't formed yet. Fresh input is doing almost all the work — little prior context is returning from cache. This is normal for new operators or those working with rapidly-shifting contexts. The path forward is simple: keep submitting. Every snapshot adds to the context library that will eventually compound.",
    characteristics: [
      "Leverage below 5× (cache reads < 5× input)",
      "Each cycle depends on new input",
      "No accumulated context to reuse yet",
      "Every Transmitter started here",
    ],
  },
  priming: {
    why: "The cascade is starting to form. Prior context is beginning to return from cache, but the leverage ratio hasn't deepened yet. This is the transition phase — the operator is building the context library that will eventually compound. The key metric to watch is leverage: as it climbs past 10×, reuse becomes the primary fuel source.",
    characteristics: [
      "Leverage 5–10× (reuse forming)",
      "Prior context starting to return",
      "Transition from input-dependence to reuse",
      "Leverage growth is the leading indicator",
    ],
  },
  contextual: {
    why: "Reuse is now established. The operator's prior context is materially supporting the workflow — cache reads are 10–15× the fresh input. This is where the cascade starts to pay dividends: each session builds on the last without starting from scratch. Construction is still limited, meaning the operator is consuming their context library faster than they're expanding it.",
    characteristics: [
      "Leverage 10–15× (reuse established)",
      "Prior context materially supporting workflow",
      "Passive reuse — construction still limited",
      "Next step: start building new context",
    ],
  },
  "deep-reader": {
    why: "A deep context library is carrying the workflow. The operator draws heavily from accumulated cache (15–23× input) while creating relatively little new context. This is the profile of an operator working within a mature, well-structured knowledge base — efficient, but construction is the bottleneck for further growth.",
    characteristics: [
      "Leverage 15–23× (deep reuse)",
      "Mature context library as primary fuel",
      "Low construction — consuming faster than building",
      "Efficient but growth-limited without construction",
    ],
  },
  archivist: {
    why: "Extreme reuse of a deep context library. Cache reads dwarf fresh input (23×+), meaning the operator is working almost entirely from accumulated context. This is the most reuse-heavy passive composition — highly efficient per token, but the operator is drawing down their context library rather than expanding it.",
    characteristics: [
      "Leverage 23×+ (extreme reuse)",
      "Almost entirely cache-driven",
      "Minimal fresh input or new construction",
      "Maximum efficiency, minimum growth",
    ],
  },
  builder: {
    why: "The operator has started actively constructing new context. Cache writes are growing relative to cache reads, meaning the system is creating material that future sessions will reuse. Leverage is still developing, so the payoff isn't immediate — but this is the foundation of long-term compounding. Builders are investing in their future cascade.",
    characteristics: [
      "Construction ≥ 2% of cache reads",
      "Actively writing new context for future reuse",
      "Leverage still developing (< 30×)",
      "Investment phase — compounding payoff comes later",
    ],
  },
  recursive: {
    why: "Construction and reuse are now feeding each other. The operator is building new context on top of an already substantial reusable base (30–50× leverage). This is the compounding loop in action: each new cache write becomes future cache read, which enables more output, which drives more construction. Recursive operators are on the trajectory to ARCH.",
    characteristics: [
      "Leverage 30–50× with active construction",
      "Construction feeds reuse feeds construction",
      "The compounding loop is self-sustaining",
      "On trajectory to ARCH tier",
    ],
  },
  amplifier: {
    why: "The most advanced construction composition. A massive context library (50×+ leverage) is being actively expanded through construction. The operator is both the deepest reader and an active builder — amplifying their existing context base rather than just consuming it. This is the rare operator who has solved reuse and is now solving growth.",
    characteristics: [
      "Leverage 50×+ with active construction",
      "Deep reuse + active construction simultaneously",
      "Amplifying an already-massive context base",
      "The frontier of the construction family",
    ],
  },
};

function tierBase(cls: SignalClass): string {
  return cls.split(" ").slice(0, -1).join(" ") || cls;
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">{label}</span>
      <span className={`font-mono text-[11px] ${accent ? "text-gold" : "text-text-secondary"}`}>{value}</span>
    </div>
  );
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
  const archCtx = archetype ? ARCHETYPE_CONTEXT[archetype.key] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Trophy Room */}
      <TrophyRoom counts={trophyCounts} />

      {/* Tier + Archetype side by side — equal size, stats at bottom */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Experience Tier box */}
        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          {/* Header */}
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

          {/* Badge + percentile */}
          <div className="flex items-center gap-2">
            <SignalClassBadge signalClass={classTier} showFull size="md" />
            <span className="font-mono text-sm text-gold">Top {topPct.toFixed(2)}%</span>
          </div>

          {/* Description */}
          <p className="font-sans text-[12px] leading-relaxed text-text-secondary">
            {TIER_DESC[tierBase(classTier)] ?? ""}
          </p>

          {/* Tier scatter — total tokens vs yield, with tier threshold lines */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
              Field position — total tokens vs Υ Yield (tier thresholds marked)
            </span>
            <TierScatter boardRows={boardRows} operatorCodename={operatorCodename} tierThresholds={RS05_CLASS_THRESHOLDS.map(t => ({ class: t.class, totalMin: t.totalMin }))} />
          </div>

          {/* Tier-relevant stats at bottom */}
          <div className="mt-auto flex flex-col gap-1.5 border-t border-bg-border-subtle pt-3">
            <StatRow label="Global rank" value={`#${globalRank}`} accent />
            <StatRow label="Platform" value={platform ?? "—"} />
            {accountAgeDays != null && <StatRow label="Account age" value={`${accountAgeDays}d`} />}
            {lifetimeTurns != null && <StatRow label="Lifetime turns" value={fmtNum(lifetimeTurns)} />}
            {deltaFromAvg != null && (
              <StatRow
                label="vs. field avg"
                value={`${deltaFromAvg >= 0 ? "▲" : "▼"} ${Math.abs(deltaFromAvg).toFixed(1)}%`}
                accent={deltaFromAvg >= 0}
              />
            )}
            {deltaFromTop != null && (
              <StatRow
                label="vs. top operator"
                value={`${deltaFromTop > 0 ? "▼" : "▲"} ${Math.abs(deltaFromTop).toFixed(1)}%`}
              />
            )}
          </div>
        </div>

        {/* Build Archetype box — equal shape */}
        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          {/* Header */}
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

          {/* Description + why it matters */}
          {archetype && archCtx && (
            <>
              <p className="font-sans text-[12px] leading-relaxed text-text-secondary">
                {archetype.blurb}
              </p>
              <p className="font-sans text-[12px] leading-relaxed text-text-muted">
                {archCtx.why}
              </p>

              {/* Characteristics */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  Characteristics
                </span>
                <ul className="flex flex-col gap-0.5">
                  {archCtx.characteristics.map((ch, i) => (
                    <li key={i} className="font-mono text-[10px] leading-relaxed text-text-muted flex gap-1.5">
                      <span className="text-gold">▸</span>
                      <span>{ch}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Classification */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  How this archetype is classified
                </span>
                <span className="font-mono text-[10px] leading-relaxed text-text-muted">
                  {archetype.definedBy}
                </span>
              </div>

              {/* Bubble chart — leverage vs velocity, bubble size = construction */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">
                  Field composition — leverage vs velocity (bubble = construction)
                </span>
                <ArchetypeBubble boardRows={boardRows} operatorCodename={operatorCodename} />
              </div>
            </>
          )}

          {/* Archetype-relevant stats at bottom — the 3 defining axes */}
          {c && (
            <div className="mt-auto flex flex-col gap-1.5 border-t border-bg-border-subtle pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim mb-0.5">
                Cascade composition — the 3 defining axes
              </span>
              <StatRow
                label="Leverage (cache R / input)"
                value={c.leverage >= 1_000 ? `${(c.leverage / 1_000).toFixed(1)}K×` : `${c.leverage.toFixed(1)}×`}
                accent
              />
              <StatRow
                label="Velocity (output / input)"
                value={c.velocity >= 10 ? c.velocity.toFixed(1) : c.velocity.toFixed(2)}
              />
              <StatRow
                label="Construction (cache W / R)"
                value={c.construction.toFixed(3)}
              />
              <StatRow
                label="Υ Yield (R × O / I²)"
                value={c.yield_ >= 1_000 ? `${(c.yield_ / 1_000).toFixed(1)}K` : c.yield_.toFixed(1)}
                accent
              />
              <StatRow
                label="SNR (signal/noise)"
                value={`${(c.snr * 100).toFixed(1)}%`}
              />
              <StatRow
                label="$ / 1M tokens"
                value={`$${c.costPerMillion.toFixed(2)}`}
              />
            </div>
          )}
        </div>
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
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📈</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
            Cascade Trajectory
          </h3>
        </div>
        <OverviewChart history={history} fieldAvgYield={fieldAvgYield} />
      </div>
    </div>
  );
}
