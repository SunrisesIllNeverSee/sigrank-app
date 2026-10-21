"use client";

import { useSyncExternalStore } from "react";

/* owner 2026-10-21: phone = max-width 760px (same breakpoint as the CSS). */
const MQ = "(max-width: 760px)";

function subscribe(cb: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True on phones. SSR and the hydration pass read false (desktop markup),
 *  then it flips after hydration — so no hydration mismatch. */
export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window.matchMedia === "function" ? window.matchMedia(MQ).matches : false),
    () => false,
  );
}
