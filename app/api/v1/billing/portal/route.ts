import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { getSupabaseServer } from '@/lib/supabase/server'

/**
 * POST /api/v1/billing/portal
 *
 * Body: { operator_id?: string, customer_id?: string }
 *
 * Opens a Stripe Billing Portal session so an operator can manage / cancel
 * their subscription. Returns 503 { error: 'stripe_not_configured' } when
 * Stripe is unconfigured. Resolves the Stripe customer id either from the body
 * or by looking up the operator's subscription row (getSupabaseServer-guarded);
 * returns 404 when no customer can be resolved.
 */

export const runtime = 'nodejs'

interface PortalBody {
  operator_id?: string
  customer_id?: string
}

/**
 * Resolve a Stripe customer id from the operator row. Guarded.
 * The customer id is stored on the canonical operators.stripe_customer_id
 * column (schema.sql §1); the subscriptions table has no such column.
 */
async function customerForOperator(operatorId: string): Promise<string | null> {
  const sb = getSupabaseServer()
  if (!sb) return null
  try {
    const { data } = await sb
      .from('operators')
      .select('stripe_customer_id')
      .eq('operator_id', operatorId)
      .not('stripe_customer_id', 'is', null)
      .maybeSingle()
    return (data?.stripe_customer_id as string) ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  let body: PortalBody
  try {
    body = (await req.json()) as PortalBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (body.operator_id !== undefined) {
    if (typeof body.operator_id !== 'string' || !/^[a-zA-Z0-9_-]{1,256}$/.test(body.operator_id)) {
      return NextResponse.json({ error: 'invalid_operator_id' }, { status: 400 })
    }
  }

  let customerId = body.customer_id ?? null
  if (!customerId && body.operator_id) {
    customerId = await customerForOperator(body.operator_id)
  }

  if (!customerId) {
    return NextResponse.json({ error: 'no_customer' }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/account/subscription`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[portal] session create failed', err)
    return NextResponse.json({ error: 'portal_failed' }, { status: 502 })
  }
}
