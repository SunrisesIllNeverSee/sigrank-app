import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Active Output Share",
  description:
    "The fraction of output relative to all active token movement (output + cache_creation). Measures how much active generation is output vs cache building.",
  path: "/wiki/metrics/active-output-share",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Output Flow Share", href: "/wiki/metrics/output-flow-share" },
  { label: "Context Activity Ratio", href: "/wiki/metrics/context-activity-ratio" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function ActiveOutputSharePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Active Output Share", path: "/wiki/metrics/active-output-share" },
          ]),
          definedTerm(
            "Active Output Share",
            "The fraction of output relative to all active token movement (output + cache_creation). Measures how much active generation is output vs cache building.",
            "/wiki/metrics/active-output-share",
          ),
        ]}
      />
      <WikiEntry
        title="Active Output Share"
        summary="The fraction of output relative to all active token movement (output + cache_creation). Measures how much active generation is output vs cache building."
        category="metrics"
        evidenceLevel="repeated-experiment"
        definition={
          <>
            The fraction of output relative to all active token movement (output
            + cache_creation). Measures how much active generation is output vs
            cache building.
          </>
        }
        inputs={<>output, cache_creation.</>}
        derivedVariables={
          <>active_output_share = output / max(output + cache_creation, 1)</>
        }
        claim={
          <>
            Active output share measures the proportion of active generation that
            is output vs cache creation — distinguishing productive output from
            context investment.
          </>
        }
        test={<>Verify the formula for known inputs.</>}
        observable={
          <>The numeric active output share value (0 to 1).</>
        }
        falsifiers={
          <>
            If the share does not equal output / (output + cache_creation), the
            implementation is wrong.
          </>
        }
        evidence={
          <>Computed from field data. Used in composition analysis.</>
        }
        limitations={
          <>
            Does not account for cache_read (reuse). A high share may indicate
            insufficient context building.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={<>SigRank composition analysis. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
