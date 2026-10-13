/**
 * components/profile-v2/BadgesView.tsx — dedicated "Badges" tab for the
 * /user/[codename] profile page.
 *
 * Earned gallery plus searchable badge and achievement catalogs. Pixel standing, class, identity, snapshot
 * milestone, live metric records, and Hall records are derived from the
 * operator's current data. Proposed designs stay unearned in the indexes;
 * /hall/badges uses the same catalog browser.
 */

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { HallRecord, OperatorSubmission, SnapshotRecord } from "@/lib/board";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import { BadgeExplorer, type BadgeDisplayEntry } from "./BadgeExplorer";
import { PLATFORM_PIXEL_BADGES, platformPixelTotals, canonicalPixelPlatform } from "@/lib/profile/platform-pixels";
import { earnedPixelMarks } from "@/lib/profile/pixel-eligibility";
import { BOARD_SIGIL, HALL_INK, hallSigil } from "@/lib/profile/record-artwork";

const ACCENT = "rgb(var(--accent))";

interface BadgeDef {
  id?: string;
  rank: string;
  name: string;
  criteria: string;
  detail?: string;
  color: string;
  sigil?: string;
  ink?: string;
  standing?: number;
}

export interface BadgesViewProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  records: HallRecord[];
  trophyCounts: TrophyCounts | null;
  /** Scored snapshots on record (snapshot_submissions rows). */
  scoredSnapshots: number;
  percentile: number;
  processedTokens: number;
  /** Pending/unranked operators hold no earned badges yet. */
  pending?: boolean;
  platformSubmissions?: OperatorSubmission[];
  snapshotRecords?: SnapshotRecord[];
  evidenceDate?: string;
  snapshotHash?: string | null;
  submissionId?: string;
}

export function BadgesView({
  operator,
  snapshot,
  records,
  trophyCounts,
  scoredSnapshots,
  percentile,
  processedTokens,
  pending = false,
  platformSubmissions = [], snapshotRecords = [],
  evidenceDate, snapshotHash, submissionId,
}: BadgesViewProps) {
  /* ── Badge derivation — same rules as SocialView ─────────────── */
  const badges: BadgeDef[] = [];
  const dyn = trophyCounts?.dynamicRecords ?? [];

  for (const r of dyn) {
    badges.push({
      id: `medal:${r.canonId}:${r.rank}`,
      rank: `#${r.rank}`,
      standing: r.rank,
      sigil: BOARD_SIGIL[r.canonId]?.s ?? "◆",
      ink: BOARD_SIGIL[r.canonId]?.ink,
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

  if (!pending) badges.push({
    rank: snapshot.class_tier,
    name: "Class",
    criteria: "Signal class — lifetime verified token volume",
    color: "rgb(var(--class-power))",
  });

  if (!pending && (operator.verification_status === "verified" || operator.verification_status === "audited")) {
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

  for (const record of records.filter((entry) => !entry.isPlaceholder)) {
    badges.push({
      rank: "RECORD",
      name: record.title,
      criteria: `Hold a Hall of Signal record · ${record.title}`,
      detail: `${record.value}${record.date ? ` · ${record.date}` : ""}`,
      color: HALL_INK,
      sigil: hallSigil(record.title),
      ink: HALL_INK,
    });
  }

  if (scoredSnapshots >= 500) badges.push({ rank: "500TH", name: "Snapshot", criteria: "Reach 500 scored snapshots", color: "rgb(var(--rank-1))" });

  const earnedPixels = earnedPixelMarks({ percentile, processedTokens, verificationStatus: operator.verification_status, pending, platformSubmissions });
  const proof = { date: evidenceDate, dateLabel: "Evidence snapshot date", snapshotHash, submissionId };
  const entries: BadgeDisplayEntry[] = [
    ...earnedPixels.map(badge => ({ id: badge.id, label: badge.label, category: "Pixel badges", description: badge.detail,
      rule: badge.detail, evidence: "Current accepted profile / board facts", status: "existing", earned: true,
      kind: "pixel" as const, pattern: badge.pattern,
      ...(badge.platform ? {
        date: badge.evidenceDate, dateLabel: "Platform all-time snapshot date",
        submissionId: snapshotRecords.find(r => r.window === "all_time" && canonicalPixelPlatform(r.platform) === badge.platform && r.submittedAt.startsWith(badge.evidenceDate ?? "!"))?.submissionId,
        snapshotHash: snapshotRecords.find(r => r.window === "all_time" && canonicalPixelPlatform(r.platform) === badge.platform && r.submittedAt.startsWith(badge.evidenceDate ?? "!"))?.snapshotHash ?? null,
      } : proof) })),
    ...badges.map((badge, i) => ({ id: badge.id ?? `record-${i}-${badge.name}`, label: badge.name, category: badge.standing != null || badge.rank === "RECORD" ? "Records & medals" : "Standing & milestones",
      description: [badge.rank, badge.detail].filter(Boolean).join(" · "), rule: badge.criteria,
      evidence: "Accepted board / Hall facts", status: "existing", earned: true, kind: "medal" as const,
      sigil: badge.sigil ?? (badge.name === "Class" ? "⬡" : badge.name === "Identity" ? "✓" : "⌗"), rank: badge.standing,
      accent: badge.ink ?? badge.color, ...proof })),
  ];
  const nextStanding = [{ id: "top10", label: "Top 10% Achiever", target: 90 }, { id: "top5", label: "Top 5% Elite", target: 95 }, { id: "top1", label: "Top 1% Legend", target: 99 }]
    .find(b => !earnedPixels.some(e => e.id === b.id));
  const progress = pending ? null : processedTokens < 10_000_000
    ? { label: "10M Tokens Milestone", current: processedTokens, target: 10_000_000, unit: "accepted tokens" }
    : nextStanding ? { label: nextStanding.label, current: percentile, target: nextStanding.target, unit: "percentile" } : null;
  const totals = pending ? new Map() : platformPixelTotals(platformSubmissions);
  const platformProgress = [...totals].flatMap(([platform, fact]) => {
    const next = PLATFORM_PIXEL_BADGES.find(b => b.platform === platform && b.threshold > fact.tokens);
    return next ? [{ label: next.label, current: fact.tokens, target: next.threshold, unit: "accepted all-time tokens" }] : [];
  });
  return <BadgeExplorer earned={entries} progress={progress} platformProgress={platformProgress} leftTarget="profile-badge-left" rightTarget="profile-badge-right" />;
}
