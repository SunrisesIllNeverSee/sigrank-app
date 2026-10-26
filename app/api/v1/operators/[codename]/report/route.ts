/**
 * /api/v1/operators/{codename}/report — the operator's latest cascade report.
 *
 * GET → { report } — the full OperatorReport row when report_visible is on
 *       (public opt-in), or when the caller is the linked owner. Otherwise
 *       404 — a private report's existence and contents are never exposed.
 *       Never cached: report_visible can flip via
 *       /api/profile/report-visibility at any time.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer, getSupabaseService } from "@/lib/infra/supabase/server";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const { codename } = await params;
  // Same shape gate as the snapshot-history route — rejects % / _ wildcards
  // before they reach the ilike pattern below.
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(codename)) {
    return json(
      { status: "invalid", detail: "Codename must be 1-100 chars of [a-zA-Z0-9_-]." },
      400,
    );
  }
  const sb = getSupabaseServer();
  if (!sb) return json({ status: "unavailable" }, 503);

  const { data: op } = await sb
    .from("operators_public")
    .select("operator_id")
    .ilike("codename", codename)
    .limit(1)
    .maybeSingle();
  if (!op) {
    return json(
      { status: "not_found", detail: `No operator "${codename}".` },
      404,
    );
  }

  // Private reports are invisible to anon; the service client sees them so the
  // owner check below can still serve them to the linked operator.
  const svc = getSupabaseService();
  if (!svc) return json({ status: "unavailable" }, 503);

  const { data: report } = await svc
    .from("operator_reports")
    .select("report, report_visible, created_at")
    .eq("operator_id", op.operator_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!report) return json({ status: "not_found" }, 404);

  // Private reports serve only the linked owner — verified via the session's
  // operator_accounts link, the same check /api/profile/report-visibility uses.
  if (!report.report_visible) {
    const sessionOp = await getSessionOperator();
    if (sessionOp?.operatorId !== op.operator_id) {
      return json({ status: "not_found" }, 404);
    }
  }

  return json({ report });
}
