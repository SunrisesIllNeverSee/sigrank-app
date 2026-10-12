/**
 * components/profile-v2/AnalysisView.tsx — the ANALYSIS tab for the v2 profile redesign.
 *
 * Data-dense comparison surface modeled on _workspace/profile-mocks/analysis.html:
 *
 *   1. TIER POSITION         — Υ yield vs total tokens field scatter (log10 x-axis),
 *                              dots color-coded by class tier, median crosshair,
 *                              operator highlighted with ring + label.
 *   2. ARCHETYPE FINGERPRINT — 3-axis triangle radar (leverage / velocity /
 *                              construction), operator polygon vs archetype template.
 *   3. VS FIELD              — grouped bars per cascade metric vs field median.
 *                              MEDIAN/TOP switch is a pure-CSS checkbox hack so the
 *                              component stays a server component.
 *   4. DELTA BREAKDOWN       — diverging log-normalized bars, % above/below median.
 *   5. HALL RECORDS          — all-time record trophy cards from the records prop.
 */

import Link from "next/link";
import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type {
  TelemetryRaw,
  LeaderboardRow,
  HistoryPoint,
  HallRecord,
} from "@/lib/board";
import type { FieldAverages } from "@/lib/analytics/field-average";
import type {
  BuildArchetype,
  BuildArchetypeKey,
} from "@/lib/analytics/build-archetypes";
import { tierOf, type TierName } from "@/components/sigrank/types";
import { sortValue } from "@/lib/analytics/sort-value";

export interface AnalysisViewProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  telemetry: TelemetryRaw;
  globalRank: number;
  topPct: number;
  ranked: boolean;
  archetype: BuildArchetype | null;
  fieldAvg: FieldAverages;
  boardRows: LeaderboardRow[]; // for scatter + comparisons
  history: HistoryPoint[];
  records: HallRecord[]; // operator's hall records
}

/* ── palette (CSS vars so the charts follow the active theme) ── */
const GOLD = "rgb(var(--gold))";
const ACCENT = "rgb(var(--accent))";
const VIOLET = "rgb(var(--rank-low))"; // violet accent on the dark themes
const UP = "#34d399";
const DOWN = "#f87171";
const MUTED = "rgb(var(--text-muted))";
const BORDER = "rgb(var(--bg-border))";
const SURF = "rgb(var(--bg-surface))";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/** Per-tier dot colors — the same --class-* tokens the leaderboard uses. */
const TIER_COLOR: Record<TierName | "TRANSMITTER", string> = {
  TRANSMITTER: "rgb(var(--class-transmitter))",
  "ARCH+": "rgb(var(--class-archplus))",
  ARCH: "rgb(var(--class-arch))",
  POWER: "rgb(var(--class-power))",
  BASE: "rgb(var(--class-base))",
  SEEKER: "rgb(var(--class-seeker))",
  REFINER: "rgb(var(--class-refiner))",
  BEARER: "rgb(var(--class-bearer))",
  IGNITER: "rgb(var(--class-igniter))",
};
const TIER_ORDER: (TierName | "TRANSMITTER")[] = [
  "TRANSMITTER",
  "ARCH+",
  "ARCH",
  "POWER",
  "BASE",
  "SEEKER",
  "REFINER",
  "BEARER",
  "IGNITER",
];

/* ── small format helpers ── */
const totalTokens = (t: TelemetryRaw): number =>
  t.fresh_input + t.output + t.cache_read + t.cache_create;

const fmtTok = (n: number): string =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `${(n / 1e3).toFixed(1)}K`
        : `${Math.round(n)}`;

const fmtYield = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n >= 100 ? n.toFixed(0) : n.toFixed(1);

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const fmtRecordDate = (d: string): string => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt
        .toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
        .toUpperCase();
};

/* ── shared chrome ── */
function Module({
  title,
  subtitle,
  tag,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-bg-border bg-bg-surface p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-bg-border pb-2.5">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-text-muted opacity-70">
              {subtitle}
            </p>
          )}
        </div>
        {tag}
      </div>
      {children}
    </section>
  );
}

