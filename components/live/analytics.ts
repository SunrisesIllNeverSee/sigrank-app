/**
 * components/live/analytics.ts — workspace funnel events, following the
 * repo's typed-surface convention (lib/infra/posthog/events.ts — same `on()`
 * env guard + `baseProps()` domain/env shape). Lives here instead of
 * events.ts because the 2B change-set is scoped to components/live/**; the
 * names mirror the shared snake_case vocabulary so they can be promoted into
 * the central `track` surface later without a call-site change.
 *
 * `posthog` is the lazy proxy (lib/infra/posthog/client): no-ops until
 * posthog-js loads, so every call is safe on keyless local/mock builds.
 */
import { posthog } from "@/lib/infra/posthog/client";

const on = () =>
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  !!process.env.NEXT_PUBLIC_sigrank_POSTHOG_PROJECT_TOKEN;

const baseProps = () => ({
  domain: typeof window !== "undefined" ? window.location.hostname : "unknown",
  env: process.env.NEXT_PUBLIC_VERCEL_ENV ??
    (process.env.NODE_ENV === "production" ? "production" : "development"),
});

export const liveTrack = {
  /** Operator selection (row click / rail click / hall hex) — the drill
   *  surface's "open" event. */
  operatorSelected: (extra: { codename: string; rank: number | null }) => {
    if (on())
      posthog.capture("live_board_operator_selected", {
        ...extra,
        ...baseProps(),
      });
  },
  /** Theme swatch click (LB-20 palette switching, now persisted). */
  themeChanged: (theme: string) => {
    if (on())
      posthog.capture("live_board_theme_changed", { theme, ...baseProps() });
  },
};
