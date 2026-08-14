// supabase/functions/stripe-webhook/index.ts
//
// Stripe webhook receiver on Supabase Edge Functions.
//
// WHY EDGE FUNCTIONS INSTEAD OF VERCEL?
//   Stripe requires a 200 response within seconds. Edge Functions run closer
//   to Stripe's servers (global edge network) with ~5ms cold starts vs
//   Vercel's ~500ms-1s cold starts. This matters when Stripe retries.
//
//   The existing Vercel handler (app/api/v1/billing/stripe-webhook/route.ts)
//   remains the primary endpoint. This Edge Function is a faster alternative
//   that can be swapped in by updating the Stripe webhook URL in the Stripe
//   dashboard.
//
// DEPLOY:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// ENDPOINT:
//   https://copqtaqzsdvpdbhpwjmt.supabase.co/functions/v1/stripe-webhook
//
// ENV (set via dashboard or supabase secrets):
//   STRIPE_WEBHOOK_SECRET — Stripe webhook signing secret (whsec_...)
//   STRIPE_SECRET_KEY     — Stripe API key (sk_...)
//   SUPABASE_URL          — auto-injected by Edge Functions
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Edge Functions

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { Hono } from 'npm:hono@^4.9.7'
import Stripe from 'npm:stripe@^18.4.0'

const app = new Hono().basePath('/stripe-webhook')

// ─── Environment ──────────────────────────────────────────────────────────

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// ─── Stripe client (lazy init) ────────────────────────────────────────────

let stripeClient: Stripe | null = null
function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      httpClient: Stripe.createFetchHttpClient(),
    })
  }
  return stripeClient
}

// ─── Supabase client (lazy init) ──────────────────────────────────────────

let supabaseClient: { from: (t: string) => unknown } | null = null
function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  if (!supabaseClient) {
    // Use the REST API directly via fetch — avoids importing the full
    // supabase-js library in the Edge Function.
    const url = SUPABASE_URL
    const key = SUPABASE_SERVICE_ROLE_KEY
    supabaseClient = {
      from(table: string) {
        return {
          insert: async (row: Record<string, unknown>) => {
            const res = await fetch(`${url}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify(row),
            })
            return { error: res.ok ? null : await res.text() }
          },
          update: async (match: Record<string, unknown>, set: Record<string, unknown>) => {
            const matchStr = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join('&')
            const res = await fetch(`${url}/rest/v1/${table}?${matchStr}`, {
              method: 'PATCH',
              headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify(set),
            })
            return { error: res.ok ? null : await res.text() }
          },
          select: async (match: Record<string, unknown>) => {
            const matchStr = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join('&')
            const res = await fetch(`${url}/rest/v1/${table}?${matchStr}`, {
              headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
              },
            })
            const data = await res.json()
            return { data, error: res.ok ? null : data }
          },
        }
      },
    }
  }
  return supabaseClient
}

// ─── Audit log ────────────────────────────────────────────────────────────

async function logAudit(action: string, detail: Record<string, unknown>): Promise<void> {
  const sb = getSupabase()
  if (!sb) {
    console.log(`[audit] ${action}`, detail)
    return
  }
  try {
    await (sb.from('audit_log') as any).insert({
      event_type: action,
      event_source: 'stripe',
      payload: detail,
      occurred_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[audit] write failed for ${action}`, err)
  }
}

// ─── Webhook handler ──────────────────────────────────────────────────────

app.post('*', async (c) => {
  // Check configuration
  if (!STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: 'webhook_secret_not_configured' }, 503)
  }

  const stripe = getStripe()
  if (!stripe) {
    return c.json({ error: 'stripe_not_configured' }, 503)
  }

  const signature = c.req.header('stripe-signature')
  if (!signature) {
    await logAudit('stripe_webhook_bad_signature', { reason: 'missing_signature' })
    return c.json({ error: 'missing_signature' }, 400)
  }

  // Raw body — required for signature verification
  const rawBody = await c.req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    await logAudit('stripe_webhook_bad_signature', { reason: 'construct_failed', message })
    return c.json({ error: 'invalid_signature' }, 400)
  }

  // Idempotency: check if this event was already processed
  const sb = getSupabase()
  if (sb) {
    const { data: existing } = await (sb.from('webhook_events') as any).select({ event_id: event.id })
    if (existing && Array.isArray(existing) && existing.length > 0) {
      const row = existing[0] as Record<string, unknown>
      if (row.processed_at) {
        return c.json({ duplicate: true, event_id: event.id }, 200)
      }
      // Not yet processed — fall through and re-run (Stripe retry)
    }

    // Record the event
    await (sb.from('webhook_events') as any).insert({
      event_id: event.id,
      event_type: event.type,
      payload: event,
      created_at: new Date().toISOString(),
    }).catch(() => {
      // Conflict on event_id is expected for retries — ignore
    })
  }

  // ─── Dispatch handlers ────────────────────────────────────────────────

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const operatorId = session.client_reference_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (operatorId && customerId) {
          await (sb?.from('operators') as any)?.update(
            { operator_id: operatorId },
            {
              stripe_customer_id: customerId,
              current_supporter_tier: 'pro',
            },
          )
          await logAudit('stripe_checkout_completed', { operatorId, customerId, subscriptionId })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (sb && customerId) {
          // Downgrade to free tier
          await (sb.from('operators') as any).update(
            { stripe_customer_id: customerId },
            { current_supporter_tier: 'free' },
          )
        }
        await logAudit('stripe_subscription_deleted', { customerId, subscriptionId: subscription.id })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Determine tier from subscription status
        const tier = subscription.status === 'active' || subscription.status === 'trialing'
          ? 'pro'
          : 'free'

        if (sb && customerId) {
          await (sb.from('operators') as any).update(
            { stripe_customer_id: customerId },
            { current_supporter_tier: tier },
          )
        }
        await logAudit('stripe_subscription_updated', {
          customerId,
          subscriptionId: subscription.id,
          status: subscription.status,
          tier,
        })
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await logAudit('stripe_invoice_paid', {
          customerId: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await logAudit('stripe_payment_failed', {
          customerId: invoice.customer,
          amount: invoice.amount_due,
          currency: invoice.currency,
        })
        break
      }

      default:
        // Unhandled event type — log and ack
        await logAudit('stripe_webhook_unhandled', { type: event.type, eventId: event.id })
        break
    }

    // Mark as processed
    if (sb) {
      await (sb.from('webhook_events') as any).update(
        { event_id: event.id },
        { processed_at: new Date().toISOString() },
      )
    }

    return c.json({ received: true, event_id: event.id, type: event.type }, 200)
  } catch (err) {
    // Don't mark as processed — Stripe will retry
    const message = err instanceof Error ? err.message : 'unknown'
    await logAudit('stripe_webhook_handler_error', { eventId: event.id, error: message })
    return c.json({ error: 'handler_failed', message }, 500)
  }
})

Deno.serve(app.fetch)
