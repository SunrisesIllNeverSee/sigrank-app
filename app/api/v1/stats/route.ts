/**
 * app/api/v1/stats/route.ts — Aggregate stats endpoint.
 *
 * Returns quantified statistics for AI engines (AEO Item 2a).
 * AI search engines cite numbers — this endpoint provides the canonical
 * aggregate stats that llms.txt, JSON-LD, and the homepage all reference.
 *
 * GET /api/v1/stats → { total_operators, total_tokens, median_yield, ... }
 *
 * Yield aggregates (median/average/max) and token breakdowns
 * (input/output/cache_read/cache_creation) are computed from the
 * `metric_snapshots` table (all_time window, yieldable rows only —
 * input > 0 AND output > 0, matching the board's ghost-row guard).
 * Platform + class-tier breakdowns are grouped from `operators_public`
 * and `metric_snapshots` respectively.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { getHomepageStats } from "@/lib/board";
import { rateLimit, rateLimitHeaders, rateLimitedResponse } from "@/lib/infra/api-gate";

export const revalidate = 3600;

/** Median of a sorted numeric array (returns 0 for empty input). */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);

  const sb = getSupabaseServer();
  const homeStats = await getHomepageStats();

  // Default response from homepage stats (system_stats singleton)
  const stats: Record<string, unknown> = {
    total_operators: homeStats.total_operators,
    total_snapshots: homeStats.total_snapshots,
    total_tokens_scored: homeStats.total_tokens_scored,
    transmitter_count: homeStats.transmitter_count,
    top_operator: homeStats.top_operator_codename,
    top_yield: homeStats.top_signa_rate,
    active_last_hour: homeStats.active_last_hour,
    comparisons_ran: homeStats.comparisons_ran,
    is_placeholder: homeStats.isPlaceholder,
  };

  // Enrich with computed aggregates from the DB if available
  if (sb) {
    try {
      // Yield aggregates + token breakdowns from all_time snapshots.
      // Only rows with input > 0 AND output > 0 are yieldable (matches the
      // board's ghost-row guard in lib/board/queries.ts).
      const { data: snapData } = await sb
        .from("metric_snapshots")
        .select(
          "signa_rate, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens",
        )
        .eq("window_type", "all_time")
        .gt("input_tokens", 0)
        .gt("output_tokens", 0);

      if (snapData && snapData.length > 0) {
        const yields: number[] = [];
        let totalInput = 0;
        let totalOutput = 0;
        let totalCacheCreation = 0;
        let totalCacheRead = 0;

        for (const row of snapData) {
          const y = row.signa_rate;
          if (typeof y === "number" && y > 0) yields.push(y);
          totalInput += row.input_tokens ?? 0;
          totalOutput += row.output_tokens ?? 0;
          totalCacheCreation += row.cache_creation_tokens ?? 0;
          totalCacheRead += row.cache_read_tokens ?? 0;
        }

        stats.total_input_tokens = totalInput;
        stats.total_output_tokens = totalOutput;
        stats.total_cache_creation_tokens = totalCacheCreation;
        stats.total_cache_read_tokens = totalCacheRead;
        stats.total_tokens = totalInput + totalOutput + totalCacheCreation + totalCacheRead;

        if (yields.length > 0) {
          stats.median_yield = median(yields);
          stats.average_yield = yields.reduce((a, b) => a + b, 0) / yields.length;
          stats.max_yield = Math.max(...yields);
          stats.yieldable_operator_count = yields.length;
        } else {
          stats.median_yield = 0;
          stats.average_yield = 0;
          stats.max_yield = 0;
          stats.yieldable_operator_count = 0;
        }
      }

      // Count operators by platform
      const { data: platformData } = await sb
        .from("operators_public")
        .select("primary_domain")
        .not("primary_domain", "is", null);

      if (platformData) {
        const platforms: Record<string, number> = {};
        for (const row of platformData) {
          const p = row.primary_domain as string;
          if (p) platforms[p] = (platforms[p] || 0) + 1;
        }
        stats.platforms = platforms;
        stats.platform_count = Object.keys(platforms).length;
      }

      // Count operators by class tier (from all_time snapshots)
      const { data: classData } = await sb
        .from("metric_snapshots")
        .select("class_tier")
        .eq("window_type", "all_time")
        .not("class_tier", "is", null);

      if (classData) {
        const classes: Record<string, number> = {};
        for (const row of classData) {
          const c = row.class_tier as string;
          if (c) classes[c] = (classes[c] || 0) + 1;
        }
        stats.class_tiers = classes;
      }
    } catch {
      // Enrichment failed — return the base stats
    }
  }

  // Add known constants
  stats.models_tracked = 3304;
  stats.zenodo_doi = "10.5281/zenodo.21900519";
  stats.install = "npx sigrank";
  stats.privacy = "Token counts only. Never prompts.";

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      ...rateLimitHeaders(rl),
    },
  });
}
