import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Recursive Self-Evaluation Test",
  description:
    "Can a system apply an external structural framework recursively to itself and produce actionable diagnostic output?",
  path: "/wiki/tests/recursive-self-evaluation",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Verifiability Test", href: "/wiki/tests/verifiability" },
  { label: "Alignment vs Governance", href: "/wiki/governance/alignment-vs-governance" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "System Testing (mos2es.org)", href: "https://mos2es.org/system-testing" },
];

export default function RecursiveSelfEvaluationTestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "System Tests", path: "/wiki#evidence-system-tests" },
            { name: "Recursive Self-Evaluation Test", path: "/wiki/tests/recursive-self-evaluation" },
          ]),
          definedTerm(
            "Recursive Self-Evaluation Test",
            "Can a system apply an external structural framework recursively to itself and produce actionable diagnostic output?",
            "/wiki/tests/recursive-self-evaluation",
          ),
        ]}
      />
      <WikiEntry
        title="Recursive Self-Evaluation Test"
        summary="Can a system apply an external structural framework recursively to itself and produce actionable diagnostic output?"
        category="system-tests"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Can a system apply an external structural framework recursively to
            itself and produce actionable diagnostic output?
          </>
        }
        inputs={
          <>
            An external structural framework (e.g., the MO§ES™ test suite). The
            system&apos;s own behavior and outputs.
          </>
        }
        derivedVariables={
          <>
            Self-diagnosis accuracy (does the system correctly identify its own
            issues?), framework application fidelity (does the system apply the
            framework correctly?).
          </>
        }
        claim={
          <>
            A system capable of recursive self-evaluation can identify its own
            drift or failure under an external test framework.
          </>
        }
        test={
          <>
            Present the framework to the system. Ask the system to apply it to
            its own behavior. Evaluate whether the diagnostic output is accurate
            and actionable.
          </>
        }
        observable={
          <>
            Whether the system applies the framework. Whether the self-diagnosis
            is accurate. Whether the output is actionable.
          </>
        }
        falsifiers={
          <>
            The system cannot apply the framework to itself, OR the
            self-diagnosis is consistently wrong, OR the output is not
            actionable.
          </>
        }
        evidence={
          <>
            No formal experiments yet. Proposed test framework. Related to
            external governance experiments.
          </>
        }
        limitations={
          <>
            The system may imitate the framework&apos;s wording without genuinely
            applying it. Must distinguish genuine self-evaluation from
            pattern-matching.
          </>
        }
        lineage={
          <>MO§ES™ architecture, external governance research program. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
