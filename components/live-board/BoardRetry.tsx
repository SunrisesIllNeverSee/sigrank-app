"use client";
/**
 * BoardRetry — the unavailable-state retry affordance (Phase 1 shell).
 *
 * Probes /api/v1/leaderboard?scope=live directly: route handlers are not
 * ISR-cached and 'unavailable' results are evicted from the data-layer memo
 * on resolve, so this is a real liveness check, not a cached replay. On
 * recovery it router.refresh()es for the fresh server render; if the outage
 * persists it reports that honestly instead of spinning.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./live-board.module.css";

export function BoardRetry({ windowEnum }: { windowEnum: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "down">("idle");
  return (
    <div className={styles.retryRow}>
      <button
        type="button"
        className={styles.retryBtn}
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          try {
            const r = await fetch(
              `/api/v1/leaderboard?scope=live&window=${encodeURIComponent(windowEnum)}&limit=1`,
              { cache: "no-store" },
            );
            const d = r.ok ? await r.json() : null;
            if (d && d.source && d.source !== "unavailable") {
              // Data layer is back — pull a fresh server render.
              router.refresh();
              window.location.reload();
              return;
            }
            setState("down");
          } catch {
            setState("down");
          }
        }}
      >
        {state === "busy" ? "Checking…" : "Retry"}
      </button>
      {state === "down" && (
        <span className={styles.retryNote} role="status">
          Still unavailable — the board re-checks automatically on its refresh
          cycle.
        </span>
      )}
    </div>
  );
}
