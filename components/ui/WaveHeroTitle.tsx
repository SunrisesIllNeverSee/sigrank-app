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
}

export function WaveHeroTitle({ title, terminalText }: WaveHeroTitleProps) {
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
    const maxRem =
      terminalText.length <= 7 ? 1.3 : terminalText.length <= 11 ? 0.95 : 0.7;
    return (
      <TerminalBlockText
        text={terminalText}
        label={terminalText}
        fontClassName={`text-[clamp(0.4rem,1.9vw,${maxRem}rem)]`}
      />
    );
  }

  return (
    <h1 className="font-mono text-3xl font-bold tracking-wide text-text-primary sm:text-4xl md:text-5xl">
      {title}
    </h1>
  );
}
