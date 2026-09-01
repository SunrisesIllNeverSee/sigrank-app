import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Blackhole Law",
  description:
    "Detect signal that has lost sufficient lineage, coherence, or distinguishability to be treated as valid continuation. Beyond a threshold, signal should be collapsed as noise.",
  path: "/wiki/ct/blackhole-law",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Semantic Entropy", href: "/wiki/ct/semantic-entropy" },
  { label: "Conservation Law of Commitment", href: "/wiki/ct/conservation" },
  { label: "Lineage (System Tests)", href: "/wiki/tests/lineage" },
  { label: "Conservation Law (mos2es.com)", href: "https://mos2es.com/concepts/conservation-law" },
  { label: "30-Day Pilot (mos2es.org)", href: "https://mos2es.org/pilot" },
];

export default function BlackholeLawPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Commitment Theory", path: "/wiki#evidence-commitment-theory" },
            { name: "Blackhole Law", path: "/wiki/ct/blackhole-law" },
          ]),
          definedTerm(
            "Blackhole Law",
            "Detect signal that has lost sufficient lineage, coherence, or distinguishability to be treated as valid continuation.",
            "/wiki/ct/blackhole-law",
          ),
        ]}
      />
      <WikiEntry
        title="Blackhole Law"
        summary="Detect signal that has lost sufficient lineage, coherence, or distinguishability to be treated as valid continuation. Beyond a threshold, signal should be collapsed as noise."
        category="commitment-theory"
        evidenceLevel="concept"
        specVersion="CT Research Prospectus V.1"
        definition={
          <>
            Detect signal that has lost sufficient lineage, coherence, or
            distinguishability to be treated as valid continuation. When signal
            has degraded beyond a threshold, it should be collapsed (treated as
            noise, not as valid continuation).
          </>
        }
        inputs={
          <>
            A signal with a lineage chain. Measurements of lineage, coherence,
            and distinguishability.
          </>
        }
        derivedVariables={
          <>
            Lineage loss, coherence loss, distinguishability from noise.
          </>
        }
        claim={
          <>
            Signal that has lost sufficient lineage, coherence, or
            distinguishability should be collapsed — treated as noise rather
            than valid continuation. There exists a threshold beyond which
            signal is no longer valid.
          </>
        }
        test={
          <>
            Measure lineage, coherence, and distinguishability at each
            transformation step. Identify the threshold beyond which signal
            should be collapsed.
          </>
        }
        observable={
          <>
            Lineage chain length, coherence values, distinguishability metrics.
          </>
        }
        falsifiers={
          <>
            No threshold exists (signal never loses enough lineage or coherence
            to be invalid), OR the threshold is arbitrary (no principled
            collapse criterion).
          </>
        }
        evidence={<>No formal experiments yet. Proposed concept.</>}
        limitations={
          <>
            The most important open problem is: similarity does not
            automatically imply invalid duplication. Two signals may be similar
            because they independently reached the same conclusion
            (convergence), not because one copied the other (mimicry). The
            Convergence vs Mimicry Test must distinguish these:
            <br />
            <br />
            same or similar output → shared lineage? → YES (possible copying or
            inheritance) / NO → independent reasoning path? → YES (legitimate
            convergence).
          </>
        }
        lineage={
          <>Commitment Theory, MO§ES™ architecture, proposed research program. Architecture: <a href="https://mos2es.com/concepts/conservation-law" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/concepts/conservation-law</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
