import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { revalidateOperatorIndexState } from "@/lib/ingest/materialize";

/**
 * POST /api/v1/profile/codename — change the signed-in operator's codename.
 *
 * Owner 2026-07-16: "peoples ability to change code name and user handle".
 * Handle is already editable via POST /api/v1/profile. Codename was previously
 * immutable (the "permanent identity" lock). This endpoint allows codename
 * changes, rate-limited by a 30-day cooldown per operator.
 *
 * Rules:
 *   - Auth-resolved (verifies session via getUser)
 *   - Codename must be 3-30 chars, alphanumeric + hyphens, lowercase
 *   - Must be unique (not already taken by another operator)
 *   - 30-day cooldown: an operator who changed codename in the last 30 days
 *     gets a 429 with the date they can change again
 *   - Released names are held for 30 days: a codename another operator
 *     released (old_codename in codename_history) within the last 30 days
 *     cannot be claimed by anyone else; the previous owner may reclaim it
 *   - Service-role write, scoped to the resolved operator_id
 *   - Records the change in codename_history (migration 0054, service-role only)
 */
export const dynamic = "force-dynamic";

const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
const GENERIC_ERROR = "Could not change codename. Please try again later.";

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

  // Cooldown: one change per operator per 30 days.
  const { data: last, error: lastErr } = await svc
    .from("codename_history")
    .select("changed_at")
    .eq("operator_id", op.operatorId)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) {
    console.error("[codename] cooldown lookup failed", lastErr.message);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
  if (last?.changed_at) {
    const availableAt = new Date(
      new Date(last.changed_at as string).getTime() + COOLDOWN_MS,
    );
    if (availableAt.getTime() > Date.now()) {
      return NextResponse.json(
        {
          error: `You changed your codename recently. You can change it again on ${availableAt.toISOString().slice(0, 10)}.`,
          available_at: availableAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((availableAt.getTime() - Date.now()) / 1000),
            ),
          },
        },
      );
    }
  }

  // Held names: a codename another operator released in the last 30 days is
  // not claimable by anyone else (the previous owner may reclaim it).
  const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();
  const { data: held, error: heldErr } = await svc
    .from("codename_history")
    .select("id")
    .ilike("old_codename", newCodename)
    .neq("operator_id", op.operatorId)
    .gte("changed_at", cutoff)
    .limit(1)
    .maybeSingle();
  if (heldErr) {
    console.error("[codename] held-name lookup failed", heldErr.message);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
  if (held) {
    return NextResponse.json(
      { error: "That codename is unavailable right now." },
      { status: 409 },
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

  // Record history first so a successful rename can never escape the
  // cooldown; roll the row back if the rename itself fails.
  const { data: hist, error: histErr } = await svc
    .from("codename_history")
    .insert({
      operator_id: op.operatorId,
      old_codename: op.codename,
      new_codename: newCodename,
    })
    .select("id")
    .single();
  if (histErr || !hist) {
    console.error("[codename] history insert failed", histErr?.message);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  const { error } = await svc
    .from("operators")
    .update({ codename: newCodename })
    .eq("operator_id", op.operatorId);

  if (error) {
    console.error("[codename] update failed", error.message);
    await svc.from("codename_history").delete().eq("id", hist.id);
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "That codename is already taken." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  // The codename IS the indexed URL — bust both the old path (now a 404 the
  // sitemap would otherwise keep advertising until TTL) and the new one.
  revalidateOperatorIndexState(op.codename);
  revalidateOperatorIndexState(newCodename);

  return NextResponse.json({ ok: true, codename: newCodename });
}
