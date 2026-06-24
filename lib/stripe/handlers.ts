import 'server-only'

/**
 * lib/stripe/handlers.ts — Stripe webhook event handlers (server-only).
 *
 * Each handler is invoked by app/api/v1/billing/stripe-webhook/route.ts after
 * the route has (1) verified the signature and (2) deduped via webhook_events.
 * Every DB operation here is getSupabaseServer()-guarded: with no creds (dev /
 * mock mode) handlers log and resolve so the webhook still acks 200. Handlers
 * never throw on a missing Supabase client.
 *
 * Covered events:
 *   - checkout.session.completed         (subscription start OR one-time claim)
 *   - customer.subscription.created      → upsert subscription + recompute tier
 *   - customer.subscription.updated      → upsert subscription + recompute tier
 *   - customer.subscription.deleted      → mark canceled + recompute tier
 *   - invoice.payment_succeeded          → keep tier active
 *   - invoice.payment_failed             → flag past_due (grace handled by tier.ts)
 */

import type Stripe from 'stripe'
import { getSupabaseServer } from '@/lib/supabase/server'
import { tierForPrice } from '@/lib/stripe/server'
import type { SubscriptionStatus, SubscriptionRecord } from '@/lib/stripe/tier'
import { applyRewardsForOperator, recomputeSupporterTier } from '@/lib/stripe/rewards'
import type { SupporterTier } from '@/lib/scoring/types'

/** Result of a handler — surfaced in the webhook response for observability. */
export interface HandlerResult {
  handled: boolean
  note: string
}

const ok = (note: string): HandlerResult => ({ handled: true, note })
const skipped = (note: string): HandlerResult => ({ handled: false, note })

/** Pull operator_id from session/subscription metadata, if present. */
function operatorIdFrom(
  meta: Stripe.Metadata | null | undefined,
): string | null {
  const id = meta?.operator_id
  return typeof id === 'string' && id.length > 0 ? id : null
}

/** Map a Stripe subscription to the price-derived supporter tier. */
function tierForSubscription(sub: Stripe.Subscription): SupporterTier {
  const priceId = sub.items?.data?.[0]?.price?.id ?? null
  return tierForPrice(priceId)
}

/** Build the resolver-shaped record from a Stripe subscription. */
function toSubscriptionRecord(sub: Stripe.Subscription): SubscriptionRecord {
  return {
    tier: tierForSubscription(sub),
    status: sub.status as SubscriptionStatus,
    // Stripe gives epoch seconds; the resolver accepts epoch ms or ISO.
    current_period_end: sub.current_period_end * 1000,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
  }
}

/**
 * Read the operator's prior supporter tier (for reward diffing). Guarded —
 * returns 'free' when Supabase is unconfigured or the read fails.
 */
async function readPriorTier(operatorId: string): Promise<SupporterTier> {
  const sb = getSupabaseServer()
  if (!sb) return 'free'
  try {
    const { data } = await sb
      .from('operators')
      .select('current_supporter_tier')
      .eq('operator_id', operatorId)
      .maybeSingle()
    return (data?.current_supporter_tier as SupporterTier) ?? 'free'
  } catch {
    return 'free'
  }
}

/**
 * Persist (upsert) a subscription row, recompute the operator's effective tier
 * across all their subscription rows, and apply the reward delta. Guarded.
 */
