/*
 * ARCHIVAL COPY of lib/identity/canon-ids.ts (glyphFor only; CLASS_TIERS name→glyph as of 4c610df9)@4c610df9 (2026-07-31) for /board/history.
 * Frozen: do not sync with live code. Not canon.
 */
import type { SignalClass } from "./types";

const CLASS_NAME_TO_GLYPH: Record<string, string> = {
  TRANSMITTER: "◈",
  "ARCH+": "▲",
  ARCH: "▽",
  POWER: "⬡",
  BASE: "↓",
  SEEKER: "◎",
  REFINER: "⟳",
  BEARER: "◇",
  IGNITER: "·",
};

/** Canonical glyph for a SignalClass name. July 31 fell back to '·' (IGNITER's
 *  glyph) for a missing class, which mislabels the one null-class row; the
 *  archive shows no glyph instead. Unknown names keep the July 31 fallback. */
export function glyphFor(name: SignalClass | null | undefined): string {
  if (name == null) return "";
  return CLASS_NAME_TO_GLYPH[name] ?? "·";
}
