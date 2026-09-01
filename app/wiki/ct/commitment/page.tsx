import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Commitment",
  description:
    "Semantic obligation embedded in a signal. The commitment function C(S) measures the strength of obligation in a natural language signal S.",
  path: "/wiki/ct/commitment",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Conservation Law of Commitment", href: "/wiki/ct/conservation" },
  { label: "Transformation", href: "/wiki/ct/transformation" },
  { label: "Semantic Entropy", href: "/wiki/ct/semantic-entropy" },
  { label: "Conservation Law (mos2es.com)", href: "https://mos2es.com/concepts/conservation-law" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function CommitmentPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Commitment Theory", path: "/wiki#evidence-commitment-theory" },
            { name: "Commitment", path: "/wiki/ct/commitment" },
          ]),
          definedTerm(
            "Commitment",
            "Semantic obligation embedded in a signal. The commitment function C(S) measures the strength of obligation in a natural language signal S.",
            "/wiki/ct/commitment",
          ),
        ]}
      />
      <WikiEntry
        title="Commitment"
        summary="Semantic obligation embedded in a signal. The commitment function C(S) measures the strength of obligation in a natural language signal S."
        category="commitment-theory"
        evidenceLevel="demonstration"
        specVersion="CT Research Prospectus V.1"
        definition={
          <>
            Semantic obligation embedded in a signal. The commitment function
            C(S) measures the strength of obligation in a natural language
            signal S.
          </>
        }
        inputs={
          <>
            A natural language signal (utterance, instruction, contract clause,
            specification).
          </>
        }
        derivedVariables={<>{`C(S) — the commitment value of the signal.`}</>}
        claim={
          <>
            Natural language signals carry embedded commitment —
            &ldquo;shall&rdquo; is stronger than &ldquo;may,&rdquo;
            &ldquo;must&rdquo; is stronger than &ldquo;should.&rdquo; This
            commitment is measurable and degrades under transformation.
          </>
        }
        test={
          <>
            Measure commitment in original signals and transformed versions.
            Compare commitment levels across signal types (contractual versus
            suggestive).
          </>
        }
        observable={
          <>
            Commitment values before and after transformation. Degradation
            rates.
          </>
        }
        falsifiers={
          <>
            Commitment cannot be consistently measured, OR transformations do
            not degrade commitment.
          </>
        }
        evidence={
          <>
            Conservation Law experiments (DOI 10.5281/zenodo.19105225) measured
            commitment degradation across 7 controlled experiments with a
            20-signal canonical corpus, 10 recursive iterations, and NLI
            bidirectional entailment.
          </>
        }
        limitations={
          <>
            Commitment measurement depends on the measurement method (NLI,
            Jaccard, etc.). Different methods may produce different values.
          </>
        }
        lineage={
          <>
            Commitment Theory research program, Conservation Law paper (DOI
            10.5281/zenodo.20029607).
           Architecture: <a href="https://mos2es.com/concepts/conservation-law" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/conservation-law</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
