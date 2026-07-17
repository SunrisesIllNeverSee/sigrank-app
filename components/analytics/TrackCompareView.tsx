"use client";

import { useEffect } from "react";
import { track } from "@/lib/posthog/events";

/**
 * Fires compare_viewed when a user lands on /compare with both operators
 * selected. isDefault distinguishes the default "you vs field" landing from
 * a user-chosen pair (both ?a= and ?b= present in the URL).
 */
export function TrackCompareView({ isDefault }: { isDefault: boolean }) {
  useEffect(() => {
    track.compareViewed({ isDefault });
  }, [isDefault]);
  return null;
}
