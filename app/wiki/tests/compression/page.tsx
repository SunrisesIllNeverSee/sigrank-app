import type { Metadata } from "next";
import { WikiEntry, type WikiCrossRef } from "@/components/wiki/WikiEntry";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Compression Test",
  description:
    "Measure whether useful signal is preserved efficiently or diluted by unnecessary expansion.",
  path: "/wiki/tests/compression",
});

const crossRefs: WikiCrossRef[] = [
  { label: "Lineage Test", href: "/wiki/tests/lineage" },
  { label: "Conservation", href: "/wiki/ct/conservation" },
  { label: "Semantic Entropy", href: "/wiki/ct/semantic-entropy" },
  { label: "Architecture (mos2es.com)", href: "https://mos2es.com/architecture" },
  { label: "System Testing (mos2es.org)", href: "https://mos2es.org/system-testing" },
];

export default function CompressionTestPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "System Tests", path: "/wiki#evidence-system-tests" },
            { name: "Compression Test", path: "/wiki/tests/compression" },
          ]),
          definedTerm(
            "Compression Test",
            "Measure whether useful signal is preserved efficiently or diluted by unnecessary expansion.",
            "/wiki/tests/compression",
          ),
        ]}
      />
      <WikiEntry
        title="Compression Test"
        summary="Measure whether useful signal is preserved efficiently or diluted by unnecessary expansion."
        category="system-tests"
        evidenceLevel="concept"
        specVersion="MO§ES V.05 (proposed)"
        definition={
          <>
            Measure whether useful signal is preserved efficiently or diluted by
            unnecessary expansion.
          </>
        }
        inputs={
          <>
            A signal of known content. The system&apos;s compressed/transformed
            version.
          </>
        }
        derivedVariables={
          <>
            useful_signal / representation_cost. Information retention under
            compression. Entropy introduced by redundant generation.
          </>
        }
        claim={
          <>
            Efficient compression preserves useful signal while minimizing
            representation cost. The ratio useful_signal / representation_cost
            measures this.
          </>
        }
        test={
          <>
            Same task, different verbosity levels. Measure information retention
            under compression. Test whether compression destroys required
            commitments. Measure entropy introduced by redundant generation.
          </>
        }
        observable={
          <>
            The useful-signal to representation-cost ratio. Whether commitments
            survive compression.
          </>
        }
        falsifiers={
          <>
            Compression destroys required commitments, OR shorter representations
            consistently lose signal that longer ones preserve.
          </>
        }
        evidence={
          <>
            No formal experiments yet. Proposed test framework. Related to
            Conservation Law experiments (DOI 10.5281/zenodo.19105225).
          </>
        }
        limitations={
          <>
            &ldquo;Shorter is always better&rdquo; is NOT the claim. The claim is
            about the ratio of useful signal to representation cost. Some
            expansions are legitimate (adding necessary context).
          </>
        }
        lineage={
          <>
            MO§ES™ architecture, Conservation Law of Commitment, cascade
            ontology.
           Architecture: <a href="https://mos2es.com/architecture" className="text-text-accent underline-offset-2 hover:underline">mos2es.com/architecture</a>.</>
        }
        crossRefs={crossRefs}
        lastUpdated="2026-09-01"
      />
    </>
  );
}
