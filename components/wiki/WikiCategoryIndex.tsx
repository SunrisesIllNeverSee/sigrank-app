/**
 * components/wiki/WikiCategoryIndex.tsx — the evidence-layer category index.
 *
 * Renders the six wiki categories (Measurement, Metrics, System Tests,
 * Validation, Governance, Commitment Theory) as a navigable grid. Each card
 * links to the category's section anchor on the /wiki page. This is the
 * entry point to the evidence layer — the cold, factual reference that
 * complements the console showcase.
 *
 * Server component.
 */

import React from "react";
import Link from "next/link";
import { WIKI_CATEGORIES } from "@/lib/wiki/evidence-ladder";

interface Props {
  /** Optional: entries count per category, if known. */
  entryCounts?: Record<string, number>;
}

export function WikiCategoryIndex({ entryCounts }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-lg font-bold uppercase tracking-wide text-text-primary">
          Evidence Layer
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          The reference wiki: definitions, tests, data, falsifiers, and lineage
          for every claim. Each entry carries an evidence maturity badge — from
          hypothesized to canonical.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WIKI_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/wiki#${cat.id}`}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4 transition-colors hover:border-gold/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
                {cat.label}
              </h3>
              {entryCounts && entryCounts[cat.id] != null && (
                <span className="font-mono text-[11px] tabular-nums text-text-dim">
                  {entryCounts[cat.id]} entries
                </span>
              )}
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">
              {cat.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
