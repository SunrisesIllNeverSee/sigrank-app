"use client";

import React, { useEffect, useState } from "react";
import { Space_Grotesk, Bitter, Archivo_Black } from "next/font/google";
import "./wordmark.css";

const wmGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--wm-grotesk",
  display: "swap",
  preload: false,
});
const wmSerif = Bitter({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--wm-serif",
  display: "swap",
  preload: false,
});
const wmBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--wm-black",
  display: "swap",
  preload: false,
});

const WORD = "SIGRANK".split("");

export function RotatingWordmark() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      setHidden(
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

  if (hidden) return null;

  return (
    <div className={`${wmGrotesk.variable} ${wmSerif.variable} ${wmBlack.variable} flex flex-wrap items-center justify-center gap-x-3 gap-y-2`}>
      <div
        aria-label="SIGRANK"
        role="img"
        className="flex select-none items-baseline text-[clamp(3.5rem,13vw,9rem)] font-bold leading-none tracking-[0.04em] text-gold"
      >
        {WORD.map((ch, i) => (
          <span
            key={i}
            aria-hidden
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
