import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { getStripe } from "@/lib/infra/stripe/server";
import { captureServer } from "@/lib/infra/posthog/server";

/**
 * POST /api/v1/account/delete — permanent account deletion (owner 2026-06-27).
 * Spec: docs/superpowers/specs/2026-06-27-account-deletion-design.md.
 *
 * Cookie-session auth'd; deletes ONLY the session operator (operator_id comes from the
 * session, NEVER the body → no IDOR). Body: { confirm } must equal the operator's
 * current codename (re-checked server-side). All-or-abort sequence:
 *   1. Cancel any active Stripe subscription (immediate) — on failure ABORT (502), so a
 *      live subscription is never left billing a now-anonymous row. Stripe customer
 *      object is RETAINED (tax/refund records).
 *   2. delete_account() RPC — anonymize + retire the operator, revoke devices, null the
 *      Stripe pointer. Keeps the board row + cascade history (the moat).
 *   3. auth.admin.deleteUser() — remove the email from auth.users; cascades
 *      operator_accounts (0009). Skipped (not an error) if the operator was never linked.
 * Sign-out is client-side after success (the DangerZone component calls signOut()).
 */
export const dynamic = "force-dynamic";

// Stripe sub statuses worth cancelling (anything that could still charge).
const CANCELABLE = new Set(["active", "trialing", "past_due", "unpaid"]);

export async function POST(req: NextRequest) {
  const op = await getSessionOperator();
  if (!op)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const confirm = typeof body.confirm === "string" ? body.confirm : "";
  if (confirm !== op.codename) {
    return NextResponse.json(
      { error: "Confirmation does not match." },
      { status: 400 },
    );
  }

  const svc = getSupabaseService();
  if (!svc)
    return NextResponse.json({ error: "Not configured." }, { status: 503 });

  // 1. Stripe: cancel active subscriptions for this operator's customer, if any.
  //    Look up the customer id from our row (the session shape doesn't carry it).
  const { data: opRow } = await svc
    .from("operators")
    .select("stripe_customer_id")
    .eq("operator_id", op.operatorId)
    .maybeSingle();
  const customerId =
    opRow && typeof opRow.stripe_customer_id === "string"
      ? opRow.stripe_customer_id
      : null;

  const stripe = getStripe();
  if (customerId && stripe) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      for (const sub of subs.data) {
        if (CANCELABLE.has(sub.status))
          await stripe.subscriptions.cancel(sub.id);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Stripe cancellation failed.";
      return NextResponse.json(
        { error: `Couldn't cancel billing, please try again. (${msg})` },
        { status: 502 },
      );
    }
  }

  // 2. Anonymize + retire the operator (keeps the board row + cascade history).
  const { error: rpcErr } = await svc.rpc("delete_account", {
    p_operator_id: op.operatorId,
  });
  if (rpcErr)
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });

  // 3. Remove the auth user (the email). Cascades operator_accounts. Skip if unlinked.
  if (op.userId) {
    const { error: authErr } = await svc.auth.admin.deleteUser(op.userId);
    // A "user not found" here is benign (already gone / never linked) — don't fail the
    // whole deletion after the row is already anonymized.
    if (authErr && !/not.?found/i.test(authErr.message)) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }
  }

  // Fire operator_retired event for trend tracking (best-effort, never blocks).
  await captureServer(op.codename, "operator_retired", {
    codename: op.codename,
    had_subscription: !!customerId,
  });

  return NextResponse.json({ ok: true });
}
