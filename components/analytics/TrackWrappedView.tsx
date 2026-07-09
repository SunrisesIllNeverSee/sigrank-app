"use client";

import { useEffect } from "react";
import { track } from "@/lib/posthog/events";

/** Fires wrapped_viewed once on mount of the operator Wrapped page. */
export function TrackWrappedView() {
  useEffect(() => {
    track.wrappedViewed();
  }, []);
  return null;
}
