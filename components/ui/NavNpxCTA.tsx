"use client";

import { usePathname } from "next/navigation";
import { CopyButton } from "@/components/marketing/CopyButton";

/**
 * NavNpxCTA — a floating "npx sigrank" CTA button pinned to the bottom-right
 * corner. Landing page only (pathname === "/"). Stays visible as the user
 * scrolls. Clicking copies "npx sigrank" to clipboard.
 */
export function NavNpxCTA() {
  const pathname = usePathname() ?? "";
  if (pathname !== "/") return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        onClick={undefined}
        className="group relative inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 font-mono text-sm font-bold text-text-primary backdrop-blur-sm shadow-lg shadow-gold/20 transition-all duration-300 hover:border-gold hover:bg-gold/20 hover:shadow-gold/40 sm:text-base"
        style={{
          animation: "npx-glow 2s ease-in-out infinite",
        }}
      >
        <span className="text-gold">$</span>
        <span className="text-text-primary">npx sigrank</span>
        <span className="relative z-10">
          <CopyButton text="npx sigrank" />
        </span>
        <span className="absolute inset-0 rounded-xl bg-gold/10 blur-md" style={{ animation: "npx-pulse 2s ease-in-out infinite" }} />
        <style>{`
          @keyframes npx-glow {
            0%, 100% { box-shadow: 0 0 8px 2px rgba(218, 165, 32, 0.2); }
            50% { box-shadow: 0 0 24px 6px rgba(218, 165, 32, 0.45); }
          }
          @keyframes npx-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </button>
    </div>
  );
}
