import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Resonance",
  description:
    "A proposed property in Commitment Theory: whether a system can apply an external structural framework recursively to itself and produce actionable diagnostic output.",
  path: "/wiki/ct/resonance",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Recursive Self-Evaluation (System Tests)", href: "/wiki/tests/recursive-self-evaluation" },
  { label: "Alignment vs Governance", href: "/wiki/governance/alignment-vs-governance" },
  { label: "Conservation Law (mos2es.com)", href: "https://mos2es.com/concepts/conservation-law" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function ResonancePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Commitment Theory", path: "/wiki#evidence-commitment-theory" },
            { name: "Resonance", path: "/wiki/ct/resonance" },
          ]),
          definedTerm(
            "Resonance",
            "A proposed property in Commitment Theory: whether a system can apply an external structural framework recursively to itself and produce actionable diagnostic output.",
            "/wiki/ct/resonance",
          ),
        ]}
      />
      <WikiEntry
        title="Resonance"
        summary="A proposed property in Commitment Theory: whether a system can apply an external structural framework recursively to itself and produce actionable diagnostic output."
        category="commitment-theory"
        evidenceLevel="concept"
        specVersion="CT Research Prospectus V.1"
        definition={
          <>
            A proposed property in Commitment Theory. Whether a system can apply
            an external structural framework recursively to itself and produce
            actionable diagnostic output. Two layers: an operational test
            (recursive self-application) and a theory question (whether that
            constitutes resonance).
          </>
        }
        inputs={
          <>
            An external structural framework. The system&apos;s own behavior.
          </>
        }
        derivedVariables={
          <>
            Self-application fidelity, diagnostic output quality.
          </>
        }
        claim={
          <>
            The useful capability is that a system can apply an external
            framework to itself recursively. Whether this constitutes
            &ldquo;resonance&rdquo; in the deeper Commitment Theory sense is a
            separate theory question.
          </>
        }
        test={
          <>
            Present a framework to the system. Ask it to apply the framework to
            itself. Evaluate the diagnostic output.
          </>
        }
        observable={
          <>
            Whether the system applies the framework. Whether the output is
            actionable.
          </>
        }
        falsifiers={
          <>
            The system cannot apply the framework to itself, OR the output is
            not actionable.
          </>
        }
        evidence={<>No formal experiments yet. Proposed concept.</>}
        limitations={
          <>
            <strong>Important — keep two layers separate.</strong> The
            operational test (recursive self-application) is testable. The
            theory question (whether this constitutes resonance) is not yet
            testable. Do NOT claim the operational test proves resonance in the
            deeper sense.
          </>
        }
        lineage={<>Commitment Theory, MO§ES™ architecture. Architecture: <a href="https://mos2es.com/concepts/conservation-law" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/conservation-law</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
