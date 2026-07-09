/**
 * components/sigrank/PlatformIcon.tsx — small monochrome platform glyphs for the board.
 *
 * Inline SVG marks (no network, no external assets, theme-reactive via `currentColor`)
 * standing in for each platform on the leaderboard's PLATFORM column. Deliberately
 * NOT the brands' real trademarked logos — these are simple, original monochrome
 * glyphs that read cleanly at 16px on the terminal-styled dark board and carry zero
 * trademark surface. The API (`<PlatformIcon platform="claude" />`) is stable, so the
 * internals can later swap to real brand SVGs (e.g. simple-icons) without touching
 * callers — see the README note on real logos.
 *
 * Each glyph is drawn in a 16×16 viewBox with `fill="currentColor"`, so color comes
 * from the cell's text color (theme token). A `title` gives an accessible label.
 */

import React from "react";

export type PlatformKey =
  "claude" | "chatgpt" | "gemini" | "pi" | "codex" | "multi" | "other";

const LABEL: Record<PlatformKey, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  pi: "Pi",
  codex: "Codex",
  multi: "Multi",
  other: "Other",
};

/** Normalize any incoming platform string to a known key (defensive; 'other' fallback). */
export function platformKey(p: string | null | undefined): PlatformKey {
  const k = (p ?? "").toLowerCase();
  return (
    ["claude", "chatgpt", "gemini", "pi", "codex", "multi"] as const
  ).includes(k as never)
    ? (k as PlatformKey)
    : "other";
}

// Original monochrome glyphs (16×16). Each is a distinct, recognizable mark — not a
// brand logo. Drawn with currentColor so they inherit the cell's theme color.
const GLYPH: Record<PlatformKey, React.ReactNode> = {
  // Claude — a radiating sunburst/asterisk (the "spark" motif).
  claude: (
    <g fill="currentColor">
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x="7.2"
          y="1.5"
          width="1.6"
          height="5"
          rx="0.8"
          transform={`rotate(${i * 45} 8 8)`}
        />
      ))}
    </g>
  ),
  // ChatGPT — interlocking hex knot suggested by a rounded six-point ring.
  chatgpt: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      d="M8 2.2 13 5v6L8 13.8 3 11V5z"
    />
  ),
  // Gemini — twin verticals (the "twins" / duality).
  gemini: (
    <g fill="currentColor">
      <rect x="4.2" y="3" width="1.7" height="10" rx="0.85" />
      <rect x="10.1" y="3" width="1.7" height="10" rx="0.85" />
      <rect x="3" y="3" width="10" height="1.6" rx="0.8" />
      <rect x="3" y="11.4" width="10" height="1.6" rx="0.8" />
    </g>
  ),
  // Pi — the π letterform.
  pi: (
    <g fill="currentColor">
      <rect x="2.6" y="3.4" width="10.8" height="1.7" rx="0.85" />
      <rect x="4.6" y="4.6" width="1.7" height="8.4" rx="0.85" />
      <rect x="9.7" y="4.6" width="1.7" height="8.4" rx="0.85" />
    </g>
  ),
  // Codex — angle brackets </>.
  codex: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.6 4.5 2.5 8l3.1 3.5M10.4 4.5 13.5 8l-3.1 3.5"
    />
  ),
  // Multi — overlapping nodes (a small constellation).
  multi: (
    <g fill="currentColor">
      <circle cx="5" cy="5.5" r="2.1" />
      <circle cx="11" cy="6.5" r="2.1" />
      <circle cx="8" cy="11" r="2.1" />
    </g>
  ),
  // Other — a neutral diamond.
  other: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      d="M8 2.5 13.5 8 8 13.5 2.5 8z"
    />
  ),
};

export function PlatformIcon({
  platform,
  size = 16,
  title,
}: {
  platform: string | null | undefined;
  size?: number;
  title?: string;
}) {
  const key = platformKey(platform);
  const label = title ?? LABEL[key];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      aria-label={label}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    >
      <title>{label}</title>
      {GLYPH[key]}
    </svg>
  );
}
