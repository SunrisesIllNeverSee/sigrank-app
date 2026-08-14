/**
 * app/api/v1/stats/route.ts — Aggregate stats endpoint.
 *
 * Returns quantified statistics for AI engines (AEO Item 2a).
 * AI search engines cite numbers — this endpoint provides the canonical
 * aggregate stats that llms.txt, JSON-LD, and the homepage all reference.
 *
 * GET /api/v1/stats → { total_operators, total_tokens, median_yield, ... }
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { getHomepageStats } from "@/lib/board";

export const revalidate = 3600;

export async function GET() {
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

      // Count operators by class tier (from latest snapshots)
      const { data: classData } = await sb
        .from("metric_snapshots")
        .select("class_tier, window_type")
        .eq("window_type", "all_time");

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
  stats.zenodo_doi = "10.5281/zenodo.21900519";
  stats.install = "npx sigrank";
  stats.privacy = "Token counts only. Never prompts.";

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
