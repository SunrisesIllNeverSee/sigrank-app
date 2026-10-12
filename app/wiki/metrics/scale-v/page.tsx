import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

const summary = "Base-10 logarithm of total recorded token activity across input, output, cache-write and cache-read.";

export const metadata: Metadata = withOG({
  title: "Scale V — Recorded Token Activity",
  description: summary,
  path: "/wiki/metrics/scale-v",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Yield (Υ)", href: "/wiki/metrics/yield" },
  { label: "Leverage", href: "/wiki/metrics/leverage" },
  { label: "Velocity", href: "/wiki/metrics/velocity" },
  { label: "Leaderboard", href: "/board/all" },
];

export default function ScaleVPage() {
  return (
    <>
      <JsonLd data={[
        breadcrumb([
          { name: "Wiki", path: "/wiki" },
          { name: "Metrics", path: "/wiki#evidence-metrics" },
          { name: "Scale V", path: "/wiki/metrics/scale-v" },
        ]),
        definedTerm("Scale V", summary, "/wiki/metrics/scale-v"),
      ]} />
      <WikiEntry
        title="Scale V"
        summary={summary}
        category="metrics"
        evidenceLevel="production-evidence"
        definition={<>The base-10 logarithm of the sum of recorded input, output, cache-write, and cache-read token counts over the selected measurement window. Every increase of 1 corresponds to ten times the recorded activity volume. The raw Total Tokens figure remains separately available.</>}
        inputs={<>Input (I), Output (O), Cache-write (W), Cache-read (R), as nonnegative recorded token counts from the same window.</>}
        derivedVariables={<>Scale V = log₁₀(I + O + W + R), for positive recorded totals. A total of one million tokens gives Scale V = 6; ten million gives 7.</>}
        claim={<>Scale V measures order-of-magnitude token activity, not whether tokens are unique, meaningful, relevant, newly generated, or successfully retrieved. Cache-read tokens can be reused context; these still count as recorded activity, not distinct content.</>}
        test={<>For a positive total, sum the four raw counters and take log₁₀ of their total; multiplying all counters by ten must increase Scale V by one. Compare against the raw Total Tokens column and CSV export.</>}
        observable={<>Scale V and raw Total Tokens in the leaderboard's selected time window.</>}
        falsifiers={<>If Scale V differs from log₁₀ of the four recorded pillars (for a positive total) or is presented as a retrieval-success signal, the presentation is incorrect.</>}
        evidence={<>Deterministic formula over token-only telemetry; leaderboard export retains exact recorded total. No assessment of underlying prompt or response content is performed.</>}
        limitations={<>A large token total can reflect repeated context rather than new information. Scale V is not Yield, Leverage, efficiency, unique-content volume, a quality measure, or a validated “needle in a haystack” detection metric. Unavailable or zero totals cannot produce a meaningful positive logarithmic scale.</>}
        specVersion="TTEOP (Token Telemetry Evaluation Operator Protocol) v0.1-draft"
        lineage={<>Four-pillar token telemetry, derived measurement. The distinct efficiency and reuse metrics are explained separately.</>}
        crossRefs={crossRefs}
        lastUpdated="2026-10-12"
      />
    </>
  );
}
