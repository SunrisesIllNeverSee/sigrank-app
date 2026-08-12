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
import { breadcrumb } from "@/lib/jsonld";

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
      <Link
        href="/field"
        className="group block rounded-lg border border-bg-border bg-bg-surface px-6 py-5 transition-colors hover:border-gold/40"
      >
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            📊 Field Analysis
          </p>
          <h2 className="font-sans text-xl font-bold leading-tight text-text-primary group-hover:text-gold md:text-2xl">
            Field Analysis
          </h2>
          <p className="font-mono text-sm text-gold">
            THE FIELD
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            The true distribution of token efficiency.{" "}
            {meta.humans_included.toLocaleString()} human AI operators,
            outliers separated. Volume ranked. Yield revealed.
          </p>
        </div>
      </Link>

      {/* ── State of the Index hero card ────────────────────────────── */}
      <Link
        href="/research"
        className="group block rounded-lg border border-bg-border bg-bg-surface px-6 py-5 transition-colors hover:border-gold/40"
      >
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            📊 SigRank Index
          </p>
          <h2 className="font-sans text-xl font-bold leading-tight text-text-primary group-hover:text-gold md:text-2xl">
            State of the Index
          </h2>
          <p className="font-mono text-sm text-gold">
            THE DATA-STATE
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            The primary anonymized dataset. 1,628 operators across 17
            platforms and 3,304 models. 9.07Q total tokens. Available on
            Zenodo under CC-BY-4.0.
          </p>
        </div>
      </Link>
    </div>
  );
}
