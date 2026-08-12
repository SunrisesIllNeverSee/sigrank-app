/**
 * app/research/page.tsx — State of the Index: the primary dataset.
 *
 * This is the Zenodo-first landing page. The full anonymized operator-level
 * dataset is the source material — everything else (articles, field analysis,
 * dashboards) is derived from it. This page points researchers to the data.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, sigrankDataset, researchArticle } from "@/lib/jsonld";

export const revalidate = 3600; // 1h — the seed corpus is stable

export const metadata: Metadata = withOG({
  title: "State of the Index — AI Operator Token Efficiency",
  description:
    "The primary anonymized dataset: 1,628 AI operators across 17 platforms and 3,304 models. Raw token telemetry, derived cascade metrics, per-platform breakdowns. Available on Zenodo under CC-BY-4.0.",
  path: "/research",
});

// ── Constants ─────────────────────────────────────────────────────────

const ZENODO_VERSION_DOI = "10.5281/zenodo.21900519";
const ZENODO_CONCEPT_DOI = "10.5281/zenodo.21875675";
const ZENODO_URL = "https://zenodo.org/records/21900519";
const ZENODO_FILE = (name: string) => `${ZENODO_URL}/files/${name}`;
const SNAPSHOT_DATE = "2026-07-13";

// Dataset stats (from Zenodo v3.1 package)
const DATASET = {
  operatorCount: 1628,
  platformCount: 17,
  modelCount: 3304,
  totalTokens: 9_071_333_906_075_020,
  totalInput: 9_033_520_362_816_918,
  totalOutput: 2_863_764_919_168,
  totalCacheRead: 34_112_884_055_111,
  totalCacheWrite: 801_057_987_773,
};

const DATA_FILES = [
  { name: "operators-raw.csv", rows: "1,628", desc: "Raw token telemetry: input, output, cache_read, cache_write, reasoning, total, cost, op_ratio, active_days, sessions, submissions + trans_exp" },
  { name: "operators-derived.csv", rows: "1,628", desc: "Derived cascade metrics: yield, seed_sigrank, snr, leverage, velocity, compression, tokens_per_day, dev10x, scale_v, cost_per_million, efficiency + archetype" },
  { name: "operators-platform-split.csv", rows: "8,992", desc: "Per-operator per-platform token breakdown" },
  { name: "platform-raw.csv", rows: "17", desc: "Platform aggregate raw stats" },
  { name: "platform-metrics.csv", rows: "17", desc: "Platform derived metrics" },
  { name: "model-raw.csv", rows: "3,304", desc: "Model aggregate raw stats" },
  { name: "model-metrics.csv", rows: "3,304", desc: "Model adoption patterns" },
  { name: "archetypes.json", rows: "—", desc: "10 build archetype statistics: N, %, median yield/leverage/velocity/SNR, token composition, classification thresholds" },
  { name: "class-distribution-reference.json", rows: "—", desc: "24-stage experience ladder observed distribution: population, min/max tokens per stage" },
  { name: "experience_ladder.json", rows: "—", desc: "Canonical 24-stage classifier thresholds (total-token boundaries)" },
  { name: "MANIFEST.json", rows: "—", desc: "All file paths, sizes, SHA-256 hashes, row counts, citation metadata" },
];

const DOCS = [
  { name: "README.md", desc: "Package overview, file descriptions, two-axis taxonomy summary" },
  { name: "METHODS.md", desc: "All metric formulas, HCM cohort definition, archetype classification" },
  { name: "PROVENANCE.md", desc: "Source, scrape date, exclusions, reproducibility" },
  { name: "ANONYMIZATION.md", desc: "ID scheme, stripped fields, shuffle seeds, re-identification risk" },
  { name: "DATASET-SPEC.md", desc: "Locked column specification for all 7 CSV files" },
  { name: "RELEASE-NOTES.md", desc: "Version history (v1.0 → v3.1)" },
];

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000_000_000_000) return `${(n / 1_000_000_000_000_000).toFixed(2)}Q`;
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

// ── Page ───────────────────────────────────────────────────────────────

export default function StateOfTheIndexPage() {
  const { operatorCount, platformCount, totalTokens, totalInput, totalOutput, totalCacheRead } = DATASET;
  const cachePct = totalTokens > 0 ? ((totalCacheRead / totalTokens) * 100).toFixed(1) : "0";

  const headlineFindings = [
    `${operatorCount.toLocaleString("en-US")} anonymized operators across ${platformCount} platforms and ${DATASET.modelCount.toLocaleString("en-US")} models.`,
    `${fmt(totalTokens)} total tokens observed (${fmt(totalInput)} input, ${fmt(totalOutput)} output, ${fmt(totalCacheRead)} cache read).`,
    `${cachePct}% of all tokens are served from cache — the cascade economy in aggregate.`,
    `Primary source dataset on Zenodo (v3.1). All findings, articles, and dashboards derive from this data.`,
  ];

  const bibtex = `@dataset{sigrank_taxonomy_2026,
  author       = {McHenry, Deric J.},
  title        = {SigRank Two-Axis Operator Taxonomy: Finalized Datasets and Analytics Dashboards (v3.1)},
  year         = {2026},
  publisher    = {Zenodo},
  version      = {3.1},
  doi          = {${ZENODO_VERSION_DOI}},
  url          = {https://doi.org/${ZENODO_VERSION_DOI}},
  note         = {Concept DOI: ${ZENODO_CONCEPT_DOI}. License: CC-BY-4.0. ORCID: 0009-0002-9904-5390.}
}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          sigrankDataset({ updated: new Date().toISOString() }),
          researchArticle({
            slug: "",
            title: "State of the Index — AI Operator Token Efficiency",
            description:
              "The primary anonymized dataset: 1,628 AI operators across 17 platforms. Raw token telemetry, derived cascade metrics, per-platform breakdowns. Available on Zenodo under CC-BY-4.0.",
            datePublished: SNAPSHOT_DATE,
            headlineFindings,
            doi: ZENODO_VERSION_DOI,
          }),
          breadcrumb([{ name: "Research", path: "/research" }]),
        ]}
      />

      <WaveHero
        eyebrow="📊 SigRank Index"
        terminalText="THE DATA-STATE"
        title="State of the Index"
        subtitle={
          <>
            The primary anonymized dataset.{" "}
            {operatorCount.toLocaleString("en-US")} operators across{" "}
            {platformCount} platforms and {DATASET.modelCount.toLocaleString("en-US")} models.{" "}
            {fmt(totalTokens)} total tokens. Data as of {SNAPSHOT_DATE}.
          </>
        }
      />

      {/* ── Table of contents ───────────────────────────────────────── */}
      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-b border-bg-border pb-3 text-xs">
        <a href="#finding" className="font-mono text-text-muted transition-colors hover:text-gold">The Finding</a>
        <a href="#source" className="font-mono text-text-muted transition-colors hover:text-gold">Source</a>
        <a href="#dataset" className="font-mono text-text-muted transition-colors hover:text-gold">Dataset</a>
        <a href="#field" className="font-mono text-text-muted transition-colors hover:text-gold">Field Analysis</a>
        <a href="#methodology" className="font-mono text-text-muted transition-colors hover:text-gold">Methodology</a>
        <a href="#cite" className="font-mono text-text-muted transition-colors hover:text-gold">Cite</a>
        <a href="#license" className="font-mono text-text-muted transition-colors hover:text-gold">License</a>
      </nav>

      {/* ── The Finding ─────────────────────────────────────────────── */}
      <section id="finding" className="flex flex-col gap-4 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The Finding
        </h2>
        <p className="text-lg text-text-primary">
          When you measure 1,628 AI operators across 17 platforms, the first
          thing that jumps out is that <strong>volume is not yield</strong>.
          The operators who burn the most tokens are not the most efficient.
          The most efficient operators reuse context — cache reads dominate
          their cascade, and their Yield (Υ) is orders of magnitude higher
          than the heavy-input majority.
        </p>
        <p className="text-base text-text-secondary">
          The aggregate numbers tell the story: {fmt(totalInput)} of the{" "}
          {fmt(totalTokens)} total tokens observed are fresh input. Only{" "}
          {fmt(totalCacheRead)} are cache reads — just {cachePct}% of all
          traffic. The cascade economy exists, but barely. Most operators are
          paying full price for every token. The ones who aren&apos;t are the
          ones at the top of the leaderboard.
        </p>
        <p className="text-base text-text-secondary">
          This is the founding insight. The dataset is the evidence. Every
          quarter we will re-snapshot the index, publish a new version, and
          track how the distribution shifts as prompt caching becomes standard
          practice. This is v3.1 — the baseline.
        </p>
      </section>

      {/* ── The Source ──────────────────────────────────────────────── */}
      <section id="source" className="flex flex-col gap-4 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The Source
        </h2>
        <p className="text-lg text-text-primary">
          This is the source material. Every article, dashboard, and finding
          published by SigRank derives from this dataset. It is available on
          Zenodo under CC-BY-4.0 — download the CSVs and JSON to run your own
          analysis.
        </p>
        <p className="text-base text-text-secondary">
          The dataset measures AI operators — the humans driving AI tools —
          by four token pillars: <strong>input</strong> (fresh tokens sent),
          <strong> output</strong> (tokens generated), <strong>cache creation</strong>
          {" "}(context written to cache), and <strong>cache read</strong> (context
          reused from cache). From these four integers, every cascade metric is
          derived — including the headline efficiency metric{" "}
          <strong>Υ (Yield) = (cache_read × output) / input²</strong>.
        </p>
      </section>

      {/* ── Headline stats ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Operators" value={operatorCount.toLocaleString("en-US")} />
        <StatCard label="Platforms" value={String(platformCount)} />
        <StatCard label="Models" value={DATASET.modelCount.toLocaleString("en-US")} />
        <StatCard label="Total tokens" value={fmt(totalTokens)} />
        <StatCard label="Cache %" value={`${cachePct}%`} />
      </section>

      {/* ── The Dataset ──────────────────────────────────────────────── */}
      <section id="dataset" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The Dataset
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="mb-1 font-mono text-xs uppercase tracking-wider text-text-dim">Version DOI</p>
          <Link
            href={`https://doi.org/${ZENODO_VERSION_DOI}`}
            className="font-mono text-sm text-gold underline underline-offset-2"
            rel="external"
          >
            {ZENODO_VERSION_DOI}
          </Link>
          <p className="mt-2 mb-1 font-mono text-xs uppercase tracking-wider text-text-dim">Concept DOI (always resolves to latest)</p>
          <Link
            href={`https://doi.org/${ZENODO_CONCEPT_DOI}`}
            className="font-mono text-sm text-gold underline underline-offset-2"
            rel="external"
          >
            {ZENODO_CONCEPT_DOI}
          </Link>
        </div>

        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-text-dim">
            Data files (CSV + JSON)
          </p>
          <table className="w-full text-sm">
            <tbody>
              {DATA_FILES.map((f) => (
                <tr key={f.name} className="border-b border-bg-border/30 last:border-0">
                  <td className="py-1.5 pr-3 whitespace-nowrap">
                    <Link
                      href={ZENODO_FILE(f.name)}
                      className="font-mono text-gold underline underline-offset-2"
                      rel="external"
                    >
                      {f.name}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-text-secondary whitespace-nowrap">{f.rows}</td>
                  <td className="py-1.5 text-text-dim">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-text-dim">
            Documentation
          </p>
          <table className="w-full text-sm">
            <tbody>
              {DOCS.map((f) => (
                <tr key={f.name} className="border-b border-bg-border/30 last:border-0">
                  <td className="py-1.5 pr-3 whitespace-nowrap">
                    <Link
                      href={ZENODO_FILE(f.name)}
                      className="font-mono text-gold underline underline-offset-2"
                      rel="external"
                    >
                      {f.name}
                    </Link>
                  </td>
                  <td className="py-1.5 text-text-dim">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={ZENODO_URL}
            className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 font-mono text-sm text-gold transition hover:bg-gold/20"
            rel="external"
          >
            View on Zenodo →
          </Link>
        </div>
      </section>

      {/* ── Field Analysis ──────────────────────────────────────────── */}
      <section id="field" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Field Analysis
        </h2>
        <p className="text-base text-text-secondary">
          The full field analysis lives at{" "}
          <Link href="/field" className="text-gold underline underline-offset-2">
            /field
          </Link>
          {" "}— interactive charts, archetype distributions, platform adoption
          curves, Benford validation, percentile bands, and the cascade Sankey.
          It is the visual companion to this dataset.
        </p>
        <Link
          href="/field"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm text-text-secondary transition hover:border-text-dim"
        >
          Open Field Analysis →
        </Link>
      </section>

      {/* ── Methodology ─────────────────────────────────────────────── */}
      <section id="methodology" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Methodology
        </h2>
        <p className="text-base text-text-secondary">
          Figures are computed from the SigRank Index — a privacy-preserving
          leaderboard ranking AI operators by token-cascade efficiency (Υ ={" "}
          cache_read × output / input²). Data is built from on-device,
          ed25519-signed token-telemetry snapshots. No message content is ever
          read or stored. Full methodology at{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            /methodology
          </Link>
          .
        </p>
      </section>

      {/* ── Cite this dataset ───────────────────────────────────────── */}
      <section id="cite" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Cite this dataset
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="font-mono text-sm text-text-secondary">
            McHenry, D. J. (2026). SigRank Two-Axis Operator Taxonomy:
            Finalized Datasets and Analytics Dashboards (v3.1) [Dataset].
            Zenodo. https://doi.org/{ZENODO_VERSION_DOI}
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-text-dim">
            BibTeX
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-text-secondary">
{bibtex}
          </pre>
        </div>
      </section>

      {/* ── License ─────────────────────────────────────────────────── */}
      <section id="license" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          License
        </h2>
        <p className="text-base text-text-secondary">
          This dataset is licensed under{" "}
          <Link
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-gold underline underline-offset-2"
            rel="license"
          >
            CC-BY-4.0
          </Link>
          . Attribution required — cite as shown above.
        </p>
      </section>
    </div>
  );
}

// ── Small components ───────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wider text-text-dim">{label}</p>
      <p className="mt-1 text-xl font-bold text-gold tabular-nums">{value}</p>
    </div>
  );
}
