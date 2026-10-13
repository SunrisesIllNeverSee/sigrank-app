/**
 * components/profile-v2/BadgesView.tsx — dedicated "Badges" tab for the
 * /user/[codename] profile page.
 *
 * Earned-only badge gallery. Pixel standing, class, identity, snapshot
 * milestone, live metric records, and Hall records are derived from the
 * operator's current data. The complete design/rules catalog is separate at
 * /hall/badges so proposed designs are not presented as earned awards.
 */

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { HallRecord } from "@/lib/board";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import Link from "next/link";
import { earnedPixelMarks } from "@/lib/profile/pixel-eligibility";
import { BOARD_SIGIL, HALL_INK, hallSigil } from "@/lib/profile/record-artwork";
import { HexMark, MedalHex } from "./RecordMarks";
import { PixelArtwork } from "@/components/profile-v2/BadgeArtwork";

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

const ACCENT = "rgb(var(--accent))";

interface BadgeDef {
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
}: BadgesViewProps) {
  /* ── Badge derivation — same rules as SocialView ─────────────── */
  const badges: BadgeDef[] = [];
  const dyn = trophyCounts?.dynamicRecords ?? [];

  for (const r of dyn) {
    badges.push({
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

  for (const record of records.filter((entry) => !entry.isPlaceholder)) {
    badges.push({
      rank: "RECORD",
      name: record.title,
      criteria: `Hold a Hall of Signal record · ${record.title}`,
      detail: `${record.value}${record.date ? ` · ${fmtRecordDate(record.date)}` : ""}`,
      color: HALL_INK,
      sigil: hallSigil(record.title),
      ink: HALL_INK,
    });
  }

  if (scoredSnapshots >= 500) badges.push({ rank: "500TH", name: "Snapshot", criteria: "Reach 500 scored snapshots", color: "rgb(var(--rank-1))" });

  const earnedPixels = earnedPixelMarks({ percentile, processedTokens, verificationStatus: operator.verification_status, pending });
  const earnedBadges = badges;
  const earned = earnedBadges.length + earnedPixels.length;

  return (
    <div className="flex flex-col gap-4">
      <Module
        title="Earned Badges"
        subtitle={`${earned} held`}
      >
        <div className="flex flex-col gap-6">
          {earnedPixels.length > 0 && (
            <section>
              <h4 className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">Pixel badges</h4>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                {earnedPixels.map((badge) => (
                  <div key={badge.id} className="flex w-24 flex-col items-center gap-2 text-center" title={`Earned: ${badge.label}`}>
                    <div className="flex h-[82px] w-[82px] items-center justify-center rounded-lg border border-bg-border bg-bg-elevated shadow-[inset_0_0_24px_rgba(60,220,180,.05)]"><PixelArtwork pattern={badge.pattern} size={58} /></div>
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-text-primary">{badge.label}</span>
                  </div>
                ))}

              </div>
            </section>
          )}
          <section>
            <h4 className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">Records & standing</h4>
            <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-3 xl:grid-cols-4">
              {earnedBadges.map((badge, i) => (
                <article key={`${badge.name}-${i}`} title={badge.criteria} className="flex min-h-32 flex-col items-center justify-center gap-2 border-y border-bg-border px-3 py-4 text-center">
                  {badge.standing != null
                    ? <MedalHex rank={badge.standing} sigil={badge.sigil ?? "◆"} ink={badge.ink} size={64} />
                    : <HexMark sigil={badge.sigil ?? (badge.name === "Class" ? "⬡" : badge.name === "Identity" ? "✓" : "⌗")} ring={badge.color} ink={badge.ink} size={64} />}
                  <span className="font-mono text-[8px] text-text-muted">{badge.rank}</span>
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-text-primary">{badge.name}</span>
                  {badge.detail && <span className="font-mono text-[8px] text-text-muted">{badge.detail}</span>}
                </article>
              ))}
            </div>
          </section>
          <Link href="/hall/badges" className="self-start border-b border-gold/40 pb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold hover:border-gold">Browse all badges →</Link>
        </div>
      </Module>

    </div>
  );
}
