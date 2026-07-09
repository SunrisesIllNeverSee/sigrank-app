import "server-only";

/**
 * lib/stripe/server.ts — server-side Stripe client + price→tier mapping.
 *
 * `'server-only'` keeps the secret key off the client. getStripe() returns null
 * when STRIPE_SECRET_KEY is unset so checkout/webhook routes can no-op cleanly
 * (the app builds and renders with no Stripe creds). PRICE_TO_TIER maps the
 * configured price ids to supporter tiers; TIER_PRIORITY ranks tiers when an
 * operator holds more than one active subscription.
 */

import Stripe from "stripe";
import type { SupporterTier } from "@/lib/scoring/types";

const secretKey = process.env.STRIPE_SECRET_KEY;

/** True when the Stripe secret key is present. */
export const STRIPE_CONFIGURED = Boolean(secretKey);

let cached: Stripe | null = null;

/**
 * getStripe — memoized Stripe client, or null if unconfigured.
 * Never throws on missing creds.
 */
export function getStripe(): Stripe | null {
  if (!STRIPE_CONFIGURED) return null;
  if (cached) return cached;
  cached = new Stripe(secretKey as string, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
  return cached;
}

/**
 * PRICE_TO_TIER — maps configured Stripe price ids to supporter tiers.
 * Built from env at module load; unset price ids simply produce no mapping.
 * OPERATOR_OVERRIDE_REQUIRED — set the STRIPE_PRICE_* env vars to live ids.
 */
export const PRICE_TO_TIER: Record<string, SupporterTier> = (() => {
  const map: Record<string, SupporterTier> = {};
  const patron = process.env.STRIPE_PRICE_PATRON_MONTHLY;
  const proMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const proYearly = process.env.STRIPE_PRICE_PRO_YEARLY;
  const circle = process.env.STRIPE_PRICE_CIRCLE_SPONSOR;
  if (patron) map[patron] = "patron";
  if (proMonthly) map[proMonthly] = "pro";
  if (proYearly) map[proYearly] = "pro";
  if (circle) map[circle] = "circle_sponsor";
  return map;
})();

/**
 * TIER_PRIORITY — ordering used to pick the highest tier when an operator has
 * multiple active subscriptions (subscription_states.md edge case).
 */
export const TIER_PRIORITY: Record<SupporterTier, number> = {
  circle_sponsor: 3,
  pro: 2,
  patron: 1,
  free: 0,
};

/** Resolve a price id to its tier, or 'free' if unmapped. */
export function tierForPrice(
  priceId: string | null | undefined,
): SupporterTier {
  if (!priceId) return "free";
  return PRICE_TO_TIER[priceId] ?? "free";
}
