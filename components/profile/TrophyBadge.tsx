import type { TrophyCounts } from "@/lib/analytics/trophy-counts";

export function TrophyBadge({ counts }: { counts: TrophyCounts | null }) {
  if (!counts || counts.total === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-gold/30 bg-gold/5 px-2.5 py-1">
      <span className="text-sm">🏆</span>
      <span className="flex items-center gap-1.5 font-mono text-xs">
        {counts.gold > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="text-gold">🥇</span>
            <span className="font-bold text-gold">{counts.gold}</span>
          </span>
        )}
        {counts.silver > 0 && (
          <span className="flex items-center gap-0.5">
            <span style={{ filter: "grayscale(0.2)" }}>🥈</span>
            <span className="font-bold" style={{ color: "#c0c0c0" }}>{counts.silver}</span>
          </span>
        )}
        {counts.bronze > 0 && (
          <span className="flex items-center gap-0.5">
            <span>🥉</span>
            <span className="font-bold" style={{ color: "#cd7f32" }}>{counts.bronze}</span>
          </span>
        )}
      </span>
    </div>
  );
}
