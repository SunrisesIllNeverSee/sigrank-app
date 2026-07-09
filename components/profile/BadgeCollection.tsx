"use client";

/**
 * components/profile/BadgeCollection.tsx — renders the 8 launch badges.
 *
 * Earned badges: full color, clickable (tooltip with condition).
 * In-progress badges: dimmed, progress bar (26/30).
 * Locked badges: not shown (don't tease what doesn't exist yet).
 *
 * Badge icons are emoji — no SVG assets needed for Phase 1.
 */

const BADGE_META: Record<
  string,
  { label: string; icon: string; condition: string }
> = {
  first_spark: {
    label: "First Spark",
    icon: "◈",
    condition: "1× cache leverage",
  },
  cascade_engine: {
    label: "Cascade Engine",
    icon: "⚡",
    condition: "10×cache leverage",
  },
  chain_reaction: {
    label: "Chain Reaction",
    icon: "⚡",
    condition: "100×cache leverage",
  },
  foundation: {
    label: "Foundation",
    icon: "🏗️",
    condition: "3 BUILD→MAINTAIN arcs",
  },
  phoenix: {
    label: "Phoenix",
    icon: "🔥",
    condition: "5×MAINTAIN recovery within 1 day",
  },
  verified: {
    label: "Verified",
    icon: "✓",
    condition: "Submitted via signed agent",
  },
  cascade_streak: {
    label: "Cascade Streak",
    icon: "🔥",
    condition: "7 consecutive days MAINTAIN",
  },
  top_10: { label: "Top 10", icon: "🏆", condition: "Currently in top 10" },
};

export function BadgeCollection({
  badges,
}: {
  badges: {
    earned_this_week: string[];
    in_progress: Array<{
      id: string;
      label: string;
      icon: string;
      progress: number;
      target: number;
      display: string;
    }>;
    collection: string[];
  };
}) {
  const earned = badges.collection.map((id) => ({
    id,
    ...BADGE_META[id],
  }));

  return (
    <div className="rounded-lg border border-bg-border p-4">
      <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.06em] text-text-muted">
        Badges
      </h3>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {earned.map((badge) => (
            <div
              key={badge.id}
              className="group relative flex flex-col items-center"
              title={`${badge.label} — ${badge.condition}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xl">
                {badge.icon}
              </div>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-text-secondary">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* In-progress badges */}
      {badges.in_progress.length > 0 && (
        <>
          <div className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">
            In progress
          </div>
          <div className="flex flex-col gap-2">
            {badges.in_progress.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3">
                <span className="text-lg opacity-50">{badge.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-text-secondary">{badge.label}</span>
                    <span className="text-text-muted">{badge.display}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-border">
                    <div
                      className="h-full rounded-full bg-gold/40"
                      style={{
                        width: `${Math.min((badge.progress / badge.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {earned.length === 0 && badges.in_progress.length === 0 && (
        <p className="font-mono text-sm text-text-muted">
          No badges yet. Submit your cascade to start earning.
        </p>
      )}
    </div>
  );
}
