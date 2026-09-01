import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Lineage Preservation",
  description:
    "Whether a system can maintain traceable continuity through its chain of decisions and transformations during operation.",
  path: "/wiki/governance/lineage-preservation",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Execution-Layer Governance", href: "/wiki/governance/execution-layer-governance" },
  { label: "Lineage (System Tests)", href: "/wiki/tests/lineage" },
  { label: "Conservation Law of Commitment", href: "/wiki/ct/conservation" },
  { label: "Governance vs Alignment (mos2es.com)", href: "https://mos2es.com/governance-vs-alignment" },
  { label: "Execution-Layer Governance (mos2es.org)", href: "https://mos2es.org/execution-governance" },
];

export default function LineagePreservationPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Governance", path: "/wiki#evidence-governance" },
            { name: "Lineage Preservation", path: "/wiki/governance/lineage-preservation" },
          ]),
          definedTerm(
            "Lineage Preservation",
            "Whether a system can maintain traceable continuity through its chain of decisions and transformations during operation.",
            "/wiki/governance/lineage-preservation",
          ),
        ]}
      />
      <WikiEntry
        title="Lineage Preservation"
        summary="Whether a system can maintain traceable continuity through its chain of decisions and transformations during operation."
        category="governance"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Whether a system can maintain traceable continuity through its chain
            of decisions and transformations during operation.
          </>
        }
        inputs={
          <>
            A chain of transformations: origin → state → transformation →
            decision → output.
          </>
        }
        derivedVariables={
          <>
            Chain completeness, link integrity, origin recoverability.
          </>
        }
        claim={
          <>
            A governed system preserves the lineage chain that makes its current
            action valid. Without governance, the chain degrades through
            recursive transformation.
          </>
        }
        test={
          <>
            Apply transformations through a system with and without governance
            enforcement. Measure whether the chain can be reconstructed in each
            case.
          </>
        }
        observable={
          <>
            Whether each link in the chain is intact. Whether the origin can be
            recovered.
          </>
        }
        falsifiers={
          <>
            The chain is equally preserved with or without governance
            enforcement.
          </>
        }
        evidence={
          <>
            Related to the Conservation Law experiments (DOI
            10.5281/zenodo.19105225) which show commitment degradation without
            enforcement.
          </>
        }
        limitations={
          <>
            Lineage preservation in simple chains may not generalize to complex
            multi-step transformations.
          </>
        }
        lineage={<>MO§ES™ architecture, Conservation Law experiments. Architecture: <a href="https://mos2es.com/governance-vs-alignment" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/governance-vs-alignment</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
