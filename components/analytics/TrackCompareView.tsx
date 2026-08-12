"use client";

import { useEffect } from "react";
import { track } from "@/lib/infra/posthog/events";

/**
 * Fires compare_viewed when a user lands on /compare with both operators
 * selected. isDefault distinguishes the default "you vs field" landing from
 * a user-chosen pair (both ?a= and ?b= present in the URL).
 *
 * Also bumps the "comparisons_ran" site counter when both operands are chosen.
 * This was previously done server-side (with headers() prefetch detection),
 * but moved client-side so the /compare page can be ISR (no headers() = no
 * dynamic rendering). The fire-and-forget fetch is fully defensive.
 */
export function TrackCompareView({ isDefault }: { isDefault: boolean }) {
  useEffect(() => {
    track.compareViewed({ isDefault });
    if (!isDefault) {
      // Bump the site counter (fire-and-forget, errors swallowed server-side).
      fetch("/api/v1/stats/compare-bump", { method: "POST" }).catch(() => {});
    }
  }, [isDefault]);
  return null;
}
