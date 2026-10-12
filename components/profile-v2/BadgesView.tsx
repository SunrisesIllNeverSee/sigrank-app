/**
 * components/profile-v2/BadgesView.tsx — dedicated "Badges" tab for the
 * /user/[codename] profile page.
 *
 * Two surfaces:
 *   1. BADGES EARNED — the same derivation as SocialView's badge module
 *      (metric-rank badges from live trophy counts, class badge, verified
 *      identity, Hall-of-Signal record holder) plus the earn criteria on
 *      each card. Locked cells stay visible at reduced opacity.
 *   2. ACHIEVEMENTS — progress-backed milestones computed from real rules:
 *      the 24-class RS-0.5 token ladder (current class, progress % to the
 *      next class, locked classes above), the 500-snapshot milestone, and
 *      unheld #1 metric records. Nothing is fabricated — every threshold
 *      comes from RS05_CLASS_THRESHOLDS or live trophy data.
 */

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { HallRecord } from "@/lib/board";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import type { TierProgress } from "@/lib/analytics/tier-progress";
import { RS05_CLASS_THRESHOLDS } from "@/lib/analytics/ruleset";

const fmtRecordDate = (d: string): string => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt
        .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        .toUpperCase();
};

function Module({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-bg-border bg-bg-surface p-5">
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
      </div>
      {children}
    </section>
  );
}

const MUTED = "rgb(var(--text-muted))";
const ACCENT = "rgb(var(--accent))";
const SNAPSHOT_MILESTONE = 500;

interface BadgeDef {
  rank: string;
  name: string;
  criteria: string;
  detail?: string;
  color: string;
  locked?: boolean;
  progressPct?: number;
}

function compact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export interface BadgesViewProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  records: HallRecord[];
  trophyCounts: TrophyCounts | null;
  tierProgress: TierProgress | null;
  /** Scored snapshots on record (snapshot_submissions rows). */
  scoredSnapshots: number;
}

