/**
 * workflows/daily-recompute.ts — Durable daily rank recomputation.
 *
 * Replaces the fragile pg_cron-only pipeline with a Vercel Workflow that
 * survives crashes, retries failed steps, and provides observability.
 *
 * Pipeline (3 steps, matching the existing pg_cron jobs):
 *   1. recompute_the_field  — recalculate all operator pillars + ranks
 *   2. refresh_system_stats — update aggregate counters
 *   3. backfill_rank_history — persist daily rank snapshot
 *
 * Each step calls the existing Supabase RPC function via the service-role
 * client. If a step fails, the workflow retries it automatically. If the
 * deployment rolls out mid-run, the workflow resumes from the last
 * completed step.
 *
 * Triggered daily by Vercel Cron at 06:11 UTC (matching the old pg_cron
 * schedule). The cron hits /api/cron/recompute which calls start().
 */

import { getSupabaseService } from "@/lib/infra/supabase/server";

export async function dailyRecompute() {
  "use workflow";

  const step1 = await recomputeField();
  const step2 = await refreshStats();
  const step3 = await backfillHistory();

  return { recomputed: step1, statsRefreshed: step2, historyBackfilled: step3 };
}

/** Step 1: Recalculate all operator pillars and board ranks. */
async function recomputeField() {
  "use step";

  const sb = getSupabaseService();
  if (!sb) throw new Error("Service client unavailable");

  const { error } = await sb.rpc("recompute_the_field");
  if (error) throw new Error(`recompute_the_field failed: ${error.message}`);

  return { ok: true, ranAt: new Date().toISOString() };
}

/** Step 2: Refresh aggregate system stats (operator counts, token totals). */
async function refreshStats() {
  "use step";

  const sb = getSupabaseService();
  if (!sb) throw new Error("Service client unavailable");

  const { error } = await sb.rpc("refresh_system_stats");
  if (error) throw new Error(`refresh_system_stats failed: ${error.message}`);

  return { ok: true, ranAt: new Date().toISOString() };
}

/** Step 3: Backfill the daily rank_history snapshot for trend charts. */
async function backfillHistory() {
  "use step";

  const sb = getSupabaseService();
  if (!sb) throw new Error("Service client unavailable");

  const { error } = await sb.rpc("backfill_rank_history");
  if (error) throw new Error(`backfill_rank_history failed: ${error.message}`);

  return { ok: true, ranAt: new Date().toISOString() };
}
