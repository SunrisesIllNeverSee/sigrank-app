import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Velocity",
  description:
    "Output per fresh input. How much an operator produces relative to new input.",
  path: "/wiki/metrics/velocity",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Yield (Υ)", href: "/wiki/metrics/yield" },
  { label: "Signal-to-Noise Ratio (SNR)", href: "/wiki/metrics/snr" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function VelocityPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Velocity", path: "/wiki/metrics/velocity" },
          ]),
          definedTerm(
            "Velocity",
            "Output per fresh input. How much an operator produces relative to new input.",
            "/wiki/metrics/velocity",
          ),
        ]}
      />
      <WikiEntry
        title="Velocity"
        summary="Output per fresh input. How much an operator produces relative to new input."
        category="metrics"
        evidenceLevel="production-evidence"
        definition={
          <>
            Output per fresh input. How much an operator produces relative to new
            input.
          </>
        }
        inputs={<>output, input.</>}
        derivedVariables={<>velocity = output / max(input, 1)</>}
        claim={
          <>
            Velocity measures the raw output efficiency — how much output an
            operator generates per unit of fresh input.
          </>
        }
        test={
          <>Verify velocity = output / max(input, 1) for known inputs.</>
        }
        observable={<>The numeric velocity value.</>}
        falsifiers={
          <>
            If velocity does not equal output / max(input, 1), the
            implementation is wrong.
          </>
        }
        evidence={
          <>Canonical test. Field data shows velocity distributions.</>
        }
        limitations={
          <>
            Ignores cache creation cost. High velocity may indicate efficient
            output OR may indicate insufficient context reuse.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={
          <>
            SigRank Standard, cascade ontology (Transmission stage = output /
            input).
           Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
