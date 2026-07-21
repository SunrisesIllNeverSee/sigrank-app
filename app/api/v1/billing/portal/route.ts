import { NextResponse } from "next/server";
import { getStripe } from "@/lib/infra/stripe/server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";

/**
 * POST /api/v1/billing/portal
 *
 * Auth-required: opens a Stripe Billing Portal session for the SIGNED-IN
 * operator's own subscription. The Stripe customer id is resolved from the
 * verified session's operator_id — body operator_id/customer_id are IGNORED
 * (they were an auth-bypass vector: operator_id is a public UUID returned by
 * GET /api/v1/operators/[codename], and customer_id was accepted with no
 * ownership check at all). Fix follows the profile route's pattern
 * (getSessionOperator → resolve from op.operatorId).
 *
 * Returns 401 when not signed in, 503 { error: 'stripe_not_configured' } when
 * Stripe is unconfigured, 404 when the signed-in operator has no Stripe customer.
 */

export const runtime = "nodejs";

/**
 * Resolve a Stripe customer id from the operator row. Guarded.
 * The customer id is stored on the canonical operators.stripe_customer_id
 * column (schema.sql §1); the subscriptions table has no such column.
 */
async function customerForOperator(operatorId: string): Promise<string | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("operators")
      .select("stripe_customer_id")
      .eq("operator_id", operatorId)
      .not("stripe_customer_id", "is", null)
      .maybeSingle();
    return (data?.stripe_customer_id as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  // Auth gate: resolve the verified session. The body's operator_id/customer_id
  // are deliberately ignored — both were auth-bypass vectors (operator_id is a
  // public UUID; customer_id was accepted with no ownership check).
  const op = await getSessionOperator();
  if (!op) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  // Consume the body for request-shape validation only (keeps the 400 on
  // malformed JSON), but do NOT use its fields for authorization.
  try {
    await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const customerId = await customerForOperator(op.operatorId);
  if (!customerId) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[portal] session create failed", err);
    return NextResponse.json({ error: "portal_failed" }, { status: 502 });
  }
}
