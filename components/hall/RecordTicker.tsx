"use client";

import React from "react";
import Link from "next/link";

/**
 * RecordTicker — the record-highlights marquee for the Hall of Signal.
 *
 * A revival of the archived home/SignalTicker: a horizontal row of record pills
 * (`🥇 Max Ghenis · Υ · 1.2K`) that scrolls continuously, alternating gold /
 * accent left-borders. Pure CSS animation (no JS interval), pauses on hover. The
 * track is duplicated once so the loop is seamless: when the first copy has
 * scrolled fully left, the second copy is exactly where the first started.
 * Respects prefers-reduced-motion (motion-reduce → static, non-scrolling row).
 *
 * Client island only because it owns the marquee animation + hover-pause; the
 * data (each board's #1 holder + value) is computed server-side and passed in.
 */
export interface RecordTickerItem {
  /** Metric ticker the record belongs to (e.g. 'Υ', 'SNR', 'IN'). */
  board: string;
  /** Record holder's display name (real name when present, else codename). */
  holder: string;
  /** Headline record value, already formatted (e.g. '1.2K', '$4.20'). */
  value: string;
  /** Link target (operator profile). */
  href: string;
  /** When true, the holder is an outlier — red asterisk (owner 2026-07-14). */
  outlier?: boolean;
}

export function RecordTicker({ items }: { items: RecordTickerItem[] }) {
  if (items.length === 0) return null;
  // Duplicate the track for a seamless loop.
  const track = [...items, ...items];

  return (
    <div className="group relative overflow-hidden rounded-lg border border-bg-border bg-bg-surface py-2.5">
      {/* edge fades so pills dissolve at the rails rather than hard-cut */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bg-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bg-surface to-transparent" />

      <div className="flex w-max animate-ticker gap-2 group-hover:[animation-play-state:paused]">
        {track.map((it, i) => (
          <Link
            key={`${it.board}-${i}`}
            href={it.href}
            className={`flex shrink-0 items-center gap-2 rounded-md border-l-2 bg-bg-elevated/60 px-3 py-1.5 transition-colors hover:bg-bg-elevated ${
              i % 2 === 0 ? "border-l-gold" : "border-l-accent"
            }`}
          >
            <span className="text-[11px]">🥇</span>
            <span className="font-mono text-xs font-medium text-text-primary">
              {it.holder}
              {it.outlier && (
                <span
                  title="Outlier — excluded from Human Center of Mass"
                  className="ml-1 text-red-500"
                >
                  *
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] text-text-dim">·</span>
            <span className="rounded bg-bg-base/60 px-1.5 py-0.5 font-mono text-[10px] text-gold">
              {it.board}
            </span>
            <span className="font-mono text-[11px] text-text-secondary">
              {it.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
