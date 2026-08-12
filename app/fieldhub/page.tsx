/**
 * app/fieldhub/page.tsx — Field Analysis hub.
 *
 * TOC landing page with blurbs + hero previews for each field analysis
 * section. Each section links to /field/<slug> for the full content.
 * The full article is at /field.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { getFieldAnalysis } from "@/lib/analytics/field-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { breadcrumb, personAuthor } from "@/lib/jsonld";
import { FIELD_SECTIONS } from "@/lib/field/sections";
import FieldStatCards from "@/components/field/FieldStatCards";
import BenfordTrustBadge from "@/components/field/BenfordTrustBadge";

export const metadata: Metadata = withOG({
  title: "Field Hub — AI Operator Field Analysis",
  description:
    "Table of contents for the 12 field analysis sections: volume vs yield, the token cascade, SNR separation, ghost ranks, build archetypes, and more.",
  path: "/fieldhub",
});

export const revalidate = 3600;

export default async function FieldHubPage() {
  const data = await getFieldAnalysis();
  const { meta } = data;

  const fieldDataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "AI Operator Field Distribution Analysis — SigRank",
    description:
      "Distribution analysis of 1,498 human AI operators (Human Center of Mass) ranked by token-cascade efficiency (yield Υ). " +
      "Volume vs yield correlation, SNR separation, platform dominance, outlier detection. " +
      "Outliers separated via 6-signal outlier-likelihood score + input/total ratio analysis.",
    url: `${SITE_ORIGIN}/field`,
    creator: personAuthor(),
    author: personAuthor(),
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    citation: "McHenry, D. J. (2026). SigRank Two-Axis Operator Taxonomy: Finalized Datasets and Analytics Dashboards (v3.1) [Dataset]. Zenodo. https://doi.org/10.5281/zenodo.21900519",
    keywords: [
      "AI operator distribution",
      "token efficiency",
      "yield vs volume",
      "AI operator field analysis",
      "outlier detection",
      "token cascade",
    ],
    variableMeasured: [
      { "@type": "PropertyValue", name: "Yield (Υ)", description: "cache_read × output / input²" },
      { "@type": "PropertyValue", name: "SNR", description: "output / (input + output)" },
      { "@type": "PropertyValue", name: "Leverage", description: "cache_read / input" },
      { "@type": "PropertyValue", name: "Velocity", description: "output / input" },
    ],
    measurementTechnique:
      "On-device token telemetry from 1,498 human operators (Human Center of Mass). Outliers separated via input/total ratio analysis.",
    temporalCoverage: meta.scraped_at,
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          fieldDataset,
          breadcrumb([{ name: "Field Hub", path: "/fieldhub" }]),
        ]}
      />

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
      />

      {/* ── Headline stats ───────────────────────────────────────────── */}
      <FieldStatCards
        medians={{
          yield: meta.medians.yield,
          snr: meta.medians.snr,
          leverage: meta.medians.leverage,
          tokens_per_day: meta.medians.tokens_per_day,
        }}
      />

      {/* ── Benford trust badge ──────────────────────────────────────── */}
      <BenfordTrustBadge />

      {/* ── TOC ──────────────────────────────────────────────────────── */}
      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-b border-bg-border pb-3 text-xs">
        {FIELD_SECTIONS.map((s) => (
          <a
            key={s.slug}
            href={`#${s.slug}`}
            className="font-mono text-text-muted transition-colors hover:text-gold"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {/* ── Section previews ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {FIELD_SECTIONS.map((section) => (
          <section
            key={section.slug}
            id={section.slug}
            className="flex flex-col gap-3 scroll-mt-20 rounded-lg border border-bg-border bg-bg-surface px-5 py-4"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-sans text-lg font-bold text-text-primary">
                {section.title}
              </h2>
              <span className="font-mono text-xs text-text-dim">
                {String(section.order).padStart(2, "0")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              {section.blurb}
            </p>
            {section.chart && (
              <Link
                href={`/field/${section.slug}`}
                className="overflow-hidden rounded-lg border border-bg-border transition-opacity hover:opacity-90"
              >
                <img
                  src={section.chart}
                  alt={section.title}
                  width={800}
                  height={400}
                  className="h-auto w-full"
                  style={{ aspectRatio: "800 / 400" }}
                  loading="lazy"
                />
              </Link>
            )}
            <Link
              href={`/field/${section.slug}`}
              className="self-start font-mono text-xs text-gold underline underline-offset-2 transition-colors hover:text-text-primary"
            >
              Read {section.title} →
            </Link>
          </section>
        ))}
      </div>

      {/* ── Footer links ─────────────────────────────────────────────── */}
      <footer className="mt-4 flex flex-col gap-3 border-t border-bg-border pt-6">
        <p className="text-sm text-text-secondary">
          Data collected {meta.scraped_at} from{" "}
          <a
            href={meta.source}
            className="text-gold underline hover:text-text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            tokscale.ai/leaderboard
          </a>
          . {meta.total_scraped.toLocaleString()} operators collected,{" "}
          {meta.outliers} outliers separated,{" "}
          {meta.humans_included.toLocaleString()} humans analyzed.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/field"
            className="text-gold underline hover:text-text-primary"
          >
            Read full article →
          </Link>
          <Link
            href="/research"
            className="text-gold underline hover:text-text-primary"
          >
            State of the Index
          </Link>
          <Link
            href="/methodology"
            className="text-gold underline hover:text-text-primary"
          >
            Methodology
          </Link>
          <Link
            href="/hall"
            className="text-gold underline hover:text-text-primary"
          >
            Hall of Signal
          </Link>
          <Link
            href="/board/all"
            className="text-gold underline hover:text-text-primary"
          >
            Live Leaderboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
