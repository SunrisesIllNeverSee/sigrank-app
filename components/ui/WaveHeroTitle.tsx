"use client";

import React, { useEffect, useState } from "react";
import { TerminalBlockText } from "@/components/home/TerminalBlockText";

/**
 * WaveHeroTitle — the WaveHero H1, theme-aware.
 *
 * Under the terminal theme (and only then), if the caller supplied a plain
 * `terminalText`, the title renders as block-letter art via the shared
 * TerminalBlockText engine — matching the landing SIGRANK wordmark. Every other
 * theme (and any page that omits terminalText) renders the existing styled <h1>
 * untouched, so carbon/paper/railway heroes are byte-identical to before.
 *
 * Client-only because it reads data-theme off <html> (set by ThemeToggle), the
 * same detection pattern TerminalWordmark uses. Kept as a small leaf so the rest
 * of WaveHero stays a server component.
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
  const [isTerminal, setIsTerminal] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsTerminal(
        document.documentElement.getAttribute("data-theme") === "terminal",
      );
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Terminal theme + a plain string supplied → block-letter hero.
  if (isTerminal && terminalText) {
    // Wider words need a smaller clamp ceiling so they fit without an x-scroll
    // gutter; scale the max down as the word grows past ~7 chars (SIGRANK).
    const baseMax =
      terminalText.length <= 7 ? 1.3 : terminalText.length <= 11 ? 0.95 : 0.7;
    const maxRem = compact ? baseMax * 0.35 : baseMax;
    return (
      <TerminalBlockText
        text={terminalText}
        label={terminalText}
        fontClassName={`text-[clamp(0.3rem,${compact ? 0.7 : 1.9}vw,${maxRem}rem)]`}
      />
    );
  }

  const Tag = headingLevel === "h2" ? "h2" : "h1";
  return (
    <Tag
      className={
        compact
          ? "font-mono text-base font-bold tracking-wide text-text-primary sm:text-lg"
          : "font-mono text-3xl font-bold tracking-wide text-text-primary sm:text-4xl md:text-5xl"
      }
    >
      {title}
    </Tag>
  );
}
