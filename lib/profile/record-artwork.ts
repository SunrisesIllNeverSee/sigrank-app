/* Owner-catalog sigils (achievement-index.v1.json) keyed by metric-board id —
   medallion glyph inside the standing-metal ring. */
export const BOARD_SIGIL: Record<string, { s: string; ink: string }> = {
  "Y.01": { s: "Υ", ink: "#bd83ff" },  // cascade-yield-one
  "Y.02": { s: "◈", ink: "#41d9d3" },  // signal-snr-half
  "Y.03": { s: "×", ink: "#bd83ff" },  // cascade-leverage-ten
  "Y.04": { s: "↗", ink: "#bd83ff" },  // cascade-velocity
  "Y.05": { s: "⌁", ink: "#41d9d3" },  // signal-dev-two
  "Y.06": { s: "⬡", ink: "#ffad4b" },  // scale-billion
  "Y.07": { s: "$", ink: "#ffad4b" },  // cost — no catalog mark; honest label
  "Y.08": { s: "▸", ink: "#41d9d3" },  // signal-output-first
  "Y.09": { s: "◉", ink: "#41d9d3" },  // signal-balanced
  "Y.10": { s: "◉", ink: "#41d9d3" },
  "Y.11": { s: "◉", ink: "#41d9d3" },
  "Y.12": { s: "◉", ink: "#41d9d3" },
  "T.01": { s: "▰", ink: "#ffad4b" },  // scale-output-ten
  "T.02": { s: "▦", ink: "#ffad4b" },  // scale-100m
  "T.03": { s: "▱", ink: "#ffad4b" },  // scale-output-hundred
  "T.04": { s: "▤", ink: "#ffad4b" },  // cache-write
  "T.05": { s: "⬡", ink: "#ffad4b" },  // total — scale family
};
export const HALL_INK = "#e8bf61";
/** Curated Hall record → catalog sigil (hall-first ◇ / triple ♛ / gold ★). */
export function hallSigil(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("FIRST")) return "◇";
  if (t.includes("TRIPLE") || t.includes("THREE")) return "♛";
  return "★";
}

