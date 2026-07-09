"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * components/billing/CheckoutRedirect.tsx — client-only Stripe.js loader + the
 * shared checkout-start helper.
 *
 * loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is called ONLY here, on the
 * client. The publishable key is the only Stripe key safe in the browser; the
 * secret key never leaves the server (lib/stripe/server.ts is 'server-only').
 *
 * The actual redirect uses the Checkout Session `url` returned by our API
 * routes (server-created sessions), so a missing publishable key does not block
 * the redirect — `getStripeClient()` is exported for any future client-side
 * Stripe.js needs (e.g. Elements) without re-loading the SDK.
 */

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

/** Memoized client-side Stripe.js instance, or null when no publishable key. */
export function getStripeClient(): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

/** Outcome of a checkout start attempt — drives UI messaging. */
export type CheckoutOutcome =
  { ok: true } | { ok: false; reason: "not_configured" | "failed" };

/**
 * startCheckout — POST to a billing endpoint, then redirect to the returned
 * Stripe Checkout url. Returns a CheckoutOutcome instead of throwing so callers
 * can show "Try again later" on a 503. On success the browser navigates away.
 */
export async function startCheckout(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<CheckoutOutcome> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 503) return { ok: false, reason: "not_configured" };
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      window.location.assign(data.url);
      return { ok: true };
    }
    return { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
