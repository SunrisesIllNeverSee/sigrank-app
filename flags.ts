/**
 * flags.ts — Vercel Flags SDK + PostHog adapter.
 *
 * This is the Vercel-native way to evaluate PostHog feature flags server-side,
 * before the page renders. Flags evaluated here are available via the
 * `useFlag` / `verifyFlag` helpers from `flags/next` in server components and
 * via the `@flags-sdk/posthog` adapter in middleware.
 *
 * The identify function resolves the current user's codename from the Supabase
 * session — the same distinct ID used by PostHogIdentify (client-side) and
 * captureServer (server-side). This ensures the same user gets the same flag
 * value on client and server.
 *
 * No-ops to an anonymous distinct ID when:
 * - PostHog is not configured (no NEXT_PUBLIC_POSTHOG_KEY)
 * - The user is not signed in
 * - Supabase is unavailable
 *
 * Usage in server components:
 *   import { exchangeSearchFlag } from "@/flags";
 *   const showSearch = await exchangeSearchFlag();
 *
 * Create the corresponding flag in PostHog dashboard → Feature Flags → New.
 */

import { postHogAdapter } from "@flags-sdk/posthog";
import { flag, dedupe } from "flags/next";
import type { Identify } from "flags";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";

// Anonymous fallback — used when the user is not signed in or PostHog is
// not configured. PostHog still buckets anonymous users consistently, so
// percentage rollouts work even for logged-out visitors.
const ANONYMOUS_DISTINCT_ID = "anonymous";

/**
 * Identify the current user for flag evaluation. Returns the codename as the
 * distinct ID — the same key PostHogIdentify uses client-side and captureServer
 * uses server-side. This keeps flag bucketing consistent across all surfaces.
 */
export const identify = dedupe(async () => {
  // No PostHog key → no point resolving identity, return anonymous.
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return { distinctId: ANONYMOUS_DISTINCT_ID };
  }

  try {
    const operator = await getSessionOperator();
    if (operator?.codename) {
      return { distinctId: operator.codename };
    }
  } catch {
    // Session resolution failed — fall through to anonymous.
  }

  return { distinctId: ANONYMOUS_DISTINCT_ID };
}) satisfies Identify<{ distinctId: string }>;

// ── Feature flags ───────────────────────────────────────────────────────
//
// Each flag here must have a matching flag created in the PostHog dashboard
// (Feature Flags → New). The key must match exactly.
//
// To add a new flag:
// 1. Create it in PostHog dashboard with the same key
// 2. Add a flag() definition here
// 3. Use it in a server component: `const enabled = await myFlag();`

/**
 * exchange_search — gates the Algolia-powered site-wide search.
 * Off by default until Algolia is connected and indexed.
 */
export const exchangeSearchFlag = flag({
  key: "exchange_search",
  adapter: postHogAdapter,
  identify,
});

/**
 * vercel_marketplace_badge — shows a "Available on Vercel" badge on the
 * homepage and board pages. On by default.
 */
export const vercelMarketplaceBadgeFlag = flag({
  key: "vercel_marketplace_badge",
  adapter: postHogAdapter,
  identify,
});

/**
 * agent_email_notifications — gates AgentMail notifications on the exchange.
 * On by default when AgentMail is configured.
 */
export const agentEmailNotificationsFlag = flag({
  key: "agent_email_notifications",
  adapter: postHogAdapter,
  identify,
});
