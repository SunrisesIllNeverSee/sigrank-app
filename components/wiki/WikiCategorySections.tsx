/**
 * components/wiki/WikiCategorySections.tsx — evidence-layer category sections.
 *
 * Renders one section per wiki category (Measurement, Metrics, System Tests,
 * Validation, Governance, Commitment Theory) with the anchor ID that
 * WikiCategoryIndex cards and WikiEntry breadcrumbs link to. Each section
 * lists the individual wiki pages in that category.
 *
 * This is the target of the category navigation — without these sections,
 * the category index cards and the breadcrumbs on all 38 wiki pages would
 * link to non-existent anchors.
 *
 * Server component.
 */

import React from "react";
import Link from "next/link";
import {
  WIKI_CATEGORIES,
  WIKI_CATEGORY_PAGES,
  wikiCategoryHubAnchor,
} from "@/lib/wiki/evidence-ladder";

export function WikiCategorySections() {
  return (
    <div className="flex flex-col gap-10">
      {WIKI_CATEGORIES.map((cat) => {
        const pages = WIKI_CATEGORY_PAGES[cat.id] ?? [];
        return (
          <section
            key={cat.id}
            id={wikiCategoryHubAnchor(cat.id)}
            className="flex scroll-mt-20 flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-text-primary">
                {cat.label}
              </h2>
              <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
                {cat.description}
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={page.slug}
                    className="group flex items-center gap-2 rounded-md border border-bg-border bg-bg-surface px-3 py-2 font-mono text-xs text-text-secondary transition-colors hover:border-gold/30 hover:text-text-primary"
                  >
                    <span className="text-text-dim group-hover:text-gold">→</span>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
