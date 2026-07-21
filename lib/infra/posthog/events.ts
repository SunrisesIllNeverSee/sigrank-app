import { posthog } from "@/lib/infra/posthog/client";

// Single typed surface for client funnel events so names never drift. Each helper
// no-ops when the PostHog key is unset (guards on the public env key), so calls are
// safe to leave in place on local/mock builds.
const on = () => !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const track = {
  boardViewed: (
    window: string,
    extra?: { platform?: string; view?: string; total?: number },
  ) => {
    if (on()) posthog.capture("board_viewed", { window, ...extra });
  },
  profileViewed: (isOwn: boolean) => {
    if (on()) posthog.capture("profile_viewed", { is_own: isOwn });
  },
  profileShared: (
    channel: "copy" | "download",
    extra?: Record<string, unknown>,
  ) => {
    if (on()) posthog.capture("profile_shared", { channel, ...extra });
  },
  // Compare (head-to-head) sharing is its own surface — kept distinct from
  // profile_shared so the referral analysis can tell the two viral loops apart.
  compareShared: (
    channel: "copy" | "download",
    extra?: Record<string, unknown>,
  ) => {
    if (on()) posthog.capture("compare_shared", { channel, ...extra });
  },
  wrappedViewed: () => {
    if (on()) posthog.capture("wrapped_viewed");
  },
  // Score calculator: fires when a user successfully parses their token counts
  // on /score/paste. Captures the class tier + yield band so we can see the
  // funnel from "curious visitor" → "calculated score" → "enrolled + submitted".
  scoreCalculated: (extra: {
    classTier: string;
    yieldBand: string;
    source: string;
    estimated: boolean;
  }) => {
    if (on()) posthog.capture("score_calculated", extra);
  },
  // Compare: fires when a user views a head-to-head with both operators
  // selected (not the default landing). Captures whether it's the default
  // "you vs field" or a user-chosen pair.
  compareViewed: (extra: { isDefault: boolean }) => {
    if (on()) posthog.capture("compare_viewed", extra);
  },
  upgradeViewed: () => {
    if (on()) posthog.capture("upgrade_viewed");
  },
  // The /upgrade flow is pay-what-you-want (one-time donation or a monthly preset),
  // NOT a fixed tier — capture the real shape, not a fabricated tier label.
  checkoutClicked: (props: {
    kind: "donation" | "subscription";
    amount_usd?: number;
    price?: string;
  }) => {
    if (on()) posthog.capture("checkout_clicked", props);
  },
};
