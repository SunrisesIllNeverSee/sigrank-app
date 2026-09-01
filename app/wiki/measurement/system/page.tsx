import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "System",
  description:
    "The AI system (model + tool + platform configuration) being operated — distinct from the operator.",
  path: "/wiki/measurement/system",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator", href: "/wiki/measurement/operator" },
  { label: "Operator-System Dyad", href: "/wiki/measurement/operator-system-dyad" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function SystemPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "System", path: "/wiki/measurement/system" },
          ]),
          definedTerm(
            "System",
            "The AI system (model + tool + platform configuration) being operated — distinct from the operator.",
            "/wiki/measurement/system",
          ),
        ]}
      />
      <WikiEntry
        title="System"
        summary="The AI system (model + tool + platform configuration) being operated — distinct from the operator."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            The AI system (model + tool + platform configuration) being
            operated. Distinct from the operator.
          </>
        }
        inputs={
          <>
            Model identifiers, tool identifiers, platform identifiers from
            session metadata.
          </>
        }
        derivedVariables={
          <>
            System-level aggregates of token pillars across operators.
          </>
        }
        claim={
          <>
            Different systems support different operating relationships — system
            choice affects operator performance.
          </>
        }
        test={
          <>
            Compare the same operator across different systems to isolate system
            effects.
          </>
        }
        observable={
          <>
            System-level yield distributions, system-level SNR distributions.
          </>
        }
        falsifiers={
          <>
            If system-level metrics show no difference across systems after
            controlling for operator, the system is not a meaningful unit.
          </>
        }
        evidence={
          <>
            17 platforms tracked. System-level differences observed in field
            data.
          </>
        }
        limitations={
          <>
            System effects are confounded with task selection and workflow
            differences.
          </>
        }
        lineage={<>SigRank methodology, Upsilon architecture. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