function Tag({
  children,
  lit = false,
}: {
  children: React.ReactNode;
  lit?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] ${
        lit
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-bg-border bg-bg-elevated text-text-secondary"
      }`}
    >
      {children}
    </span>
  );
}

function PendingNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs leading-relaxed text-text-muted">
      {children}
    </p>
  );
}

/* ═══════════════ 1. TIER POSITION ═══════════════ */
interface ScatterPoint {
  codename: string;
  label: string;
  tokens: number;
  yield_: number;
  tier: TierName | "TRANSMITTER";
  isOp: boolean;
}

function TierPosition({
  operator,
  snapshot,
  telemetry,
  boardRows,
  ranked,
  globalRank,
  topPct,
}: {
  operator: Operator;
  snapshot: ScoredSnapshot;
  telemetry: TelemetryRaw;
  boardRows: LeaderboardRow[];
  ranked: boolean;
  globalRank: number;
  topPct: number;
}) {
  const pts: ScatterPoint[] = boardRows
    .filter(
      (r) =>
        !r.pending && r.snapshot.cascade && !r.snapshot.cascade.nonCompounding,
    )
    .map((r) => {
      const t = totalTokens(r.telemetry);
      return {
        codename: r.operator.codename,
        label: r.operator.display_name ?? r.operator.codename,
        tokens: t,
        yield_: r.snapshot.cascade!.yield_,
        tier: tierOf(r.snapshot.class_tier),
        isOp: r.operator.codename === operator.codename,
      };
    })
    .filter((p) => p.tokens > 0 && p.yield_ > 0);

  const c = snapshot.cascade;
  const opFromRows = pts.find((p) => p.isOp) ?? null;
  const op: ScatterPoint | null =
    opFromRows ??
    (ranked && c && !c.nonCompounding && totalTokens(telemetry) > 0
      ? {
          codename: operator.codename,
          label: operator.display_name ?? operator.codename,
          tokens: totalTokens(telemetry),
          yield_: c.yield_,
          tier: tierOf(snapshot.class_tier),
          isOp: true,
        }
      : null);

  const L = 56;
  const R = 812;
  const T = 10;
  const B = 182;

  if (pts.length < 3) {
    return (
      <Module
        title="Tier Position"
        subtitle="Yield vs total tokens"
        tag={<Tag>FIELD N={pts.length}</Tag>}
      >
        <PendingNote>
          Not enough field data to plot tier position yet.
        </PendingNote>
      </Module>
    );
  }

  const logs = pts.map((p) => Math.log10(p.tokens));
  const yields = pts.map((p) => p.yield_);
  const xLo = Math.max(0, Math.floor(Math.min(...logs)));
  const xHiRaw = Math.ceil(Math.max(...logs, Math.log10(op?.tokens ?? 1)));
  const xHi = xHiRaw <= xLo ? xLo + 1 : xHiRaw;
  const yMax = Math.max(10, Math.ceil(Math.max(...yields, op?.yield_ ?? 0) * 1.08));

  const xAt = (log: number): number =>
    L + ((log - xLo) / (xHi - xLo || 1)) * (R - L);
  const yAt = (v: number): number => B - (v / yMax) * (B - T);

  const medX = median(logs);
  const medY = median(yields);

  const xTicks: number[] = [];
  for (let i = xLo; i <= xHi; i++) xTicks.push(i);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  const tiersPresent = TIER_ORDER.filter((t) =>
    pts.some((p) => p.tier === t && !p.isOp),
  );

  const opX = op ? xAt(Math.log10(op.tokens)) : 0;
  const opY = op ? yAt(op.yield_) : 0;

  return (
    <Module
      title="Tier Position"
      subtitle="Yield vs total tokens"
      tag={<Tag>FIELD N={pts.length}</Tag>}
    >
      <svg
        viewBox="0 0 840 212"
        className="block h-auto w-full"
        role="img"
        aria-label="Scatter plot of yield versus total tokens for all operators, color coded by class tier"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {/* horizontal grid */}
        {yTicks.map((v, i) => (
          <line
            key={`gy-${i}`}
            x1={L}
            y1={yAt(v)}
            x2={R}
            y2={yAt(v)}
            stroke={BORDER}
            strokeWidth={0.5}
            strokeDasharray={i === 0 || i === yTicks.length - 1 ? undefined : "3 6"}
          />
        ))}
        {/* vertical grid */}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xAt(t)}
            y1={T}
            x2={xAt(t)}
            y2={B}
            stroke={BORDER}
            strokeWidth={0.5}
            strokeDasharray={t === xLo || t === xHi ? undefined : "3 6"}
          />
        ))}

        {/* field median crosshair */}
        {medX != null && (
          <>
            <line
              x1={xAt(medX)}
              y1={T}
              x2={xAt(medX)}
              y2={B}
              stroke={MUTED}
              strokeWidth={1}
              strokeDasharray="4 5"
              opacity={0.55}
            />
            <text
              x={xAt(medX) + 6}
              y={T + 7}
              fill={MUTED}
              fontFamily={MONO}
              fontSize={8}
              opacity={0.8}
            >
              MED {fmtTok(Math.pow(10, medX))}
            </text>
          </>
        )}
        {medY != null && (
          <>
            <line
              x1={L}
              y1={yAt(medY)}
              x2={R}
              y2={yAt(medY)}
              stroke={MUTED}
              strokeWidth={1}
              strokeDasharray="4 5"
              opacity={0.55}
            />
            <text
              x={R - 6}
              y={yAt(medY) - 4}
              textAnchor="end"
              fill={MUTED}
              fontFamily={MONO}
              fontSize={8}
              opacity={0.8}
            >
              MED {fmtYield(medY)}Υ
            </text>
          </>
        )}

        {/* axis labels */}
        {yTicks.map((v, i) => (
          <text
            key={`ly-${i}`}
            x={L - 8}
            y={yAt(v) + 3}
            textAnchor="end"
            fill={MUTED}
            fontFamily={MONO}
            fontSize={9}
            opacity={0.75}
          >
            {fmtYield(v)}
          </text>
        ))}
        {xTicks.map((t) => (
          <text
            key={`lx-${t}`}
            x={xAt(t)}
            y={B + 16}
            textAnchor="middle"
            fill={MUTED}
            fontFamily={MONO}
            fontSize={9}
            opacity={0.75}
          >
            {fmtTok(Math.pow(10, t))}
          </text>
        ))}
        <text
          x={(L + R) / 2}
          y={210}
          textAnchor="middle"
          fill={MUTED}
          fontFamily={MONO}
          fontSize={8}
          letterSpacing={0.8}
        >
          TOTAL TOKENS · LOG10
        </text>
        <text
          transform={`rotate(-90 12 ${(T + B) / 2})`}
          x={12}
          y={(T + B) / 2}
          textAnchor="middle"
          fill={MUTED}
          fontFamily={MONO}
          fontSize={8}
          letterSpacing={0.8}
        >
          YIELD Υ
        </text>

        {/* field dots */}
        {pts.map((p) =>
          p.isOp ? null : (
            <circle
              key={p.codename + p.tier}
              cx={xAt(Math.log10(p.tokens)).toFixed(1)}
              cy={yAt(p.yield_).toFixed(1)}
              r={3}
              fill={TIER_COLOR[p.tier] ?? MUTED}
              opacity={0.85}
            />
          ),
        )}

        {/* operator highlight */}
        {op && (
          <g>
            <circle
              cx={opX.toFixed(1)}
              cy={opY.toFixed(1)}
              r={15}
              fill="none"
              stroke={GOLD}
              strokeWidth={0.75}
              strokeDasharray="2 3"
              opacity={0.35}
            />
            <circle
              cx={opX.toFixed(1)}
              cy={opY.toFixed(1)}
              r={10}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.5}
            />
            <circle
              cx={opX.toFixed(1)}
              cy={opY.toFixed(1)}
              r={6}
              fill={VIOLET}
              stroke={GOLD}
              strokeWidth={1.5}
            />
            <text
              x={(opX > 560 ? opX - 17 : opX + 17).toFixed(1)}
              y={(opY - 8).toFixed(1)}
              textAnchor={opX > 560 ? "end" : "start"}
              fill="rgb(var(--text-primary))"
              fontFamily={MONO}
              fontSize={10}
              fontWeight={600}
            >
              {op.label}
            </text>
            <text
              x={(opX > 560 ? opX - 17 : opX + 17).toFixed(1)}
              y={(opY + 3).toFixed(1)}
              textAnchor={opX > 560 ? "end" : "start"}
              fill={MUTED}
              fontFamily={MONO}
              fontSize={8}
            >
              {fmtYield(op.yield_)}Υ · {fmtTok(op.tokens)}
            </text>
          </g>
        )}
      </svg>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-bg-border pt-2.5 font-mono text-[9px] uppercase tracking-[0.06em] text-text-muted">
        {tiersPresent.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <i
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: TIER_COLOR[t] }}
            />
            {t}
          </span>
        ))}
        {op && (
          <span className="inline-flex items-center gap-1.5">
            <i
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px]"
              style={{ background: VIOLET, borderColor: GOLD }}
            />
            THIS OPERATOR
          </span>
        )}
        <span className="flex-1" />
        {ranked && globalRank > 0 && (
          <span className="text-text-secondary">
            RANK #{globalRank} · TOP {topPct.toFixed(1)}%
          </span>
        )}
        <span className="opacity-70">DASHED = FIELD MEDIAN</span>
      </div>
    </Module>
  );
}

/* ═══════════════ 1b. HCM SIGNATURE ═══════════════ */
interface HcmPoint {
  codename: string;
  label: string;
  share: number; // fresh_input / total tokens — the HCM composition axis
  yield_: number;
  mode: "hitl" | "agentic" | "hybrid" | null;
  isOp: boolean;
}

const MODE_COLOR: Record<string, string> = {
  hitl: "rgb(var(--gold))",
  agentic: "rgb(var(--accent))",
  hybrid: "rgb(var(--violet, 168 85 247))",
};
const HCM_BOUNDARY = 0.8;

/**
 * HCM POSITION — the field plotted in the Human Center of Mass composition
 * space (fresh-input share of total tokens vs yield). The dashed boundary at
 * share = 0.8 is the documented HCM rule (resolveWorkflowMode): rows at or
 * below it resolve HITL unless the deep-reuse fallback applies. Points are
 * colored by their RESOLVED workflow cohort on the same all-time board
 * population as TierPosition — no window or cohort mixing.
 */
function HcmSignature({
  operator,
  snapshot,
  telemetry,
  boardRows,
  ranked,
}: {
  operator: Operator;
  snapshot: ScoredSnapshot;
  telemetry: TelemetryRaw;
  boardRows: LeaderboardRow[];
  ranked: boolean;
}) {
  const total = (t: TelemetryRaw) =>
    t.fresh_input + t.output + t.cache_read + t.cache_create;

  const pts: HcmPoint[] = boardRows
    .filter(
      (r) =>
        !r.pending && r.snapshot.cascade && !r.snapshot.cascade.nonCompounding,
    )
    .map((r) => {
      const t = total(r.telemetry);
      return {
        codename: r.operator.codename,
        label: r.operator.display_name ?? r.operator.codename,
        share: t > 0 ? r.telemetry.fresh_input / t : 0,
        yield_: r.snapshot.cascade!.yield_,
        mode: r.workflow_mode ?? null,
        isOp: r.operator.codename === operator.codename,
      };
    })
    .filter((p) => p.share > 0 && p.yield_ > 0);

  const c = snapshot.cascade;
  const opTotal = total(telemetry);
  const opFromRows = pts.find((p) => p.isOp) ?? null;
  const op: HcmPoint | null =
    opFromRows ??
    (ranked && c && !c.nonCompounding && opTotal > 0
      ? {
          codename: operator.codename,
          label: operator.display_name ?? operator.codename,
          share: telemetry.fresh_input / opTotal,
          yield_: c.yield_,
          mode: null,
          isOp: true,
        }
      : null);

  const L = 56;
  const R = 812;
  const T = 10;
  const B = 182;

  if (pts.length < 3) {
    return (
      <Module
        title="HCM Position"
        subtitle="Workflow signature · Human Center of Mass rule"
        tag={<Tag>FIELD N={pts.length}</Tag>}
      >
        <PendingNote>
          Not enough field data to plot the workflow signature yet.
        </PendingNote>
      </Module>
    );
  }

  const yields = pts.map((p) => p.yield_);
  const yMax = Math.max(10, Math.ceil(Math.max(...yields, op?.yield_ ?? 0) * 1.08));
  const xAt = (share: number): number => L + share * (R - L);
  const yAt = (v: number): number => B - (v / yMax) * (B - T);
  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  const opX = op ? xAt(op.share) : 0;
  const opY = op ? yAt(op.yield_) : 0;
  const opVelocity =
    opTotal > 0 && telemetry.fresh_input > 0
      ? telemetry.output / telemetry.fresh_input
      : null;
  const opMode = op?.mode ?? null;
  const inHcm = op != null && op.share <= HCM_BOUNDARY;

  return (
    <Module
      title="HCM Position"
      subtitle="Workflow signature · Human Center of Mass composition rule"
      tag={<Tag>FIELD N={pts.length}</Tag>}
    >
      <svg
        viewBox="0 0 840 212"
        className="block h-auto w-full"
        role="img"
        aria-label="Scatter plot of fresh-input share versus yield for all operators, color coded by resolved workflow cohort, with the HCM composition boundary at 0.8 input share"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {/* HCM cohort region (share ≤ 0.8) */}
        <rect
          x={L}
          y={T}
          width={xAt(HCM_BOUNDARY) - L}
          height={B - T}
          fill={GOLD}
          opacity={0.035}
        />
        {/* horizontal grid */}
        {yTicks.map((v, i) => (
          <line
            key={`gy-${i}`}
            x1={L}
            y1={yAt(v)}
            x2={R}
            y2={yAt(v)}
            stroke={BORDER}
            strokeWidth={0.5}
            strokeDasharray={i === 0 || i === yTicks.length - 1 ? undefined : "3 6"}
          />
        ))}
        {/* vertical grid */}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xAt(t)}
            y1={T}
            x2={xAt(t)}
            y2={B}
            stroke={BORDER}
            strokeWidth={0.5}
            strokeDasharray={t === 0 || t === 1 ? undefined : "3 6"}
          />
        ))}

        {/* HCM composition boundary */}
        <line
          x1={xAt(HCM_BOUNDARY)}
          y1={T}
          x2={xAt(HCM_BOUNDARY)}
          y2={B}
          stroke={GOLD}
          strokeWidth={1}
          strokeDasharray="4 5"
          opacity={0.8}
        />
        <text
          x={xAt(HCM_BOUNDARY) - 6}
          y={T + 7}
          textAnchor="end"
          fill={GOLD}
          fontFamily={MONO}
          fontSize={8}
          opacity={0.9}
        >
          HCM ≤ 0.80
        </text>

        {/* axis labels */}
        {yTicks.map((v, i) => (
          <text
            key={`ly-${i}`}
            x={L - 8}
            y={yAt(v) + 3}
            textAnchor="end"
            fill={MUTED}
            fontFamily={MONO}
            fontSize={9}
            opacity={0.75}
          >
            {fmtYield(v)}
          </text>
        ))}
        {xTicks.map((t) => (
          <text
            key={`lx-${t}`}
            x={xAt(t)}
            y={B + 16}
            textAnchor="middle"
            fill={MUTED}
            fontFamily={MONO}
            fontSize={9}
            opacity={0.75}
          >
            {t.toFixed(1)}
          </text>
        ))}
        <text
          x={(L + R) / 2}
          y={210}
          textAnchor="middle"
          fill={MUTED}
          fontFamily={MONO}
          fontSize={8}
          letterSpacing={0.8}
        >
          FRESH-INPUT SHARE OF TOTAL TOKENS
        </text>
        <text
          transform={`rotate(-90 12 ${(T + B) / 2})`}
          x={12}
          y={(T + B) / 2}
          textAnchor="middle"
          fill={MUTED}
          fontFamily={MONO}
          fontSize={8}
          letterSpacing={0.8}
        >
          YIELD Υ
        </text>

        {/* field dots by resolved cohort */}
        {pts.map((p) =>
          p.isOp ? null : (
            <circle
              key={p.codename}
              cx={xAt(p.share).toFixed(1)}
              cy={yAt(p.yield_).toFixed(1)}
              r={3}
              fill={p.mode ? (MODE_COLOR[p.mode] ?? MUTED) : MUTED}
              opacity={p.mode ? 0.85 : 0.4}
            />
          ),
        )}

        {/* operator highlight */}
        {op && (
          <g>
            <circle
              cx={opX.toFixed(1)}
              cy={opY.toFixed(1)}
              r={15}
              fill="none"
              stroke={GOLD}
              strokeWidth={0.75}
              strokeDasharray="2 3"
              opacity={0.35}
            />
            <circle
              cx={opX.toFixed(1)}
              cy={opY.toFixed(1)}
              r={10}
              fill="none"
              stroke={GOLD}
              strokeWidth={1.5}
            />
            <circle
              cx={opX.toFixed(1)}
              cy={opY.toFixed(1)}
              r={6}
              fill={VIOLET}
              stroke={GOLD}
              strokeWidth={1.5}
            />
            <text
              x={(opX > 560 ? opX - 17 : opX + 17).toFixed(1)}
              y={(opY - 8).toFixed(1)}
              textAnchor={opX > 560 ? "end" : "start"}
              fill="rgb(var(--text-primary))"
              fontFamily={MONO}
              fontSize={10}
              fontWeight={600}
            >
              {op.label}
            </text>
            <text
              x={(opX > 560 ? opX - 17 : opX + 17).toFixed(1)}
              y={(opY + 3).toFixed(1)}
              textAnchor={opX > 560 ? "end" : "start"}
              fill={MUTED}
              fontFamily={MONO}
              fontSize={8}
            >
              {(op.share * 100).toFixed(1)}% IN · {fmtYield(op.yield_)}Υ
            </text>
          </g>
        )}
      </svg>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-bg-border pt-2.5 font-mono text-[9px] uppercase tracking-[0.06em] text-text-muted">
        {(["hitl", "agentic", "hybrid"] as const)
          .filter((m) => pts.some((p) => p.mode === m && !p.isOp))
          .map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5">
              <i
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: MODE_COLOR[m] }}
              />
              {m === "hitl" ? "HITL" : m === "agentic" ? "AGENTIC" : "HYBRID"}
            </span>
          ))}
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: MUTED, opacity: 0.4 }} />
          UNRESOLVED
        </span>
        {op && (
          <span className="inline-flex items-center gap-1.5">
            <i
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px]"
              style={{ background: VIOLET, borderColor: GOLD }}
            />
            THIS OPERATOR
          </span>
        )}
        <span className="flex-1" />
        {op && (
          <span className="text-text-secondary">
            SHARE {(op.share * 100).toFixed(1)}%{opVelocity != null ? ` · VEL ${opVelocity.toFixed(1)}` : ""} · {inHcm ? "INSIDE HCM" : "OUTSIDE HCM"}
            {opMode ? ` · ${opMode.toUpperCase()}` : " · UNRESOLVED"}
          </span>
        )}
        <span className="opacity-70">DASHED GOLD = HCM BOUNDARY</span>
      </div>
    </Module>
  );
}

/* ═══════════════ 2. ARCHETYPE FINGERPRINT ═══════════════ */
interface FpAxes {
  leverage: number;
  velocity: number;
  construction: number;
}

/**
 * Archetype template shapes in the same normalized space as the radar
 * (leverage is log-scaled, velocity + construction linear-clamped).
 */
const ARCHETYPE_TEMPLATE: Record<
  BuildArchetypeKey,
  { lev: number; vel: number; constr: number }
> = {
  convergent: { lev: 0.75, vel: 0.85, constr: 0.55 },
  kinetic: { lev: 0.4, vel: 0.9, constr: 0.25 },
  "input-bound": { lev: 0.15, vel: 0.4, constr: 0.05 },
  priming: { lev: 0.25, vel: 0.4, constr: 0.05 },
  contextual: { lev: 0.35, vel: 0.4, constr: 0.05 },
  "deep-reader": { lev: 0.45, vel: 0.4, constr: 0.06 },
  archivist: { lev: 0.55, vel: 0.4, constr: 0.06 },
  builder: { lev: 0.3, vel: 0.4, constr: 0.35 },
  recursive: { lev: 0.5, vel: 0.45, constr: 0.4 },
  amplifier: { lev: 0.65, vel: 0.5, constr: 0.45 },
};

const normAxes = (a: FpAxes) => ({
  // leverage spans orders of magnitude → log-normalize (≈3.2k → 1.0)
  lev: clamp01(Math.log10(1 + a.leverage) / 3.5),
  vel: clamp01(a.velocity),
  constr: clamp01(a.construction / 0.1),
});

function ArchetypeFingerprint({
  archetype,
  telemetry,
}: {
  archetype: BuildArchetype | null;
  telemetry: TelemetryRaw;
}) {
  // describeBuildArchetype() result also satisfies this shape — read axes off it
  // when present so the fingerprint matches the classifier exactly.
  const embedded = (
    archetype as unknown as { axes?: FpAxes } | null
  )?.axes;
  const computed: FpAxes | null =
    telemetry.fresh_input > 0 && telemetry.cache_read > 0
      ? {
          leverage: telemetry.cache_read / telemetry.fresh_input,
          velocity: telemetry.output / telemetry.fresh_input,
          construction: telemetry.cache_create / telemetry.cache_read,
        }
      : null;
  const axes = embedded ?? computed;

  if (!archetype || !axes) {
    return (
      <Module title="Archetype Fingerprint" subtitle="Leverage × velocity × construction">
        <PendingNote>
          Fingerprint resolves after the first verified cascade submission.
        </PendingNote>
      </Module>
    );
  }

  const blurb =
    "blurb" in archetype
      ? archetype.blurb
      : ((archetype as unknown as { description?: string }).description ?? "");

  const op = normAxes(axes);
  const tpl = ARCHETYPE_TEMPLATE[archetype.key] ?? ARCHETYPE_TEMPLATE.contextual;
  const match = Math.round(
    100 * (1 - (Math.abs(op.lev - tpl.lev) + Math.abs(op.vel - tpl.vel) + Math.abs(op.constr - tpl.constr)) / 3),
  );

  // Triangle geometry — centre (100,88), R=70. Top=Leverage, BR=Velocity, BL=Construction.
  const CX = 100;
  const CY = 88;
  const R = 70;
  const V = {
    lev: { x: CX, y: CY - R },
    vel: { x: CX + R * Math.cos(Math.PI / 6), y: CY + R * Math.sin(Math.PI / 6) },
    constr: { x: CX - R * Math.cos(Math.PI / 6), y: CY + R * Math.sin(Math.PI / 6) },
  };
  const pt = (v: { x: number; y: number }, f: number): string =>
    `${(CX + (v.x - CX) * f).toFixed(1)},${(CY + (v.y - CY) * f).toFixed(1)}`;
  const poly = (f: { lev: number; vel: number; constr: number }): string =>
    `${pt(V.lev, f.lev)} ${pt(V.vel, f.vel)} ${pt(V.constr, f.constr)}`;

  const axisRows = [
    { name: "Leverage", op: op.lev, tpl: tpl.lev, val: axes.leverage >= 100 ? axes.leverage.toLocaleString("en-US", { maximumFractionDigits: 0 }) : axes.leverage.toFixed(1) },
    { name: "Velocity", op: op.vel, tpl: tpl.vel, val: axes.velocity.toFixed(2) },
    { name: "Construction", op: op.constr, tpl: tpl.constr, val: axes.construction.toFixed(3) },
  ];

  return (
    <Module
      title="Archetype Fingerprint"
      subtitle="Leverage × velocity × construction"
      tag={<Tag lit>{archetype.name}</Tag>}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        <div className="flex shrink-0 items-center justify-center sm:w-60">
          <svg
            viewBox="0 0 200 175"
            className="block h-[180px] w-[220px]"
            role="img"
            aria-label={`Triangular radar comparing operator fingerprint to the ${archetype.name} archetype template`}
          >
            {[1, 0.75, 0.5, 0.25].map((f) => (
              <polygon
                key={f}
                points={poly({ lev: f, vel: f, constr: f })}
                fill="none"
                stroke={BORDER}
                strokeWidth={0.75}
              />
            ))}
            <path
              d={`M${CX} ${CY}V${V.lev.y}M${CX} ${CY}L${V.vel.x.toFixed(1)} ${V.vel.y.toFixed(1)}M${CX} ${CY}L${V.constr.x.toFixed(1)} ${V.constr.y.toFixed(1)}`}
              stroke={BORDER}
              strokeWidth={0.75}
            />
            <polygon
              points={poly(tpl)}
              fill="rgba(167,139,250,0.10)"
              stroke={VIOLET}
              strokeWidth={1.25}
              strokeDasharray="5 3"
            />
            <polygon
              points={poly(op)}
              fill="rgb(var(--gold) / 0.14)"
              stroke={GOLD}
              strokeWidth={1.75}
              strokeLinejoin="round"
            />
            {[V.lev, V.vel, V.constr].map((v, i) => {
              const f = [op.lev, op.vel, op.constr][i];
              return (
                <circle
                  key={i}
                  cx={(CX + (v.x - CX) * f).toFixed(1)}
                  cy={(CY + (v.y - CY) * f).toFixed(1)}
                  r={3}
                  fill={SURF}
                  stroke={GOLD}
                  strokeWidth={1.5}
                />
              );
            })}
            <text x={CX} y={10} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={8} letterSpacing={0.8}>
              LEVERAGE
            </text>
            <text x={166} y={140} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={8} letterSpacing={0.8}>
              VELOCITY
            </text>
            <text x={34} y={140} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={8} letterSpacing={0.8}>
              CONSTRUCTION
            </text>
          </svg>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
          <div className="flex items-center gap-2 font-mono text-[15px] font-bold tracking-[0.06em]" style={{ color: VIOLET }}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <polygon points="6,0 12,6 6,12 0,6" fill="currentColor" />
            </svg>
            {archetype.name}
            <span className="rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gold">
              {match}% MATCH
            </span>
          </div>
          {blurb && (
            <p className="max-w-[46ch] text-xs leading-relaxed text-text-secondary">
              {blurb}
            </p>
          )}
          <div className="mt-0.5 flex flex-col gap-1.5">
            {axisRows.map((a) => (
              <div
                key={a.name}
                className="grid grid-cols-[92px_1fr_52px] items-center gap-2.5 font-mono text-[9px]"
              >
                <span className="uppercase tracking-[0.06em] text-text-muted">
                  {a.name}
                </span>
                <span className="relative h-1 overflow-hidden rounded-sm bg-bg-border">
                  <i
                    className="absolute inset-y-0 left-0 rounded-sm bg-gold"
                    style={{ width: `${(a.op * 100).toFixed(1)}%` }}
                  />
                  <i
                    className="absolute inset-y-0 w-[1.5px]"
                    style={{ left: `${(a.tpl * 100).toFixed(1)}%`, background: VIOLET }}
                  />
                </span>
                <span className="text-right tabular-nums text-text-secondary">
                  {a.val}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3.5 font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted">
            <span>
              <i className="mr-1.5 inline-block w-3.5 border-t-2 align-middle" style={{ borderColor: GOLD }} />
              OPERATOR
            </span>
            <span>
              <i className="mr-1.5 inline-block w-3.5 border-t-2 border-dashed align-middle" style={{ borderColor: VIOLET }} />
              {archetype.name} TEMPLATE
            </span>
          </div>
        </div>
      </div>
    </Module>
  );
}

/* ═══════════════ 3. VS FIELD ═══════════════ */
type VsKey =
  | "yield_"
  | "snr"
  | "velocity"
  | "leverage"
  | "dev10x"
  | "scaleV"
  | "efficiency";

const VS_METRICS: {
  key: VsKey;
  label: string;
  color: string;
  fmt: (v: number) => string;
}[] = [
  { key: "yield_", label: "Yield", color: GOLD, fmt: (v) => `${fmtYield(v)}Υ` },
  { key: "snr", label: "SNR", color: ACCENT, fmt: (v) => v.toFixed(3) },
  { key: "velocity", label: "Velocity", color: "#fb923c", fmt: (v) => v.toFixed(2) },
  { key: "leverage", label: "Leverage", color: VIOLET, fmt: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toLocaleString("en-US", { maximumFractionDigits: 1 }) },
  { key: "dev10x", label: "10xDEV", color: "#60a5fa", fmt: (v) => v.toFixed(2) },
  { key: "scaleV", label: "Scale V", color: "#facc15", fmt: (v) => v.toFixed(2) },
  { key: "efficiency", label: "Efficiency", color: "rgb(var(--text-secondary))", fmt: (v) => fmtYield(v) },
];

function VsField({
  operator,
  snapshot,
  fieldAvg,
  boardRows,
}: {
  operator: Operator;
  snapshot: ScoredSnapshot;
  fieldAvg: FieldAverages;
  boardRows: LeaderboardRow[];
}) {
  const c = snapshot.cascade;
  if (!c) {
    return (
      <Module title="Vs Field" subtitle="Percentile breakdown">
        <PendingNote>
          Percentile comparison unlocks after the first verified cascade submission.
        </PendingNote>
      </Module>
    );
  }

  const opVal = (key: VsKey): number | null => {
    switch (key) {
      case "yield_": return c.yield_;
      case "snr": return c.snr;
      case "velocity": return c.velocity;
      case "leverage": return c.leverage;
      case "dev10x": return c.dev10x;
      case "scaleV": return c.scaleV;
      case "efficiency": return c.efficiency;
    }
  };

  const rows = VS_METRICS.map((m) => {
    const op = opVal(m.key);
    const med = fieldAvg[m.key];
    if (op == null) return null;
    // Sort-equivalent value for the operator's own metric — non-compounding
    // yield/leverage sorts below the compounding field, matching sortValue().
    const opSort =
      c.nonCompounding && (m.key === "yield_" || m.key === "leverage")
        ? -1
        : op;
    let best = -Infinity;
    let bestRow: LeaderboardRow | null = null;
    let rank = 1;
    for (const r of boardRows) {
      if (r.pending) continue;
      const v = sortValue(r, m.key);
      if (v > best) {
        best = v;
        bestRow = r;
      }
      if (v > opSort) rank++;
    }
    const n = boardRows.filter((r) => !r.pending).length || 1;
    const pct = Math.min(100, Math.max(0, ((n - rank + 1) / n) * 100));
    const topName = bestRow
      ? (bestRow.operator.display_name ?? bestRow.operator.codename)
      : null;
    const topIsSelf = bestRow?.operator.codename === operator.codename;
    return { m, op, med, rank, pct, best, topName, topIsSelf };
  }).filter((r): r is NonNullable<typeof r> => r != null);

  if (!rows.length) {
    return (
      <Module title="Vs Field" subtitle="Percentile breakdown">
        <PendingNote>No comparable cascade metrics on this snapshot.</PendingNote>
      </Module>
    );
  }

  const n = boardRows.filter((r) => !r.pending).length;

  return (
    <Module
      title="Vs Field"
      subtitle="Percentile breakdown"
      className="[&:has(.vs-cb:checked)_.vs-med]:hidden [&:has(.vs-cb:checked)_.vs-top]:flex [&:has(.vs-cb:checked)_.vs-lab-med]:border-bg-border [&:has(.vs-cb:checked)_.vs-lab-med]:bg-transparent [&:has(.vs-cb:checked)_.vs-lab-med]:text-text-muted [&:has(.vs-cb:checked)_.vs-lab-top]:border-gold/50 [&:has(.vs-cb:checked)_.vs-lab-top]:bg-gold/10 [&:has(.vs-cb:checked)_.vs-lab-top]:text-gold"
      tag={
        <span className="flex items-center gap-1">
          <input
            id="vs-field-mode"
            type="checkbox"
            className="vs-cb sr-only"
            aria-label="Toggle comparison reference between field median and top operator"
          />
          <label
            htmlFor="vs-field-mode"
            className="vs-lab-med cursor-pointer select-none rounded border border-gold/50 bg-gold/10 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-gold transition-colors"
          >
            vs median
          </label>
          <label
            htmlFor="vs-field-mode"
            className="vs-lab-top cursor-pointer select-none rounded border border-bg-border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-text-muted transition-colors"
          >
            vs top
          </label>
        </span>
      }
    >
      <div className="flex flex-col">
        {rows.map(({ m, op, med, rank, pct, best, topName, topIsSelf }) => {
          const medDenom = Math.max(op, med ?? 0, 1e-9);
          const topDenom = Math.max(op, best > 0 ? best : op, 1e-9);
          const pctLabel = pct >= 99.95 ? "100" : pct.toFixed(1);
          const pctColor =
            rank === 1
              ? "rgb(var(--rank-1))"
              : rank === 2
                ? "rgb(var(--rank-2))"
                : rank === 3
                  ? "rgb(var(--rank-3))"
                  : "rgb(var(--rank-low))";
          return (
            <div
              key={m.key}
              className="grid grid-cols-[72px_1fr_48px] items-center gap-3 border-b border-bg-border-subtle py-2.5 last:border-0 sm:grid-cols-[88px_1fr_58px]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-secondary">
                {m.label}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                {/* operator bar */}
                <span className="flex items-center gap-2">
                  <span className="relative h-[9px] flex-1">
                    <i
                      className="block h-full rounded-sm"
                      style={{
                        width: `${Math.max((op / medDenom) * 100, 1.5)}%`,
                        background: m.color,
                      }}
                    />
                  </span>
                  <span className="w-[88px] shrink-0 font-mono text-[9px] tabular-nums text-text-primary sm:w-[108px]">
                    {m.fmt(op)}
                  </span>
                </span>
                {/* median ref bar (visible in MEDIAN mode) */}
                <span className="vs-med flex items-center gap-2">
                  <span className="relative h-[5px] flex-1">
                    <i
                      className="block h-full rounded-sm"
                      style={{
                        width: `${med != null ? Math.max((med / medDenom) * 100, 1.5) : 0}%`,
                        background: MUTED,
                        opacity: 0.55,
                      }}
                    />
                  </span>
                  <span className="w-[88px] shrink-0 font-mono text-[8px] tabular-nums text-text-muted sm:w-[108px]">
                    {med != null ? `${m.fmt(med)} MED` : "— MED"}
                  </span>
                </span>
                {/* top ref bar (visible in TOP mode) */}
                <span className="vs-top hidden items-center gap-2">
                  <span className="relative h-[5px] flex-1">
                    <i
                      className="block h-full rounded-sm"
                      style={{
                        width: `${best > 0 ? Math.max((best / topDenom) * 100, 1.5) : 0}%`,
                        background: MUTED,
                        opacity: 0.55,
                      }}
                    />
                  </span>
                  <span className="w-[88px] shrink-0 truncate font-mono text-[8px] tabular-nums text-text-muted sm:w-[108px]">
                    {topIsSelf
                      ? "SELF"
                      : best > 0 && topName
                        ? `${m.fmt(best)} · ${topName.toUpperCase()}`
                        : "—"}
                  </span>
                </span>
              </span>
              <span
                className="text-right font-mono text-[11px] font-bold tabular-nums"
                style={{ color: pctColor }}
              >
                {pctLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-bg-border pt-2.5 font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted">
        <span className="vs-med">REF = FIELD MEDIAN · N={n}</span>
        <span className="vs-top hidden">REF = #1 OPERATOR PER METRIC · SELF WHERE HELD</span>
        <span className="opacity-70">
          RANK COLOR:{" "}
          <span style={{ color: "rgb(var(--rank-1))" }}>TOP 1</span> ·{" "}
          <span style={{ color: "rgb(var(--rank-2))" }}>TOP 2</span> ·{" "}
          <span style={{ color: "rgb(var(--rank-3))" }}>TOP 3</span> ·{" "}
          <span style={{ color: "rgb(var(--rank-low))" }}>FIELD</span>
        </span>
      </div>
    </Module>
  );
}

/* ═══════════════ 4. DELTA BREAKDOWN ═══════════════ */
function DeltaBreakdown({
  snapshot,
  fieldAvg,
}: {
  snapshot: ScoredSnapshot;
  fieldAvg: FieldAverages;
}) {
  const c = snapshot.cascade;
  if (!c) {
    return (
      <Module title="Delta Breakdown" subtitle="Above / below field median" tag={<Tag>LOG10 SCALE</Tag>}>
        <PendingNote>
          Delta breakdown unlocks after the first verified cascade submission.
        </PendingNote>
      </Module>
    );
  }

  const rows: { label: string; delta: number }[] = [];
  const push = (label: string, op: number | null, med: number | null) => {
    if (op == null || med == null || med <= 0) return;
    rows.push({ label, delta: ((op - med) / med) * 100 });
  };

  push("Yield", c.yield_, fieldAvg.yield_);
  push("SNR", c.snr, fieldAvg.snr);
  push("Velocity", c.velocity, fieldAvg.velocity);
  push("Leverage", c.leverage, fieldAvg.leverage);
  push("10xDEV", c.dev10x, fieldAvg.dev10x);
  push("Scale V", c.scaleV, fieldAvg.scaleV);
  push("Efficiency", c.efficiency, fieldAvg.efficiency);

  // Op Ratio = leverage × velocity product vs the field's mean ratio product.
  const opProduct = c.leverage * c.velocity;
  const medProduct =
    fieldAvg.crRatio != null && fieldAvg.outRatio != null
      ? fieldAvg.crRatio * fieldAvg.outRatio
      : null;
  push("Op Ratio", opProduct, medProduct);

  if (!rows.length) {
    return (
      <Module title="Delta Breakdown" subtitle="Above / below field median" tag={<Tag>LOG10 SCALE</Tag>}>
        <PendingNote>No field medians available for comparison.</PendingNote>
      </Module>
    );
  }

  const maxW = Math.max(...rows.map((r) => Math.log10(1 + Math.abs(r.delta))), 1e-9);
  const sorted = [...rows].sort(
    (a, z) => Math.log10(1 + Math.abs(z.delta)) - Math.log10(1 + Math.abs(a.delta)),
  );
  const above = rows.filter((r) => r.delta >= 0).length;

  const fmtDelta = (d: number): string => {
    const abs = Math.abs(d);
    const body = abs >= 100 ? Math.round(abs).toLocaleString("en-US") : abs.toFixed(abs >= 10 ? 0 : 1);
    return `${d >= 0 ? "+" : "−"}${body}%`;
  };

  return (
    <Module
      title="Delta Breakdown"
      subtitle="Above / below field median"
      tag={<Tag>LOG10 SCALE</Tag>}
    >
      <div className="flex flex-col">
        {sorted.map((r) => {
          const w = (Math.log10(1 + Math.abs(r.delta)) / maxW) * 100;
          const pos = r.delta >= 0;
          return (
            <div
              key={r.label}
              className="grid grid-cols-[72px_1fr_64px] items-center gap-3 py-1.5 sm:grid-cols-[88px_1fr_64px]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-secondary">
                {r.label}
              </span>
              <span className="relative h-3.5">
                <i
                  className={`absolute -bottom-[3px] -top-[3px] ${
                    pos ? "left-0 border-l" : "right-0 border-r"
                  } border-bg-border`}
                />
                <i
                  className={`absolute top-0 h-full ${
                    pos
                      ? "left-0 rounded-r-sm bg-gradient-to-r from-emerald-400/40 to-emerald-400"
                      : "right-0 rounded-l-sm bg-gradient-to-l from-red-400/40 to-red-400"
                  }`}
                  style={{ width: `${Math.max(w, 2)}%` }}
                />
              </span>
              <span
                className={`text-right font-mono text-[10px] font-bold tabular-nums ${
                  pos ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {fmtDelta(r.delta)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-bg-border pt-2.5 font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted">
        <span>
          <i className="mb-px mr-1.5 inline-block h-2 w-2.5 rounded-[1px] align-middle" style={{ background: UP }} />
          ABOVE MEDIAN{"  "}·{"  "}
          <i className="mb-px mr-1.5 inline-block h-2 w-2.5 rounded-[1px] align-middle" style={{ background: DOWN }} />
          BELOW
        </span>
        <span className="opacity-70">
          {above}/{rows.length} METRICS ABOVE FIELD MEDIAN
        </span>
      </div>
    </Module>
  );
}

/* ═══════════════ 5. HALL RECORDS ═══════════════ */
function MedalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="rgb(var(--rank-1))" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="6" fill="rgb(var(--rank-1))" opacity="0.15" />
      <text x="10" y="13.5" textAnchor="middle" fill="rgb(var(--rank-1))" fontFamily={MONO} fontSize="8" fontWeight="700">
        1
      </text>
    </svg>
  );
}

