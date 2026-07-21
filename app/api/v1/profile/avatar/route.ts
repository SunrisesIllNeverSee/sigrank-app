import { NextResponse, type NextRequest } from "next/server";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";

/**
 * POST /api/v1/profile/avatar — upload the signed-in operator's avatar.
 *
 * Multipart `file` → validated (image mime + ≤2 MB) → stored in the `avatars` bucket
 * (0010) under the operator's OWN folder (`<operator_id>/...`) → operators.avatar_url
 * set to the public URL. Service-role upload, path-scoped to the verified session's
 * operator_id (RLS in 0010 enforces the same boundary for any client-direct write).
 */
export const dynamic = "force-dynamic";

const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const op = await getSessionOperator();
  if (!op)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const svc = getSupabaseServer();
  if (!svc)
    return NextResponse.json(
      { error: "Storage is not configured." },
      { status: 503 },
    );

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "Use a PNG, JPG, WebP, or GIF image." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 2 MB." },
      { status: 413 },
    );
  }

  // Time-stamped name busts the public-URL cache when an operator re-uploads.
  const path = `${op.operatorId}/avatar-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await svc.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = svc.storage.from("avatars").getPublicUrl(path);
  const url = pub.publicUrl;

  // Uploading is an explicit edit → lock the avatar against provider resync (0012).
  const { error: dbErr } = await svc
    .from("operators")
    .update({ avatar_url: url, avatar_locked: true })
    .eq("operator_id", op.operatorId);
  if (dbErr)
    return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, url });
}
