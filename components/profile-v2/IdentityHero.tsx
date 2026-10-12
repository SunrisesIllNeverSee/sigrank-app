/**
 * components/profile-v2/IdentityHero.tsx — the identity hero for the
 * redesigned /user/[codename] Overview tab.
 *
 * Server component: pure render from props, no hooks / no client state.
 * Ported from _workspace/profile-mocks/overview.html §1 (IDENTITY HERO):
 * avatar + tier-progress ring | name/codename/handle + tag pills | rank column.
 *
 * Token mapping (mock → site theme):
 *   mock --violet  → --class-power  (167 139 250 — the site's violet token)
 *   mock --accent  → --gold         (brand accent stands in for the lime accent)
 *   mock --cyan    → --accent       (cascade-blue, the site's cyan-adjacent token)
 *   mock --muted/-text2 → --text-muted / --text-secondary
 *
 * Silkscreen is loaded here via next/font (preload:false, display:swap) rather
 * than relying on --font-lbw-silk, which only exists inside the .lbw-root
 * workspace subtree — this component renders on the standalone profile page.
 */

import { Silkscreen } from "next/font/google";

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";
import type { TierProgress } from "@/lib/analytics/tier-progress";
import { CLASS_TIERS, classToTierId } from "@/lib/identity/canon-ids";

const displayFont = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

interface IdentityHeroProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  globalRank: number;
  topPct: number;
  pending: boolean;
  archetype: BuildArchetype | null;
  tierProgress: TierProgress | null;
  workflowMode: string | null;
}

/** Tier-ring geometry: r=46 in a 100×100 viewBox → circumference ≈ 289.03. */
const RING_R = 46;
const RING_CIRC = 2 * Math.PI * RING_R; // 289.03

/** Mock compact(): K/M/B suffixes — "2.70B", "128.2M", "33.8K". */
function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/** 'YYYY-MM-DD' → "OCT 8 2026" (mock's SNAPSHOT line). */
function formatSnapshotDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d} ${y}`;
}

/**
 * Avatar initials — first letter of the first and last name segments
 * ("TheSignalVault" → "TV", "MOSES" → "MO"), matching the mock treatment.
 */
function initialsOf(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N} _-]/gu, " ")
    .split(/[\s_-]+|(?<=[a-z0-9])(?=[A-Z])/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TAG_BASE =
  "inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] leading-none";

export function IdentityHero({
  operator,
  snapshot,
  globalRank,
  topPct,
  pending,
  archetype,
  tierProgress,
  workflowMode,
}: IdentityHeroProps) {
  const isPrivate = operator.profile_visibility === "private";
  const displayName = operator.display_name ?? operator.codename;
  const initials = initialsOf(displayName);
  const tierGlyph = CLASS_TIERS[classToTierId(snapshot.class_tier)]?.glyph ?? "◈";
  const costPerMillion = snapshot.cascade?.costPerMillion ?? null;

  // Tier ring: fraction of the way to the next class (0 when already at top).
  const progress = tierProgress
    ? Math.min(100, Math.max(0, tierProgress.progressPct)) / 100
    : 0;
  const ringOffset = (1 - progress) * RING_CIRC;

  return (
    <section className="rounded-lg border border-bg-border bg-bg-surface px-6 py-6 sm:px-7">
      <div className="flex flex-wrap items-center gap-6">
        {/* Avatar + tier-progress ring */}
        <div className="relative h-16 w-16 shrink-0">
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-lg font-bold"
            style={{
              background:
                "linear-gradient(135deg, rgb(var(--class-power)) 0%, rgb(var(--class-bearer)) 60%, rgb(var(--class-power) / 0.55) 100%)",
              color: "rgb(var(--bg-base))",
            }}
          >
            {operator.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar; fixed 64px footprint */
              <img
                src={operator.avatar_url}
                alt={displayName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {tierProgress && (
            <svg
              viewBox="0 0 100 100"
              className="absolute -left-[18px] -top-[18px] h-[100px] w-[100px]"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="rgb(var(--bg-border))"
                strokeWidth="3"
              />
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="rgb(var(--class-power))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 50 50)"
              />
            </svg>
          )}
        </div>

        {/* Identity block */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold leading-tight text-text-primary">
              {displayName}
            </h1>
            {isPrivate && (
              <span className={`${TAG_BASE} border-bg-border bg-bg-elevated text-text-muted`}>
                Private
              </span>
            )}
          </div>
          <div className="font-mono text-xs tracking-[0.04em] text-text-muted">
            {operator.codename}
          </div>
          {operator.handle && (
            <div className="font-mono text-xs text-text-secondary">
              @{operator.handle}
            </div>
          )}

          {/* Tag pills */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {!pending && (
              <span
                className={`${TAG_BASE} border-class-power/40 bg-class-power/10 font-semibold text-class-power`}
              >
                <span aria-hidden="true">{tierGlyph}</span>
                {snapshot.class_tier}
              </span>
            )}
            {archetype && (
              <span
                className={`${TAG_BASE} border-gold/40 bg-gold/10 text-gold`}
                title={archetype.blurb}
              >
                {archetype.name}
              </span>
            )}
            {workflowMode && (
              <span
                className={`${TAG_BASE} border-accent/40 bg-accent/10 text-accent`}
              >
                {workflowMode}
              </span>
            )}
            <span
              className={`${TAG_BASE} border-bg-border bg-bg-elevated text-text-secondary`}
            >
              {operator.primary_domain}
            </span>
          </div>
        </div>

        {/* Rank column */}
        <div className="ml-auto flex flex-col items-end gap-1 text-right">
          {pending ? (
            <span
              className={`${displayFont.className} text-base uppercase tracking-[0.04em] text-text-muted`}
            >
              Unranked
            </span>
          ) : (
            <>
              <div className="flex items-start gap-0.5 leading-none">
                <span
                  className={`${displayFont.className} relative -top-1 text-sm text-text-muted`}
                >
                  #
                </span>
                <span
                  className={`${displayFont.className} text-[40px] font-bold leading-none tracking-[-0.02em] ${
                    globalRank <= 3 ? "text-gold" : "text-text-primary"
                  }`}
                >
                  {globalRank}
                </span>
              </div>
              <div className="font-mono text-[13px] font-semibold text-class-seeker">
                Top {topPct.toFixed(1)}%
              </div>
            </>
          )}
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-text-muted">
            <span>{operator.account_age_days} days</span>
            <span className="text-text-dim"> · </span>
            <span>
              {operator.total_messages_lifetime.toLocaleString("en-US")} msg
            </span>
            <span className="text-text-dim"> · </span>
            <span>{compact(snapshot.token_throughput)} tok</span>
            {costPerMillion != null && (
              <>
                <span className="text-text-dim"> · </span>
                <span>${costPerMillion.toFixed(2)}/M</span>
              </>
            )}
          </div>
          {snapshot.snapshot_date && (
            <div className="font-mono text-[10px] uppercase tracking-[0.04em] text-text-muted opacity-70">
              Snapshot {formatSnapshotDate(snapshot.snapshot_date)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