export function BadgesView({
  operator,
  snapshot,
  records,
  trophyCounts,
  tierProgress,
  scoredSnapshots,
}: BadgesViewProps) {
  /* ── Badge derivation — same rules as SocialView ─────────────── */
  const badges: BadgeDef[] = [];
  const dyn = trophyCounts?.dynamicRecords ?? [];

  for (const r of dyn) {
    badges.push({
      rank: `#${r.rank}`,
      name: r.name,
      criteria: `Top-${r.rank} all-time board · ${r.name}`,
      detail: r.value,
      color:
        r.rank === 1
          ? "rgb(var(--rank-1))"
          : r.rank === 2
            ? "rgb(var(--rank-2))"
            : "rgb(var(--rank-3))",
    });
  }

  badges.push({
    rank: snapshot.class_tier,
    name: "Class",
    criteria: "Signal class — lifetime verified token volume",
    color: "rgb(var(--class-power))",
  });

  if (operator.verification_status !== "unverified") {
    badges.push({
      rank: operator.verification_status === "audited" ? "AUDITED" : "VERIFIED",
      name: "Identity",
      criteria:
        operator.verification_status === "audited"
          ? "Identity verified + telemetry audited"
          : "Operator identity claimed and verified",
      color: ACCENT,
    });
  }

  if (records.length > 0) {
    const earliest = records.map((r) => r.date).sort()[0];
    badges.push({
      rank: "RECORD",
      name: "Hall of Signal",
      criteria: "Hold a Hall of Signal record",
      detail: earliest ? `SINCE ${fmtRecordDate(earliest)}` : `${records.length} HELD`,
      color: "rgb(var(--rank-1))",
    });
  }

  /* ── Locked teasers (same rules as SocialView) ───────────────── */
  const held = new Set(dyn.filter((r) => r.rank === 1).map((r) => r.name));
  const lockCandidates = ["Velocity", "SNR", "Scale V", "Cost per 1M"]
    .filter((n) => !held.has(n))
    .slice(0, 2);
  for (const n of lockCandidates) {
    badges.push({
      rank: "#1",
      name: n,
      criteria: `Hold all-time #1 for ${n}`,
      color: MUTED,
      locked: true,
    });
  }
  const snapshotLocked = scoredSnapshots < SNAPSHOT_MILESTONE;
  badges.push({
    rank: `${SNAPSHOT_MILESTONE}TH`,
    name: "Snapshot",
    criteria: `Reach ${SNAPSHOT_MILESTONE} scored snapshots`,
    detail: `${scoredSnapshots} ON RECORD`,
    progressPct: Math.min(100, (scoredSnapshots / SNAPSHOT_MILESTONE) * 100),
    color: MUTED,
    locked: snapshotLocked,
  });

  const earned = badges.filter((b) => !b.locked).length;
  const locked = badges.length - earned;

  /* ── Class ladder achievements ───────────────────────────────── */
  const ladder = RS05_CLASS_THRESHOLDS;
  const currentIdx = ladder.findIndex((c) => c.class === snapshot.class_tier);
  // Ladder is ordered highest → lowest; show the rungs around the operator:
  // the two classes directly above the current one (locked), current, and
  // the rung below (already passed) for context.
  const ladderWindow = currentIdx >= 0
    ? ladder.slice(Math.max(0, currentIdx - 2), Math.min(ladder.length, currentIdx + 2))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Module
        title="Badges Earned"
        subtitle={`${earned} earned · ${locked} locked`}
      >
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <div
              key={`${b.name}-${i}`}
              title={b.locked ? `Locked — ${b.criteria}` : b.criteria}
              className={`flex min-w-[150px] flex-1 basis-[calc(33%-8px)] flex-col items-center gap-1 rounded-md border bg-bg-elevated px-3 py-3 text-center transition-transform sm:flex-none ${
                b.locked ? "opacity-30 saturate-[0.4]" : "hover:-translate-y-0.5"
              }`}
              style={{
                borderColor: b.locked
                  ? "rgb(var(--bg-border))"
                  : `color-mix(in srgb, ${b.color} 45%, rgb(var(--bg-border)))`,
              }}
            >
              <span
                className="font-mono text-[17px] font-bold leading-none"
                style={{ color: b.locked ? "rgb(var(--text-secondary))" : b.color }}
              >
                {b.rank}
              </span>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                {b.name}
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted opacity-75">
                {b.criteria}
              </span>
              {b.detail && (
                <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-text-secondary">
                  {b.detail}
                </span>
              )}
              {b.progressPct != null && (
                <span className="mt-0.5 h-1 w-full overflow-hidden rounded bg-bg-border">
                  <span
                    className="block h-full rounded bg-text-secondary"
                    style={{ width: `${b.progressPct}%` }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
      </Module>

      <Module
        title="Class Ladder"
        subtitle={
          tierProgress == null
            ? "CLASS STANDING UNAVAILABLE"
            : tierProgress.nextClass
              ? `${tierProgress.progressPct.toFixed(0)}% TO ${tierProgress.nextClass}`
              : currentIdx === 0
                ? "TOP CLASS REACHED"
                : "CLASS STANDING UNAVAILABLE"
        }
      >
        <div className="flex flex-col">
          {ladderWindow.length === 0 && (
            <p className="font-mono text-xs text-text-muted">
              Class thresholds unavailable for {snapshot.class_tier}.
            </p>
          )}
          {ladderWindow.map((rung) => {
            const isCurrent = rung.class === snapshot.class_tier;
            const rungIdx = ladder.indexOf(rung);
            const isLocked = rungIdx < currentIdx; // higher in list = harder
            const isNext = rungIdx === currentIdx - 1;
            return (
              <div
                key={rung.class}
                className={`flex items-center gap-3 border-b border-bg-border-subtle px-1 py-2.5 last:border-0 ${
                  isLocked ? "opacity-35 saturate-[0.4]" : ""
                }`}
              >
                <span
                  className={`w-20 shrink-0 font-mono text-[13px] font-bold ${
                    isCurrent ? "text-gold" : "text-text-secondary"
                  }`}
                >
                  {rung.class}
                </span>
                <span className="w-24 shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-text-muted">
                  {compact(rung.totalMin)}+ TOKENS
                </span>
                <span className="flex-1 font-mono text-[9px] uppercase tracking-[0.08em] text-text-muted">
                  {isCurrent
                    ? tierProgress?.nextClass
                      ? `${compact(tierProgress.currentTotal)} BANKED · ${compact(tierProgress.tokensToNext ?? 0)} TO ${tierProgress.nextClass}`
                      : "CURRENT CLASS"
                    : isLocked
                      ? isNext
                        ? "NEXT CLASS — LOCKED"
                        : "LOCKED"
                      : "PASSED"}
                </span>
                {isNext && tierProgress != null && (
                  <span className="w-28 shrink-0">
                    <span className="block h-1 overflow-hidden rounded bg-bg-border">
                      <span
                        className="block h-full rounded bg-gold"
                        style={{ width: `${tierProgress.progressPct}%` }}
                      />
                    </span>
                  </span>
                )}
                <span className="w-16 shrink-0 text-right font-mono text-[9px] uppercase text-text-muted">
                  {isCurrent ? "CURRENT" : isLocked ? "LOCKED" : "EARNED"}
                </span>
              </div>
            );
          })}
        </div>
      </Module>

      <Module title="Milestones" subtitle="Snapshot record volume">
        <div className="flex items-center gap-3 px-1 py-1.5">
          <span
            className={`w-20 shrink-0 font-mono text-[13px] font-bold ${
              snapshotLocked ? "text-text-secondary" : "text-gold"
            }`}
          >
            {scoredSnapshots}/{SNAPSHOT_MILESTONE}
          </span>
          <span className="flex-1">
            <span className="block font-mono text-[9px] uppercase tracking-[0.08em] text-text-muted">
              Scored snapshots on record — {SNAPSHOT_MILESTONE} unlocks the Snapshot milestone badge
            </span>
            <span className="mt-1 block h-1 max-w-[280px] overflow-hidden rounded bg-bg-border">
              <span
                className="block h-full rounded bg-gold"
                style={{
                  width: `${Math.min(100, (scoredSnapshots / SNAPSHOT_MILESTONE) * 100)}%`,
                }}
              />
            </span>
          </span>
          <span className="w-16 shrink-0 text-right font-mono text-[9px] uppercase text-text-muted">
            {snapshotLocked ? "LOCKED" : "EARNED"}
          </span>
        </div>
      </Module>
    </div>
  );
}
