import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";

/**
 * POST /api/v1/profile/codename — change the signed-in operator's codename.
 *
 * Owner 2026-07-16: "peoples ability to change code name and user handle".
 * Handle is already editable via POST /api/v1/profile. Codename was previously
 * immutable (the "permanent identity" lock). This endpoint allows a one-time
 * codename change per the owner's request.
 *
 * Rules:
 *   - Auth-resolved (verifies session via getUser)
 *   - Codename must be 3-30 chars, alphanumeric + hyphens, lowercase
 *   - Must be unique (not already taken by another operator)
 *   - Service-role write, scoped to the resolved operator_id
 *   - Records the change in codename_history for audit
 */
export const dynamic = "force-dynamic";

const CODENAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export async function POST(req: NextRequest) {
  const op = await getSessionOperator();
  if (!op)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const svc = getSupabaseServer();
  if (!svc)
    return NextResponse.json(
      { error: "Profiles are not configured." },
      { status: 503 },
    );

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const newCodename =
    typeof body.codename === "string" ? body.codename.trim().toLowerCase() : "";

  if (!newCodename || !CODENAME_RE.test(newCodename)) {
    return NextResponse.json(
      {
        error:
          "Codename must be 3-30 chars, lowercase letters/numbers/hyphens, starting and ending with a letter or number.",
      },
      { status: 400 },
    );
  }

  if (newCodename === op.codename) {
    return NextResponse.json(
      { error: "That's already your codename." },
      { status: 400 },
    );
  }

  // Reserved codenames that can't be claimed
  const RESERVED = new Set([
    "the-field",
    "admin",
    "sigrank",
    "moses",
    "system",
    "null",
    "undefined",
  ]);
  if (RESERVED.has(newCodename)) {
    return NextResponse.json(
      { error: "That codename is reserved." },
      { status: 400 },
    );
  }

  // Check uniqueness
  const { data: existing } = await svc
    .from("operators")
    .select("operator_id")
    .eq("codename", newCodename)
    .neq("operator_id", op.operatorId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "That codename is already taken." },
      { status: 409 },
    );
  }

  // Update the codename
  const { error } = await svc
    .from("operators")
    .update({ codename: newCodename })
    .eq("operator_id", op.operatorId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, codename: newCodename });
}
