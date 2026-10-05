/**
 * app/sitemap.ts — dynamic sitemap for Google Search Console.
 *
 * Static routes are listed with their natural change frequency. Operator
 * profile routes (/user/<codename>) come from the claimed-operator data layer
 * filtered through the shared search-indexing policy (lib/seo/indexing-policy.ts)
 * — a URL appears here iff its page is eligible for `index,follow`. Board
 * windows + wiki subpages are enumerated from their source-of-truth arrays.
 *
 * Freshness contract (SEARCH-RECOVERY Phase 1): no synthesized lastModified.
 * An entry emits lastmod only when the route declares a real modification
 * date; generation time and shared fallback dates are never sent.
 */

import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";
import { getIndexableOperatorRows } from "@/lib/board";
import { BOARD_WINDOWS } from "@/lib/board/windows";
import {
  staticSitemapEntries,
  operatorSitemapEntries,
  STATIC_ROUTES,
} from "@/lib/seo/sitemap-entries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Membership is governed by config/search-index-policy.ts (CORE +
  // SUPPORTED promoted; HOLD stays live but unadvertised; UTILITY + REDIRECT
  // never promoted). lastModified only when the route entry declares a real
  // modification date; no shared fallback date, no generation time.
  // Board windows include /board/all as the single emitter (never re-added
  // to STATIC_ROUTES); /board/off is excluded — it 307-redirects to
  // /board/all, which causes "Duplicate without user-selected canonical".
  const entries = staticSitemapEntries(
    STATIC_ROUTES,
    BOARD_WINDOWS.map((w) => w.slug),
    SITE_ORIGIN,
  );

  // Operator profile routes — the search-indexable population only. Sourced
  // from the data layer (claimed operators + snapshot existence), never from
  // the public leaderboard HTTP API (a rate-limited, 30d-windowed view that is
  // not the indexing contract). Each row passes through the shared policy, so
  // sitemap membership == the page's index,follow eligibility. Data-layer
  // failure leaves a valid partial sitemap rather than erroring the route.
  let operatorEntries: MetadataRoute.Sitemap = [];
  try {
    operatorEntries = operatorSitemapEntries(
      await getIndexableOperatorRows(),
      SITE_ORIGIN,
    );
  } catch {
    // Data layer unreachable — skip operator entries (sitemaps can be partial)
  }

  return [...entries, ...operatorEntries];
}
