import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Semantic Entropy",
  description:
    "A measure of the information loss or disorder introduced into a signal through transformation. Entropy from redundant generation, commitment degradation, or signal dilution.",
  path: "/wiki/ct/semantic-entropy",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Conservation Law of Commitment", href: "/wiki/ct/conservation" },
  { label: "Compression (System Tests)", href: "/wiki/tests/compression" },
  { label: "Commitment", href: "/wiki/ct/commitment" },
  { label: "Conservation Law (mos2es.com)", href: "https://mos2es.com/concepts/conservation-law" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function SemanticEntropyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Commitment Theory", path: "/wiki#evidence-commitment-theory" },
            { name: "Semantic Entropy", path: "/wiki/ct/semantic-entropy" },
          ]),
          definedTerm(
            "Semantic Entropy",
            "A measure of the information loss or disorder introduced into a signal through transformation.",
            "/wiki/ct/semantic-entropy",
          ),
        ]}
      />
      <WikiEntry
        title="Semantic Entropy"
        summary="A measure of the information loss or disorder introduced into a signal through transformation. Entropy from redundant generation, commitment degradation, or signal dilution."
        category="commitment-theory"
        evidenceLevel="concept"
        specVersion="CT Research Prospectus V.1"
        definition={
          <>
            A measure of the information loss or disorder introduced into a
            signal through transformation. Entropy introduced by redundant
            generation, commitment degradation, or signal dilution.
          </>
        }
        inputs={<>Original signal S. Transformed signal T(S).</>}
        derivedVariables={
          <>
            Entropy = information loss between S and T(S). Redundancy in T(S).
            Signal-to-noise degradation.
          </>
        }
        claim={
          <>
            Transformations introduce semantic entropy — the transformed signal
            carries less commitment and more noise than the original. This
            entropy is measurable.
          </>
        }
        test={
          <>
            Measure information content and commitment in S and T(S). Compute
            the entropy difference.
          </>
        }
        observable={
          <>
            Entropy values, information loss metrics, redundancy measures.
          </>
        }
        falsifiers={
          <>
            Transformations do not introduce semantic entropy (information is
            preserved perfectly).
          </>
        }
        evidence={
          <>
            Related to the Conservation Law experiments which measure commitment
            degradation. Direct entropy measurement not yet conducted.
          </>
        }
        limitations={
          <>
            Semantic entropy is distinct from Shannon entropy — it measures
            meaning loss, not bit-level information loss. Measurement methods
            are not standardized.
          </>
        }
        lineage={<>Commitment Theory, Conservation Law, MO§ES™ architecture. Architecture: <a href="https://mos2es.com/concepts/conservation-law" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/conservation-law</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
