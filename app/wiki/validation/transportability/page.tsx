import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Transportability",
  description:
    "Whether metrics and findings from one cohort or context transfer to another. Can results from one population generalize?",
  path: "/wiki/validation/transportability",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Task Conditioning", href: "/wiki/validation/task-conditioning" },
  { label: "Cohort", href: "/wiki/measurement/cohort" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function TransportabilityPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Validation", path: "/wiki#evidence-validation" },
            { name: "Transportability", path: "/wiki/validation/transportability" },
          ]),
          definedTerm(
            "Transportability",
            "Whether metrics and findings from one cohort or context transfer to another. Can results from one population generalize?",
            "/wiki/validation/transportability",
          ),
        ]}
      />
      <WikiEntry
        title="Transportability"
        summary="Whether metrics and findings from one cohort or context transfer to another. Can results from one population generalize?"
        category="validation"
        evidenceLevel="concept"
        specVersion="SigRank Standard v1.0 (proposed)"
        definition={
          <>
            Whether metrics and findings from one cohort or context transfer to
            another. Can results from one population generalize?
          </>
        }
        inputs={
          <>Metric distributions from two or more cohorts/contexts.</>
        }
        derivedVariables={
          <>Distribution overlap, transfer error rate.</>
        }
        claim={
          <>
            If metrics are transportable, findings from one cohort should
            generalize to another (within reasonable bounds).
          </>
        }
        test={
          <>
            Compute metrics for cohort A, apply any cohort-A-specific thresholds
            to cohort B, measure transfer error.
          </>
        }
        observable={
          <>Transfer error rate, distribution overlap statistics.</>
        }
        falsifiers={
          <>
            High transfer error — findings from one cohort do not generalize to
            another.
          </>
        }
        evidence={
          <>No formal transportability studies yet. Proposed validation method.</>
        }
        limitations={
          <>
            Different cohorts may have fundamentally different operating
            conditions. Transportability is not all-or-nothing.
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
