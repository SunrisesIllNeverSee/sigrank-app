"use client";

import { useEffect } from "react";

export const GA4_ID = "G-YQCKR06LBH";

// Real-user signals only. Automated sweeps load the page and leave without ever
// producing one of these, so GA4 never sees them. Events are passive and one-shot.
export const GA4_INTERACTION_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/**
 * Loads gtag.js and configures GA4 once, on the first real user interaction.
 * Returns a cleanup that removes the listeners if no interaction has happened.
 * Idempotent: a second call after loading is a no-op.
 */
export function loadGA4OnFirstInteraction(doc: Document = document, id: string = GA4_ID): () => void {
  const win = doc.defaultView as (Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void }) | null;
  if (!win) return () => {};

  const targets: EventTarget[] = [win, doc];
  const opts: AddEventListenerOptions = { passive: true, capture: true };
  let done = false;

  const detach = () => {
    for (const t of targets) for (const e of GA4_INTERACTION_EVENTS) t.removeEventListener(e, onInteract, opts);
  };

  function onInteract() {
    if (done) return;
    done = true;
    detach();
    if (doc.getElementById("ga4-gtag-src")) return;
    win!.dataLayer = win!.dataLayer || [];
    win!.gtag = function gtag() {
      // gtag.js requires the Arguments object, not an array.
      // eslint-disable-next-line prefer-rest-params
      (win!.dataLayer as unknown[]).push(arguments);
    };
    win!.gtag("js", new Date());
    win!.gtag("config", id);
    const s = doc.createElement("script");
    s.id = "ga4-gtag-src";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    doc.head.appendChild(s);
  }

  for (const t of targets) for (const e of GA4_INTERACTION_EVENTS) t.addEventListener(e, onInteract, opts);
  return detach;
}

export function DeferredGA4() {
  useEffect(() => loadGA4OnFirstInteraction(), []);
  return null;
}
