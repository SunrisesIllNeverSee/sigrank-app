import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Persistent Governing State",
  description:
    "A persistent internal reference (principles, lineage, current commitments) presented to the system against which intended actions can be evaluated.",
  path: "/wiki/governance/persistent-governing-state",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Alignment vs Governance", href: "/wiki/governance/alignment-vs-governance" },
  { label: "Lineage Preservation", href: "/wiki/governance/lineage-preservation" },
  { label: "Persistent Governing State (mos2es.com)", href: "https://mos2es.com/concepts/persistent-governing-state" },
  { label: "Execution-Layer Governance (mos2es.org)", href: "https://mos2es.org/execution-governance" },
];

export default function PersistentGoverningStatePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Governance", path: "/wiki#evidence-governance" },
            { name: "Persistent Governing State", path: "/wiki/governance/persistent-governing-state" },
          ]),
          definedTerm(
            "Persistent Governing State",
            "A persistent internal reference (principles, lineage, current commitments) presented to the system against which intended actions can be evaluated.",
            "/wiki/governance/persistent-governing-state",
          ),
        ]}
      />
      <WikiEntry
        title="Persistent Governing State"
        summary="A persistent internal reference (principles, lineage, current commitments) presented to the system against which intended actions can be evaluated."
        category="governance"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            A persistent internal reference — principles, lineage, and current
            commitments — presented to the system against which intended
            actions can be evaluated. The governing state is presented to the
            system, not enforced by a separate checkpoint in the action path.
          </>
        }
        inputs={
          <>
            Governing state data structure (principles, lineage chain, current
            commitments). The system&apos;s proposed actions.
          </>
        }
        derivedVariables={
          <>
            Continuity evaluation result (continue / abstain / re-ground).
            Governing state stability over time.
          </>
        }
        claim={
          <>
            The governing state is presented to the system rather than enforced
            by a separate checkpoint in the action path. The system evaluates
            its own proposed actions against the governing state.
          </>
        }
        test={
          <>
            Present a governing state to a system. Observe whether the system
            evaluates proposed actions against it. Compare with
            checkpoint-enforced governance (an external gate).
          </>
        }
        observable={
          <>
            Whether the system self-evaluates against the governing state.
            Whether it abstains or re-grounds when continuity is broken.
          </>
        }
        falsifiers={
          <>
            The system ignores the presented governing state, OR
            presented-state governance produces identical behavior to
            checkpoint-enforced governance (no architectural difference).
          </>
        }
        evidence={<>No formal experiments yet. Proposed architecture.</>}
        limitations={
          <>
            &ldquo;Presented, not enforced&rdquo; is an architectural claim, not
            yet empirically validated. The system may ignore presented state.
            Must avoid metaphysical language — call it &ldquo;Persistent
            Governing State,&rdquo; not &ldquo;internal compass&rdquo; or
            &ldquo;conscience.&rdquo;
          </>
        }
        lineage={<>MO§ES™ architecture, proposed design. Architecture: <a href="https://mos2es.com/concepts/persistent-governing-state" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/persistent-governing-state</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
