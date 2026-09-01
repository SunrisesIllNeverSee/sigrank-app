import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Operator Separability",
  description:
    "Whether different operators produce measurably different metric profiles. If all operators look the same, the measurement has no discriminative power.",
  path: "/wiki/validation/operator-separability",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator-System Interaction", href: "/wiki/validation/operator-system-interaction" },
  { label: "Test-Retest Reliability", href: "/wiki/validation/test-retest" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function OperatorSeparabilityPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Validation", path: "/wiki#evidence-validation" },
            { name: "Operator Separability", path: "/wiki/validation/operator-separability" },
          ]),
          definedTerm(
            "Operator Separability",
            "Whether different operators produce measurably different metric profiles. If all operators look the same, the measurement has no discriminative power.",
            "/wiki/validation/operator-separability",
          ),
        ]}
      />
      <WikiEntry
        title="Operator Separability"
        summary="Whether different operators produce measurably different metric profiles. If all operators look the same, the measurement has no discriminative power."
        category="validation"
        evidenceLevel="concept"
        specVersion="SigRank Standard v1.0 (proposed)"
        definition={
          <>
            Whether different operators produce measurably different metric
            profiles. If all operators look the same, the measurement has no
            discriminative power.
          </>
        }
        inputs={
          <>Metric profiles for multiple operators.</>
        }
        derivedVariables={
          <>
            Between-operator variance, within-operator variance, F-ratio.
          </>
        }
        claim={
          <>
            If the measurement is valid, different operators should produce
            significantly different metric profiles.
          </>
        }
        test={
          <>
            Compare between-operator variance to within-operator variance.
            Compute F-ratio and significance.
          </>
        }
        observable={
          <>F-ratio, p-value, effect size.</>
        }
        falsifiers={
          <>
            Between-operator variance is not significantly different from
            within-operator variance.
          </>
        }
        evidence={
          <>
            Field data shows operator-level differences in yield, SNR, leverage,
            velocity.
          </>
        }
        limitations={
          <>
            Operators using the same tools and workflows may have similar
            profiles. Separability depends on task diversity.
          </>
        }
        lineage={
          <>Psychometric validation methodology, SigRank field data. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
