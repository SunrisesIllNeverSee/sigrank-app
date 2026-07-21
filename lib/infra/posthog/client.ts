import posthog from "posthog-js";

// Module-level guard so init runs exactly once per page load, independent of
// posthog-js internals (avoids relying on the undocumented `__loaded` flag).
let initialized = false;

/**
 * Initialise PostHog in the browser. No-ops cleanly when the project key is
 * unset — local/mock builds, or before `NEXT_PUBLIC_POSTHOG_KEY` lands in Vercel.
 * Mirrors the repo's Stripe/Supabase "unset → no throw" convention so analytics
 * is purely additive: nothing phones home until the key exists.
 */
export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined" || initialized) return;
  initialized = true;
  posthog.init(key, {
    // Talk to our own origin (/ingest) — the next.config.ts reverse proxy forwards
    // to PostHog cloud. Keeps analytics alive past ad-blockers + no third-party domain.
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false, // SPA pageviews are sent manually in PostHogProvider
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    // Web vitals auto-collection is the #1 event source (37% of all events) and
    // none are on any dashboard. Disable to cut ~7,100 events/30d + serverless
    // invocations on the /ingest proxy. Re-enable if we start monitoring CWV.
    capture_performance: false,
    // Privacy is the moat ("we don't read your content"). Even if session replay is
    // enabled in the PostHog project, mask ALL input + textarea values and all text by
    // config — so pasted ccusage token data is never recorded. Belt-and-suspenders with
    // the ph-no-capture class on the paste textarea (components/submit/PasteForm.tsx). (salvaged from PR #16)
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
    },
  });
}

export { posthog };
