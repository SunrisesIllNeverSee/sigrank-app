"use client";

import React from "react";
import "./terminal-block.css";

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

/** SVG mask (data URI) with one crisp rect per run of █ in the row. */
function rowMask(line: string, cols: number): string {
  let rects = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] !== "█") { i++; continue; }
    let j = i;
    while (j < line.length && line[j] === "█") j++;
    rects += `<rect x='${i}' y='0' width='${j - i}' height='1'/>`;
    i = j;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} 1' preserveAspectRatio='none' shape-rendering='crispEdges'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export interface TerminalBlockTextProps {
  text: string;
  /** Visual ceiling in rem. The fit term can only shrink below this — never grow. */
  maxRem?: number;
  /** vw fallback for browsers without container-query units (Safari < 16). */
  vw?: string;
  /** Accessible label; defaults to the text itself. */
  label?: string;
}

/**
 * The block-letter <pre>. Each row is a `.terminal-wordmark-line` with a
 * staggered `--tw-delay` so the gold cycle flows down the word.
 *
 * Sizing is self-fitting: the wrapper is an inline-size container, and the
 * font is `cqw`-sized so `cols × ~0.62em ≤ container` at ANY width and ANY
 * text length (the old per-length clamp tiers clipped "STATE OF THE INDEX").
 * `maxRem` stays as the visual cap so short words still render large.
 */
export function TerminalBlockText({
  text,
  maxRem = 1.3,
  vw = "1.9vw",
  label,
}: TerminalBlockTextProps) {
  const rows = toBlockRows(text);
  const cols = Math.max(...rows.map((r) => r.length));
  // Monospace advance ≈ 0.6em; 0.65 divisor leaves ~8% breathing room.
  const fitCqw = (100 / (0.65 * cols)).toFixed(3);
  return (
    <div
      className="flex w-full flex-col items-center"
      style={{ containerType: "inline-size" }}
      aria-label={label ?? text}
    >
      <pre
        aria-hidden
        className="tbt-fit select-none overflow-x-clip font-mono leading-[1.1] tracking-tight"
        style={
          {
            margin: 0,
            "--tbt-fit": `${fitCqw}cqw`,
            "--tbt-fallback": vw,
            "--tbt-max": `${maxRem}rem`,
          } as React.CSSProperties
        }
      >
        {rows.map((line, i) => (
          <div
            key={i}
            className="terminal-wordmark-line tbt-row"
            style={{
              ["--tw-delay" as string]: `${i * 0.4}s`,
              // Each row is painted through an exact rectangle mask built from
              // the block pattern, not the █ glyph: glyph fallback fonts gave █
              // a different advance than the space, so rows drifted and the
              // letters broke/smeared. One cell = 0.6em × 1em, as before.
              width: `${cols * 0.6}em`,
              WebkitMaskImage: rowMask(line, cols),
              maskImage: rowMask(line, cols),
            }}
          />
        ))}
      </pre>
    </div>
  );
}
