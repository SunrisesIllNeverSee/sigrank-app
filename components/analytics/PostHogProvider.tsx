"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, posthog } from "@/lib/infra/posthog/client";
import { PostHogIdentify } from "./PostHogIdentify";

/**
 * Client island that boots PostHog and emits manual SPA pageviews. The root
 * layout stays a server component; this wraps the body content so every route
 * change is captured and `posthog` is available to downstream client components.
 * Everything no-ops when NEXT_PUBLIC_POSTHOG_KEY is unset.
 *
 * Feature flags are loaded automatically by posthog-js on init. The
 * `useFeatureFlag` hook in lib/infra/posthog/flags.ts subscribes to flag
 * changes via `posthog.onFeatureFlags()` and re-renders when flags update.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      {children}
      <PostHogIdentify />
      {/* useSearchParams() needs a Suspense boundary to avoid de-opting the whole
          tree to client rendering / failing static generation in Next App Router. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Child effects run before the parent's init effect on first mount, so ensure
    // init here too (idempotent) — otherwise the very first pageview would be lost.
    initPostHog();
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    // A01-7: Parse UTM params on landing and register as super properties so
    // they persist across the session for first-touch attribution.
    const utm = searchParams;
    const utmProps: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const val = utm.get(key);
      if (val) utmProps[key] = val;
    }
    if (Object.keys(utmProps).length > 0) {
      posthog.register(utmProps);
    }
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      domain: window.location.hostname,
      env: process.env.NEXT_PUBLIC_VERCEL_ENV
        ?? (process.env.NODE_ENV === "production" ? "production" : "development"),
    });
  }, [pathname, searchParams]);

  return null;
}
