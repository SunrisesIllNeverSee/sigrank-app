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

/** Canonical glyph for a SignalClass name (falls back to '·' / IGNITER). */
export function glyphFor(name: SignalClass): string {
  return CLASS_NAME_TO_GLYPH[name] ?? "·";
}
