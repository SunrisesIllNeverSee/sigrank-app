import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Modularity Test",
  description:
    "Test whether system components are functionally coherent rather than merely technically detachable.",
  path: "/wiki/tests/modularity",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Verifiability Test", href: "/wiki/tests/verifiability" },
  { label: "Purpose Coherence Test", href: "/wiki/tests/purpose-coherence" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "System Testing (mos2es.org)", href: "https://mos2es.org/system-testing" },
];

export default function ModularityTestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "System Tests", path: "/wiki#evidence-system-tests" },
            { name: "Modularity Test", path: "/wiki/tests/modularity" },
          ]),
          definedTerm(
            "Modularity Test",
            "Test whether system components are functionally coherent rather than merely technically detachable.",
            "/wiki/tests/modularity",
          ),
        ]}
      />
      <WikiEntry
        title="Modularity Test"
        summary="Test whether system components are functionally coherent rather than merely technically detachable."
        category="system-tests"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Test whether system components are functionally coherent rather than
            merely technically detachable.
          </>
        }
        inputs={
          <>
            A system with identified components. The ability to remove or isolate
            each component.
          </>
        }
        derivedVariables={
          <>
            Functional independence (does the component preserve valid function
            when isolated?), dependency mapping (which components depend on
            which?).
          </>
        }
        claim={
          <>
            Architecturally separable is NOT the same as functionally valid. A
            component may be technically detachable but functionally incoherent
            on its own.
          </>
        }
        test={
          <>
            Remove or isolate each component and observe whether it preserves
            valid function. Map which components are independently coherent vs
            dependent.
          </>
        }
        observable={
          <>
            Whether isolated components function. The dependency graph.
          </>
        }
        falsifiers={
          <>
            All &ldquo;modular&rdquo; components fail when isolated (they were
            only coherent as part of the whole), OR all components function
            independently (no real modularity exists).
          </>
        }
        evidence={
          <>No formal experiments yet. Proposed test framework.</>
        }
        limitations={
          <>
            Functional coherence depends on the task context. A component may be
            coherent for one task and incoherent for another.
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
