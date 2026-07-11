"use client";

import { usePathname } from "next/navigation";
import { CopyButton } from "@/components/marketing/CopyButton";

/**
 * NavNpxCTA — the glowing "npx sigrank" CTA button in the nav bar.
 * Landing page only (pathname === "/"). Hidden on all other routes.
 * Clicking copies "npx sigrank" to clipboard.
 */
export function NavNpxCTA() {
  const pathname = usePathname() ?? "";
  if (pathname !== "/") return null;

  return (
    <button
      onClick={undefined}
      className="group relative inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3.5 py-1.5 font-mono text-sm font-bold text-text-primary shadow-sm shadow-gold/20 transition-all duration-300 hover:border-gold hover:bg-gold/20 hover:shadow-gold/40"
      style={{
        animation: "npx-glow 2s ease-in-out infinite",
      }}
    >
      <span className="text-gold">$</span>
      <span className="text-text-primary">npx sigrank</span>
      <span className="relative z-10 hidden sm:inline-flex">
        <CopyButton text="npx sigrank" />
      </span>
      <span className="absolute inset-0 rounded-lg bg-gold/10 blur-md" style={{ animation: "npx-pulse 2s ease-in-out infinite" }} />
      <style>{`
        @keyframes npx-glow {
          0%, 100% { box-shadow: 0 0 6px 1px rgba(218, 165, 32, 0.2); }
          50% { box-shadow: 0 0 18px 4px rgba(218, 165, 32, 0.4); }
        }
        @keyframes npx-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </button>
  );
}
