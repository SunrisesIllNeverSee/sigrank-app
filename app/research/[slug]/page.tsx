/**
 * app/research/[slug]/page.tsx — quarterly research reports (WS1 Part C).
 *
 * The citation magnet: original findings on a cadence, rendered from frozen
 * JSON snapshots (not live computation). This is what Kantar/YouGov do to win
 * citations — publish original data, then pitch the headline stat.
 *
 * Each report is a standalone page with:
 * - Headline findings (quotable, dated, standalone sentences)
 * - Methodology link
 * - Cite-this-report block (plain text + BibTeX)
 * - Data availability statement
 * - ScholarlyArticle + Dataset + Breadcrumb JSON-LD
 *
 * Reports are frozen at publication time in content/research/<slug>.json.
 * Add a new report by: (1) adding to REPORTS below, (2) generating the JSON
 * snapshot, (3) depositing on Zenodo for a DOI.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import { join } from "path";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { sigrankDataset, researchArticle, breadcrumb } from "@/lib/jsonld";

/** ── Report registry ─────────────────────────────────────────────────── */
interface ReportMeta {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  quarter: string;
  doi?: string;
}

const REPORTS: ReportMeta[] = [
  {
    slug: "q1-2026",
    title: "State of AI Operator Token Efficiency — Q1 2026",
    description:
      "The inaugural SigRank Index report. Median vs. top-decile yield gaps, platform leadership, cache utilization, and the efficiency frontier.",
    datePublished: "2026-06-30",
    quarter: "Q1 2026",
  },
  {
    slug: "q2-2026",
    title: "State of AI Operator Token Efficiency — Q2 2026",
    description:
      "The second SigRank Index report. Quarter-over-quarter trends, platform leadership shifts, class distribution, and the GhostRank quadrant.",
    datePublished: "2026-07-18",
    quarter: "Q2 2026",
  },
];

export function generateStaticParams() {
  return REPORTS.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return (async () => {
    const { slug } = await params;
    const report = REPORTS.find((r) => r.slug === slug);
    if (!report) return { title: "Not Found" };
    return withOG({
      title: report.title,
      description: report.description,
      path: `/research/${report.slug}`,
    });
  })();
}

// Frozen reports — no ISR needed (data is snapshotted at publication time).
export const revalidate = false;

/** Format yield for display. */
function fmtY(y: number): string {
  if (y >= 1_000_000) return `${(y / 1_000_000).toFixed(2)}M`;
  if (y >= 1_000) return `${(y / 1_000).toFixed(1)}K`;
  return Math.round(y).toLocaleString("en-US");
}

/** Frozen report snapshot (content/research/<slug>.json). */
interface ReportSnapshot {
  snapshotDate: string;
  asOf: string;
  quarter: string;
  operatorCount: number;
  rankedCount: number;
  topYield: number;
  medianY: number;
  topDecile: number;
  bottomDecile: number;
  gap: number;
  wastePct: number;
  platformStats: { platform: string; avgYield: number; count: number }[];
  topPlatform: { platform: string; avgYield: number; count: number } | null;
  otherPlatformsAvg: number;
  cachePct: number;
  topEntry: {
    anonId: string;
    codename: string;
    yield: number;
    platform: string;
  } | null;
}

/** Load a frozen report snapshot from content/research/<slug>.json. */
async function loadSnapshot(slug: string): Promise<ReportSnapshot | null> {
  try {
    const filePath = join(process.cwd(), "content", "research", `${slug}.json`);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as ReportSnapshot;
  } catch {
    return null;
  }
}

