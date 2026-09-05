import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Operator",
  description:
    "The individual whose AI-work telemetry is measured — the unit of analysis for AI processing efficiency.",
  path: "/wiki/measurement/operator",
});

const crossRefs: WikiCrossRef[] = [
  { label: "System", href: "/wiki/measurement/system" },
  { label: "Operator-System Dyad", href: "/wiki/measurement/operator-system-dyad" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function OperatorPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measurement", path: "/wiki#evidence-measurement" },
            { name: "Operator", path: "/wiki/measurement/operator" },
          ]),
          definedTerm(
            "Operator",
            "The individual whose AI-work telemetry is measured — the unit of analysis for AI processing efficiency.",
            "/wiki/measurement/operator",
          ),
        ]}
      />
      <WikiEntry
        title="Operator"
        summary="The individual whose AI-work telemetry is measured — the unit of analysis for AI processing efficiency."
        category="measurement"
        evidenceLevel="repeated-experiment"
        specVersion="SigRank Standard v1.0"
        definition={
          <>
            An operator is the account associated with AI-work
            telemetry. Not necessarily a legal person, employer, or unique human.
            One operator can have devices, submissions, and an optional
            authenticated account link.
          </>
        }
        inputs={
          <>
            Token counts (input, output, cache_creation, cache_read) from AI
            coding sessions. No prompt content.
          </>
        }
        derivedVariables={
          <>
            Operator-level aggregates of the four token pillars across sessions,
            windows, and platforms.
          </>
        }
        claim={
          <>
            The operator is the unit of analysis for AI processing efficiency —
            not the model, not the session, not the task.
          </>
        }
        test={
          <>
            Compare operator-level metrics across time windows to verify
            stability and distinguish operator effects from model effects.
          </>
        }
        observable={
          <>
            Per-operator yield, SNR, leverage, velocity, construction,
            consistency.
          </>
        }
        falsifiers={
          <>
            If operator-level metrics show no stability across windows, the
            operator is not a meaningful unit of analysis.
          </>
        }
        evidence={
          <>
            3,304 models tracked across 17 platforms. Operator-level metrics
            computed from signed submissions.
          </>
        }
        limitations={
          <>
            One operator may have multiple devices. Operator identity is
            pseudonymous.
          </>
        }
        lineage={<>SigRank ontology, Search Authority canon SR-OPERATOR-001. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
