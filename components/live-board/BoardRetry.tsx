"use client";
/**
 * BoardRetry — the unavailable-state retry affordance (Phase 1 shell).
 *
 * POSTs to /api/board/retry, which (a) probes the live read — route handlers
 * are not ISR-cached and 'unavailable' results are memo-evicted upstream, so
 * it's a real liveness check — and (b) revalidatePath()s the board page,
 * the only mechanism that regenerates a prerendered ISR page inside its
 * revalidate window. On success we hard-reload for the fresh render; on a
 * still-down response the panel reports it honestly instead of spinning.
 */
import { useState } from "react";
import styles from "./live-board.module.css";

export function BoardRetry({ windowEnum }: { windowEnum: string }) {
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
              `/api/board/retry?window=${encodeURIComponent(windowEnum)}`,
              { method: "POST" },
            );
            if (r.ok) {
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
