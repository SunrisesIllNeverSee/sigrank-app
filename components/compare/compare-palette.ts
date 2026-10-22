/** Canonical SigRank class hues, with literal RGB fallbacks for Safari.
 * CSS vars preserve the site's palette, not a hard-coded blue-A/green-B scheme. */
const CLASS_CHANNELS: Record<string, [string, string]> = {
  TRANSMITTER: ["class-transmitter", "245,166,35"],
  "ARCH+": ["class-archplus", "96,165,250"],
  ARCH: ["class-arch", "59,130,246"],
  POWER: ["class-power", "167,139,250"],
  BASE: ["class-base", "148,163,184"],
  SEEKER: ["class-seeker", "45,212,160"],
  REFINER: ["class-refiner", "244,116,72"],
  BEARER: ["class-bearer", "129,140,248"],
  IGNITER: ["class-igniter", "100,116,139"],
};
export function compareClassPalette(tier: string | null | undefined) {
  const key = tier?.toUpperCase().trim() === "TRANSMITTER" ?
    "TRANSMITTER" : (tier?.toUpperCase().trim().split(/\s+/).slice(0, -1).join(" ") || "BASE");
  const [token, triplet] = CLASS_CHANNELS[key] ?? CLASS_CHANNELS.BASE;
  const nums = triplet.replaceAll(",", " ");
  return {
    token,
    color: `rgb(var(--${token}, ${nums}))`,
    tint: (alpha: number) => `rgba(${triplet},${alpha})`,
  };
}

/** Stable operand colors distinguish operators even when their classes match. */
export const COMPARE_OPERAND_COLORS = {
  a: "#60a5fa",
  b: "#2dd4bf",
} as const;

/** Browser-rendered Compare workspace colors. The gold Compare theme supplies
 * --compare-a (gold) and --compare-b (bone/ivory); all other workspace themes
 * retain the previous blue/teal comparison colors. Keep the literal constants
 * above for portable server-image/Satori renders. */
export const COMPARE_THEME_OPERAND_COLORS = {
  a: "var(--compare-a, #60a5fa)",
  b: "var(--compare-b, #2dd4bf)",
} as const;
