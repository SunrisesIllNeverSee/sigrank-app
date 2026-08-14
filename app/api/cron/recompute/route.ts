/**
 * app/api/cron/recompute/route.ts — Vercel Cron trigger for the daily
 * recompute workflow.
 *
 * Vercel Cron hits this endpoint at 06:11 UTC daily (configured in
 * vercel.json). The handler starts the durable workflow, which runs
 * the three recompute steps with automatic retries and observability.
 *
 * Security: Vercel Cron sends an Authorization: Bearer <CRON_SECRET>
 * header. We require CRON_SECRET to be set and match it exactly — no
 * user-agent fallback (trivially spoofable). If CRON_SECRET is unset
 * the endpoint returns 500 so the misconfiguration is loud, not silent.
 */

import { start } from "workflow/api";
import { dailyRecompute } from "@/workflows/daily-recompute";

export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET is not set — cannot verify cron request" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await start(dailyRecompute, []);
    return Response.json({
      ok: true,
      message: "Daily recompute workflow started",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
