/**
 * lib/stripe/tier.ts — pure supporter-tier resolution (subscription_states.md).
 *
 * No Stripe SDK import here so this is safe to unit-test and import anywhere.
 * The resolver is pure: it takes the subscription rows and an explicit `now`
 * (defaulting to the current time only when the caller does not supply one) so
 * tests / server code stay deterministic.
 */

import type { SupporterTier } from "@/lib/analytics/scoring-types";
import { TIER_PRIORITY } from "@/lib/infra/stripe/server";

/** Days a `past_due` subscription keeps its tier before dropping to free. */
export const GRACE_PERIOD_DAYS = 7;

/** Stripe-canonical subscription statuses (subscription_states.md). */
export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

/** A subscription row as the resolver needs it. */
export interface SubscriptionRecord {
  tier: SupporterTier;
  status: SubscriptionStatus;
  /** ISO 8601 / epoch-ms — when the current paid period ends. */
  current_period_end: string | number;
  /** True for soft cancels (keep tier until period end). */
  cancel_at_period_end: boolean;
}

const MS_PER_DAY = 86_400_000;

function toMs(value: string | number): number {
  return typeof value === "number" ? value : Date.parse(value);
}

/** Whether one subscription resolves to a tier, ignoring multi-sub priority. */
function resolveSingle(sub: SubscriptionRecord, nowMs: number): SupporterTier {
  switch (sub.status) {
    case "active":
    case "trialing":
      return sub.tier;

    case "past_due": {
      // Within grace period (measured from period end)?
      const periodEnd = toMs(sub.current_period_end);
      const daysPastDue = (nowMs - periodEnd) / MS_PER_DAY;
      if (daysPastDue <= GRACE_PERIOD_DAYS) return sub.tier;
      return "free";
    }

    case "canceled": {
      // Soft cancel still inside the paid period keeps the tier.
      const periodEnd = toMs(sub.current_period_end);
      if (sub.cancel_at_period_end && nowMs < periodEnd) return sub.tier;
      return "free";
    }

    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "free";
  }
}

/**
 * getSupporterTier — resolve the effective tier across one or more subscriptions.
 * When multiple subscriptions resolve to a tier, the highest-priority wins
 * (circle_sponsor > pro > patron > free).
 *
 * @param subs       one subscription, an array, or null/undefined (→ 'free')
 * @param now        optional clock override (ms or Date) for deterministic use
 */
export function getSupporterTier(
  subs: SubscriptionRecord | SubscriptionRecord[] | null | undefined,
  now?: number | Date,
): SupporterTier {
  if (!subs) return "free";
  const list = Array.isArray(subs) ? subs : [subs];
  if (list.length === 0) return "free";

  const nowMs =
    now == null ? Date.now() : now instanceof Date ? now.getTime() : now;

  let best: SupporterTier = "free";
  for (const sub of list) {
    const resolved = resolveSingle(sub, nowMs);
    if (TIER_PRIORITY[resolved] > TIER_PRIORITY[best]) best = resolved;
  }
  return best;
}
