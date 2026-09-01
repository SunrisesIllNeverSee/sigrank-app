import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Execution-Layer Governance",
  description:
    "Testing whether an autonomous system can carry governing continuity into the moment of action. Governance that operates at execution time, not training time.",
  path: "/wiki/governance/execution-layer-governance",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Persistent Governing State", href: "/wiki/governance/persistent-governing-state" },
  { label: "Abstention", href: "/wiki/governance/abstention" },
  { label: "Re-grounding", href: "/wiki/governance/re-grounding" },
  { label: "Governance vs Alignment (mos2es.com)", href: "https://mos2es.com/governance-vs-alignment" },
  { label: "Execution-Layer Governance (mos2es.org)", href: "https://mos2es.org/execution-governance" },
];

export default function ExecutionLayerGovernancePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Governance", path: "/wiki#evidence-governance" },
            { name: "Execution-Layer Governance", path: "/wiki/governance/execution-layer-governance" },
          ]),
          definedTerm(
            "Execution-Layer Governance",
            "Testing whether an autonomous system can carry governing continuity into the moment of action. Governance that operates at execution time, not training time.",
            "/wiki/governance/execution-layer-governance",
          ),
        ]}
      />
      <WikiEntry
        title="Execution-Layer Governance"
        summary="Testing whether an autonomous system can carry governing continuity into the moment of action. Governance that operates at execution time, not training time."
        category="governance"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Testing whether an autonomous system can carry governing continuity
            into the moment of action. Governance that operates at execution
            time, not training time.
          </>
        }
        inputs={
          <>
            Governing state. System operations. Decisions formed during
            operation.
          </>
        }
        derivedVariables={
          <>
            Continuity and lineage preservation at decision points.
            Abstention and re-grounding events.
          </>
        }
        claim={
          <>
            Guardrails govern the environment (blocking bad actions after they
            are proposed). MO§ES™ tests and governs continuity of execution —
            maintaining the chain of legitimacy through the system&apos;s own
            reasoning.
          </>
        }
        test={
          <>
            Present a system with a governing state. Observe whether continuity
            is preserved through the decision flow: governing state → system
            operates → decision forms → continuity/lineage preserved? → YES
            (continue) / NO (abstain or re-ground).
          </>
        }
        observable={
          <>
            Whether the system maintains continuity through decisions. Whether
            it abstains or re-grounds when continuity breaks.
          </>
        }
        falsifiers={
          <>
            The system cannot maintain continuity through its own reasoning, OR
            guardrails alone are sufficient (execution-layer governance adds
            nothing).
          </>
        }
        evidence={<>No formal experiments yet. Proposed framework.</>}
        limitations={
          <>
            Execution-layer governance is a different layer from guardrails —
            it operates before the guardrail, inside the system&apos;s own
            process. The distinction is architectural.
          </>
        }
        lineage={<>MO§ES™ architecture, proposed framework. Architecture: <a href="https://mos2es.com/governance-vs-alignment" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/governance-vs-alignment</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
