/**
 * lib/flags.ts — PostHog feature-flag registry and server-side gates.
 *
 * The flag keys below are created in the PostHog dashboard (Feature Flags)
 * and evaluated remotely via posthog-node (isFeatureEnabledServer). Each
 * helper fails safe to its fallback when PostHog is unconfigured, down, or
 * the flag doesn't exist — flag evaluation never breaks the request path.
 *
 * Rollout is controlled in PostHog: changing a flag's rollout percentage
 * takes effect on the next evaluation with no deploy. On ISR/static pages
 * the evaluated value holds until the next revalidation.
 *
 * Client-side evaluation uses the matching hook instead:
 *   useFeatureFlag("exchange_search")   // lib/infra/posthog/flags.ts
 *
 * Keep this module server-only — it imports posthog-node.
 */
import { isFeatureEnabledServer } from "@/lib/infra/posthog/server";

export const FLAG_EXCHANGE_SEARCH = "exchange_search";
export const FLAG_VERCEL_MARKETPLACE_BADGE = "vercel_marketplace_badge";
export const FLAG_AGENT_EMAIL_NOTIFICATIONS = "agent_email_notifications";
export const FLAG_FIELDHUB_PAGE = "fieldhub-page";

/**
 * Site-wide gates are not personalized: a fixed distinctId keeps every
 * evaluation in the same rollout bucket. If a flag later needs per-operator
 * rollouts, pass the operator's codename as the distinctId instead.
 */
const SITE_DISTINCT_ID = "site-wide";

/**
 * exchange_search — gates the site-wide search surface (nav entry + /search
 * route). 0% rollout until Algolia is connected; fails closed.
 */
export function exchangeSearchEnabled(): Promise<boolean> {
  return isFeatureEnabledServer(SITE_DISTINCT_ID, FLAG_EXCHANGE_SEARCH, false);
}

/**
 * vercel_marketplace_badge — renders the "Available on Vercel" badge on the
 * homepage and board pages. Fails closed (no badge when undecidable).
 */
export function vercelMarketplaceBadgeEnabled(): Promise<boolean> {
  return isFeatureEnabledServer(SITE_DISTINCT_ID, FLAG_VERCEL_MARKETPLACE_BADGE, false);
}

/**
 * agent_email_notifications — gates AgentMail notifications on the exchange.
 * Fails OPEN: when undecidable we keep sending, matching pre-flag behavior —
 * the flag is a rollout dial, not a kill switch.
 */
export function agentEmailNotificationsEnabled(distinctId: string): Promise<boolean> {
  return isFeatureEnabledServer(distinctId, FLAG_AGENT_EMAIL_NOTIFICATIONS, true);
}

/**
 * fieldhub-page — gates the /fieldhub landing page. Fails OPEN: the page is
 * already live, so an undecidable evaluation (PostHog down/unconfigured)
 * keeps it up; only an explicit off in PostHog takes it down (next ISR
 * revalidation, ~1h).
 */
export function fieldhubPageEnabled(): Promise<boolean> {
  return isFeatureEnabledServer(SITE_DISTINCT_ID, FLAG_FIELDHUB_PAGE, true);
}
