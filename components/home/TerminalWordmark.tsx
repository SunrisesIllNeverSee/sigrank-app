"use client";

import React from "react";
import { TerminalBlockText } from "@/components/home/TerminalBlockText";
import "./wordmark.css";
import { usePixelWordmark } from "./usePixelWordmark";

/**
 * TerminalWordmark — the terminal-theme hero wordmark (Layer 3, FIX O-adjacent).
 *
 * Ports the TUI block-letter SIGRANK splash art (SPLASH_ART from
 * sigrank-mcp/tui.mjs lines 1093–1097) as a centered <pre>, with a continuous
 * color-cycle through the TUI MOSES_PAL palette (warm golds/ambers). The cycle
 * is driven by `.terminal-wordmark-line` in globals.css (background-clip:text
 * gradient that animates background-position). Per-line stagger via --tw-delay
 * so the sweep reads as flowing down the wordmark.
 *
 * Shown for Terminal/Green and Black & Gold, following the enclosing workspace
 * theme (or the document theme outside a shell). Other themes show the styled
 * brand mark. The mounted wrapper lets the theme observer remain connected.
 *
 * Responsive: the art is 52 chars wide — clamp the font-size so it fits mobile
 * width without horizontal scroll. Reduced-motion: the CSS slows the cycle to a
 * 30s drift (never freezes — owner's a11y call).
 *
 * Optional nicety (included — reads clean): the ◈ ─── ◈ rule (SPLASH_RULE).
 */

const SPLASH_RULE = "◈  ───────────────────────────────────────────  ◈";

export function TerminalWordmark() {
  const { isPixel, themeRef } = usePixelWordmark<HTMLDivElement>();

  return (
    <div ref={themeRef} className="flex flex-col items-center gap-3" aria-label="SIGRANK"
      style={{ display: isPixel ? "flex" : "none" }}>
      {/* Block-letter art via the shared engine. SIGRANK's glyphs reproduce the
          original SPLASH_ART byte-for-byte. Responsive font-size so the 52-char
          width fits mobile without a horizontal-scroll gutter (overflow-x-clip). */}
      <TerminalBlockText
        text="SIGRANK"
        label="SIGRANK"
        maxRem={1.7}
        vw="3.2vw"
      />

      {/* ◈ rule (SPLASH_RULE) */}
      <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-text-dim sm:text-[11px]">
        <span>{SPLASH_RULE}</span>
      </div>
    </div>
  );
}