async function persistSubscription(
  operatorId: string,
  sub: Stripe.Subscription,
  nowMs: number,
): Promise<void> {
  const record = toSubscriptionRecord(sub)
  const sb = getSupabaseServer()
  if (!sb) {
    // Dev path: recompute from this single record so reward logging still runs.
    const nextTier = recomputeSupporterTier(record, nowMs)
    await applyRewardsForOperator(operatorId, 'free', nextTier)
    return
  }
  // The Stripe customer id lives on the canonical operators row
  // (operators.stripe_customer_id UNIQUE) — the subscriptions table has no
  // stripe_customer_id/price_id column. See schema.sql §1 + §13.
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null
  try {
    // Write only the canonical subscriptions columns (schema.sql §13). Both
    // current_period_start and current_period_end are NOT NULL.
    await sb.from('subscriptions').upsert(
      {
        subscription_id: sub.id,
        operator_id: operatorId,
        tier: record.tier,
        status: record.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: record.cancel_at_period_end,
        updated_at: new Date(nowMs).toISOString(),
      },
      { onConflict: 'subscription_id' },
    )

    // Link the Stripe customer to the operator on the canonical column so the
    // billing portal can resolve it later (operators.stripe_customer_id).
    if (customerId) {
      await sb
        .from('operators')
        .update({ stripe_customer_id: customerId })
        .eq('operator_id', operatorId)
    }

    // Recompute the effective tier across ALL of this operator's subscriptions.
    const { data: rows } = await sb
      .from('subscriptions')
      .select('tier,status,current_period_end,cancel_at_period_end')
      .eq('operator_id', operatorId)

    const records: SubscriptionRecord[] = (rows ?? []).map((r) => ({
      tier: r.tier as SupporterTier,
      status: r.status as SubscriptionStatus,
      current_period_end: r.current_period_end as string,
      cancel_at_period_end: Boolean(r.cancel_at_period_end),
    }))

    const prevTier = await readPriorTier(operatorId)
    const nextTier = recomputeSupporterTier(
      records.length > 0 ? records : record,
      nowMs,
    )
    await applyRewardsForOperator(operatorId, prevTier, nextTier)
  } catch (err) {
    console.error('[webhook] persistSubscription failed', err)
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Event handlers.
// ───────────────────────────────────────────────────────────────────────────

/**
 * checkout.session.completed — two distinct flows by session.mode:
 *  - mode === 'payment' && metadata.purpose === 'claim' → operator claim.
 *  - mode === 'subscription'                            → defer tier work to
 *    the customer.subscription.created/updated events (which carry the price).
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
  const operatorId = operatorIdFrom(session.metadata)

  // ── One-time lifetime claim (OPERATOR_OVERRIDE: anonymous→claimed) ────────
  if (session.mode === 'payment' && session.metadata?.purpose === 'claim') {
    if (!operatorId) return skipped('claim session missing operator_id')
    const contact = session.metadata?.contact ?? null
    const paymentIntent =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

    const sb = getSupabaseServer()
    if (!sb) {
      console.info(
        `[webhook] (no supabase) claim operator=${operatorId} pi=${paymentIntent}`,
      )
      return ok(`claim acked (dev) operator=${operatorId}`)
    }
    try {
      await sb
        .from('operators')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
          claim_payment_id: paymentIntent,
          claim_contact: contact,
        })
        .eq('operator_id', operatorId)
      return ok(`operator ${operatorId} claimed`)
    } catch (err) {
      console.error('[webhook] claim update failed', err)
      return ok(`claim acked (write failed) operator=${operatorId}`)
    }
  }

  // ── Subscription checkout: tier work happens on subscription.* events ─────
  if (session.mode === 'subscription') {
    return ok(
      `subscription checkout completed operator=${operatorId ?? 'unknown'} ` +
        `(tier applied on subscription event)`,
    )
  }

  return skipped(`unhandled checkout mode=${session.mode}`)
}

/** customer.subscription.created / updated — upsert + recompute tier. */
export async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  nowMs: number,
): Promise<HandlerResult> {
  const operatorId = operatorIdFrom(sub.metadata)
  if (!operatorId) return skipped('subscription missing operator_id metadata')
  await persistSubscription(operatorId, sub, nowMs)
  return ok(`subscription ${sub.id} (${sub.status}) synced operator=${operatorId}`)
}

/** customer.subscription.deleted — mark canceled + recompute tier. */
export async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  nowMs: number,
): Promise<HandlerResult> {
  const operatorId = operatorIdFrom(sub.metadata)
  if (!operatorId) return skipped('deleted subscription missing operator_id')
  // Force a canceled status so the resolver drops the tier (unless soft-cancel
  // still inside the paid period). Reuse the upsert path with the live row.
  await persistSubscription(operatorId, { ...sub, status: 'canceled' }, nowMs)
  return ok(`subscription ${sub.id} canceled operator=${operatorId}`)
}

/** invoice.payment_succeeded — log; tier stays active via the subscription row. */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
): Promise<HandlerResult> {
  const sb = getSupabaseServer()
  const subId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id ?? null
  if (!sb) return ok(`invoice paid (dev) subscription=${subId}`)
  try {
    if (subId) {
      await sb
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('subscription_id', subId)
    }
    return ok(`invoice paid subscription=${subId}`)
  } catch (err) {
    console.error('[webhook] invoice paid update failed', err)
    return ok(`invoice paid acked (write failed) subscription=${subId}`)
  }
}

/**
 * invoice.payment_failed — flag the subscription past_due. The 7-day grace
 * window is enforced read-side by lib/stripe/tier.ts, so we only flip status.
 */
export async function handleInvoiceFailed(
  invoice: Stripe.Invoice,
): Promise<HandlerResult> {
  const sb = getSupabaseServer()
  const subId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id ?? null
  if (!sb) return ok(`invoice failed (dev) subscription=${subId}`)
  try {
    if (subId) {
      await sb
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('subscription_id', subId)
    }
    return ok(`invoice failed → past_due subscription=${subId}`)
  } catch (err) {
    console.error('[webhook] invoice failed update failed', err)
    return ok(`invoice failed acked (write failed) subscription=${subId}`)
  }
}

/**
 * dispatchEvent — central router used by the webhook route. Returns a
 * HandlerResult for every event type; unknown types are reported as skipped.
 * `nowMs` is injected by the route (event-derived) for deterministic resolution.
 */
export async function dispatchEvent(
  event: Stripe.Event,
  nowMs: number,
): Promise<HandlerResult> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return handleSubscriptionUpsert(event.data.object as Stripe.Subscription, nowMs)
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription, nowMs)
    case 'invoice.payment_succeeded':
      return handleInvoicePaid(event.data.object as Stripe.Invoice)
    case 'invoice.payment_failed':
      return handleInvoiceFailed(event.data.object as Stripe.Invoice)
    default:
      return skipped(`unhandled event type ${event.type}`)
  }
}
