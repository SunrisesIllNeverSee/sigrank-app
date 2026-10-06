/* components/live/PixelIcon.tsx — pixel-block nav icons (Option A from
 * docs/assets/live-board-icon-options.png; brand pack badge system, the
 * same block language as the XX mark). Each icon is a 5×5 grid of lit
 * cells; lit cells paint currentColor so the existing per-icon accent
 * rules in rail-extras.css apply unchanged.
 *
 * Patterns: rows top→bottom, "1" = lit cell. Unknown names render null —
 * no silent fallback so typos are visible.
 */
const PATTERNS = {
  board: "10000/11000/11100/11110/11111",
  compare: "10001/01010/00100/01010/10001",
  hall: "01110/01110/11111/00100/01110",
  field: "00100/01110/10101/01110/00100",
  wiki: "11111/10001/10101/10001/11111",
  blog: "00001/00010/00100/01100/11110",
  enterprise: "01110/10001/10101/10001/01110",
} as const;

export type PixelIconName = keyof typeof PATTERNS;

export function PixelIcon({ name }: { name: PixelIconName }) {
  const pattern = PATTERNS[name];
  if (!pattern) return null;
  return (
    <span className="gi pxic" aria-hidden="true">
      {pattern.split("/").flatMap((row, r) =>
        row.split("").map((cell, c) => (
          <i key={`${r}-${c}`} className={cell === "1" ? "lit" : ""} />
        )),
      )}
    </span>
  );
}

/* ---------- rail icon sets (owner 2026-10-06: "toggle through the icons,
   I want all 4 or 5 sets") — the five candidates from
   docs/assets/live-board-icon-options.png, switchable at runtime. */
export const ICON_SETS = ["pixel", "glyph", "emoji", "minimal", "hex"] as const;
export type IconSetName = (typeof ICON_SETS)[number];

const GLYPH_SET: Record<PixelIconName, string> = {
  board: "▤", compare: "⚖", hall: "🏆", field: "◉", wiki: "▥", blog: "✎", enterprise: "⬢",
};
const EMOJI_SET: Record<PixelIconName, string> = {
  board: "📊", compare: "⚖️", hall: "🏆", field: "🎯", wiki: "📖", blog: "✏️", enterprise: "🏢",
};
const MINIMAL_SET: Record<PixelIconName, string> = {
  board: "▦", compare: "◐", hall: "◈", field: "◎", wiki: "▥", blog: "✎", enterprise: "⬢",
};

export function RailIcon({
  name,
  set,
}: {
  name: PixelIconName;
  set: IconSetName;
}) {
  if (set === "pixel") return <PixelIcon name={name} />;
  const g =
    set === "emoji" ? EMOJI_SET[name]
    : set === "minimal" ? MINIMAL_SET[name]
    : GLYPH_SET[name];
  if (set === "hex") {
    return (
      <span className="gi hexic" aria-hidden="true">
        <span>{g}</span>
      </span>
    );
  }
  return (
    <span className="gi" aria-hidden="true">
      {g}
    </span>
  );
}
