import React from "react";
import type { SupporterTier } from "@/lib/scoring/types";
import type { SubscriptionStatus as SubStatus } from "@/lib/stripe/tier";
import { Placeholder } from "@/components/ui/Placeholder";

/**
 * components/billing/SubscriptionStatus.tsx — read-only subscription summary.
 *
 * Presentational server component. Shows the current supporter tier, Stripe
 * status, and renewal date. When `isPlaceholder` (mock / no live billing data)
 * the values carry the gold-star placeholder marker per the placeholder protocol.
 */

const TIER_LABEL: Record<SupporterTier, string> = {
  free: "Free",
  patron: "Patron",
  pro: "Pro",
  circle_sponsor: "Circle Sponsor",
};

const STATUS_LABEL: Record<SubStatus, string> = {
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  paused: "Paused",
};

interface Props {
  tier: SupporterTier;
  status?: SubStatus;
  /** ISO date the current paid period ends. */
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  /** Mock / no-live-data → render values with the placeholder marker. */
  isPlaceholder?: boolean;
}

function StatusDot({ status }: { status: SubStatus }) {
  const color =
    status === "active" || status === "trialing"
      ? "bg-class-seeker"
      : status === "past_due"
        ? "bg-text-gold"
        : "bg-text-muted";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export function SubscriptionStatus({
  tier,
  status = "active",
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
  isPlaceholder = false,
}: Props) {
  const tierLabel = TIER_LABEL[tier];
  const renewLabel = cancelAtPeriodEnd ? "Ends" : "Renews";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-wide text-text-muted">
          Current plan
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
          <StatusDot status={status} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="font-mono text-2xl font-bold text-text-primary">
        {isPlaceholder ? (
          <Placeholder
            value={tierLabel}
            title="Demo — connect billing for live status"
          />
        ) : (
          tierLabel
        )}
      </div>

      {tier !== "free" && currentPeriodEnd ? (
        <div className="font-sans text-xs text-text-secondary">
          {renewLabel}:{" "}
          {isPlaceholder ? (
            <Placeholder
              value={currentPeriodEnd}
              title="Demo — placeholder renewal date"
            />
          ) : (
            <span className="font-mono text-text-primary">
              {currentPeriodEnd}
            </span>
          )}
        </div>
      ) : null}

      {tier === "free" ? (
        <p className="font-sans text-xs text-text-muted">
          No active subscription. Upgrade to Pro for precision scoring and full
          history.
        </p>
      ) : null}
    </div>
  );
}
