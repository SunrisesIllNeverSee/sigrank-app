import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Abstention",
  description:
    "The system's ability to refrain from acting when continuity or lineage is broken. A governed system that detects a continuity break should abstain rather than proceed.",
  path: "/wiki/governance/abstention",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Re-grounding", href: "/wiki/governance/re-grounding" },
  { label: "Execution-Layer Governance", href: "/wiki/governance/execution-layer-governance" },
  { label: "Governance vs Alignment (mos2es.com)", href: "https://mos2es.com/governance-vs-alignment" },
  { label: "Execution-Layer Governance (mos2es.org)", href: "https://mos2es.org/execution-governance" },
];

export default function AbstentionPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Governance", path: "/wiki#evidence-governance" },
            { name: "Abstention", path: "/wiki/governance/abstention" },
          ]),
          definedTerm(
            "Abstention",
            "The system's ability to refrain from acting when continuity or lineage is broken.",
            "/wiki/governance/abstention",
          ),
        ]}
      />
      <WikiEntry
        title="Abstention"
        summary="The system's ability to refrain from acting when continuity or lineage is broken. A governed system that detects a continuity break should abstain rather than proceed."
        category="governance"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            The system&apos;s ability to refrain from acting when continuity or
            lineage is broken. A governed system that detects a continuity break
            should abstain rather than proceed.
          </>
        }
        inputs={
          <>
            A continuity evaluation result indicating a break. The system&apos;s
            proposed action.
          </>
        }
        derivedVariables={
          <>
            Abstention rate (how often the system abstains when continuity is
            broken?). False abstention rate (how often it abstains when
            continuity is actually intact?).
          </>
        }
        claim={
          <>
            A governed system should abstain when it cannot verify that its
            proposed action maintains continuity with the governing state.
          </>
        }
        test={
          <>
            Present the system with scenarios where continuity is broken.
            Observe whether it abstains. Compare with scenarios where
            continuity is intact (should not abstain).
          </>
        }
        observable={
          <>
            Abstention decisions, abstention rate, false abstention rate.
          </>
        }
        falsifiers={
          <>
            The system never abstains (always proceeds regardless of
            continuity), OR it always abstains (never acts).
          </>
        }
        evidence={<>No formal experiments yet. Proposed governance behavior.</>}
        limitations={
          <>
            Abstention is conservative — it may cause the system to miss valid
            actions. The threshold for abstention must be calibrated.
          </>
        }
        lineage={<>MO§ES™ architecture, execution-layer governance. Architecture: <a href="https://mos2es.com/governance-vs-alignment" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/governance-vs-alignment</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
