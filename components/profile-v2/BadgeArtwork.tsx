const PIXEL_COLORS: Record<string, string> = {
  L: "#b4ee75", C: "#44d9d3", B: "#428cff", P: "#bd83ff", M: "#ec8dff",
  O: "#ff9a48", Y: "#f2cc58", R: "#ff7676", W: "#e5f7ff", G: "#44d9a2",
  K: "#293a43",
};

export function PixelArtwork({
  pattern,
  size = 54,
}: {
  pattern: string;
  size?: number;
}) {
  const rows = pattern.split("/");
  const columns = Math.max(...rows.map(row => row.length));
  const cells = rows.flatMap(row => row.padEnd(columns, ".").split(""));
  return (
    <span
      className="grid shrink-0"
      style={{ width: size, height: size, display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gridTemplateRows: `repeat(${rows.length},1fr)`, gap: Math.max(1, Math.round(size / (columns * 8))) }}
      aria-hidden="true"
    >
      {cells.map((cell, i) => (
        <i
          key={i}
          className="rounded-[2px]"
          style={{ backgroundColor: cell === "." ? "transparent" : PIXEL_COLORS[cell] ?? "#a8bbb2" }}
        />
      ))}
    </span>
  );
}

export function AchievementArtwork({ sigil, accent }: { sigil: string; accent: string }) {
  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center" style={{ color: accent }} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full fill-none stroke-current" strokeWidth="1.5">
        <path d="M24 2.5 42 13v22L24 45.5 6 35V13z" />
        <path d="M24 8 37 15.5v17L24 40 11 32.5v-17z" opacity=".4" />
      </svg>
      <span className="relative font-mono text-xl">{sigil}</span>
    </span>
  );
}
