/**
 * app/api/cron/recompute/route.ts — Vercel Cron trigger for the daily
 * recompute workflow.
 *
 * Vercel Cron hits this endpoint at 06:11 UTC daily (configured in
 * vercel.json). The handler starts the durable workflow, which runs
 * the three recompute steps with automatic retries and observability.
 *
 * Security: Vercel Cron requests include a CRON_SECRET header we verify
 * to prevent external abuse. If CRON_SECRET is not set, we fall back to
 * checking the user-agent for vercel-cron (less secure but works on
 * Hobby where you can't always set custom headers).
 */

import { start } from "workflow/api";
import { dailyRecompute } from "@/workflows/daily-recompute";

export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify this is a Vercel Cron request
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const userAgent = request.headers.get("user-agent") ?? "";

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (!userAgent.includes("vercel-cron")) {
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
