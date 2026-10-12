/**
 * components/profile-v2/RecordMarks.tsx — record/medallion artwork for the
 * profile right rail (owner checklist item 9).
 *
 * Uses the owner's hexagon medallion artwork — the same outer/inner hex
 * geometry as components/profile-v2/BadgeArtwork.tsx `AchievementArtwork`
 * (achievement-index.v1.json): every award is a double-hex medallion with a
 * centered sigil. Sigils come from the owner's catalog:
 *   hall      ★ gold · ✧ silver · ◆ bronze · ◇ first · ♛ triple   #e8bf61
 *   cascade   Υ yield · ↑ · × leverage · ∞ · ↗ velocity            #bd83ff
 *   quality   ◈ snr · ✦ · ⌁ dev · ▸ output                          #41d9d3
 *   scale     ▦ · ⬡ scale-v · ▰ · ▱ · ⚡                            #ffad4b
 *   proof     ◌ · ▤ · § · ✓ · ⌗                                   #9bdca4
 *   growth    ➤ · ⋈ · 7 · 30 · ↟                                  #f48da7
 *
 * Two-tone rule: the medallion ring carries the STANDING metal
 * (gold/silver/bronze for #1/#2/#3, hall gold for curated awards) and the
 * sigil carries the METRIC family accent — so "◆-ringed Υ" reads instantly
 * as "third-place standing on Yield".
 *
 * Pure render — safe for server components (no client directive).
 */

export interface HexMarkProps {
  /** Catalog sigil drawn inside the medallion. */
  sigil: string;
  /** Ring/stroke color (standing metal or family accent). */
  ring: string;
  /** Sigil color — defaults to `ring`. */
  ink?: string;
  size?: number;
  /** Dashed ring for pending/in-progress records. */
  dashed?: boolean;
}

/** Owner hexagon medallion: outer + inner hex, centered sigil. */
export function HexMark({ sigil, ring, ink, size = 16, dashed = false }: HexMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M24 2.5 42 13v22L24 45.5 6 35V13z"
        fill="none"
        stroke={ring}
        strokeWidth="3"
        strokeDasharray={dashed ? "5 4" : undefined}
        strokeLinejoin="round"
      />
      <path
        d="M24 8 37 15.5v17L24 40 11 32.5v-17z"
        fill="none"
        stroke={ring}
        strokeWidth="1.6"
        opacity="0.4"
        strokeLinejoin="round"
      />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fill={ink ?? ring}
        fontSize="19"
        fontWeight="700"
        fontFamily="monospace"
      >
        {sigil}
      </text>
    </svg>
  );
}

const METAL: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

/** Earned record: metal ring by standing rank + metric-family sigil. */
export function MedalHex({ rank, sigil, ink, size = 16 }: { rank?: number; sigil: string; ink?: string; size?: number }) {
  return <HexMark sigil={sigil} ring={rank != null ? METAL[rank] ?? "#e8bf61" : "#e8bf61"} ink={ink} size={size} />;
}

/** Pending record: dashed hexagon + clock hands (in-progress milestone). */
export function PendingHex({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M24 2.5 42 13v22L24 45.5 6 35V13z" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4" strokeLinejoin="round" opacity="0.8" />
      <path d="M24 16v9l7 4.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

/** Unavailable record: dim hexagon + lock. */
export function LockedHex({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M24 2.5 42 13v22L24 45.5 6 35V13z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" opacity="0.55" />
      <rect x="17" y="24" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M20 24v-3a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}
