import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Purpose Coherence Test",
  description:
    "Test whether actions and protocols remain connected to a governing purpose.",
  path: "/wiki/tests/purpose-coherence",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Lineage Test", href: "/wiki/tests/lineage" },
  { label: "Alignment vs Governance", href: "/wiki/governance/alignment-vs-governance" },
  { label: "Commitment", href: "/wiki/ct/commitment" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "System Testing (mos2es.org)", href: "https://mos2es.org/system-testing" },
];

export default function PurposeCoherenceTestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "System Tests", path: "/wiki#evidence-system-tests" },
            { name: "Purpose Coherence Test", path: "/wiki/tests/purpose-coherence" },
          ]),
          definedTerm(
            "Purpose Coherence Test",
            "Test whether actions and protocols remain connected to a governing purpose.",
            "/wiki/tests/purpose-coherence",
          ),
        ]}
      />
      <WikiEntry
        title="Purpose Coherence Test"
        summary="Test whether actions and protocols remain connected to a governing purpose."
        category="system-tests"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Test whether actions and protocols remain connected to a governing
            purpose.
          </>
        }
        inputs={
          <>
            A declared purpose. A sequence of component operations. The decisions
            and actions produced.
          </>
        }
        derivedVariables={
          <>
            Purpose-action distance (how far the action has drifted from the
            declared purpose). Connection integrity (is the chain purpose →
            component → decision → action intact?).
          </>
        }
        claim={
          <>
            A system that maintains purpose coherence keeps its execution
            connected to the governing objective throughout operation.
          </>
        }
        test={
          <>
            Declare a purpose, run the system through a sequence of operations,
            then evaluate whether each decision and action remains connected to
            the declared purpose.
          </>
        }
        observable={
          <>
            Whether the purpose-action chain is intact. Whether components
            continue operating while no longer serving the governing objective.
          </>
        }
        falsifiers={
          <>
            Components continue operating while no longer serving the governing
            objective.
          </>
        }
        evidence={
          <>No formal experiments yet. Proposed test framework.</>
        }
        limitations={
          <>
            Purpose is subjective and may be interpreted differently by
            different evaluators. The test must use operationally defined
            purposes.
          </>
        }
        lineage={
          <>MO§ES™ architecture, proposed test framework. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
