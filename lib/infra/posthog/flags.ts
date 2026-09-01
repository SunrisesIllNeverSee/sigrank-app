"use client";

import { useEffect, useState } from "react";
import { posthog } from "@/lib/infra/posthog/client";

/**
 * useFeatureFlag — evaluate a PostHog feature flag on the client.
 *
 * Returns `undefined` while the flag is loading, then the boolean value
 * once PostHog resolves it. No-ops to `false` when PostHog is not
 * configured (no env key) — so flags are purely additive: the app
 * works without them, and enabling a flag only unlocks new behavior.
 *
 * Usage:
 *   const showExchangeSearch = useFeatureFlag("exchange_search");
 *   if (showExchangeSearch) { ... }
 *
 * Flags are evaluated on mount and re-evaluated when PostHog loads.
 * For flags that need to respond to identity changes (login/logout),
 * the PostHogIdentify component triggers a reload which propagates
 * via the `posthog.onFeatureFlags` callback.
 */
export function useFeatureFlag(
  key: string,
  fallback = false,
): boolean {
  const [enabled, setEnabled] = useState(fallback);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    let mounted = true;

    const check = () => {
      if (!mounted) return;
      const value = posthog.isFeatureEnabled(key);
      if (value !== undefined) {
        setEnabled(value);
      }
    };

    // Check immediately (PostHog may already be loaded)
    check();

    // Re-check when flags are loaded/refreshed
    const unsubscribe = posthog.onFeatureFlags(check);

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [key]);

  return enabled;
}

/**
 * useFeatureFlagPayload — evaluate a PostHog feature flag with a JSON
 * payload (multivariate flags). Returns `null` while loading or when
 * PostHog is not configured.
 *
 * Usage:
 *   const config = useFeatureFlagPayload("exchange_config");
 *   if (config) { const maxSignals = config.max_signals; }
 */
export function useFeatureFlagPayload<T = unknown>(
  key: string,
): T | null {
  const [payload, setPayload] = useState<T | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    let mounted = true;

    const check = () => {
      if (!mounted) return;
      const value = posthog.getFeatureFlagPayload(key);
      if (value !== undefined && value !== null) {
        setPayload(value as T);
      }
    };

    check();
    const unsubscribe = posthog.onFeatureFlags(check);

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [key]);

  return payload;
}
