import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import type { SupporterTier } from '@/lib/scoring/types'

/**
 * POST /api/v1/billing/create-checkout-session
 *
 * Body: { tier: 'patron'|'pro'|'circle_sponsor', interval: 'monthly'|'yearly',
 *         operator_id?: string }
 *
 * Creates a Stripe Checkout Session in `subscription` mode for the selected
 * supporter tier. When Stripe is unconfigured (getStripe() === null) it returns
 * 503 { error: 'stripe_not_configured' } so the UI can show "Try again later"
 * and never falsely complete a sale. Founder tier is OFF (D7) — only the three
 * shipping tiers are accepted.
 */

export const runtime = 'nodejs'

type CheckoutTier = Extract<SupporterTier, 'patron' | 'pro' | 'circle_sponsor'>
type Interval = 'monthly' | 'yearly'

interface CheckoutBody {
  tier?: string
  interval?: string
  operator_id?: string
}

/**
 * Resolve the configured Stripe price id for a (tier, interval) pair.
 * Patron + Circle Sponsor have a single recurring price; Pro has monthly +
 * yearly. OPERATOR_OVERRIDE_REQUIRED — set the STRIPE_PRICE_* env vars.
 */
function priceIdFor(tier: CheckoutTier, interval: Interval): string | undefined {
  switch (tier) {
    case 'patron':
      return process.env.STRIPE_PRICE_PATRON_MONTHLY
    case 'pro':
      return interval === 'yearly'
        ? process.env.STRIPE_PRICE_PRO_YEARLY
        : process.env.STRIPE_PRICE_PRO_MONTHLY
    case 'circle_sponsor':
      return process.env.STRIPE_PRICE_CIRCLE_SPONSOR
  }
}

const VALID_TIERS: CheckoutTier[] = ['patron', 'pro', 'circle_sponsor']

export async function POST(req: Request) {
  let body: CheckoutBody
  try {
    body = (await req.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const tier = body.tier as CheckoutTier
  const interval: Interval = body.interval === 'yearly' ? 'yearly' : 'monthly'

  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'invalid_tier' }, { status: 400 })
  }

  const stripe = getStripe()
  if (!stripe) {
    // No Stripe creds → never sell silently. UI shows "Try again later".
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  const price = priceIdFor(tier, interval)
  if (!price) {
    // Creds present but the price env is unset for this tier/interval.
    return NextResponse.json({ error: 'price_not_configured' }, { status: 503 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Length-guard the optional operator_id before it reaches Stripe metadata
  // (500-char/key limit). Overlong values would fail the API call or be
  // silently truncated, breaking webhook reconciliation (P2 #11).
  const operatorId =
    body.operator_id && typeof body.operator_id === 'string'
      ? body.operator_id.slice(0, 256)
      : ''

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      metadata: {
        operator_id: operatorId,
        tier,
        interval,
      },
      success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/upgrade/canceled`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] session create failed', err)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 })
  }
}
