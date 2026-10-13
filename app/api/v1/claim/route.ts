import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/infra/supabase/auth-server";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to manage your operator profile." },
      { status: 401 },
    );
  }
  return NextResponse.json(
    {
      error: "Seeded profile claiming is unavailable until secure ownership verification is supported.",
      code: "claim_verification_unavailable",
    },
    { status: 503, headers: { "Cache-Control": "private, no-store" } },
  );
}
