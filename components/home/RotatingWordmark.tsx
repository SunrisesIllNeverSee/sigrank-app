"use client";

import React from "react";
import localFont from "next/font/local";
import "./wordmark.css";
import { usePixelWordmark } from "./usePixelWordmark";

// Wordmark font pool — used ONLY here (the rotating SIGRANK logo on the
// homepage). Moved from app/layout.tsx so these 3 font families don't
// load on every page on the site. Each letter of "SIGRANK" cycles through
// these via the .wordmark-letter CSS animation in globals.css.
const wmGrotesk = localFont({
  src: [{path: "../../public/fonts/space_grotesk-700-normal.woff2", weight: "700", style: "normal"}],
  variable: "--wm-grotesk",
  display: "swap",
  preload: false,
});
const wmSerif = localFont({
  src: [{path: "../../public/fonts/bitter-700-normal.woff2", weight: "700", style: "normal"}],
  variable: "--wm-serif",
  display: "swap",
  preload: false,
});
const wmBlack = localFont({
  src: [{path: "../../public/fonts/archivo_black-400-normal.woff2", weight: "400", style: "normal"}],
  variable: "--wm-black",
  display: "swap",
  preload: false,
});

/**
 * RotatingWordmark — the landing hero wordmark, EXAGGERATED.
 *
 * "SIGRANK" rendered letter-by-letter, each letter independently cycling
 * through a small font pool (mono → grotesk → serif → archivo-black) on a
 * per-letter stagger, so the word visibly morphs across faces without changing
 * in unison. Driven by the `.wordmark-letter` / `@keyframes wordmark-rotate`
 * rule in globals.css; per-letter delay is set inline via the --wm-delay var.
 *
 * Hero-scale: clamped huge (up to ~9rem), heavy weight, tight tracking. The §
 * coin sits after the word. Reduced-motion locks every letter to the mono face.
 *
 * Hidden for pixel themes, where TerminalWordmark takes over. Inside workspace
 * themes the letters use the theme display font rather than rotating typefaces.
 * The semantic page H1 is server-rendered by Draft2Hero; this animated treatment
 * is exposed as an image-like accessible brand label to avoid a duplicate H1.
 */
const WORD = "SIGRANK".split("");

export function RotatingWordmark() {
  const { isPixel, themeRef } = usePixelWordmark<HTMLDivElement>();

  return (
    <div ref={themeRef} style={{ display: isPixel ? "none" : "flex" }} className={`theme-brand-wordmark ${wmGrotesk.variable} ${wmSerif.variable} ${wmBlack.variable} flex flex-wrap items-center justify-center gap-x-3 gap-y-2`}>
      <div
        aria-label="SIGRANK"
        role="img"
        className="flex select-none items-baseline text-[clamp(3.5rem,13vw,9rem)] font-bold leading-none tracking-[0.04em] text-gold"
      >
        {WORD.map((ch, i) => (
          <span
            key={i}
            aria-hidden
            // i===0 is the S — gets the extra wordmark-letter-s class so it
            // briefly swaps to § (the MO§ES™ glyph) on the serif keyframe slot.
            className={
              i === 0 ? "wordmark-letter wordmark-letter-s" : "wordmark-letter"
            }
            style={{ ["--wm-delay" as string]: `${i * 0.55}s` }}
          >
            {ch}
          </span>
        ))}
      </div>
      <span className="flex h-[clamp(2.5rem,7vw,5rem)] w-[clamp(2.5rem,7vw,5rem)] items-center justify-center rounded-full border-[3px] border-gold font-mono text-[clamp(1.25rem,3.5vw,2.5rem)] text-gold">
        §
      </span>
    </div>
  );
}
