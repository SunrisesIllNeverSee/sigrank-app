"use client";

import { useEffect } from "react";
import { track } from "@/lib/infra/posthog/events";

/**
 * Client island that fires payment_succeeded when the user lands on
 * /upgrade/success after a Stripe Checkout completion. Reads the kind
 * and amount from URL search params if Stripe passes them back.
 */
export function PaymentSuccessTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get("kind") === "subscription" ? "subscription" : "donation";
    const amount = Number(params.get("amount_usd") ?? 0);
    track.paymentSucceeded({
      kind,
      amount_usd: amount,
    });
  }, []);

  return null;
}
