import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Output Flow Share",
  description:
    "The fraction of total token flow that is output. Measures what proportion of all token movement is productive output.",
  path: "/wiki/metrics/output-flow-share",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Context Activity Ratio", href: "/wiki/metrics/context-activity-ratio" },
  { label: "Active Output Share", href: "/wiki/metrics/active-output-share" },
  { label: "Composition", href: "/wiki/measurement/composition" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function OutputFlowSharePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Output Flow Share", path: "/wiki/metrics/output-flow-share" },
          ]),
          definedTerm(
            "Output Flow Share",
            "The fraction of total token flow that is output. Measures what proportion of all token movement is productive output.",
            "/wiki/metrics/output-flow-share",
          ),
        ]}
      />
      <WikiEntry
        title="Output Flow Share"
        summary="The fraction of total token flow that is output. Measures what proportion of all token movement is productive output."
        category="metrics"
        evidenceLevel="repeated-experiment"
        definition={
          <>
            The fraction of total token flow that is output. Measures what
            proportion of all token movement is productive output.
          </>
        }
        inputs={<>output, input, cache_creation, cache_read.</>}
        derivedVariables={
          <>
            output_flow_share = output / (input + output + cache_creation +
            cache_read)
          </>
        }
        claim={
          <>
            Output flow share measures how much of the total token throughput is
            actual output vs cache operations and input.
          </>
        }
        test={
          <>
            Verify the formula for known inputs. Check that it sums to 1 with
            other flow shares.
          </>
        }
        observable={<>The numeric output flow share value (0 to 1).</>}
        falsifiers={
          <>
            If output flow share does not equal output / total_tokens, the
            implementation is wrong.
          </>
        }
        evidence={
          <>Computed from field data. Used in composition analysis.</>
        }
        limitations={
          <>
            Does not distinguish useful output from verbose output. Confounded by
            cache-heavy workflows.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={<>SigRank composition analysis, cascade ontology. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
