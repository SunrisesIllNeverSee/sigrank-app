import Link from "next/link";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";

export function TrophyRoom({ counts }: { counts: TrophyCounts | null }) {
  if (!counts || counts.total === 0) {
    return (
      <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
            Trophy Room
          </h3>
        </div>
        <p className="mt-2 font-sans text-xs text-text-muted">
          No trophies yet. Reach top 3 on any leaderboard to earn your first medal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
            Trophy Room
          </h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          {counts.gold > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-gold">🥇</span>
              <span className="text-gold font-bold">{counts.gold}</span>
              <span className="text-text-dim">gold</span>
            </span>
          )}
          {counts.silver > 0 && (
            <span className="flex items-center gap-1">
              <span>🥈</span>
              <span style={{ color: "#c0c0c0" }} className="font-bold">{counts.silver}</span>
              <span className="text-text-dim">silver</span>
            </span>
          )}
          {counts.bronze > 0 && (
            <span className="flex items-center gap-1">
              <span>🥉</span>
              <span style={{ color: "#cd7f32" }} className="font-bold">{counts.bronze}</span>
              <span className="text-text-dim">bronze</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {counts.dynamicRecords.map((r) => {
          const isGold = r.rank === 1;
          const color =
            r.rank === 1 ? undefined : r.rank === 2 ? "#c0c0c0" : "#cd7f32";
          return (
            <Link
              key={`dyn-${r.canonId}`}
              href="/hall"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-colors hover:bg-bg-hover ${
                isGold
                  ? "border-gold/40 bg-gold/10 text-text-primary hover:border-gold"
                  : "border-bg-border bg-bg-elevated text-text-primary"
              }`}
              title={`Holds #${r.rank} on ${r.name} · ${r.value}`}
            >
              <span className="font-bold" style={color ? { color } : undefined}>
                #{r.rank}
              </span>
              <span className="text-text-secondary">{r.name}</span>
              <span
                className={`font-semibold ${isGold ? "text-gold" : ""}`}
                style={color && !isGold ? { color } : undefined}
              >
                {r.value}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
