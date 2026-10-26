/**
 * app/api/profile/report-visibility/route.ts — toggle the Report tab visibility.
 *
 * POST: flips report_visible on the operator's latest report.
 * Requires auth (the operator must be logged in and linked to the operator).
 * Server-side only — uses the service role key to update the report.
 *
 * Privacy: the Report tab is opt-in, off by default. The operator must
 * explicitly choose to share their cascade report (mode patterns, badges, DNA).
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const visible = Boolean(body.visible);

    // Auth: the operator must be logged in and linked
    const sessionOp = await getSessionOperator();
    if (!sessionOp) {
      return NextResponse.json(
        { status: "error", reason: "unauthorized" },
        { status: 401 },
      );
    }

    const svc = getSupabaseService();
    if (!svc) {
      return NextResponse.json(
        { status: "error", reason: "server_not_configured" },
        { status: 500 },
      );
    }

    // Update the operator's report visibility. PostgREST ignores
    // order/limit on PATCH, so this sets the flag on all of the operator's
    // report rows — the read path always takes the latest, which is the
    // intended behavior anyway.
    const { error } = await svc
      .from("operator_reports")
      .update({ report_visible: visible })
      .eq("operator_id", sessionOp.operatorId);

    if (error) {
      return NextResponse.json(
        { status: "error", reason: "update_failed", detail: error.message },
        { status: 500 },
      );
    }

    // The serialized report rides in the "operator" unstable_cache and the
    // ISR'd /user/[codename] payload — invalidate both so a flip to private
    // stops serving the report at the next request, not after 150s / 6h.
    revalidateTag("operator", "max");
    revalidatePath(`/user/${sessionOp.codename}`);
    revalidatePath(`/user/${sessionOp.codename.toLowerCase()}`);

    return NextResponse.json({
      status: "ok",
      report_visible: visible,
    });
  } catch (e) {
    return NextResponse.json(
      { status: "error", reason: "server_error", detail: String(e) },
      { status: 500 },
    );
  }
}
