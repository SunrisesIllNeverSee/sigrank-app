import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Convergent Validity",
  description:
    "Whether metrics that should be related are actually related, and metrics that should not be related are not.",
  path: "/wiki/validation/convergent-validity",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Test-Retest Reliability", href: "/wiki/validation/test-retest" },
  { label: "Operator Separability", href: "/wiki/validation/operator-separability" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function ConvergentValidityPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Validation", path: "/wiki#evidence-validation" },
            { name: "Convergent Validity", path: "/wiki/validation/convergent-validity" },
          ]),
          definedTerm(
            "Convergent Validity",
            "Whether metrics that should be related are actually related, and metrics that should not be related are not.",
            "/wiki/validation/convergent-validity",
          ),
        ]}
      />
      <WikiEntry
        title="Convergent Validity"
        summary="Whether metrics that should be related are actually related, and metrics that should not be related are not."
        category="validation"
        evidenceLevel="concept"
        specVersion="SigRank Standard v1.0 (proposed)"
        definition={
          <>
            Whether metrics that should be related are actually related, and
            metrics that should not be related are not.
          </>
        }
        inputs={
          <>Correlation matrix of all metrics across a population of operators.</>
        }
        derivedVariables={
          <>Inter-metric correlations, correlation structure.</>
        }
        claim={
          <>
            If metrics have convergent validity, related metrics (e.g., yield and
            leverage) should correlate, while unrelated metrics should not.
          </>
        }
        test={
          <>
            Compute the full correlation matrix. Compare observed correlations to
            theoretically expected relationships.
          </>
        }
        observable={
          <>Correlation coefficients, correlation matrix structure.</>
        }
        falsifiers={
          <>
            Related metrics do not correlate, OR unrelated metrics correlate
            strongly.
          </>
        }
        evidence={
          <>
            Field data shows expected correlation structure (yield correlates
            with leverage and velocity).
          </>
        }
        limitations={
          <>
            Correlation does not imply causation. Small samples produce unstable
            correlations.
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
