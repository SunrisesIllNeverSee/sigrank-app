import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Lineage Test",
  description:
    "Test whether a system's current signal or state can be traced back through an intact origin chain.",
  path: "/wiki/tests/lineage",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Purpose Coherence Test", href: "/wiki/tests/purpose-coherence" },
  { label: "Lineage Preservation", href: "/wiki/governance/lineage-preservation" },
  { label: "Commitment", href: "/wiki/ct/commitment" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "System Testing (mos2es.org)", href: "https://mos2es.org/system-testing" },
];

export default function LineageTestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "System Tests", path: "/wiki#evidence-system-tests" },
            { name: "Lineage Test", path: "/wiki/tests/lineage" },
          ]),
          definedTerm(
            "Lineage Test",
            "Test whether a system's current signal or state can be traced back through an intact origin chain.",
            "/wiki/tests/lineage",
          ),
        ]}
      />
      <WikiEntry
        title="Lineage Test"
        summary="Test whether a system's current signal or state can be traced back through an intact origin chain."
        category="system-tests"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Test whether a system&apos;s current signal/state can be traced back
            through an intact origin chain.
          </>
        }
        inputs={
          <>
            A sequence of transformations applied to an initial signal. The
            system&apos;s outputs at each step.
          </>
        }
        derivedVariables={
          <>
            Chain completeness (can each step be traced to the prior?), origin
            recoverability (can the original signal be reconstructed?).
          </>
        }
        claim={
          <>
            A system that preserves lineage can connect its current output to
            the authoritative prior state that produced it.
          </>
        }
        test={
          <>
            Present a signal, apply transformations through the system, then ask
            the system to reconstruct the chain: origin → state → transformation
            → decision → output. Can the chain be reconstructed?
          </>
        }
        observable={
          <>
            Whether the system can produce the chain. Whether each link is
            accurate. Whether gaps exist.
          </>
        }
        falsifiers={
          <>The system cannot connect its action to authoritative prior state.</>
        }
        evidence={
          <>No formal experiments yet. Proposed test framework.</>
        }
        limitations={
          <>
            Lineage may be preserved in trivial cases but lost in complex
            multi-step transformations. The test must distinguish genuine
            reconstruction from pattern-matching.
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