function HallRecordsModule({ records }: { records: HallRecord[] }) {
  const shown = records.slice(0, 3);
  return (
    <Module
      title="Hall Records"
      subtitle="All-time"
      tag={
        <span
          className="inline-flex items-center whitespace-nowrap rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em]"
          style={{
            borderColor: "rgb(var(--rank-1) / 0.4)",
            color: "rgb(var(--rank-1))",
          }}
        >
          {records.length} HELD
        </span>
      }
    >
      {shown.length === 0 ? (
        <PendingNote>No all-time records held yet.</PendingNote>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {shown.map((r) => (
            <div
              key={r.reward_id}
              className="relative flex flex-col gap-2 overflow-hidden rounded-md border bg-bg-elevated px-3.5 py-3"
              style={{ borderColor: "rgb(var(--rank-1) / 0.3)" }}
            >
              <div className="flex items-center justify-between">
                <MedalIcon />
                <span
                  className="whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[7px] font-bold tracking-[0.1em]"
                  style={{
                    borderColor: "rgb(var(--rank-1) / 0.45)",
                    background: "rgb(var(--rank-1) / 0.1)",
                    color: "rgb(var(--rank-1))",
                  }}
                >
                  CURRENT RECORD
                </span>
              </div>
              <div>
                <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-text-muted">
                  {r.title}
                </div>
                <div
                  className="font-mono text-[22px] font-bold leading-[1.05] tabular-nums"
                  style={{ color: "rgb(var(--rank-1))" }}
                >
                  {r.value}
                </div>
              </div>
              <div className="font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted">
                SET {fmtRecordDate(r.date)} · {r.reward_id}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-bg-border pt-2.5">
        <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted">
          {records.length} ALL-TIME RECORDS HELD
        </span>
        <Link
          href="/hall"
          className="rounded border border-bg-border px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
        >
          View all records →
        </Link>
      </div>
    </Module>
  );
}

/* ═══════════════ VIEW ═══════════════ */
export function AnalysisView({
  operator,
  snapshot,
  telemetry,
  globalRank,
  topPct,
  ranked,
  archetype,
  fieldAvg,
  boardRows,
  records,
}: AnalysisViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <TierPosition
        operator={operator}
        snapshot={snapshot}
        telemetry={telemetry}
        boardRows={boardRows}
        ranked={ranked}
        globalRank={globalRank}
        topPct={topPct}
      />
      <HcmSignature
        operator={operator}
        snapshot={snapshot}
        telemetry={telemetry}
        boardRows={boardRows}
        ranked={ranked}
      />
      <ArchetypeFingerprint archetype={archetype} telemetry={telemetry} />
      <VsField
        operator={operator}
        snapshot={snapshot}
        fieldAvg={fieldAvg}
        boardRows={boardRows}
      />
      <DeltaBreakdown snapshot={snapshot} fieldAvg={fieldAvg} />
      <HallRecordsModule records={records} />
    </div>
  );
}
