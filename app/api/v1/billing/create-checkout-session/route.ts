import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { getSessionOperator } from '@/lib/supabase/auth-server'
import type { SupporterTier } from '@/lib/scoring/types'
import { captureServer } from '@/lib/posthog/server'

/**
 * POST /api/v1/billing/create-checkout-session
 *
 * Two flows (owner 2026-06-27 — "Support the Build"):
 *  1. DONATION (one-time, pay-what-you-want):
 *       { kind: 'donation', amount_cents: number, operator_id?: string }
 *     → one-time Checkout in `payment` mode at the customer-entered amount
 *       (server clamps to $1–$10,000). Uses STRIPE_DONATION_PRODUCT (a Product
 *       id) so the line item is a price_data with the supporter product.
 *  2. SUBSCRIPTION (recurring, preset monthly amounts):
 *       { kind: 'subscription', price: <stripe price id>, operator_id?: string }
 *     → `subscription` mode against one of the configured monthly support prices
 *       (STRIPE_SUPPORT_PRICES, a comma list of allowed price ids — server-side
 *       allowlist so the client can't inject an arbitrary price).
 *
 * When Stripe is unconfigured (getStripe() === null) returns 503
 * { error: 'stripe_not_configured' } so the UI shows "Try again later" and never
 * falsely completes a sale. (Legacy tier/interval body still accepted for the
 * old 3-tier path; see priceIdFor.)
 */

export const runtime = 'nodejs'

type CheckoutTier = Extract<SupporterTier, 'patron' | 'pro' | 'circle_sponsor'>
type Interval = 'monthly' | 'yearly'

/** Donation clamp — guard against fat-finger / abuse on the customer amount. */
const DONATION_MIN_CENTS = 100 // $1
const DONATION_MAX_CENTS = 1_000_000 // $10,000

interface CheckoutBody {
  kind?: 'donation' | 'subscription'
  amount_cents?: number
  price?: string
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

  const stripe = getStripe()
  if (!stripe) {
    // No Stripe creds → never sell silently. UI shows "Try again later".
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  const siteUrl0 = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // AUTH (2026-07-02): when a session exists, bind operator_id from the session
  // and ignore the body value. This closes the "clobber someone's
  // stripe_customer_id" medium — a logged-in operator can't inject another
  // operator's id. Anonymous donations (no session) are still allowed.
  const sessionOp = await getSessionOperator()
  const operatorId0 = sessionOp?.operatorId ?? ''

  // ── Flow 1 — DONATION (one-time, pay-what-you-want) ──────────────────────────
  if (body.kind === 'donation') {
    const amount = Number(body.amount_cents)
    if (!Number.isFinite(amount) || amount < DONATION_MIN_CENTS || amount > DONATION_MAX_CENTS) {
      return NextResponse.json({ error: 'invalid_amount' }, { status: 400 })
    }
    // .trim() — dashboard copy-paste can introduce leading/trailing whitespace,
    // which Stripe rejects ("No such product: '  prod_…'"). Defensive.
    const productId = process.env.STRIPE_DONATION_PRODUCT?.trim()
    if (!productId) {
      return NextResponse.json({ error: 'donation_not_configured' }, { status: 503 })
    }
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              product: productId,
              unit_amount: Math.round(amount),
            },
          },
        ],
        metadata: { operator_id: operatorId0, kind: 'donation' },
        success_url: `${siteUrl0}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl0}/upgrade/canceled`,
      })
      await captureServer(operatorId0 || 'anon_checkout', 'checkout_started', {
        kind: 'donation',
        amount_cents: Math.round(amount),
        has_operator: !!operatorId0,
      })
      return NextResponse.json({ url: session.url })
    } catch (err) {
      console.error('[checkout] donation session failed', err)
      return NextResponse.json({ error: 'checkout_failed' }, { status: 502 })
    }
  }

  // ── Flow 2 — SUBSCRIPTION (recurring monthly preset) ─────────────────────────
  if (body.kind === 'subscription') {
    // Server-side allowlist: only price ids configured in STRIPE_SUPPORT_PRICES
    // (comma-separated) are accepted, so the client can't inject an arbitrary one.
    const allowed = (process.env.STRIPE_SUPPORT_PRICES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const price = typeof body.price === 'string' ? body.price.trim() : ''
    if (!price || !allowed.includes(price)) {
      return NextResponse.json({ error: 'invalid_price' }, { status: 400 })
    }
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        metadata: { operator_id: operatorId0, kind: 'subscription' },
        // subscription_data.metadata is what handleSubscriptionUpsert reads
        // (Lane 1 fix: without this, subscription events arrive with empty
        // metadata → customers pay, get nothing).
        subscription_data: {
          metadata: { operator_id: operatorId0, kind: 'subscription' },
        },
        success_url: `${siteUrl0}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl0}/upgrade/canceled`,
      })
      await captureServer(operatorId0 || 'anon_checkout', 'checkout_started', {
        kind: 'subscription',
        price,
        has_operator: !!operatorId0,
      })
      return NextResponse.json({ url: session.url })
    } catch (err) {
      console.error('[checkout] subscription session failed', err)
      return NextResponse.json({ error: 'checkout_failed' }, { status: 502 })
    }
  }

  // ── Legacy 3-tier path (kept; preset patron/pro/circle_sponsor) ──────────────
  const tier = body.tier as CheckoutTier
  const interval: Interval = body.interval === 'yearly' ? 'yearly' : 'monthly'

  if (!VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'invalid_tier' }, { status: 400 })
  }

  const price = priceIdFor(tier, interval)
  if (!price) {
    // Creds present but the price env is unset for this tier/interval.
    return NextResponse.json({ error: 'price_not_configured' }, { status: 503 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // operator_id already resolved from the session above (operatorId0); reuse it.
  const operatorId = operatorId0

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      metadata: {
        operator_id: operatorId,
        tier,
        interval,
      },
      // subscription_data.metadata is what handleSubscriptionUpsert reads
      // (Lane 1 fix: without this, subscription events arrive with empty
      // metadata → customers pay, get nothing).
      subscription_data: {
        metadata: {
          operator_id: operatorId,
          tier,
          interval,
        },
      },
      success_url: `${siteUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/upgrade/canceled`,
    })
    await captureServer(operatorId || 'anon_checkout', 'checkout_started', {
      kind: 'subscription_tier',
      tier,
      interval,
      has_operator: !!operatorId,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] session create failed', err)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 502 })
  }
}
