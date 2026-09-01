/**
 * components/wiki/WikiEntry.tsx — the standardized wiki entry template.
 *
 * Every evidence-layer wiki entry on signalaf.com/wiki follows this template.
 * It enforces a consistent 11-section structure: definition, inputs, derived
 * variables, claim, test, observable, falsifier, evidence, limitations,
 * version, lineage — with an evidence maturity badge at the top.
 *
 * This is the Phase 1 foundation for the ~40 wiki pages that will populate
 * signalaf.com/wiki across six categories (Measurement, Metrics, System Tests,
 * Validation, Governance, Commitment Theory).
 *
 * Server component. The route file owns metadata/SEO; this component owns the
 * visual structure.
 */

import React from "react";
import Link from "next/link";
import { EvidenceBadge } from "./EvidenceBadge";
import { wikiCategoryById, wikiCategoryHubAnchor, type WikiCategory } from "@/lib/wiki/evidence-ladder";

export interface WikiCrossRef {
  /** Label for the cross-reference link. */
  label: string;
  /** URL (internal or external). */
  href: string;
}

export interface WikiEntryProps {
  /** The entry title (rendered as H1). */
  title: string;
  /** One-line summary shown under the title. */
  summary: string;
  /** The wiki category this entry belongs to. */
  category: WikiCategory;
  /** The evidence maturity level ID. */
  evidenceLevel: string;
  /** The definition section content (exact operational meaning). */
  definition: React.ReactNode;
  /** What is observed (raw inputs to the measurement/test). */
  inputs?: React.ReactNode;
  /** What is calculated from the inputs. */
  derivedVariables?: React.ReactNode;
  /** What the metric/test supposedly indicates. */
  claim?: React.ReactNode;
  /** How the claim is evaluated. */
  test?: React.ReactNode;
  /** What is measured during the test. */
  observable?: React.ReactNode;
  /** The evidence section content (tests, data, observations). */
  evidence?: React.ReactNode;
  /** The falsifiers section content (what would disprove this). */
  falsifiers?: React.ReactNode;
  /** Known confounds or limitations. */
  limitations?: React.ReactNode;
  /** The lineage/provenance section content (where this came from, changes over time). */
  lineage?: React.ReactNode;
  /** Optional cross-references to other wiki entries or external sources. */
  crossRefs?: WikiCrossRef[];
  /** Optional last-updated date (ISO string). */
  lastUpdated?: string;
  /** Optional spec version this entry corresponds to. */
  specVersion?: string;
}

export function WikiEntry({
  title,
  summary,
  category,
  evidenceLevel,
  definition,
  inputs,
  derivedVariables,
  claim,
  test,
  observable,
  evidence,
  falsifiers,
  limitations,
  lineage,
  crossRefs,
  lastUpdated,
  specVersion,
}: WikiEntryProps) {
  const cat = wikiCategoryById(category);

  /** Reusable section wrapper — keeps the 11-section template visually consistent. */
  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-text-accent">
        {label}
      </h2>
      <div className="font-sans text-sm leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-2">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-xs text-text-muted">
        <Link href="/wiki" className="transition-colors hover:text-text-primary">
          Wiki
        </Link>
        {cat && (
          <>
            <span className="text-text-dim">/</span>
            <Link
              href={`/wiki#${wikiCategoryHubAnchor(category)}`}
              className="transition-colors hover:text-text-primary"
            >
              {cat.label}
            </Link>
          </>
        )}
      </nav>

      {/* Header: title + evidence badge */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-wide text-text-primary sm:text-4xl">
            {title}
          </h1>
          <EvidenceBadge level={evidenceLevel} />
        </div>
        <p className="max-w-2xl font-sans text-base leading-relaxed text-text-secondary">
          {summary}
        </p>
        {(lastUpdated || specVersion) && (
          <div className="flex flex-wrap gap-3 font-mono text-[11px] text-text-dim">
            {lastUpdated && <span>Last updated: {lastUpdated}</span>}
            {specVersion && <span>Spec: {specVersion}</span>}
          </div>
        )}
      </header>

      {/* 1. Definition */}
      <Section label="Definition">{definition}</Section>

      {/* 2. Inputs */}
      {inputs && <Section label="Inputs">{inputs}</Section>}

      {/* 3. Derived variables */}
      {derivedVariables && <Section label="Derived variables">{derivedVariables}</Section>}

      {/* 4. Claim */}
      {claim && <Section label="Claim">{claim}</Section>}

      {/* 5. Test */}
      {test && <Section label="Test">{test}</Section>}

      {/* 6. Observable */}
      {observable && <Section label="Observable">{observable}</Section>}

      {/* 7. Falsifier */}
      {falsifiers && <Section label="Falsifier">{falsifiers}</Section>}

      {/* 8. Evidence */}
      {evidence && <Section label="Evidence">{evidence}</Section>}

      {/* 9. Limitations */}
      {limitations && <Section label="Limitations">{limitations}</Section>}

      {/* 10. Version — rendered inline with lastUpdated/specVersion in header */}
      {/* (specVersion prop serves as the Version section) */}

      {/* 11. Lineage */}
      {lineage && <Section label="Lineage">{lineage}</Section>}

      {/* Cross-references */}
      {crossRefs && crossRefs.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-text-accent">
            Cross-references
          </h2>
          <ul className="flex flex-col gap-1">
            {crossRefs.map((ref, i) => (
              <li key={i}>
                <Link
                  href={ref.href}
                  className="font-mono text-xs text-text-accent underline-offset-2 hover:underline"
                >
                  → {ref.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <div className="mt-4 border-t border-bg-border-subtle pt-4">
        <Link
          href="/wiki"
          className="font-mono text-xs text-text-accent underline-offset-2 hover:underline"
        >
          ← Back to the Wiki
        </Link>
      </div>
    </div>
  );
}
