import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Task Conditioning",
  description:
    "Whether metrics are conditioned by task type — different tasks may produce systematically different metric profiles regardless of operator skill.",
  path: "/wiki/validation/task-conditioning",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Transportability", href: "/wiki/validation/transportability" },
  { label: "Operator-System Interaction", href: "/wiki/validation/operator-system-interaction" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function TaskConditioningPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Validation", path: "/wiki#evidence-validation" },
            { name: "Task Conditioning", path: "/wiki/validation/task-conditioning" },
          ]),
          definedTerm(
            "Task Conditioning",
            "Whether metrics are conditioned by task type — different tasks may produce systematically different metric profiles regardless of operator skill.",
            "/wiki/validation/task-conditioning",
          ),
        ]}
      />
      <WikiEntry
        title="Task Conditioning"
        summary="Whether metrics are conditioned by task type — different tasks may produce systematically different metric profiles regardless of operator skill."
        category="validation"
        evidenceLevel="concept"
        specVersion="SigRank Standard v1.0 (proposed)"
        definition={
          <>
            Whether metrics are conditioned by task type — different tasks may
            produce systematically different metric profiles regardless of
            operator skill.
          </>
        }
        inputs={
          <>Metric profiles for the same operator across different task types.</>
        }
        derivedVariables={
          <>Task-level metric differences, task effect size.</>
        }
        claim={
          <>
            Metrics may be task-dependent — the same operator may show different
            metrics on different tasks, and this is not a skill difference.
          </>
        }
        test={
          <>
            Compare the same operator&apos;s metrics across task types. Test for
            significant task effects.
          </>
        }
        observable={
          <>Task-level metric differences, task effect F-ratio.</>
        }
        falsifiers={
          <>
            No task effects — metrics are identical across all task types for all
            operators.
          </>
        }
        evidence={
          <>
            Field data suggests task effects exist. Formal analysis not yet
            conducted.
          </>
        }
        limitations={
          <>
            Task classification is subjective. Some tasks may be rare in the
            dataset.
          </>
        }
        lineage={
          <>Upsilon workflow friction analysis, proposed validation. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
