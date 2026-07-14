"use client";

/**
 * components/home/MotionPause.tsx — a floating pause/play toggle for ALL landing
 * motion (owner 2026-06-21: "can we put a pause button on the landing page").
 *
 * Flips `data-landing-motion` on <html> between 'running' and 'paused'. A single
 * CSS rule (globals.css) sets `animation-play-state: paused` on every landing
 * animation class (wordmark ripple · ticker marquee · flip cards · cascade
 * backdrop), so one button freezes everything at once with NO re-render — the
 * animated components never see this state; they just stop mid-frame and resume.
 *
 * The choice persists to localStorage so a visitor who pauses stays paused on
 * return. It also pre-syncs from prefers-reduced-motion: if the OS asks for
 * reduced motion AND the user hasn't made an explicit choice, we default to
 * paused (the CSS already statics those animations, but the button reflects it).
 */

import { useEffect, useState } from "react";

const KEY = "sigrank:landing-motion";
type Motion = "running" | "paused";

function apply(state: Motion) {
  document.documentElement.dataset.landingMotion = state;
}

export function MotionPause() {
  // Start as null until we've read the persisted/OS preference on mount, so the
  // button label doesn't flash the wrong glyph before hydration settles.
  const [motion, setMotion] = useState<Motion | null>(null);

  useEffect(() => {
    let initial: Motion;
    const saved = (typeof window !== "undefined" &&
      localStorage.getItem(KEY)) as Motion | null;
    if (saved === "paused" || saved === "running") {
      initial = saved;
    } else {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      initial = reduce ? "paused" : "running";
    }
    apply(initial);
    setMotion(initial);
    // Scope the attribute to the landing's lifetime: clear it on unmount so a
    // paused state never bleeds onto pages that share an animation class
    // (HallHero's .cascade-pulse, the metrics .flip-inner cards). The choice is
    // still persisted in localStorage, so it re-applies when the landing remounts.
    return () => {
      delete document.documentElement.dataset.landingMotion;
    };
  }, []);

  const toggle = () => {
    const next: Motion = motion === "paused" ? "running" : "paused";
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode / storage disabled — non-fatal, the data-attr still applies */
    }
    setMotion(next);
  };

  const paused = motion === "paused";
  // Before mount we don't know the state — render a neutral, still-functional button.
  const label = paused ? "Play landing motion" : "Pause landing motion";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      aria-label={label}
      title={label}
      className="fixed bottom-5 left-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-bg-border bg-bg-surface/90 text-text-secondary shadow-card backdrop-blur transition-colors hover:border-gold/50 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
    >
      {/* ⏸ when running (click to pause) · ▶ when paused (click to play) */}
      <span aria-hidden className="font-mono text-sm leading-none">
        {paused ? "▶" : "⏸"}
      </span>
    </button>
  );
}
