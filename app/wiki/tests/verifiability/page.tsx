import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Verifiability Test",
  description:
    "Convert architecture claims into explicit tests with a claim → test → observable → pass/fail/indeterminate → repeat cycle.",
  path: "/wiki/tests/verifiability",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Recursive Self-Evaluation Test", href: "/wiki/tests/recursive-self-evaluation" },
  { label: "Test-Retest Reliability", href: "/wiki/validation/test-retest" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "System Testing (mos2es.org)", href: "https://mos2es.org/system-testing" },
];

export default function VerifiabilityTestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "System Tests", path: "/wiki#evidence-system-tests" },
            { name: "Verifiability Test", path: "/wiki/tests/verifiability" },
          ]),
          definedTerm(
            "Verifiability Test",
            "Convert architecture claims into explicit tests with a claim → test → observable → pass/fail/indeterminate → repeat cycle.",
            "/wiki/tests/verifiability",
          ),
        ]}
      />
      <WikiEntry
        title="Verifiability Test"
        summary="Convert architecture claims into explicit, reproducible tests. Every protocol gets a claim → test → observable → pass/fail/indeterminate → repeat cycle."
        category="system-tests"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Convert architecture claims into explicit tests. Every protocol gets
            a claim → test → observable → pass/fail/indeterminate → repeat
            cycle.
          </>
        }
        inputs={
          <>
            An architecture claim. A proposed test for the claim.
          </>
        }
        derivedVariables={
          <>
            Test outcome (pass/fail/indeterminate). Reproducibility (does the
            test produce the same result when repeated?).
          </>
        }
        claim={
          <>
            Architecture claims should be convertible into explicit,
            reproducible tests. Claims that cannot be tested are not verifiable.
          </>
        }
        test={
          <>
            For each claim, define: CLAIM → TEST → OBSERVABLE →
            PASS/FAIL/INDETERMINATE → REPEAT. Verify that the test is
            reproducible.
          </>
        }
        observable={
          <>
            The test outcome. Whether the test is reproducible across runs.
          </>
        }
        falsifiers={
          <>
            The claimed behavior cannot be reproduced, OR the test produces
            different results on repetition.
          </>
        }
        evidence={
          <>
            The SigRank canonical test (11/11) is an example of a verifiability
            test — the MO§ES™ seed values must reproduce Υ 18436.98 exactly.
          </>
        }
        limitations={
          <>
            Some claims may be inherently untestable (e.g., subjective quality
            claims). &ldquo;Indeterminate&rdquo; is a valid outcome, not a
            failure.
          </>
        }
        lineage={
          <>
            MO§ES™ architecture, SigRank canonical test, this is one of the
            strongest MO§ES™ principles.
           Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
