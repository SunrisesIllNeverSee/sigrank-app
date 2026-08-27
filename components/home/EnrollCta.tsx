"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * EnrollCta — the direct "run this now" call to action.
 *
 * A copy-to-clipboard command block showing `npx sigrank` with a one-line
 * pitch. Designed to sit in the hero so a first-time visitor sees the exact
 * command they need to run, without navigating to /developers or /pricing.
 *
 * Client component (uses useState for the "copied" feedback).
 */
export function EnrollCta({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText("npx sigrank");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be blocked — the command is still visible to type
    }
  }

  return (
    <div className={"flex flex-col items-center gap-3 " + className}>
      <div className="flex items-center gap-3">
        <button
          onClick={copyCommand}
          className="group flex items-center gap-3 rounded-lg border border-gold/40 bg-bg-base px-5 py-3 font-mono text-sm sm:text-base transition-all hover:border-gold hover:bg-bg-elevated hover:shadow-lg hover:shadow-gold/10"
          aria-label="Copy npx sigrank command to clipboard"
        >
          <span className="text-text-muted select-none">$</span>
          <span className="text-text-primary font-semibold">npx sigrank</span>
          <span className="text-text-muted text-xs uppercase tracking-wide transition-colors group-hover:text-gold">
            {copied ? "copied ✓" : "copy"}
          </span>
        </button>
      </div>
      <p className="text-center font-sans text-xs text-text-muted sm:text-sm">
        No install required. No account needed.{" "}
        <Link
          href="/score"
          className="text-gold underline underline-offset-2 hover:text-text-primary"
        >
          Or paste your numbers →
        </Link>
      </p>
    </div>
  );
}
