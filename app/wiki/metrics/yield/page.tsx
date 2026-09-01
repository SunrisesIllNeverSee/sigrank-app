import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Yield (Υ)",
  description:
    "Upsilon Yield — the combined reuse and output relationship. How much reusable signal an operator creates from each unit of input.",
  path: "/wiki/metrics/yield",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Leverage", href: "/wiki/metrics/leverage" },
  { label: "Velocity", href: "/wiki/metrics/velocity" },
  { label: "Signal-to-Noise Ratio (SNR)", href: "/wiki/metrics/snr" },
  { label: "Composition", href: "/wiki/measurement/composition" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function YieldPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Yield (Υ)", path: "/wiki/metrics/yield" },
          ]),
          definedTerm(
            "Yield (Υ)",
            "Upsilon Yield — the combined reuse and output relationship. How much reusable signal an operator creates from each unit of input.",
            "/wiki/metrics/yield",
          ),
        ]}
      />
      <WikiEntry
        title="Yield (Υ)"
        summary="Upsilon Yield — the combined reuse and output relationship. How much reusable signal an operator creates from each unit of input."
        category="metrics"
        evidenceLevel="production-evidence"
        definition={
          <>
            Upsilon Yield — the combined reuse and output relationship. How much
            reusable signal an operator creates from each unit of input.
          </>
        }
        inputs={<>cache_read, output, input (three of the four token pillars).</>}
        derivedVariables={
          <>Υ = (cache_read × output) / max(input, 1)²</>
        }
        claim={
          <>
            Yield measures the combined efficiency of producing output and
            reusing cached signal relative to fresh input.
          </>
        }
        test={
          <>
            Canonical test — MO§ES seed values (1_251_211, 11_296_121,
            128_196_310, 2_555_179_769) → Υ 18436.98. Must reproduce exactly.
          </>
        }
        observable={
          <>The numeric yield value for a given set of token counts.</>
        }
        falsifiers={
          <>
            If the formula does not reproduce the canonical seed value, the
            implementation is wrong.
          </>
        }
        evidence={
          <>
            Canonical test passes 11/11. Seed values verified. Published in
            SigRank Standard.
          </>
        }
        limitations={
          <>
            Sensitive to small input denominators. Does NOT establish
            correctness, novelty, quality, value, safety, talent, effort, or
            intelligence. Plausibility checks matter.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={
          <>SigRank Standard, Search Authority canon, MO§ES seed values. Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
