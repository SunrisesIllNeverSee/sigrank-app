import "server-only";

/**
 * lib/stripe/rewards.ts — supporter-tier reward grant / revoke (server-only).
 *
 * Maps a resolved SupporterTier to the canonical reward set (RW.16–RW.27) and
 * recomputes the operator's supporter tier from the full set of subscription
 * rows using the pure resolver in lib/stripe/tier.ts. All DB writes are
 * getSupabaseService()-guarded by the caller (handlers.ts); the functions here
 * are pure mappings plus a single guarded persistence helper.
 *
 * Reward catalog (lib/canon/ids.ts REWARDS):
 *   patron         → RW.16, RW.17, RW.18
 *   pro            → RW.19..RW.24 (includes all patron rewards via RW.19)
 *   circle_sponsor → RW.25, RW.26, RW.27
 */

import { getSupabaseService } from "@/lib/infra/supabase/server";
import type { SupporterTier } from "@/lib/analytics/scoring-types";
import { getSupporterTier, type SubscriptionRecord } from "@/lib/infra/stripe/tier";

/** Canonical reward ids unlocked by each supporter tier (REWARD_TIERS.md). */
export const TIER_REWARDS: Record<SupporterTier, string[]> = {
  free: [],
  patron: ["RW.16", "RW.17", "RW.18"],
  pro: ["RW.19", "RW.20", "RW.21", "RW.22", "RW.23", "RW.24"],
  circle_sponsor: ["RW.25", "RW.26", "RW.27"],
};

/**
 * rewardsForTier — the full set of reward ids an operator at `tier` holds.
 * Pro implicitly includes Patron rewards (RW.19 == "All Patron rewards"), and
 * circle_sponsor stacks on top of pro. Returned sorted + de-duplicated so the
 * grant set is deterministic.
 */
export function rewardsForTier(tier: SupporterTier): string[] {
  const set = new Set<string>();
  const add = (t: SupporterTier) =>
    TIER_REWARDS[t].forEach((id) => set.add(id));
  switch (tier) {
    case "circle_sponsor":
      add("circle_sponsor");
      add("pro");
      add("patron");
      break;
    case "pro":
      add("pro");
      add("patron");
      break;
    case "patron":
      add("patron");
      break;
    case "free":
    default:
      break;
  }
  return [...set].sort();
}

/** A grant/revoke plan: which rewards to grant and which to revoke. */
export interface RewardDelta {
  tier: SupporterTier;
  grant: string[];
  revoke: string[];
}

/**
 * diffRewards — given the previous and next tier, compute which rewards to
 * grant (held at next but not previous) and revoke (held at previous but not
 * next). Pure — no I/O.
 */
export function diffRewards(
  prevTier: SupporterTier,
  nextTier: SupporterTier,
): RewardDelta {
  const prev = new Set(rewardsForTier(prevTier));
  const next = new Set(rewardsForTier(nextTier));
  const grant = [...next].filter((id) => !prev.has(id)).sort();
  const revoke = [...prev].filter((id) => !next.has(id)).sort();
  return { tier: nextTier, grant, revoke };
}

/**
 * recomputeSupporterTier — resolve the effective supporter tier from the set of
 * subscription rows using the pure resolver. `now` is injectable for
 * deterministic use; callers in webhook handlers pass the event-derived time.
 */
export function recomputeSupporterTier(
  subs: SubscriptionRecord | SubscriptionRecord[] | null | undefined,
  now?: number | Date,
): SupporterTier {
  return getSupporterTier(subs, now);
}

/**
 * applyRewardsForOperator — persist a tier change for one operator:
 *   1. UPDATE operators.current_supporter_tier (canonical column, schema.sql §1)
 *   2. compute the per-reward grant/revoke delta (returned for observability)
 *
 * NOTE: the canonical schema has no per-reward table — the reward set an
 * operator holds is fully derived from operators.current_supporter_tier via
 * rewardsForTier(). The grant/revoke delta is therefore computed and logged for
 * audit, but NOT persisted to a separate table (there is nothing to persist to).
 * If a denormalized operator_rewards table is added later (see migration 0003),
 * re-enable the upsert/delete writes guarded on its existence.
 *
 * getSupabaseService()-guarded: when Supabase is unconfigured (or any write
 * throws) it logs and returns the computed delta without throwing, so the
 * webhook can still ack (200) in dev. Returns the RewardDelta that was applied.
 */
export async function applyRewardsForOperator(
  operatorId: string,
  prevTier: SupporterTier,
  nextTier: SupporterTier,
): Promise<RewardDelta> {
  const delta = diffRewards(prevTier, nextTier);
  const sb = getSupabaseService();
  if (!sb) {
    // No creds → dev no-op. Log so the flow is observable.
    console.info(
      `[rewards] (no supabase) operator=${operatorId} ${prevTier}→${nextTier} ` +
        `grant=[${delta.grant.join(",")}] revoke=[${delta.revoke.join(",")}]`,
    );
    return delta;
  }
  try {
    // The reward set is derived from current_supporter_tier — persisting the
    // tier is sufficient. The grant/revoke delta is logged, not table-written.
    await sb
      .from("operators")
      .update({ current_supporter_tier: nextTier })
      .eq("operator_id", operatorId);

    console.info(
      `[rewards] operator=${operatorId} ${prevTier}→${nextTier} ` +
        `grant=[${delta.grant.join(",")}] revoke=[${delta.revoke.join(",")}]`,
    );
  } catch (err) {
    console.error(`[rewards] persist failed operator=${operatorId}`, err);
  }
  return delta;
}
