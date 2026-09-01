import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Transformation",
  description:
    "Any process that transforms, compresses, summarizes, or re-encodes a signal. Every AI system that processes natural language is a transformation operator.",
  path: "/wiki/ct/transformation",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Commitment", href: "/wiki/ct/commitment" },
  { label: "Conservation Law of Commitment", href: "/wiki/ct/conservation" },
  { label: "Compression (System Tests)", href: "/wiki/tests/compression" },
  { label: "Conservation Law (mos2es.com)", href: "https://mos2es.com/concepts/conservation-law" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function TransformationPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Commitment Theory", path: "/wiki#evidence-commitment-theory" },
            { name: "Transformation", path: "/wiki/ct/transformation" },
          ]),
          definedTerm(
            "Transformation",
            "Any process that transforms, compresses, summarizes, or re-encodes a signal. Every AI system that processes natural language is a transformation operator.",
            "/wiki/ct/transformation",
          ),
        ]}
      />
      <WikiEntry
        title="Transformation"
        summary="Any process that transforms, compresses, summarizes, or re-encodes a signal. Every AI system that processes natural language is a transformation operator."
        category="commitment-theory"
        evidenceLevel="demonstration"
        specVersion="CT Research Prospectus V.1"
        definition={
          <>
            Any process that transforms, compresses, summarizes, or re-encodes a
            signal. Every AI system that processes natural language is a
            transformation operator.
          </>
        }
        inputs={<>An original signal S. A transformation process T.</>}
        derivedVariables={
          <>
            {`T(S)`} — the transformed signal. {`C(T(S))`} — the commitment of
            the transformed signal.
          </>
        }
        claim={
          <>
            Transformations are ubiquitous in AI systems — summarization,
            translation, agent orchestration, multi-agent communication, and
            LLM chains are all transformation operators. Each may degrade
            commitment.
          </>
        }
        test={
          <>
            Apply various transformation types (summarization, translation,
            compression) to signals with known commitment. Measure commitment
            before and after.
          </>
        }
        observable={
          <>
            Commitment degradation by transformation type. Degradation rates
            across transformation types.
          </>
        }
        falsifiers={
          <>
            Transformations do not degrade commitment (all transformation types
            preserve C(S)).
          </>
        }
        evidence={
          <>
            Conservation Law experiments tested recursive transformation. Field
            data from AI systems shows transformation is ubiquitous.
          </>
        }
        limitations={
          <>
            Different transformation types may degrade commitment at different
            rates. The relationship between transformation type and degradation
            rate is not fully characterized.
          </>
        }
        lineage={<>Commitment Theory, Conservation Law experiments. Architecture: <a href="https://mos2es.com/concepts/conservation-law" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/conservation-law</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
