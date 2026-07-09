"use client";

import React from "react";

/**
 * CascadeHeader — an animated "signal cascade" backdrop for the landing
 * wordmark.
 *
 * The visual metaphor (CANON §IV): a few input tokens enter from the left and
 * CASCADE — each pass amplified by cache reuse — into a widening fan of output
 * signal on the right. We render it as a layered SVG of flowing particle
 * streams: thin lines that travel left→right along bezier paths, gaining
 * brightness as they fan out, so the eye reads "small in → large amplified out".
 *
 * Pure SVG + CSS animation (no canvas RAF loop) so it's cheap and SSR-safe.
 * Honors prefers-reduced-motion: when set, the streams render static (the
 * paths + nodes still draw, they just don't travel). Locked palette only
 * (gold + cascade-accent via theme tokens, referenced as currentColor / vars).
 *
 * Sits absolutely behind the wordmark (z-0); the wordmark content sits z-10.
 */

// Each stream: a bezier from a tight left origin to a fanned-out right target.
// dur/delay stagger the pulses so the cascade reads as continuous flow.
const STREAMS: { d: string; dur: number; delay: number; gold: boolean }[] = [
  {
    d: "M -20 100 C 200 100, 360 40,  640 28",
    dur: 5.5,
    delay: 0.0,
    gold: true,
  },
  {
    d: "M -20 100 C 200 100, 360 70,  640 64",
    dur: 6.2,
    delay: 0.6,
    gold: false,
  },
  {
    d: "M -20 100 C 200 100, 360 100, 660 100",
    dur: 5.0,
    delay: 0.3,
    gold: true,
  },
  {
    d: "M -20 100 C 200 100, 360 130, 640 136",
    dur: 6.6,
    delay: 0.9,
    gold: false,
  },
  {
    d: "M -20 100 C 200 100, 360 160, 640 172",
    dur: 5.8,
    delay: 0.2,
    gold: true,
  },
  {
    d: "M -20 100 C 240 100, 380 55,  640 46",
    dur: 7.0,
    delay: 1.2,
    gold: false,
  },
  {
    d: "M -20 100 C 240 100, 380 145, 640 154",
    dur: 6.0,
    delay: 1.5,
    gold: true,
  },
];

export function CascadeHeader({
  slowFactor = 1,
}: { slowFactor?: number } = {}) {
  // slowFactor multiplies each stream's animation duration. Default 1 (live
  // landing, unchanged); draft2 passes >1 for a calmer, slower cascade.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
    >
      <svg
        viewBox="0 0 640 200"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          {/* Brighten-to-the-right gradient so output reads as amplified. */}
          <linearGradient id="cascade-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.05" />
            <stop
              offset="100%"
              stopColor="rgb(var(--gold))"
              stopOpacity="0.55"
            />
          </linearGradient>
          <linearGradient id="cascade-accent" x1="0" y1="0" x2="1" y2="0">
            <stop
              offset="0%"
              stopColor="rgb(var(--accent))"
              stopOpacity="0.04"
            />
            <stop
              offset="100%"
              stopColor="rgb(var(--accent))"
              stopOpacity="0.4"
            />
          </linearGradient>
        </defs>

        {STREAMS.map((s, i) => (
          <g key={i}>
            {/* the faint static path the pulse travels along */}
            <path
              d={s.d}
              fill="none"
              stroke={s.gold ? "url(#cascade-gold)" : "url(#cascade-accent)"}
              strokeWidth="1"
            />
            {/* the travelling pulse: a short dash that runs the path length.
                pathLength=1 normalizes so the same dash math works on any path. */}
            <path
              d={s.d}
              fill="none"
              stroke={s.gold ? "rgb(var(--gold))" : "rgb(var(--accent))"}
              strokeWidth="1.75"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="0.12 0.88"
              className="cascade-pulse motion-reduce:[animation:none] motion-reduce:[stroke-dashoffset:0]"
              style={{
                ["--dur" as string]: `${s.dur * slowFactor}s`,
                ["--delay" as string]: `${s.delay}s`,
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
