import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { getSupabaseService } from '@/lib/supabase/server'
import { dispatchEvent } from '@/lib/stripe/handlers'

/**
 * logAudit — append-only audit_log write, getSupabaseService()-guarded. With no
 * Supabase creds it logs to the console so the event is still observable in dev.
 * Never throws.
 */
async function logAudit(action: string, detail: Record<string, unknown>): Promise<void> {
  const sb = getSupabaseService()
  if (!sb) {
    console.warn(`[audit] ${action}`, detail)
    return
  }
  try {
    // Map to the canonical audit_log columns (schema.sql §15): event_type +
    // event_source (NOT NULL) + payload + occurred_at (has a DEFAULT). The
    // route's `action`/`detail` shape does not match the table directly.
    await sb.from('audit_log').insert({
      event_type: action,
      event_source: 'stripe',
      payload: detail,
      occurred_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[audit] write failed for ${action}`, err)
  }
}

/**
 * POST /api/v1/billing/stripe-webhook
 *
 * Stripe webhook receiver. MUST run on the Node runtime (raw body + crypto for
 * signature verification). Flow:
 *   1. Read the RAW body (req.text()) + the 'stripe-signature' header.
 *   2. constructEvent() with STRIPE_WEBHOOK_SECRET — bad signature → 400 + audit.
 *   3. Idempotency via webhook_events.processed_at (Lane 1 fix 2026-07-02):
 *      a. Upsert the event row (insert-first prevents concurrent double-processing).
 *      b. On conflict (event_id already exists), SELECT processed_at:
 *         - processed_at IS NOT NULL → already done → ack 200 { duplicate: true }.
 *         - processed_at IS NULL → a prior attempt failed mid-handling → fall
 *           through and re-run the handler (Stripe retry actually reprocesses).
 *   4. Dispatch to the handlers (all DB ops getSupabaseService()-guarded).
 *   5. On success: UPDATE webhook_events SET processed_at = now() → ack 200.
 *      On failure: do NOT set processed_at, return 500 → Stripe retries → step 3b
 *      lets the retry through.
 *
 * With no Stripe creds the route 503s; with no Supabase creds handlers still
 * ack 200 so a dev environment can receive test events without a database.
 */

export const runtime = 'nodejs'
// The raw body is required for signature verification — opt out of any parsing.
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'webhook_secret_not_configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    await logAudit('stripe_webhook_bad_signature', { reason: 'missing_signature' })
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  // Raw body — do NOT JSON.parse before constructEvent.
  const rawBody = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    await logAudit('stripe_webhook_bad_signature', { reason: 'construct_failed', message })
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  // ── Idempotency via webhook_events.processed_at (Lane 1 fix 2026-07-02) ────
  // Insert-first prevents concurrent double-processing. On conflict, check
  // processed_at: NULL means a prior attempt failed → re-run; NOT NULL means
  // already done → ack duplicate.
  const sb = getSupabaseService()
  if (sb) {
    try {
      // Canonical webhook_events columns (schema.sql §14): event_type (NOT
      // 'type') + received_at + payload_json (NOT NULL) + processed_at.
      // Use ignoreDuplicates: false so we can read the row back on conflict.
      const { error: upsertErr } = await sb
        .from('webhook_events')
        .upsert(
          {
            event_id: event.id,
            event_type: event.type,
            received_at: new Date().toISOString(),
            payload_json: event,
          },
          { onConflict: 'event_id', ignoreDuplicates: false },
        )

      if (!upsertErr) {
        // Read the row back to check processed_at (handles both the insert and
        // the conflict-update case).
        const { data: existing } = await sb
          .from('webhook_events')
          .select('processed_at')
          .eq('event_id', event.id)
          .maybeSingle()
        const row = existing as { processed_at: string | null } | null
        if (row?.processed_at) {
          // Already processed successfully → ack duplicate.
          return NextResponse.json({ received: true, duplicate: true })
        }
        // processed_at IS NULL → either a fresh insert or a prior failed attempt.
        // Fall through to dispatch.
      }
    } catch (err) {
      // A dedup failure shouldn't drop the event; log and continue to handlers.
      console.error('[webhook] dedup insert failed', err)
    }
  }

  // Event-derived clock keeps tier resolution deterministic relative to Stripe.
  const nowMs = (event.created ?? Math.floor(Date.now() / 1000)) * 1000

  try {
    const result = await dispatchEvent(event, nowMs)
    // Success: mark processed_at so a Stripe retry won't re-run the handler.
    if (sb) {
      try {
        await sb
          .from('webhook_events')
          .update({ processed_at: new Date().toISOString() })
          .eq('event_id', event.id)
      } catch (err) {
        // Non-fatal: the handler succeeded; a duplicate retry would be idempotent
        // for most handlers anyway. Log for follow-up.
        console.error('[webhook] processed_at update failed', err)
      }
    }
    return NextResponse.json({ received: true, handled: result.handled, note: result.note })
  } catch (err) {
    console.error('[webhook] handler threw', err)
    // Do NOT set processed_at — return 500 so Stripe retries, and step 3b above
    // lets the retry through (processed_at is still NULL).
    await logAudit('stripe_webhook_handler_error', {
      event_id: event.id,
      type: event.type,
    })
    return NextResponse.json(
      { received: false, error: 'handler_error' },
      { status: 500 },
    )
  }
}
