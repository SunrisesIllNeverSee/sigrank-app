import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Composition",
  description:
    "How token flow is composed across the four pillars — the structural pattern of token usage.",
  path: "/wiki/measurement/composition",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator", href: "/wiki/measurement/operator" },
  { label: "Yield (Υ)", href: "/wiki/metrics/yield" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function CompositionPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "Composition", path: "/wiki/measurement/composition" },
          ]),
          definedTerm(
            "Composition",
            "How token flow is composed across the four pillars — the structural pattern of token usage.",
            "/wiki/measurement/composition",
          ),
        ]}
      />
      <WikiEntry
        title="Composition"
        summary="How token flow is composed across the four pillars — the structural pattern of token usage."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            How token flow is composed across the four pillars (input, output,
            cache_creation, cache_read). The structural pattern of token usage.
          </>
        }
        inputs={<>The four raw token pillars.</>}
        derivedVariables={
          <>
            Ratios between pillars (transmission, commitment, reuse), cascade
            structure.
          </>
        }
        claim={
          <>
            Composition reveals how an operator structures their AI interaction —
            not just how much they produce, but how they use cache, reuse, and
            fresh input.
          </>
        }
        test={
          <>
            Compare composition profiles across operators and archetypes.
          </>
        }
        observable={
          <>
            Pillar ratios, cascade stage values, archetype classification.
          </>
        }
        falsifiers={
          <>
            If composition profiles are identical across all operators,
            composition is not a meaningful measurement.
          </>
        }
        evidence={
          <>
            10 composition archetypes identified across 4 families in field
            data.
          </>
        }
        limitations={
          <>
            Composition is descriptive, not evaluative — a composition profile
            is not &quot;better&quot; without context.
          </>
        }
        lineage={
          <>SigRank archetype taxonomy, cascade ontology. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
