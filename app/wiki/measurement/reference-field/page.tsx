import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Reference Field",
  description:
    "The full population of operators against which any individual or cohort is compared — the benchmark population.",
  path: "/wiki/measurement/reference-field",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Cohort", href: "/wiki/measurement/cohort" },
  { label: "Operator", href: "/wiki/measurement/operator" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function ReferenceFieldPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "Reference Field", path: "/wiki/measurement/reference-field" },
          ]),
          definedTerm(
            "Reference Field",
            "The full population of operators against which any individual or cohort is compared — the benchmark population.",
            "/wiki/measurement/reference-field",
          ),
        ]}
      />
      <WikiEntry
        title="Reference Field"
        summary="The full population of operators against which any individual or cohort is compared — the benchmark population."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            The full population of operators against which any individual or
            cohort is compared. The benchmark population.
          </>
        }
        inputs={
          <>All operator submissions across all platforms and time windows.</>
        }
        derivedVariables={
          <>
            Field-level distributions, global percentiles, field statistics.
          </>
        }
        claim={
          <>
            The reference field provides the ground truth for relative
            positioning — an operator&apos;s rank is only meaningful relative to
            the field.
          </>
        }
        test={
          <>
            Verify field statistics are stable as the population grows
            (convergence check).
          </>
        }
        observable={
          <>
            Field-level medians, quartiles, distributions for each metric.
          </>
        }
        falsifiers={
          <>
            If field statistics are unstable (do not converge as population
            grows), the reference field is not reliable.
          </>
        }
        evidence={
          <>
            3,304 models, 17 platforms, field-analysis dataset with medians and
            quartiles.
          </>
        }
        limitations={
          <>
            The field is biased toward operators who submit data — not a random
            sample of all AI users.
          </>
        }
        lineage={
          <>SigRank field-analysis schema, leaderboard methodology. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
