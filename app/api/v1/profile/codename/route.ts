import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { revalidateOperatorIndexState } from "@/lib/ingest/materialize";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Could not change codename. Please try again later.";
const CODENAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const RESERVED = new Set(["the-field", "admin", "sigrank", "moses", "system", "null", "undefined"]);

type RenameResult = {
  status: string;
  old_codename: string | null;
  codename: string;
  available_at: string | null;
};

export async function POST(req: NextRequest) {
  const op = await getSessionOperator();
  if (!op) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const svc = getSupabaseService();
  if (!svc) return NextResponse.json({ error: "Profiles are not configured." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid JSON.");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const newCodename = typeof body.codename === "string" ? body.codename.trim().toLowerCase() : "";
  if (!CODENAME_RE.test(newCodename)) {
    return NextResponse.json({ error: "Codename must be 3-30 chars, lowercase letters/numbers/hyphens, starting and ending with a letter or number." }, { status: 400 });
  }
  if (RESERVED.has(newCodename)) {
    return NextResponse.json({ error: "That codename is reserved." }, { status: 400 });
  }

  const { data, error } = await svc.rpc("change_operator_codename", {
    p_operator_id: op.operatorId,
    p_new_codename: newCodename,
  }).single();
  const result = data as RenameResult | null;
  if (error || !result) {
    console.error("[codename] atomic rename failed", error?.message);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  if (result.status === "cooldown" && result.available_at) {
    const at = new Date(result.available_at);
    if (!Number.isFinite(at.getTime())) return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
    return NextResponse.json({
      error: `You changed your codename recently. You can change it again on ${at.toISOString().slice(0, 10)}.`,
      available_at: at.toISOString(),
    }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((at.getTime() - Date.now()) / 1000))) } });
  }
  if (result.status === "held" || result.status === "taken") {
    return NextResponse.json({ error: "That codename is unavailable right now." }, { status: 409 });
  }
  if (result.status === "unchanged" || result.status === "invalid") {
    return NextResponse.json({ error: "That codename is unchanged or invalid." }, { status: 400 });
  }
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Operator profile not found." }, { status: 404 });
  }
  if (result.status !== "changed" || !result.old_codename) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  revalidateOperatorIndexState(op.codename);
  if (result.old_codename !== op.codename) revalidateOperatorIndexState(result.old_codename);
  revalidateOperatorIndexState(newCodename);
  return NextResponse.json({ ok: true, codename: newCodename });
}
