import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Context Activity Ratio",
  description:
    "The ratio of cache activity (creation + read) to fresh input. Measures how much an operator invests in context vs fresh prompting.",
  path: "/wiki/metrics/context-activity-ratio",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Output Flow Share", href: "/wiki/metrics/output-flow-share" },
  { label: "Active Output Share", href: "/wiki/metrics/active-output-share" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function ContextActivityRatioPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Context Activity Ratio", path: "/wiki/metrics/context-activity-ratio" },
          ]),
          definedTerm(
            "Context Activity Ratio",
            "The ratio of cache activity (creation + read) to fresh input. Measures how much an operator invests in context vs fresh prompting.",
            "/wiki/metrics/context-activity-ratio",
          ),
        ]}
      />
      <WikiEntry
        title="Context Activity Ratio"
        summary="The ratio of cache activity (creation + read) to fresh input. Measures how much an operator invests in context vs fresh prompting."
        category="metrics"
        evidenceLevel="repeated-experiment"
        definition={
          <>
            The ratio of cache activity (creation + read) to fresh input.
            Measures how much an operator invests in context vs fresh prompting.
          </>
        }
        inputs={<>cache_creation, cache_read, input.</>}
        derivedVariables={
          <>context_activity_ratio = (cache_creation + cache_read) / max(input, 1)</>
        }
        claim={
          <>
            Context activity ratio measures the operator&apos;s investment in
            building and reusing context relative to fresh input.
          </>
        }
        test={<>Verify the formula for known inputs.</>}
        observable={
          <>The numeric context activity ratio value.</>
        }
        falsifiers={
          <>
            If the ratio does not equal (cache_creation + cache_read) /
            max(input, 1), the implementation is wrong.
          </>
        }
        evidence={
          <>Computed from field data. Used in workflow friction analysis.</>
        }
        limitations={
          <>
            High ratio may indicate efficient context reuse OR may indicate
            excessive caching overhead.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={<>Upsilon workflow friction analysis. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
