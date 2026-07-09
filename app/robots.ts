/**
 * app/robots.ts — robots.txt for crawlers.
 *
 * Allow all crawlers access to everything. The sitemap is referenced so
 * Google Search Console can discover it automatically.
 */

import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't index API routes or auth callback — they're not content pages
      disallow: ["/api/", "/auth/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
