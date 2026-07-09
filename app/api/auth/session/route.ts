import { NextResponse } from "next/server";
import { getSessionOperator } from "@/lib/supabase/auth-server";

/**
 * GET /api/auth/session — the current signed-in operator's PUBLIC display fields
 * (codename, display name, avatar), or { operator: null } when logged out.
 *
 * The nav AccountMenu calls this client-side so auth state renders without forcing
 * every page (the anonymous board included) into dynamic rendering. Returns ONLY
 * public profile fields — never the auth email (P5). Resolution is getUser-verified
 * server-side (the cookie is validated with Supabase, not trusted blindly).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const op = await getSessionOperator();
  if (!op) return NextResponse.json({ operator: null });
  return NextResponse.json({
    operator: {
      codename: op.codename,
      displayName: op.displayName,
      avatarUrl: op.avatarUrl,
    },
  });
}
