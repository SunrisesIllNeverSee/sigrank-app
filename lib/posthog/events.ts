import { posthog } from '@/lib/posthog/client'

// Single typed surface for client funnel events so names never drift. Each helper
// no-ops when the PostHog key is unset (guards on the public env key), so calls are
// safe to leave in place on local/mock builds.
const on = () => !!process.env.NEXT_PUBLIC_POSTHOG_KEY

export const track = {
  boardViewed: (window: string, extra?: { platform?: string; view?: string; total?: number }) => {
    if (on()) posthog.capture('board_viewed', { window, ...extra })
  },
  profileViewed: (isOwn: boolean) => {
    if (on()) posthog.capture('profile_viewed', { is_own: isOwn })
  },
  profileShared: (channel: 'copy' | 'download', extra?: Record<string, unknown>) => {
    if (on()) posthog.capture('profile_shared', { channel, ...extra })
  },
  // Compare (head-to-head) sharing is its own surface — kept distinct from
  // profile_shared so the referral analysis can tell the two viral loops apart.
  compareShared: (channel: 'copy' | 'download', extra?: Record<string, unknown>) => {
    if (on()) posthog.capture('compare_shared', { channel, ...extra })
  },
  wrappedViewed: () => {
    if (on()) posthog.capture('wrapped_viewed')
  },
  upgradeViewed: () => {
    if (on()) posthog.capture('upgrade_viewed')
  },
  // The /upgrade flow is pay-what-you-want (one-time donation or a monthly preset),
  // NOT a fixed tier — capture the real shape, not a fabricated tier label.
  checkoutClicked: (props: { kind: 'donation' | 'subscription'; amount_usd?: number; price?: string }) => {
    if (on()) posthog.capture('checkout_clicked', props)
  },
}
