/* components/live/PixelBadge.tsx — 3×3 block badges from the brand pack's
 * badge system (docs: 10_badge_system.png). Cells carry per-cell palette
 * colors extracted from the pack artwork; "." renders transparent.
 *
 * Palette keys → CSS vars where the board already defines the brand
 * accent (--ac/--cyan/--blue/--violet/--magenta/--orange/--yellow) so the
 * badges re-theme with the board; K = dark notch cell, G = slate cell.
 */
const CELL_COLORS: Record<string, string> = {
  L: "var(--ac)",
  C: "var(--cyan)",
  B: "var(--blue)",
  P: "var(--violet)",
  M: "var(--magenta)",
  O: "var(--orange)",
  Y: "var(--yellow)",
  R: "#fa5aaa",
  W: "#f0f5fa",
  G: "#5a6070",
  K: "var(--panel2)",
};

/* patterns decoded from 10_badge_system.png (3 rows × 3 cols) */
const BADGES = {
  top10: "LL./LGK/GGL",
  top5: "BBB/BBK/.KB",
  top1: "PPP/MMK/PMM",
  days100: "YYO/RRK/RGM",
  tokens10m: "C.W/CWK/CWC",
  verified: ".PR/BPK/.YM",
} as const;

export type PixelBadgeName = keyof typeof BADGES;

export const BADGE_LABELS: Record<PixelBadgeName, string> = {
  top10: "TOP 10% ACHIEVER",
  top5: "TOP 5% ELITE",
  top1: "TOP 1% LEGEND",
  days100: "100 DAYS CONSISTENT",
  tokens10m: "10M TOKENS MILESTONE",
  verified: "VERIFIED OPERATOR",
};

export function PixelBadge({ name }: { name: PixelBadgeName }) {
  const pattern = BADGES[name];
  if (!pattern) return null;
  return (
    <span className="pxbd" title={BADGE_LABELS[name]} role="img" aria-label={BADGE_LABELS[name]}>
      {pattern.split("/").flatMap((row, r) =>
        row.split("").map((cell, c) => (
          <i
            key={`${r}-${c}`}
            style={
              cell === "."
                ? undefined
                : { background: CELL_COLORS[cell] ?? "var(--mut)" }
            }
          />
        )),
      )}
    </span>
  );
}

/** Rank percentile → badge (pct is "percentile" 0–100, higher = better). */
export function badgeForPct(
  pct: number | null | undefined,
): PixelBadgeName | null {
  if (pct == null) return null;
  if (pct >= 99) return "top1";
  if (pct >= 95) return "top5";
  if (pct >= 90) return "top10";
  return null;
}
