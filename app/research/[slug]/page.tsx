/**
 * app/research/[slug]/page.tsx — quarterly research reports (WS1 Part C).
 *
 * The citation magnet: original findings on a cadence, server-rendered from
 * the real leaderboard API. This is what Kantar/YouGov do to win citations —
 * publish original data, then pitch the headline stat.
 *
 * Each report is a standalone page with:
 * - Headline findings (quotable, dated, standalone sentences)
 * - Methodology link
 * - Cite-this-report block
 * - ScholarlyArticle + Dataset + Breadcrumb JSON-LD
 *
 * Currently one report: Q1 2026 (the inaugural). Add more by extending
 * REPORTS below + the report's compute function.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLeaderboard } from "@/lib/data";
import { toEntry } from "@/lib/leaderboard/to-entry";
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

// ISR: revalidate daily so figures stay current within the quarter.
export const revalidate = 86400;

/** Format yield for display. */
function fmtY(y: number): string {
  if (y >= 1_000_000) return `${(y / 1_000_000).toFixed(2)}M`;
  if (y >= 1_000) return `${(y / 1_000).toFixed(1)}K`;
  return Math.round(y).toLocaleString("en-US");
}

/** Compute report stats from the all-time leaderboard. */
function computeStats(entries: ReturnType<typeof toEntry>[]) {
  const ranked = entries.filter(
    (e) => e.yield_ !== null && e.yield_ !== undefined,
  );
  const yields = ranked.map((e) => e.yield_!).sort((a, b) => a - b);

  const n = yields.length;
  const topYield = n > 0 ? yields[n - 1] : 0;
  const medianY =
    n > 0
      ? n % 2 === 0
        ? (yields[n / 2 - 1] + yields[n / 2]) / 2
        : yields[Math.floor(n / 2)]
      : 0;
  const topDecile = n > 0 ? yields[Math.floor(n * 0.9)] : 0;
  const bottomDecile = n > 0 ? yields[Math.floor(n * 0.1)] : 0;

  // Efficiency gap: top vs median (how many times better)
  const gap = medianY > 0 ? topYield / medianY : 0;

  // Waste: how much lower is the median vs the top decile (as %)
  const wastePct =
    topDecile > 0 ? Math.round((1 - medianY / topDecile) * 100) : 0;

  // Per-platform breakdown
  const platformMap = new Map<string, { yields: number[]; count: number }>();
  for (const e of ranked) {
    const p = e.platform ?? "other";
    const entry = platformMap.get(p) ?? { yields: [], count: 0 };
    entry.yields.push(e.yield_!);
    entry.count++;
    platformMap.set(p, entry);
  }

  const platformStats = Array.from(platformMap.entries())
    .map(([platform, { yields: ys, count }]) => {
      const avg = ys.reduce((s, y) => s + y, 0) / ys.length;
      return { platform, avgYield: avg, count };
    })
    .sort((a, b) => b.avgYield - a.avgYield);

  const topPlatform = platformStats[0] ?? null;
  const otherPlatformsAvg =
    platformStats.length > 1
      ? platformStats.slice(1).reduce((s, p) => s + p.avgYield, 0) /
        (platformStats.length - 1)
      : 0;

  // Cache utilization
  const avgSnr =
    ranked.length > 0
      ? ranked.reduce((s, e) => s + (e.snr ?? 0), 0) / ranked.length
      : 0;
  const cachePct = Math.round(avgSnr * 100);

  // Top operator
  const topEntry =
    ranked.length > 0
      ? ranked.reduce((best, e) => (e.yield_! > best.yield_! ? e : best))
      : null;

  return {
    n,
    topYield,
    medianY,
    topDecile,
    bottomDecile,
    gap,
    wastePct,
    platformStats,
    topPlatform,
    otherPlatformsAvg,
    cachePct,
    topEntry,
    operatorCount: entries.length,
  };
}

export default async function ResearchReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = REPORTS.find((r) => r.slug === slug);
  if (!report) notFound();

  // Fetch all-time data for real stats
  const rows = await getLeaderboard({ window: "all_time", windowFilter: true });
  const entries = rows.map(toEntry);
  const s = computeStats(entries);

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          sigrankDataset({ updated: new Date().toISOString() }),
          researchArticle({
            slug: report.slug,
            title: report.title,
            description: report.description,
            datePublished: report.datePublished,
            headlineFindings,
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
            State of AI Operator Token Efficiency. Computed from live operator
            telemetry — {s.operatorCount} operators, {s.platformStats.length}{" "}
            platforms.
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
