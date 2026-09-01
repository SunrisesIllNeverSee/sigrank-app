import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Leverage",
  description:
    "Cache reuse per fresh input. How much an operator leverages cached signal relative to new input.",
  path: "/wiki/metrics/leverage",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Yield (Υ)", href: "/wiki/metrics/yield" },
  { label: "Velocity", href: "/wiki/metrics/velocity" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function LeveragePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Metrics", path: "/wiki#evidence-metrics" },
            { name: "Leverage", path: "/wiki/metrics/leverage" },
          ]),
          definedTerm(
            "Leverage",
            "Cache reuse per fresh input. How much an operator leverages cached signal relative to new input.",
            "/wiki/metrics/leverage",
          ),
        ]}
      />
      <WikiEntry
        title="Leverage"
        summary="Cache reuse per fresh input. How much an operator leverages cached signal relative to new input."
        category="metrics"
        evidenceLevel="production-evidence"
        definition={
          <>
            Cache reuse per fresh input. How much an operator leverages cached
            signal relative to new input.
          </>
        }
        inputs={<>cache_read, input.</>}
        derivedVariables={<>leverage = cache_read / max(input, 1)</>}
        claim={
          <>
            Leverage measures how efficiently an operator reuses cached context
            relative to fresh input.
          </>
        }
        test={
          <>
            Verify leverage = cache_read / max(input, 1) for known inputs.
            Cross-check with 10xDEV = log10(leverage).
          </>
        }
        observable={<>The numeric leverage value.</>}
        falsifiers={
          <>
            If leverage does not equal cache_read / max(input, 1), the
            implementation is wrong.
          </>
        }
        evidence={
          <>
            Canonical test. Field data shows leverage distributions across
            operators.
          </>
        }
        limitations={
          <>
            Does NOT establish causal leverage or business value. High leverage
            may indicate efficient reuse OR may indicate insufficient fresh
            input.
          </>
        }
        specVersion="SigRank Standard v1.0"
        lineage={
          <>
            SigRank Standard, cascade ontology (Reuse stage = cache_read /
            cache_create).
           Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
