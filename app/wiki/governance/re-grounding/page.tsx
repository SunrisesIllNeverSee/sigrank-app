import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Re-grounding",
  description:
    "The system's ability to re-establish continuity when it has been broken. Instead of abstaining permanently, the system re-grounds itself in the governing state and resumes.",
  path: "/wiki/governance/re-grounding",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Abstention", href: "/wiki/governance/abstention" },
  { label: "Persistent Governing State", href: "/wiki/governance/persistent-governing-state" },
  { label: "Governance vs Alignment (mos2es.com)", href: "https://mos2es.com/governance-vs-alignment" },
  { label: "Execution-Layer Governance (mos2es.org)", href: "https://mos2es.org/execution-governance" },
];

export default function ReGroundingPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Governance", path: "/wiki#evidence-governance" },
            { name: "Re-grounding", path: "/wiki/governance/re-grounding" },
          ]),
          definedTerm(
            "Re-grounding",
            "The system's ability to re-establish continuity when it has been broken by re-grounding in the governing state.",
            "/wiki/governance/re-grounding",
          ),
        ]}
      />
      <WikiEntry
        title="Re-grounding"
        summary="The system's ability to re-establish continuity when it has been broken. Instead of abstaining permanently, the system re-grounds itself in the governing state and resumes."
        category="governance"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            The system&apos;s ability to re-establish continuity when it has
            been broken. Instead of abstaining permanently, the system
            re-grounds itself in the governing state and resumes.
          </>
        }
        inputs={
          <>
            A continuity break. The governing state (principles, lineage,
            current commitments).
          </>
        }
        derivedVariables={
          <>
            Re-grounding success rate, time to re-ground, post-re-grounding
            continuity quality.
          </>
        }
        claim={
          <>
            A governed system should be able to re-establish continuity by
            re-grounding in the governing state after a break, rather than
            permanently abstaining.
          </>
        }
        test={
          <>
            Break continuity, then provide the governing state. Observe whether
            the system re-grounds and resumes valid operation.
          </>
        }
        observable={
          <>
            Whether re-grounding succeeds. Whether post-re-grounding behavior is
            valid. Time to re-ground.
          </>
        }
        falsifiers={
          <>
            The system cannot re-ground after a continuity break (permanent
            abstention), OR re-grounding produces invalid behavior.
          </>
        }
        evidence={<>No formal experiments yet. Proposed governance behavior.</>}
        limitations={
          <>
            Re-grounding assumes the governing state is still valid. If the
            governing state itself is corrupted, re-grounding fails.
          </>
        }
        lineage={<>MO§ES™ architecture, execution-layer governance. Architecture: <a href="https://mos2es.com/governance-vs-alignment" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/governance-vs-alignment</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
