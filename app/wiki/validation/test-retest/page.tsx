import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Test-Retest Reliability",
  description:
    "Whether the same operator measured twice under the same conditions produces the same metrics.",
  path: "/wiki/validation/test-retest",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator Separability", href: "/wiki/validation/operator-separability" },
  { label: "Convergent Validity", href: "/wiki/validation/convergent-validity" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function TestRetestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Validation", path: "/wiki#evidence-validation" },
            { name: "Test-Retest Reliability", path: "/wiki/validation/test-retest" },
          ]),
          definedTerm(
            "Test-Retest Reliability",
            "Whether the same operator measured twice under the same conditions produces the same metrics.",
            "/wiki/validation/test-retest",
          ),
        ]}
      />
      <WikiEntry
        title="Test-Retest Reliability"
        summary="Whether the same operator measured twice under the same conditions produces the same metrics."
        category="validation"
        evidenceLevel="concept"
        specVersion="SigRank Standard v1.0 (proposed)"
        definition={
          <>
            Whether the same operator measured twice under the same conditions
            produces the same metrics.
          </>
        }
        inputs={
          <>
            Two or more measurements of the same operator under equivalent
            conditions.
          </>
        }
        derivedVariables={
          <>
            Metric correlation between test and retest. Bland-Altman limits of
            agreement.
          </>
        }
        claim={
          <>
            If the measurement is reliable, test-retest metrics should be highly
            correlated with small differences.
          </>
        }
        test={
          <>
            Measure an operator, wait, measure again under equivalent conditions.
            Compute correlation and limits of agreement.
          </>
        }
        observable={
          <>
            Correlation coefficient, Bland-Altman plot, intra-class correlation.
          </>
        }
        falsifiers={
          <>
            Low correlation or large systematic differences between test and
            retest.
          </>
        }
        evidence={
          <>No formal test-retest studies yet. Proposed validation method.</>
        }
        limitations={
          <>
            Conditions are never truly identical — tool versions, task types, and
            time effects introduce variance.
          </>
        }
        lineage={
          <>Psychometric validation methodology, proposed for SigRank. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
