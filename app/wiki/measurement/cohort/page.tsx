import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Cohort",
  description:
    "A group of operators measured together for comparison — the unit of comparative analysis.",
  path: "/wiki/measurement/cohort",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator", href: "/wiki/measurement/operator" },
  { label: "Reference Field", href: "/wiki/measurement/reference-field" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function CohortPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "Cohort", path: "/wiki/measurement/cohort" },
          ]),
          definedTerm(
            "Cohort",
            "A group of operators measured together for comparison — the unit of comparative analysis.",
            "/wiki/measurement/cohort",
          ),
        ]}
      />
      <WikiEntry
        title="Cohort"
        summary="A group of operators measured together for comparison — the unit of comparative analysis."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            A group of operators measured together for comparison. The unit of
            comparative analysis.
          </>
        }
        inputs={
          <>Operator identifiers + their token pillars + cohort membership.</>
        }
        derivedVariables={
          <>
            Cohort-level distributions, percentile ranks, quartiles, IQR fences.
          </>
        }
        claim={
          <>
            Cohort comparison reveals relative performance — an operator&apos;s
            metrics are only meaningful in the context of a reference cohort.
          </>
        }
        test={
          <>
            Compare operator metrics against cohort distributions (medians,
            quartiles, IQR).
          </>
        }
        observable={
          <>
            Percentile ranks, z-scores relative to cohort, outlier flags.
          </>
        }
        falsifiers={
          <>
            If cohort composition does not affect relative rankings, cohort is
            not a meaningful unit.
          </>
        }
        evidence={
          <>
            Field-analysis schema provides medians, quartiles, and IQR fences for
            yield, SNR, leverage, velocity.
          </>
        }
        limitations={
          <>
            Cohort selection bias — small cohorts produce unstable percentiles.
          </>
        }
        lineage={
          <>SigRank field-analysis methodology, leaderboard percentile computation. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
