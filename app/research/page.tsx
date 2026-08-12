/**
 * app/research/page.tsx — State of the Index: an introduction to the AI
 * operator token-efficiency landscape.
 *
 * Full findings page: aggregate stats + two-axis classification tables
 * (build archetypes, experience ladder) + platform breakdown + dataset
 * download links citing the Zenodo DOI.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, sigrankDataset, researchArticle } from "@/lib/jsonld";
import archetypesData from "@/public/data/archetypes.json";
import classDistributionData from "@/public/data/class-distribution-reference.json";

export const revalidate = 3600; // 1h — the seed corpus is stable

export const metadata: Metadata = withOG({
  title: "State of the Index — AI Operator Token Efficiency",
  description:
    "An introduction to the AI operator token-efficiency landscape. 1,628 anonymized operators across 17 platforms. Full dataset on Zenodo. Build archetypes, experience ladder, and platform breakdown.",
  path: "/research",
});

// ── Constants ─────────────────────────────────────────────────────────

const ZENODO_VERSION_DOI = "10.5281/zenodo.21900519";
const ZENODO_CONCEPT_DOI = "10.5281/zenodo.21875675";
const ZENODO_URL = "https://zenodo.org/records/21900519";
const SNAPSHOT_DATE = "2026-07-13";

const CSV_FILES = [
  { name: "operators-raw.csv", rows: "1,628", desc: "Raw token telemetry per operator + trans_exp" },
  { name: "operators-derived.csv", rows: "1,628", desc: "Derived cascade metrics per operator + archetype" },
  { name: "operators-platform-split.csv", rows: "8,992", desc: "Per-operator per-platform token breakdown" },
  { name: "platform-raw.csv", rows: "17", desc: "Platform aggregate raw stats" },
  { name: "platform-metrics.csv", rows: "17", desc: "Platform derived metrics" },
  { name: "model-raw.csv", rows: "3,304", desc: "Model aggregate raw stats" },
  { name: "model-metrics.csv", rows: "3,304", desc: "Model adoption patterns" },
];

// Dataset stats (from Zenodo v3.1 package, not the live board)
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

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000_000_000_000) return `${(n / 1_000_000_000_000_000).toFixed(2)}Q`;
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function fmtYield(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(3);
}

// ── Types for JSON imports ─────────────────────────────────────────────

type Archetype = {
  archetype_id: number;
  key: string;
  name: string;
  family: string;
  family_label: string;
  description: string;
  defined_by: string;
  n: number;
  yield_median: number;
  leverage_median: number;
  velocity_median: number;
  snr_median: number;
  input_pct: number;
  output_pct: number;
  cache_read_pct: number;
  cache_write_pct: number;
  total_tokens_median: number;
  tokens_per_day_median: number;
  top_platform: string;
};

type Stage = {
  stage: string;
  totalMin_inclusive: number;
  observed_min_total_tokens: number;
  observed_max_total_tokens: number;
  operators: number;
};

const archetypes = (archetypesData as { archetypes: Archetype[] }).archetypes;
const stages = (classDistributionData as { stages: Stage[] }).stages;
const hcmPopulation = archetypes.reduce((sum, a) => sum + a.n, 0);
const ladderPopulation = stages.reduce((sum, s) => sum + s.operators, 0);

// ── Page ───────────────────────────────────────────────────────────────

export default function StateOfTheIndexPage() {
  const { operatorCount, platformCount, totalTokens, totalInput, totalOutput, totalCacheRead } = DATASET;
  const cachePct = totalTokens > 0 ? ((totalCacheRead / totalTokens) * 100).toFixed(1) : "0";

  const headlineFindings = [
    `${operatorCount.toLocaleString("en-US")} anonymized operators across ${platformCount} platforms.`,
    `${fmt(totalTokens)} total tokens observed (${fmt(totalInput)} input, ${fmt(totalOutput)} output, ${fmt(totalCacheRead)} cache read).`,
    `${cachePct}% of all tokens are served from cache — the cascade economy in aggregate.`,
    `10 build archetypes (HCM cohort, ${hcmPopulation.toLocaleString()} operators) and 24 experience ladder stages (${ladderPopulation.toLocaleString()} operators).`,
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
              "An introduction to the AI operator token-efficiency landscape. 1,628 anonymized operators across 17 platforms. Full dataset on Zenodo.",
            datePublished: SNAPSHOT_DATE,
            headlineFindings,
            doi: ZENODO_VERSION_DOI,
          }),
          breadcrumb([{ name: "Research", path: "/research" }]),
        ]}
      />

      <WaveHero
        eyebrow="📊 SigRank Index"
        terminalText="STATE OF THE INDEX"
        title="State of the Index"
        subtitle={
          <>
            An introduction to the AI operator token-efficiency landscape.
            {" "}
            {operatorCount.toLocaleString("en-US")} anonymized operators across{" "}
            {platformCount} platforms. Data as of {SNAPSHOT_DATE}.
          </>
        }
      />

      {/* ── Introduction ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The Situation
        </h2>
        <p className="text-base text-text-secondary">
          The SigRank Index ranks AI operators — the humans driving AI tools —
          by token-cascade efficiency. Every operator is measured by the same
          four token pillars: <strong>input</strong> (fresh tokens sent),
          <strong> output</strong> (tokens generated), <strong>cache creation</strong>
          {" "}(context written to cache), and <strong>cache read</strong> (context
          reused from cache). From these four integers, every cascade metric is
          derived — including the headline efficiency metric{" "}
          <strong>Υ (Yield) = (cache_read × output) / input²</strong>.
        </p>
        <p className="text-base text-text-secondary">
          The full anonymized operator-level dataset is available on Zenodo
          under CC-BY-4.0. This page presents the headline findings: aggregate
          stats, the two-axis classification system, and the platform
          breakdown. Download the CSVs to run your own analysis.
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

      {/* ── The Two Axes ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The Two Axes
        </h2>
        <p className="text-base text-text-secondary">
          SigRank classifies operators along two orthogonal axes:{" "}
          <strong>build archetype</strong> (how they operate) and{" "}
          <strong>experience ladder</strong> (how much they&apos;ve operated).
          An ARCH+ operator can be INPUT-BOUND. An IGNITER can be an AMPLIFIER.
          The axes are separate by design.
        </p>

        {/* Axis 1: Build Archetypes */}
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Axis 1 — Build Archetypes
          </h3>
          <p className="text-sm text-text-dim">
            10 deterministic composition types from leverage, velocity, and
            construction. HCM cohort: {hcmPopulation.toLocaleString()} operators
            (full scrape minus 41 outliers with input/total ≥ 0.5).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left">
                  <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wider text-text-dim">Archetype</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">N</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">%</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">Med Υ</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">Med L</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">Med V</th>
                  <th className="py-2 text-right font-mono text-xs uppercase tracking-wider text-text-dim">Input %</th>
                </tr>
              </thead>
              <tbody>
                {archetypes.map((a) => (
                  <tr key={a.archetype_id} className="border-b border-bg-border/50">
                    <td className="py-2 pr-4 font-mono text-text-primary">{a.name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">{a.n}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-text-dim">
                      {((a.n / hcmPopulation) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-gold">{fmtYield(a.yield_median)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">{a.leverage_median.toFixed(1)}x</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-text-secondary">{a.velocity_median.toFixed(3)}</td>
                    <td className="py-2 text-right tabular-nums text-text-dim">{a.input_pct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-dim">
            Yield spreads {fmtYield(Math.max(...archetypes.map(a => a.yield_median)) / Math.min(...archetypes.map(a => a.yield_median)))}x
            across archetypes. Leverage spreads{" "}
            {(Math.max(...archetypes.map(a => a.leverage_median)) / Math.min(...archetypes.map(a => a.leverage_median))).toFixed(0)}x.
            Fresh input ranges from{" "}
            {Math.min(...archetypes.map(a => a.input_pct)).toFixed(2)}% to{" "}
            {Math.max(...archetypes.map(a => a.input_pct)).toFixed(2)}%.
          </p>
        </div>

        {/* Axis 2: Experience Ladder */}
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            Axis 2 — Experience Ladder
          </h3>
          <p className="text-sm text-text-dim">
            24 stages (8 tiers × 3 sub-stages) by descending first-match over
            fixed total-token thresholds. {ladderPopulation.toLocaleString()} operators.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left">
                  <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wider text-text-dim">Stage</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">N</th>
                  <th className="py-2 pr-4 text-right font-mono text-xs uppercase tracking-wider text-text-dim">Min tokens</th>
                  <th className="py-2 text-right font-mono text-xs uppercase tracking-wider text-text-dim">Max tokens</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s, i) => (
                  <tr key={s.stage} className={i % 3 === 2 ? "border-b border-bg-border" : "border-b border-bg-border/30"}>
                    <td className="py-1.5 pr-4 font-mono text-text-primary">{s.stage}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-text-secondary">{s.operators}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-text-dim">{fmt(s.observed_min_total_tokens)}</td>
                    <td className="py-1.5 text-right tabular-nums text-text-dim">{fmt(s.observed_max_total_tokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-dim">
            Token range spans from {fmt(Math.min(...stages.map(s => s.observed_min_total_tokens)))}{" "}
            (IGNITER III minimum) to {fmt(Math.max(...stages.map(s => s.observed_max_total_tokens)))}{" "}
            (ARCH+ I observed maximum). Stage populations follow Option C target
            proportions, not equal-population binning.
          </p>
        </div>
      </section>

      {/* ── The Dataset ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The Dataset
        </h2>
        <p className="text-base text-text-secondary">
          The full anonymized operator-level dataset is available on Zenodo
          under CC-BY-4.0. 7 CSV files, 4 interactive dashboards, 10 animated
          GIFs, full provenance and anonymization documentation.
        </p>
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
            CSV files in the package
          </p>
          <table className="w-full text-sm">
            <tbody>
              {CSV_FILES.map((f) => (
                <tr key={f.name} className="border-b border-bg-border/30 last:border-0">
                  <td className="py-1.5 pr-3 font-mono text-text-primary">{f.name}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-text-secondary">{f.rows}</td>
                  <td className="py-1.5 text-text-dim">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          href={ZENODO_URL}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 font-mono text-sm text-gold transition hover:bg-gold/20"
          rel="external"
        >
          View on Zenodo →
        </Link>
      </section>

      {/* ── Methodology ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
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
      <section className="flex flex-col gap-3">
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
      <section className="flex flex-col gap-3">
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
