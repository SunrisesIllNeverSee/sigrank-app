import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Conservation Law of Commitment",
  description:
    "A falsifiable conservation law: semantic commitment in natural language is preserved under recursive transformative compression if and only if governance enforcement is present.",
  path: "/wiki/ct/conservation",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Commitment", href: "/wiki/ct/commitment" },
  { label: "Transformation", href: "/wiki/ct/transformation" },
  { label: "Lineage Preservation", href: "/wiki/governance/lineage-preservation" },
  { label: "Conservation Law (mos2es.com)", href: "https://mos2es.com/concepts/conservation-law" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function ConservationPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Commitment Theory", path: "/wiki#evidence-commitment-theory" },
            { name: "Conservation Law of Commitment", path: "/wiki/ct/conservation" },
          ]),
          definedTerm(
            "Conservation Law of Commitment",
            "A falsifiable conservation law stating that semantic commitment in natural language is preserved under recursive transformative compression if and only if governance enforcement is present.",
            "/wiki/ct/conservation",
          ),
        ]}
      />
      <WikiEntry
        title="Conservation Law of Commitment"
        summary="A falsifiable conservation law: semantic commitment is preserved under recursive transformation if and only if governance enforcement is present."
        category="commitment-theory"
        evidenceLevel="repeated-experiment"
        specVersion="V.05"
        definition={
          <>
            A falsifiable conservation law stating that semantic commitment in
            natural language is preserved under recursive transformative
            compression if and only if governance enforcement is present.
            Formally: {`C(T(S)) ≈ C(S)`} with enforcement;{" "}
            {`C(T(S)) < C(S)`} without it.
          </>
        }
        inputs={
          <>
            Original signal S, transformation operator T, enforcement presence
            or absence.
          </>
        }
        derivedVariables={
          <>
            {`C(S)`} — commitment of original. {`C(T(S))`} — commitment of
            transformed. Degradation: {`C(S) - C(T(S))`}.
          </>
        }
        claim={
          <>
            Without enforcement, each recursive transformation degrades
            commitment. A &ldquo;shall&rdquo; drifts to a &ldquo;may.&rdquo; A
            &ldquo;must&rdquo; softens to a &ldquo;should.&rdquo; This
            degradation is systematic, measurable, and accelerates with
            recursion depth.
          </>
        }
        test={
          <>
            7 controlled experiments (EXP-001 through EXP-007) using a
            20-signal canonical corpus, 10 recursive iterations per signal, NLI
            bidirectional entailment, and Jaccard surface stability
            measurement.
          </>
        }
        observable={
          <>
            Commitment values at each recursion depth, with and without
            enforcement.
          </>
        }
        falsifiers={
          <>
            {`C(T(S)) ≈ C(S)`} without enforcement (commitment is conserved
            without governance), OR {`C(T(S)) < C(S)`} with enforcement
            (governance does not prevent degradation).
          </>
        }
        evidence={
          <>
            Experimental record published on Zenodo (DOI
            10.5281/zenodo.19105225) under CC-BY-4.0. 7 experiments, 20-signal
            corpus, 10 iterations each.
          </>
        }
        limitations={
          <>
            The law applies to natural language signals under recursive
            transformation. It may not generalize to all signal types or all
            transformation operators.
          </>
        }
        lineage={
          <>
            Conservation Law paper (DOI 10.5281/zenodo.20029607), Commitment
            Theory research program.
           Architecture: <a href="https://mos2es.com/concepts/conservation-law" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/conservation-law</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
