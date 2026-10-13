import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** Original submitted kernel: OWNER ONLY. Never leak original JSON through
 * public snapshot-history or SSR props. The standard public table continues
 * to expose only already-approved scored telemetry. */
export async function GET(req: NextRequest, { params }: {
  params: Promise<{ codename: string; submissionId: string }>;
}) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const { codename, submissionId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(codename) || !/^[a-zA-Z0-9_-]{1,130}$/.test(submissionId)) {
    return NextResponse.json({ error: "Invalid identifier" }, { status: 400, headers });
  }
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers });
  const { data: linked, error: linkError } = await sb
    .from("operator_accounts").select("operator_id").eq("user_id", user.id).maybeSingle();
  if (linkError) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers });
  if (!linked?.operator_id) return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const { data: operator, error: operatorError } = await sb
    .from("operators").select("operator_id,codename").eq("operator_id", linked.operator_id).maybeSingle();
  if (operatorError) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers });
  if (!operator || operator.codename !== codename) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  }
  const { data: row, error } = await sb.from("snapshot_submissions")
    .select("submission_id,submitted_at,snapshot_hash,payload_json")
    .eq("operator_id", linked.operator_id).eq("submission_id", submissionId)
    .eq("status", "scored").maybeSingle();
  if (error) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  return NextResponse.json({
    submissionId: row.submission_id,
    submittedAt: row.submitted_at,
    snapshotHash: row.snapshot_hash,
    source: "Original submitted payload_json — not reconstructed from displayed metrics",
    kernel: row.payload_json,
  }, { headers });
}