export default async function ResearchReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = REPORTS.find((r) => r.slug === slug);
  if (!report) notFound();

  // Load frozen snapshot (no live computation — citation integrity)
  const s = await loadSnapshot(slug);
  if (!s) notFound();

  const monthYear = new Date(report.datePublished).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Build headline findings (quotable, standalone sentences)
  const headlineFindings: string[] = [
    `The median AI operator scores Υ ${fmtY(s.medianY)}, ${s.wastePct}% below the top decile (Υ ${fmtY(s.topDecile)}).`,
    `The top-ranked operator (${s.topEntry?.anonId ?? "—"}) achieves Υ ${fmtY(s.topYield)}, ${s.gap.toFixed(1)}× the median.`,
    s.topPlatform
      ? `${s.topPlatform.platform} operators lead on yield, averaging Υ ${fmtY(s.topPlatform.avgYield)} vs. Υ ${fmtY(s.otherPlatformsAvg)} elsewhere.`
      : "Platform breakdown unavailable.",
    `Across all ranked operators, ${s.cachePct}% of input tokens are served from cache on average.`,
  ];

  // BibTeX citation string
  const bibtex = `@misc{sigrank_${report.slug.replace("-", "_")},
  title = {${report.title}},
  author = {McHenry, Deric J.},
  year = {${report.datePublished.slice(0, 4)}},
  month = {${new Date(report.datePublished).toLocaleDateString("en-US", { month: "short" }).toLowerCase()}},
  howpublished = {\\url{https://signalaf.com/research/${report.slug}}},
  note = {Data as of ${s.asOf}. License: CC-BY-4.0.},
}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          sigrankDataset({ updated: s.snapshotDate }),
          researchArticle({
            slug: report.slug,
            title: report.title,
            description: report.description,
            datePublished: report.datePublished,
            headlineFindings,
            doi: report.doi,
          }),
          breadcrumb([
            { name: "Research", path: "/research" },
            { name: report.quarter, path: `/research/${report.slug}` },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="📊 SigRank Quarterly Report"
        terminalText="RESEARCH"
        title={report.quarter}
        subtitle={
          <>
            State of AI Operator Token Efficiency. Frozen snapshot —{" "}
            {s.operatorCount} operators, {s.platformStats.length} platforms.
            Data as of {s.asOf}.
          </>
        }
      />

      {/* ── Headline findings ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Headline Findings
        </h2>
        <ol className="flex flex-col gap-4">
          {headlineFindings.map((finding, i) => (
            <li key={i} className="flex gap-3 text-base text-text-secondary">
              <span className="font-mono text-lg font-bold text-gold">
                {i + 1}.
              </span>
              <span>
                {finding}{" "}
                <span className="text-sm text-text-muted">({monthYear})</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Platform breakdown ────────────────────────────────────────── */}
      {s.platformStats.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            Platform Breakdown
          </h2>
          <div className="overflow-hidden rounded-lg border border-bg-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border bg-bg-surface">
                  <th className="px-4 py-2 text-left font-mono text-xs uppercase tracking-wide text-text-dim">
                    Platform
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-xs uppercase tracking-wide text-text-dim">
                    Operators
                  </th>
                  <th className="px-4 py-2 text-right font-mono text-xs uppercase tracking-wide text-text-dim">
                    Avg Yield (Υ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {s.platformStats.map((p) => (
                  <tr
                    key={p.platform}
                    className="border-b border-bg-border-subtle last:border-0"
                  >
                    <td className="px-4 py-2 capitalize text-text-primary">
                      {p.platform}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-text-secondary">
                      {p.count}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-mono text-gold">
                      {fmtY(p.avgYield)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Methodology ───────────────────────────────────────────────── */}
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
          <a
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            /methodology
          </a>
          .
        </p>
      </section>

      {/* ── Cite this report ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Cite this report
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="font-mono text-sm text-text-secondary">
            &ldquo;According to the SigRank Index ({report.quarter}),{" "}
            {headlineFindings[0].replace(/\.$/, "")}.&rdquo;
          </p>
          <p className="mt-2 font-mono text-xs text-text-muted">
            signalaf.com/research/{report.slug}
          </p>
        </div>

        {/* BibTeX */}
        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-text-dim">
            BibTeX
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-text-secondary">
{bibtex}
          </pre>
        </div>
      </section>

      {/* ── Data availability ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Data availability
        </h2>
        <p className="text-base text-text-secondary">
          Data available from the{" "}
          <a
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            SigRank Index
          </a>{" "}
          (signalaf.com/methodology), licensed{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-gold underline underline-offset-2"
            rel="license"
          >
            CC-BY-4.0
          </a>
          . Figures in this report are frozen as of {s.asOf} — see the{" "}
          <a
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            methodology page
          </a>{" "}
          for computation details and the live leaderboard for current data.
          {report.doi && (
            <>
              {" "}
              DOI:{" "}
              <a
                href={`https://doi.org/${report.doi}`}
                className="text-gold underline underline-offset-2"
              >
                {report.doi}
              </a>
              .
            </>
          )}
        </p>
      </section>

      {/* ── License ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          License
        </h2>
        <p className="text-base text-text-secondary">
          This report is licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-gold underline underline-offset-2"
            rel="license"
          >
            CC-BY-4.0
          </a>
          . Attribution required — cite as shown above.
        </p>
      </section>
    </div>
  );
}
