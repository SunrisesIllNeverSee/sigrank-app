"use client";

import { useEffect } from "react";
import { initPostHog, posthog } from "@/lib/posthog/client";

// Marks that THIS browser identified an operator, so a later logged-out load can
// reset() to a fresh anonymous id instead of leaking the prior person.
const IDENTIFIED_FLAG = "sigrank_ph_identified";

/**
 * Stitches the anonymous browser session to the operator on (re)load. Identifies by
 * CODENAME — the same id the server-side activation events (operator_enrolled /
 * snapshot_submitted) key on — so pre-login board browsing and post-login API events
 * land on one person. No supabaseUserId/operator_id exists client-side (and the server
 * has none either), so codename is the correct unifying key. No-ops without the key.
 */
export function PostHogIdentify() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    initPostHog();
    let alive = true;
    fetch("/api/v1/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (!alive) return;
        const codename: string | undefined = d?.operator?.codename;
        if (codename) {
          // identify() merges the current anonymous person into the codename person.
          if (posthog.get_distinct_id?.() !== codename) {
            posthog.identify(codename, { codename });
          }
          try {
            localStorage.setItem(IDENTIFIED_FLAG, codename);
          } catch {
            /* storage blocked — identify still applied for this load */
          }
        } else {
          // Logged out: if we'd identified earlier, reset to a fresh anonymous id.
          let hadIdentified = false;
          try {
            hadIdentified = !!localStorage.getItem(IDENTIFIED_FLAG);
          } catch {
            /* ignore */
          }
          if (hadIdentified) {
            posthog.reset();
            try {
              localStorage.removeItem(IDENTIFIED_FLAG);
            } catch {
              /* ignore */
            }
          }
        }
      })
      .catch(() => {
        /* best-effort — never block on identify */
      });
    return () => {
      alive = false;
    };
  }, []);
  return null;
}
