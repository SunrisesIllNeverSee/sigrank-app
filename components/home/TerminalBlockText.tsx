"use client";

import React from "react";

/**
 * TerminalBlockText — the ONE block-letter engine for the terminal theme.
 *
 * Renders an arbitrary string as 5-row block-letter ASCII art (the same
 * figlet "ANSI Shadow"-style font the TUI SIGRANK splash uses), assembled into
 * the same 5-line <pre> + `.terminal-wordmark-line` color-cycle (globals.css)
 * as the landing wordmark. SIGRANK's own glyphs (S I G R A N K) are lifted
 * verbatim from the original SPLASH_ART so the refactored wordmark stays
 * byte-identical; the remaining A–Z / 0–9 / ×, space glyphs are drawn in the
 * same weight.
 *
 * Used by:
 *   - TerminalWordmark (landing) → <TerminalBlockText text="SIGRANK" />
 *   - WaveHero (board/compare/hall/wiki) → page hero title, terminal theme only.
 *
 * Responsive: caller passes a clamp() font-size class; we use overflow-x-clip
 * (NOT auto) so wide words never spawn a scrollbar gutter.
 */

// 5-row glyphs. Each glyph is 5 strings of equal width. A single trailing space
// column separates letters when assembled. Drawn to match SPLASH_ART weights.
const GLYPHS: Record<string, string[]> = {
  // S I G R A N K lifted verbatim from the TUI SPLASH_ART column slices so
  // <TerminalBlockText text="SIGRANK" /> reproduces the original byte-for-byte.
  " ": ["  ", "  ", "  ", "  ", "  "],
  A: [" █████  ", "██   ██ ", "███████ ", "██   ██ ", "██   ██ "],
  B: ["██████  ", "██   ██ ", "██████  ", "██   ██ ", "██████  "],
  C: [" ██████ ", "██      ", "██      ", "██      ", " ██████ "],
  D: ["██████  ", "██   ██ ", "██   ██ ", "██   ██ ", "██████  "],
  E: ["███████ ", "██      ", "█████   ", "██      ", "███████ "],
  F: ["███████ ", "██      ", "█████   ", "██      ", "██      "],
  G: [" ██████  ", "██       ", "██   ███ ", "██    ██ ", " ██████  "],
  H: ["██   ██ ", "██   ██ ", "███████ ", "██   ██ ", "██   ██ "],
  I: ["██ ", "██ ", "██ ", "██ ", "██ "],
  J: ["     ██ ", "     ██ ", "     ██ ", "██   ██ ", " █████  "],
  K: [" ██   ██", " ██  ██ ", " █████  ", " ██  ██ ", " ██   ██"],
  L: ["██      ", "██      ", "██      ", "██      ", "███████ "],
  M: [
    "███    ███ ",
    "████  ████ ",
    "██ ████ ██ ",
    "██  ██  ██ ",
    "██      ██ ",
  ],
  // Trailing-space column added (2026-06-29): N was the ONLY glyph missing the
  // 1-col separator every other letter carries, so any letter after N collided
  // (the "MANUS" NU jam). It was lifted from SPLASH_ART where N ended "RANK", so
  // the missing gap never showed. Now 9 cols wide like its neighbours.
  N: ["███    ██ ", "████   ██ ", "██ ██  ██ ", "██  ██ ██ ", "██   ████ "],
  O: [" ██████  ", "██    ██ ", "██    ██ ", "██    ██ ", " ██████  "],
  P: ["██████  ", "██   ██ ", "██████  ", "██      ", "██      "],
  Q: [" ██████  ", "██    ██ ", "██    ██ ", "██  ████ ", " ███████ "],
  R: ["██████  ", "██   ██ ", "██████  ", "██   ██ ", "██   ██ "],
  S: ["███████ ", "██      ", "███████ ", "     ██ ", "███████ "],
  T: ["████████ ", "   ██    ", "   ██    ", "   ██    ", "   ██    "],
  U: ["██    ██ ", "██    ██ ", "██    ██ ", "██    ██ ", " ██████  "],
  V: ["██    ██ ", "██    ██ ", "██    ██ ", " ██  ██  ", "  ████   "],
  W: [
    "██      ██ ",
    "██      ██ ",
    "██  ██  ██ ",
    "██ ████ ██ ",
    "███    ███ ",
  ],
  X: ["██   ██ ", " ██ ██  ", "  ███   ", " ██ ██  ", "██   ██ "],
  Y: ["██    ██ ", " ██  ██  ", "  ████   ", "   ██    ", "   ██    "],
  Z: ["███████ ", "    ██  ", "   ██   ", "  ██    ", "███████ "],
  "0": [" ██████  ", "██   ███ ", "██ ██ ██ ", "███   ██ ", " ██████  "],
  "1": [" ███ ", "  ██ ", "  ██ ", "  ██ ", " ████"],
  "2": ["██████  ", "     ██ ", " █████  ", "██      ", "███████ "],
  "3": ["██████  ", "     ██ ", " █████  ", "     ██ ", "██████  "],
  "4": ["██   ██ ", "██   ██ ", "███████ ", "     ██ ", "     ██ "],
  "5": ["███████ ", "██      ", "███████ ", "     ██ ", "███████ "],
  "6": [" ██████ ", "██      ", "███████ ", "██   ██ ", " █████  "],
  "7": ["███████ ", "    ██  ", "   ██   ", "  ██    ", "  ██    "],
  "8": [" █████  ", "██   ██ ", " █████  ", "██   ██ ", " █████  "],
  "9": [" █████  ", "██   ██ ", " ██████ ", "     ██ ", " █████  "],
  "×": ["        ", " ██  ██ ", "  ████  ", " ██  ██ ", "        "],
  "·": ["   ", "   ", " █ ", "   ", "   "],
  "&": [" ████   ", "██  ██  ", " ████   ", "██  ██ █", " ████ ██"],
};

/** Render `text` (uppercased) into 5 assembled rows of block art. */
export function toBlockRows(text: string): string[] {
  const chars = text.toUpperCase().split("");
  const rows = ["", "", "", "", ""];
  for (const ch of chars) {
    const glyph = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < 5; r++) rows[r] += glyph[r];
  }
  return rows;
}

export interface TerminalBlockTextProps {
  text: string;
  /** Tailwind class for the responsive font-size (caller tunes per width). */
  fontClassName?: string;
  /** Accessible label; defaults to the text itself. */
  label?: string;
}

/**
 * The block-letter <pre>. Each row is a `.terminal-wordmark-line` with a
 * staggered `--tw-delay` so the gold cycle flows down the word.
 */
export function TerminalBlockText({
  text,
  fontClassName = "text-[clamp(0.45rem,2.4vw,1.3rem)]",
  label,
}: TerminalBlockTextProps) {
  const rows = toBlockRows(text);
  return (
    <div className="flex flex-col items-center" aria-label={label ?? text}>
      <pre
        aria-hidden
        className={`select-none overflow-x-clip font-mono leading-[1.1] tracking-tight ${fontClassName}`}
        style={{ margin: 0 }}
      >
        {rows.map((line, i) => (
          <div
            key={i}
            className="terminal-wordmark-line"
            style={{ ["--tw-delay" as string]: `${i * 0.4}s` }}
          >
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}
