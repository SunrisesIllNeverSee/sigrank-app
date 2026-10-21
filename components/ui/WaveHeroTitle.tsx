"use client";

import "@/components/home/wordmark.css";
import React from "react";
import { TerminalBlockText } from "@/components/home/TerminalBlockText";
import { usePixelWordmark } from "@/components/home/usePixelWordmark";

/**
 * Uses the enclosing workspace's theme, or the document theme outside a shell.
 * Terminal/Green and Black & Gold use block art; other workspace themes use
 * their display typeface. A hidden semantic heading accompanies decorative art.
 */

export interface WaveHeroTitleProps {
  title: React.ReactNode;
  /** Plain string for the terminal block-letter hero. Omit → never block-render. */
  terminalText?: string;
  /** Compact mode: ~25% size for TOC/preview cards. */
  compact?: boolean;
  /** Heading level: "h1" (default) or "h2" (for sub-sections / card titles). */
  headingLevel?: "h1" | "h2";
}

export function WaveHeroTitle({ title, terminalText, compact = false, headingLevel = "h1" }: WaveHeroTitleProps) {
  const { isPixel, themeRef } = usePixelWordmark<HTMLHeadingElement>();

  const Tag = headingLevel === "h2" ? "h2" : "h1";

  // Pixel theme + a plain string supplied → block-letter hero. The block
  // art is decorative, so a visually-hidden heading keeps the page's one h1
  // (WorkspaceShell omits its own h1 when the hero carries the title).
  if (isPixel && terminalText) {
    // Visual cap only — TerminalBlockText now self-fits to its container via
    // cqw sizing, so these tiers just keep long titles proportionally smaller.
    const baseMax =
      terminalText.length <= 7 ? 1.3 : terminalText.length <= 11 ? 0.95 : 0.7;
    const maxRem = compact ? baseMax * 0.35 : baseMax;
    return (
      <>
        <Tag ref={themeRef} className="sr-only">{title}</Tag>
        <TerminalBlockText
          text={terminalText}
          label={terminalText}
          maxRem={maxRem}
          vw={compact ? "0.7vw" : "1.9vw"}
        />
      </>
    );
  }

  return (
    <Tag
      ref={themeRef}
      className={
        compact
          ? "wave-hero-wordmark text-base font-bold tracking-wide text-text-primary sm:text-lg"
          : "wave-hero-wordmark text-3xl font-bold tracking-wide text-text-primary sm:text-4xl md:text-5xl"
      }
    >
      {title}
    </Tag>
  );
}
