import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Alignment vs Governance",
  description:
    "The architectural distinction between alignment (encouraging desired behavior through training) and governance (preserving legitimate state transition during operation).",
  path: "/wiki/governance/alignment-vs-governance",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Persistent Governing State", href: "/wiki/governance/persistent-governing-state" },
  { label: "Execution-Layer Governance", href: "/wiki/governance/execution-layer-governance" },
  { label: "Governance vs Alignment (mos2es.com)", href: "https://mos2es.com/governance-vs-alignment" },
  { label: "Execution-Layer Governance (mos2es.org)", href: "https://mos2es.org/execution-governance" },
];

export default function AlignmentVsGovernancePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Governance", path: "/wiki#evidence-governance" },
            { name: "Alignment vs Governance", path: "/wiki/governance/alignment-vs-governance" },
          ]),
          definedTerm(
            "Alignment vs Governance",
            "The distinction between alignment (encouraging desired behavior through training/rules/policies) and governance (preserving legitimate state transition during operation).",
            "/wiki/governance/alignment-vs-governance",
          ),
        ]}
      />
      <WikiEntry
        title="Alignment vs Governance"
        summary="The architectural distinction between alignment (encouraging desired behavior through training) and governance (preserving legitimate state transition during operation)."
        category="governance"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            The distinction between <strong>alignment</strong> (encouraging
            desired behavior through training, rules, and policies) and{" "}
            <strong>governance</strong> (preserving legitimate state transition
            during operation through state, lineage, continuity, and
            self-evaluation). Alignment shapes behavior at training time;
            governance preserves the chain of legitimacy at execution time.
          </>
        }
        inputs={
          <>
            System behavior under operation. Training configuration. Governance
            framework presence or absence.
          </>
        }
        derivedVariables={
          <>
            Behavior correctness (does the system produce correct outputs?).
            Legitimacy preservation (does the system maintain the chain that
            makes actions valid?).
          </>
        }
        claim={
          <>
            An aligned system can behave correctly without knowing{" "}
            <em>why</em> its current action remains legitimate. A governed
            system must preserve the chain that makes the action valid.
          </>
        }
        test={
          <>
            Compare system behavior with alignment-only versus
            alignment-plus-governance. Test whether alignment degrades through
            distribution shift, context length, and recursive transformation
            while governance operates at execution time.
          </>
        }
        observable={
          <>
            Behavior correctness over time. Legitimacy chain integrity.
          </>
        }
        falsifiers={
          <>
            Alignment alone is sufficient to maintain legitimacy indefinitely
            (governance adds nothing), OR governance without alignment produces
            correct behavior.
          </>
        }
        evidence={
          <>
            No formal comparison experiments yet. Theoretical distinction
            proposed in the MO§ES™ architecture.
          </>
        }
        limitations={
          <>
            Alignment and governance are complementary, not alternatives. The
            distinction is architectural, not empirical — both may be needed.
          </>
        }
        lineage={<>MO§ES™ architecture, proposed distinction. Architecture: <a href="https://mos2es.com/governance-vs-alignment" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/governance-vs-alignment</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
