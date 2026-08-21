/**
 * app/fieldhub/page.tsx — Field Hub.
 *
 * Section landing page for SigRank's academic field analysis and
 * dataset publications. Two entry points:
 *   - Field Analysis (→ /field) — the full article
 *   - State of the Index  (→ /research) — the dataset landing page
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { getFieldAnalysis } from "@/lib/analytics/field-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Field Hub — SigRank Research",
  description:
    "The academic field analysis and dataset publication hub for SigRank. Field Analysis and State of the Index.",
  path: "/fieldhub",
});

export const revalidate = 3600;

export default async function FieldHubPage() {
  const data = await getFieldAnalysis();
  const { meta } = data;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Field Hub — SigRank Research",
    description:
      "The academic field analysis and dataset publication hub for SigRank.",
    url: `${SITE_ORIGIN}/fieldhub`,
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    hasPart: [
      {
        "@type": "Article",
        name: "AI Operator Field Analysis — The True Distribution of Token Efficiency",
        url: `${SITE_ORIGIN}/field`,
      },
      {
        "@type": "Article",
        name: "State of the Index — AI Operator Token Efficiency",
        url: `${SITE_ORIGIN}/research`,
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          collectionPage,
          breadcrumb([{ name: "Field Hub", path: "/fieldhub" }]),
          faqPage([
            {
              question: "What is the SigRank Field Hub?",
              answer:
                "The Field Hub is the academic research hub for SigRank. It provides two entry points: the Field Analysis (signalaf.com/field), which presents the full distribution analysis of AI operator token efficiency, and the State of the Index (signalaf.com/research), which is the Zenodo dataset landing page with downloadable CSVs and JSON.",
            },
            {
              question: "Where can I download the SigRank dataset?",
              answer:
                "The SigRank seed dataset is available on Zenodo at DOI 10.5281/zenodo.21900519 under CC-BY-4.0. Visit the State of the Index page at signalaf.com/research for the full details. The seed dataset includes 1,628 AI operators across 17 platforms with raw token telemetry and derived cascade metrics. The live leaderboard at signalaf.com/board/all includes additional enrolled operators.",
            },
            {
              question: "What research does SigRank publish?",
              answer:
                "SigRank publishes field analysis showing the true distribution of AI operator token efficiency (1,498 human operators, median yield 1.68), the Zenodo dataset with full anonymized telemetry, and the academic foundation page covering the Conservation Law of Commitment and MOSES enforcement architecture.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="📊 SigRank Research"
        terminalText="FIELD HUB"
        title="Field Hub"
        subtitle={
          <>
            The academic research hub for SigRank. This is where we
            document field analysis and publish dataset findings.
          </>
        }
      />

      {/* ── Blurb ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <p className="text-lg text-text-primary">
          This section is where we document academic field analysis of the
          SigRank Index — the distribution of AI operator efficiency, the
          volume-vs-yield thesis, outlier detection, and the dataset that
          underpins every finding published on this site.
        </p>
        <p className="text-base text-text-secondary">
          Each entry below is a primary source. The Field Analysis is the
          full visual article. The State of the Index is the dataset
          landing page with DOI, citation, and downloadable files.
        </p>
      </section>

      {/* ── Field Analysis hero card ────────────────────────────────── */}
      <Link href="/field" className="group block transition-transform hover:scale-[1.01]">
        <WaveHero
          eyebrow="📊 Field Analysis"
          terminalText="THE FIELD"
          title="Field Analysis"
          subtitle={
            <>
              The true distribution of token efficiency.{" "}
              {meta.humans_included.toLocaleString()} human AI operators,
              outliers separated. Volume ranked. Yield revealed.
            </>
          }
          compact
          headingLevel="h2"
        />
      </Link>

      {/* ── State of the Index hero card ────────────────────────────── */}
      <Link href="/research" className="group block transition-transform hover:scale-[1.01]">
        <WaveHero
          eyebrow="📊 SigRank Index"
          terminalText="THE DATA-STATE"
          title="State of the Index"
          subtitle={
            <>
              The primary anonymized seed dataset. 1,628 operators across 17
              platforms and 3,304 models. 9.07Q total tokens. Available on
              Zenodo at DOI 10.5281/zenodo.21900519 under CC-BY-4.0.
            </>
          }
          compact
          headingLevel="h2"
        />
      </Link>
    </div>
  );
}
