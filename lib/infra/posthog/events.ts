import { posthog } from "@/lib/infra/posthog/client";

// Single typed surface for client funnel events so names never drift. Each helper
// no-ops when the PostHog key is unset (guards on the public env key), so calls are
// safe to leave in place on local/mock builds.
const on = () => !!process.env.NEXT_PUBLIC_POSTHOG_KEY
  || !!process.env.NEXT_PUBLIC_sigrank_POSTHOG_PROJECT_TOKEN;

// Domain + env properties attached to every event for cross-domain reporting.
// domain: which site the event originated from (signalaf.com, sigeconomy.com, etc.)
// env: deployment environment (production, preview, development)
const baseProps = () => ({
  domain: typeof window !== "undefined" ? window.location.hostname : "unknown",
  env: process.env.NEXT_PUBLIC_VERCEL_ENV
    ?? (process.env.NODE_ENV === "production" ? "production" : "development"),
});

export const track = {
  boardViewed: (
    window: string,
    extra?: { platform?: string; view?: string; total?: number },
  ) => {
    if (on()) posthog.capture("board_viewed", { window, ...baseProps(), ...extra });
  },
  profileViewed: (isOwn: boolean) => {
    if (on()) posthog.capture("profile_viewed", { is_own: isOwn, ...baseProps() });
  },
  profileShared: (
    channel: "copy" | "download",
    extra?: Record<string, unknown>,
  ) => {
    if (on()) posthog.capture("profile_shared", { channel, ...baseProps(), ...extra });
  },
  // Compare (head-to-head) sharing is its own surface — kept distinct from
  // profile_shared so the referral analysis can tell the two viral loops apart.
  compareShared: (
    channel: "copy" | "download",
    extra?: Record<string, unknown>,
  ) => {
    if (on()) posthog.capture("compare_shared", { channel, ...baseProps(), ...extra });
  },
  wrappedViewed: () => {
    if (on()) posthog.capture("wrapped_viewed", baseProps());
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
    if (on()) posthog.capture("score_calculated", { ...extra, ...baseProps() });
  },
  // Compare: fires when a user views a head-to-head with both operators
  // selected (not the default landing). Captures whether it's the default
  // "you vs field" or a user-chosen pair.
  compareViewed: (extra: { isDefault: boolean }) => {
    if (on()) posthog.capture("compare_viewed", { ...extra, ...baseProps() });
  },
  upgradeViewed: () => {
    if (on()) posthog.capture("upgrade_viewed", baseProps());
  },
  // The /upgrade flow is pay-what-you-want (one-time donation or a monthly preset),
  // NOT a fixed tier — capture the real shape, not a fabricated tier label.
  checkoutClicked: (props: {
    kind: "donation" | "subscription";
    amount_usd?: number;
    price?: string;
  }) => {
    if (on()) posthog.capture("checkout_clicked", { ...props, ...baseProps() });
  },
  boardShared: (
    channel: "download" | "clipboard",
    extra?: Record<string, unknown>,
  ) => {
    if (on()) posthog.capture("board_shared", { channel, ...baseProps(), ...extra });
  },
  // A01-1: New events to fill funnel gaps (approved 2026-09-04)
  // Fires when a snapshot is accepted by the API (not just submitted).
  snapshotSubmitted: (extra: {
    platform: string;
    source: string;
  }) => {
    if (on()) posthog.capture("snapshot_submitted", { ...extra, ...baseProps() });
  },
  // Fires when a user successfully claims their operator profile.
  profileClaimed: () => {
    if (on()) posthog.capture("profile_claimed", baseProps());
  },
  // Fires when a Stripe payment succeeds (via checkout session completion).
  paymentSucceeded: (props: {
    kind: "donation" | "subscription";
    amount_usd: number;
  }) => {
    if (on()) posthog.capture("payment_succeeded", { ...props, ...baseProps() });
  },
  // Fires when the contact form is successfully submitted.
  contactSubmitted: (extra: {
    topic: string;
  }) => {
    if (on()) posthog.capture("contact_submitted", { ...extra, ...baseProps() });
  },
};
