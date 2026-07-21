"use client";

import { useEffect } from "react";
import { track } from "@/lib/infra/posthog/events";

/**
 * Fires profile_viewed on mount. is_own is resolved exactly like ProfileEditModal:
 * GET /api/v1/profile returns the session operator ({ operator: { codename } }), and
 * ownership is a codename match. Skips the fetch entirely when PostHog is off.
 */
export function TrackProfileView({ codename }: { codename: string }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    let alive = true;
    fetch("/api/v1/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (!alive) return;
        const isOwn = !!d?.operator && d.operator.codename === codename;
        track.profileViewed(isOwn);
      })
      .catch(() => {
        if (alive) track.profileViewed(false);
      });
    return () => {
      alive = false;
    };
  }, [codename]);
  return null;
}
