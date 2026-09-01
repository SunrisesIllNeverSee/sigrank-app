import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Operator-System Dyad",
  description:
    "The paired relationship between a specific operator and a specific system — the unit of analysis for interaction effects.",
  path: "/wiki/measurement/operator-system-dyad",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Operator", href: "/wiki/measurement/operator" },
  { label: "System", href: "/wiki/measurement/system" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function OperatorSystemDyadPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "Operator-System Dyad", path: "/wiki/measurement/operator-system-dyad" },
          ]),
          definedTerm(
            "Operator-System Dyad",
            "The paired relationship between a specific operator and a specific system — the unit of analysis for interaction effects.",
            "/wiki/measurement/operator-system-dyad",
          ),
        ]}
      />
      <WikiEntry
        title="Operator-System Dyad"
        summary="The paired relationship between a specific operator and a specific system — the unit of analysis for interaction effects."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            The paired relationship between a specific operator and a specific
            system. The unit of analysis for interaction effects.
          </>
        }
        inputs={
          <>
            Operator identifier + system identifier + token pillars for their
            paired sessions.
          </>
        }
        derivedVariables={
          <>Dyad-level yield, SNR, leverage, velocity.</>
        }
        claim={
          <>
            Operator performance varies by system — the same operator may
            perform differently on different systems.
          </>
        }
        test={
          <>
            Compare the same operator across multiple systems; compare different
            operators on the same system.
          </>
        }
        observable={
          <>Dyad-level metric distributions, interaction effects.</>
        }
        falsifiers={
          <>
            If no interaction effects exist (operator ranking is identical across
            all systems), the dyad is not a meaningful unit.
          </>
        }
        evidence={
          <>Field data shows operator×system interaction effects.</>
        }
        limitations={
          <>
            Dyads with few sessions are noisy. Confounded by task selection.
          </>
        }
        lineage={
          <>Upsilon architecture, operator-system fit analysis. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
