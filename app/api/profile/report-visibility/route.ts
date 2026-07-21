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

import { NextResponse } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";

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

    const svc = getSupabaseServer();
    if (!svc) {
      return NextResponse.json(
        { status: "error", reason: "server_not_configured" },
        { status: 500 },
      );
    }

    // Update the operator's latest report's visibility
    const { error } = await svc
      .from("operator_reports")
      .update({ report_visible: visible })
      .eq("operator_id", sessionOp.operatorId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", reason: "update_failed", detail: error.message },
        { status: 500 },
      );
    }

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
