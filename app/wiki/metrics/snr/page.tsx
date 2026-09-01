import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Signal-to-Noise Ratio (SNR)",
  description:
    "Output share of fresh input plus output. The proportion of total fresh signal that is output.",
  path: "/wiki/metrics/snr",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Yield (Υ)", href: "/wiki/metrics/yield" },
  { label: "Velocity", href: "/wiki/metrics/velocity" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function SnrPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Signal-to-Noise Ratio (SNR)", path: "/wiki/metrics/snr" },
          ]),
          definedTerm(
            "Signal-to-Noise Ratio (SNR)",
            "Output share of fresh input plus output. The proportion of total fresh signal that is output.",
            "/wiki/metrics/snr",
          ),
        ]}
      />
      <WikiEntry
        title="Signal-to-Noise Ratio (SNR)"
        summary="Output share of fresh input plus output. The proportion of total fresh signal that is output."
        category="metrics"
        evidenceLevel="production-evidence"
        definition={
          <>
            Output share of fresh input plus output. The proportion of total
            fresh signal that is output.
          </>
        }
        inputs={<>output, input.</>}
        derivedVariables={<>SNR = output / (input + output)</>}
        claim={
          <>
            SNR measures the output fraction of the fresh signal — how much of
            what the operator generates (plus what they take in) is actual
            output.
          </>
        }
        test={
          <>
            Verify SNR = output / (input + output). Returns 0 when denominator is
            not positive.
          </>
        }
        observable={<>The numeric SNR value (0 to 1).</>}
        falsifiers={
          <>
            If SNR does not equal output / (input + output), the implementation
            is wrong.
          </>
        }
        evidence={
          <>Canonical test. Field data shows SNR distributions.</>
        }
        limitations={
          <>
            Does NOT establish output quality. SNR is bounded [0, 1] and loses
            information about absolute scale.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={<>SigRank Standard. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
