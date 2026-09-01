import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Operator-System Interaction",
  description:
    "Whether operator performance varies by system (model/tool/platform). Tests for interaction effects.",
  path: "/wiki/validation/operator-system-interaction",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator Separability", href: "/wiki/validation/operator-separability" },
  { label: "Operator-System Dyad", href: "/wiki/measurement/operator-system-dyad" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function OperatorSystemInteractionPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Validation", path: "/wiki#evidence-validation" },
            { name: "Operator-System Interaction", path: "/wiki/validation/operator-system-interaction" },
          ]),
          definedTerm(
            "Operator-System Interaction",
            "Whether operator performance varies by system (model/tool/platform). Tests for interaction effects.",
            "/wiki/validation/operator-system-interaction",
          ),
        ]}
      />
      <WikiEntry
        title="Operator-System Interaction"
        summary="Whether operator performance varies by system (model/tool/platform). Tests for interaction effects."
        category="validation"
        evidenceLevel="concept"
        specVersion="SigRank Standard v1.0 (proposed)"
        definition={
          <>
            Whether operator performance varies by system
            (model/tool/platform). Tests for interaction effects.
          </>
        }
        inputs={
          <>Metric profiles for operators across multiple systems.</>
        }
        derivedVariables={
          <>
            Interaction effect size, main effects for operator and system.
          </>
        }
        claim={
          <>
            If operator-system interaction exists, the same operator will perform
            differently on different systems, and different operators will rank
            differently on different systems.
          </>
        }
        test={
          <>
            Two-way ANOVA (operator × system) on metrics. Test for significant
            interaction effects.
          </>
        }
        observable={
          <>Interaction F-ratio, p-value, simple main effects.</>
        }
        falsifiers={
          <>
            No significant interaction effect (operator ranking is identical
            across all systems).
          </>
        }
        evidence={
          <>
            Field data suggests interaction effects exist. Formal analysis not
            yet conducted.
          </>
        }
        limitations={
          <>
            Confounded by task selection — operators may choose different tasks
            on different systems.
          </>
        }
        lineage={
          <>Upsilon operator×system fit analysis, proposed validation. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
