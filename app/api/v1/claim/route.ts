import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/supabase/auth-server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/v1/claim — claim an existing unclaimed seeded operator profile.
 *
 * Flow (the "seeded claim" — distinct from the auth-callback mint path):
 *   1. User is signed in (GitHub OAuth — verified via getUser).
 *   2. User is NOT already linked to an operator (no operator_accounts row).
 *   3. Body: { codename, input_tokens } — the codename of the seeded profile
 *      they want to claim + their exact tokscale lifetime input token count
 *      (the verification: only the real operator knows this number).
 *   4. Server looks up the operator by codename. Must be:
 *        - unclaimed (claimed = false)
 *        - active (status = 'active')
 *        - have a metric_snapshots row with input_tokens matching the provided value
 *   5. On match: link the auth user to the operator via operator_accounts,
 *      set claimed = true + claimed_at. Return success.
 *   6. On mismatch: return 403 with a vague error (don't leak the correct number).
 *
 * Security:
 *   - operator_id comes from the SERVER lookup, never the body (no IDOR).
 *   - input_tokens verification prevents impersonation (only the real operator
 *     knows their exact lifetime token count from tokscale).
 *   - The error message is deliberately vague to prevent number-guessing.
 *   - Rate-limited via the standard gate (best-effort per-IP).
 */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Must be signed in.
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with GitHub to claim a profile." },
      { status: 401 },
    );
  }

  const svc = getSupabaseServer();
  if (!svc) {
    return NextResponse.json(
      { error: "Claim is not available right now." },
      { status: 503 },
    );
  }

  // 2. Must NOT already be linked to an operator.
  const { data: existing } = await svc
    .from("operator_accounts")
    .select("operator_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          "You already have a profile. Sign out and create a new account to claim a different one.",
      },
      { status: 409 },
    );
  }

  // 3. Parse + validate body.
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const codename = typeof body.codename === "string" ? body.codename.trim() : "";
  const inputTokensRaw = body.input_tokens;
  const inputTokens =
    typeof inputTokensRaw === "string"
      ? inputTokensRaw.replace(/[,\s]/g, "")
      : typeof inputTokensRaw === "number"
        ? String(Math.floor(inputTokensRaw))
        : "";

  if (!codename || !inputTokens) {
    return NextResponse.json(
      { error: "Codename and input_tokens are required." },
      { status: 400 },
    );
  }

  // 4. Look up the operator — must be unclaimed + active.
  const { data: opData } = await svc
    .from("operators")
    .select("operator_id, claimed, status")
    .eq("codename", codename)
    .maybeSingle();

  const op = opData as {
    operator_id: string;
    claimed: boolean;
    status: string;
  } | null;

  if (!op) {
    return NextResponse.json(
      { error: "No operator found with that codename." },
      { status: 404 },
    );
  }

  if (op.claimed) {
    return NextResponse.json(
      { error: "This profile has already been claimed." },
      { status: 409 },
    );
  }

  if (op.status !== "active") {
    return NextResponse.json(
      { error: "This profile is not available to claim." },
      { status: 403 },
    );
  }

  // 5. Verify the input_tokens match the latest snapshot.
  const { data: snapData } = await svc
    .from("metric_snapshots")
    .select("input_tokens")
    .eq("operator_id", op.operator_id)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const snap = snapData as { input_tokens: string | number | null } | null;
  const storedInput = snap?.input_tokens
    ? String(snap.input_tokens).replace(/[,\s]/g, "")
    : null;

  // Deliberately vague on mismatch — don't leak the correct number.
  if (!storedInput || storedInput !== inputTokens) {
    return NextResponse.json(
      {
        error:
          "Verification failed. Check your exact lifetime input token count on tokscale and try again.",
      },
      { status: 403 },
    );
  }

  // 6. Link the auth user to the operator + mark claimed.
  const { error: linkError } = await svc
    .from("operator_accounts")
    .insert({ user_id: user.id, operator_id: op.operator_id });

  if (linkError) {
    // Could be a unique violation if someone claimed it between our check and insert.
    return NextResponse.json(
      { error: "Could not link this profile. It may have just been claimed." },
      { status: 409 },
    );
  }

  await svc
    .from("operators")
    .update({
      claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq("operator_id", op.operator_id);

  // Sync display_name + avatar from GitHub user_metadata (same as auth callback).
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const name = str(meta.full_name) ?? str(meta.name);
  const avatar = str(meta.avatar_url) ?? str(meta.picture);
  const handle = (str(meta.user_name) ?? str(meta.preferred_username))?.replace(
    /^@+/,
    "",
  );

  const patch: Record<string, string> = {};
  if (name) patch.display_name = name;
  if (avatar) patch.avatar_url = avatar;
  if (Object.keys(patch).length > 0) {
    await svc
      .from("operators")
      .update(patch)
      .eq("operator_id", op.operator_id);
  }
  // handle is UNIQUE — best-effort, don't fail if collision.
  if (handle) {
    await svc
      .from("operators")
      .update({ handle })
      .eq("operator_id", op.operator_id);
  }

  return NextResponse.json({
    status: "claimed",
    codename,
    operator_id: op.operator_id,
  });
}
