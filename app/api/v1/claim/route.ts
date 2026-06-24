import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'

/**
 * POST /api/v1/claim
 *
 * Body: { operator_id: string, contact?: string }
 *
 * OPERATOR OVERRIDE — anonymous → claimable. An operator claims their anonymous
 * leaderboard entry via a ONE-TIME LIFETIME payment (Stripe Checkout in
 * `payment` mode, NOT a subscription). The claim is finalized by the webhook
 * handler on checkout.session.completed where mode === 'payment' &&
 * metadata.purpose === 'claim'.
 *
 * Returns 503 { error: 'stripe_not_configured' } when Stripe is unconfigured.
 */

export const runtime = 'nodejs'

interface ClaimBody {
  operator_id?: string
  contact?: string
}

export async function POST(req: Request) {
  let body: ClaimBody
  try {
    body = (await req.json()) as ClaimBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const operatorId = body.operator_id
  if (!operatorId || typeof operatorId !== 'string') {
    return NextResponse.json({ error: 'missing_operator_id' }, { status: 400 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  // OPERATOR_OVERRIDE_REQUIRED — PRICE.CLAIM_LIFETIME placeholder ($1–5).
  const price = process.env.STRIPE_PRICE_CLAIM_LIFETIME
  if (!price) {
    return NextResponse.json({ error: 'price_not_configured' }, { status: 503 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  // Length-guard contact before it reaches Stripe metadata (500-char/key limit)
  // and the DB; unbounded input would fail checkout or truncate silently (P1 #3).
  const contact = typeof body.contact === 'string' ? body.contact.slice(0, 255) : ''

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      metadata: {
        operator_id: operatorId,
        purpose: 'claim',
        contact,
      },
      success_url: `${siteUrl}/upgrade/success?claim=1`,
      cancel_url: `${siteUrl}/upgrade/canceled`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[claim] session create failed', err)
    return NextResponse.json({ error: 'claim_failed' }, { status: 502 })
  }
}
