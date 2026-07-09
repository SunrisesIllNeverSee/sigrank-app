"use client";

/**
 * LeaderboardKey — the board's legend popup (owner 2026-06-24).
 *
 * A small "Key" button under the leaderboard hero that opens a modal explaining
 * BOTH the cascade metrics (Υ/SNR/Leverage/…) and the nine transmitter classes.
 * Reads the canonical registries (TOKEN_METRICS + CLASS_TIERS) so it stays in
 * lockstep with the contract — no hand-copied values. Client island (modal state).
 */

import { useState } from "react";
import { TOKEN_METRICS, CLASS_TIERS } from "@/lib/canon/ids";

type Tab = "metrics" | "classes";

export function LeaderboardKey() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("metrics");

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-gold/50 hover:text-text-primary"
      >
        ⊙ Key — metrics &amp; classes
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Leaderboard key"
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-bg-border bg-bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-1 rounded-md border border-bg-border p-0.5">
                <button
                  type="button"
                  onClick={() => setTab("metrics")}
                  className={
                    tab === "metrics"
                      ? "rounded px-3 py-1 font-mono text-xs font-bold text-gold"
                      : "rounded px-3 py-1 font-mono text-xs text-text-muted hover:text-text-primary"
                  }
                >
                  Cascade metrics
                </button>
                <button
                  type="button"
                  onClick={() => setTab("classes")}
                  className={
                    tab === "classes"
                      ? "rounded px-3 py-1 font-mono text-xs font-bold text-gold"
                      : "rounded px-3 py-1 font-mono text-xs text-text-muted hover:text-text-primary"
                  }
                >
                  The nine classes
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 font-mono text-sm text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            {tab === "metrics" ? (
              <div className="flex flex-col gap-1.5">
                {Object.values(TOKEN_METRICS).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-baseline gap-2 border-b border-bg-border-subtle py-1.5 last:border-b-0"
                  >
                    <span className="w-14 shrink-0 font-mono text-sm font-bold text-text-accent">
                      {m.ticker}
                    </span>
                    <span className="shrink-0 font-mono text-[13px] text-text-primary">
                      {m.name}
                    </span>
                    <span className="ml-auto text-right font-mono text-[11px] leading-snug text-text-secondary">
                      {m.formula}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {Object.values(CLASS_TIERS).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-baseline gap-3 border-b border-bg-border-subtle py-1.5 last:border-b-0"
                  >
                    <span
                      aria-hidden
                      className="w-5 shrink-0 text-center font-mono text-base"
                      style={{ color: c.hex }}
                    >
                      {c.glyph}
                    </span>
                    <span
                      className="w-28 shrink-0 font-mono text-[13px] font-bold"
                      style={{ color: c.hex }}
                    >
                      {c.name}
                    </span>
                    <span className="font-sans text-xs leading-snug text-text-secondary">
                      {c.meaning}
                    </span>
                  </div>
                ))}
                <p className="mt-2 font-sans text-[11px] leading-relaxed text-text-muted">
                  Class is assigned from your cascade — SNR and 10xDEV,
                  whichever is more restrictive. TRANSMITTER is rare on purpose.
                  Exact breakpoints are proprietary (RS.05).
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
