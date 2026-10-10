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
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FieldFamilyNav } from "@/components/field/FieldWorkspaceFrame";
import { wikiCategoryById, type WikiCategory } from "@/lib/wiki/evidence-ladder";

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

  const entryPageSections = [
    { id: "ws-wiki-definition", label: "Definition", present: true },
    { id: "ws-wiki-inputs", label: "Inputs", present: Boolean(inputs) },
    { id: "ws-wiki-derived-variables", label: "Derived variables", present: Boolean(derivedVariables) },
    { id: "ws-wiki-claim", label: "Claim", present: Boolean(claim) },
    { id: "ws-wiki-test", label: "Test", present: Boolean(test) },
    { id: "ws-wiki-observable", label: "Observable", present: Boolean(observable) },
    { id: "ws-wiki-falsifier", label: "Falsifier", present: Boolean(falsifiers) },
    { id: "ws-wiki-evidence", label: "Evidence", present: Boolean(evidence) },
    { id: "ws-wiki-limitations", label: "Limitations", present: Boolean(limitations) },
    { id: "ws-wiki-lineage", label: "Lineage", present: Boolean(lineage) },
  ].filter((item) => item.present);

  /** Reusable section wrapper — keeps the 11-section template visually consistent. */
  const Section = ({ label, anchor, children }: { label: string; anchor?: string; children: React.ReactNode }) => (
    <section id={anchor} className="flex flex-col gap-3">
      <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-text-accent">
        {label}
      </h2>
      <div className="font-sans text-sm leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );

  return (
    <WorkspaceShell
      active="wiki"
      editorialStage
      title={title}
      leftTitle="ENTRY"
      topic="wiki"
      left={<FieldFamilyNav current="wiki" pageContents={
        <nav className="ws-nav" aria-label="Sections on this page">
          {entryPageSections.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}
        </nav>
      } />}
      rightTitle="SIGNAL"
      right={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq"></span>META</div>
            <div style={{ marginBottom: 8 }}>
              <EvidenceBadge level={evidenceLevel} />
            </div>
            {(lastUpdated || specVersion) && (
              <div className="ws-kv">
                {lastUpdated && (
                  <div className="row"><span className="k">updated</span><span className="v">{lastUpdated}</span></div>
                )}
                {specVersion && (
                  <div className="row"><span className="k">spec</span><span className="v">{specVersion}</span></div>
                )}
              </div>
            )}
          </div>
          {crossRefs && crossRefs.length > 0 && (
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>CROSS-REFERENCES</div>
              <nav className="ws-nav">
                {crossRefs.map((ref, i) => (
                  <Link key={i} href={ref.href}>→ {ref.label}</Link>
                ))}
              </nav>
            </div>
          )}
        </>
      }
      leftWidth={280}
      rightWidth={240}
      status={<>SIGNALAF WIKI · EVIDENCE LAYER{cat ? ` · ${cat.label.toUpperCase()}` : ""}</>}
    >
      <div className="ws-doc">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 py-2">
          {/* Header: evidence badge + summary (title renders in the shell
              pagetitle strip as the page h1) */}
          <header className="flex flex-col gap-3">
            <EvidenceBadge level={evidenceLevel} />
            <p className="max-w-2xl font-sans text-base leading-relaxed text-text-secondary">
              {summary}
            </p>
          </header>

      {/* 1. Definition */}
      <Section label="Definition" anchor="ws-wiki-definition">{definition}</Section>

      {/* 2. Inputs */}
      {inputs && <Section label="Inputs" anchor="ws-wiki-inputs">{inputs}</Section>}

      {/* 3. Derived variables */}
      {derivedVariables && <Section label="Derived variables" anchor="ws-wiki-derived-variables">{derivedVariables}</Section>}

      {/* 4. Claim */}
      {claim && <Section label="Claim" anchor="ws-wiki-claim">{claim}</Section>}

      {/* 5. Test */}
      {test && <Section label="Test" anchor="ws-wiki-test">{test}</Section>}

      {/* 6. Observable */}
      {observable && <Section label="Observable" anchor="ws-wiki-observable">{observable}</Section>}

      {/* 7. Falsifier */}
      {falsifiers && <Section label="Falsifier" anchor="ws-wiki-falsifier">{falsifiers}</Section>}

      {/* 8. Evidence */}
      {evidence && <Section label="Evidence" anchor="ws-wiki-evidence">{evidence}</Section>}

      {/* 9. Limitations */}
      {limitations && <Section label="Limitations" anchor="ws-wiki-limitations">{limitations}</Section>}

      {/* 10. Version — rendered inline with lastUpdated/specVersion in header */}
      {/* (specVersion prop serves as the Version section) */}

      {/* 11. Lineage */}
      {lineage && <Section label="Lineage" anchor="ws-wiki-lineage">{lineage}</Section>}
        </div>
      </div>
    </WorkspaceShell>
  );
}
