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
  board: "11111/11110/11100/11000/10000",
  profile: "01110/01110/00000/11111/11111",
  articles: "11111/10001/11101/10101/11111",
  compare: "10001/01010/00100/01010/10001",
  hall: "01110/01110/11111/00100/01110",
  field: "00100/01110/10101/01110/00100",
  wiki: "11111/10001/10101/10001/11111",
  blog: "00001/00010/00100/01100/11110",
  enterprise: "01110/10001/10101/10001/01110",
  /* coming-soon rail icons (owner 2026-10-06): teams/hacks/versus live in
     the nav rail — pixel patterns follow the same 5×5 block language. */
  teams: "10101/11111/00100/11111/10001",
  hacks: "11100/11100/11100/01000/01000",
  versus: "10101/01010/00100/01010/10101",
  /* ORIGINAL BOARD (/board/history): an hourglass for the July 31 archive. */
  history: "11111/01010/00100/01010/11111",
} as const;

export type PixelIconName = keyof typeof PATTERNS;

/* history hourglass (owner 2026-10-24): bone frame, gold sand falling
   from the top chamber into the bottom — one color per lit cell. */
const HOURGLASS_CELL_COLORS: Record<string, string> = {
  "0-0": "#e8e6dc", "0-1": "#e8e6dc", "0-2": "#e8e6dc", "0-3": "#e8e6dc", "0-4": "#e8e6dc",
  "1-1": "#ffcf5a", "1-3": "#ffcf5a",
  "2-2": "#ff9a3c",
  "3-1": "#ff9a3c", "3-3": "#ff9a3c",
  "4-0": "#e8e6dc", "4-1": "#e8e6dc", "4-2": "#e8e6dc", "4-3": "#e8e6dc", "4-4": "#e8e6dc",
};

const BOARD_ROW_COLORS = ["#a6ff00", "#00e5ff", "#3b82f6", "#a855f7", "#ff9a3c"];

export function PixelIcon({ name }: { name: PixelIconName }) {
  const pattern = PATTERNS[name];
  if (!pattern) return null;
  return (
    <span className="gi pxic" aria-hidden="true">
      {pattern.split("/").flatMap((row, r) =>
        row.split("").map((cell, c) => (
          <i key={`${r}-${c}`} className={cell === "1" ? "lit" : ""} style={cell === "1" ? { color: name === "board" ? BOARD_ROW_COLORS[r] : name === "history" ? HOURGLASS_CELL_COLORS[`${r}-${c}`] : undefined } : undefined} />
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
  profile: "♙", articles: "▧", board: "▤", compare: "⚖", hall: "🏆", field: "◉", wiki: "▥", blog: "✎", enterprise: "⬢",
  teams: "⧉", hacks: "⚑", versus: "⚔", history: "⧗",
};
const EMOJI_SET: Record<PixelIconName, string> = {
  profile: "👤", articles: "📰", board: "📊", compare: "⚖️", hall: "🏆", field: "🎯", wiki: "📖", blog: "✏️", enterprise: "🏢",
  teams: "👥", hacks: "🏁", versus: "🥊", history: "⏳",
};
const MINIMAL_SET: Record<PixelIconName, string> = {
  profile: "♙", articles: "▧", board: "▦", compare: "◐", hall: "◈", field: "◎", wiki: "▥", blog: "✎", enterprise: "⬢",
  teams: "⧉", hacks: "⚑", versus: "⚔", history: "⧗",
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
  const gold = name === "history" ? { color: "#ffcf5a" } : undefined;
  if (set === "hex") {
    return (
      <span className="gi hexic" aria-hidden="true">
        <span style={gold}>{g}</span>
      </span>
    );
  }
  return (
    <span className="gi" aria-hidden="true" style={gold}>
      {g}
    </span>
  );
}
