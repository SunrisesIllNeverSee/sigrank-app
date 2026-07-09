/**
 * app/research/page.tsx — index for quarterly research reports.
 *
 * Lists published reports. Currently one: Q1 2026 (the inaugural).
 * As more quarters ship, they're added to REPORTS below.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Research",
  description:
    "SigRank quarterly reports on AI operator token efficiency. Original findings computed from live operator telemetry — the citation source for AI efficiency data.",
  path: "/research",
});

interface ReportListing {
  slug: string;
  title: string;
  description: string;
  date: string;
  quarter: string;
}

const REPORTS: ReportListing[] = [
  {
    slug: "q1-2026",
    title: "State of AI Operator Token Efficiency — Q1 2026",
    description:
      "The inaugural SigRank Index report. Median vs. top-decile yield gaps, platform leadership, cache utilization, and the efficiency frontier.",
    date: "2026-06-30",
    quarter: "Q1 2026",
  },
];

export default function ResearchIndexPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd data={breadcrumb([{ name: "Research", path: "/research" }])} />

      <WaveHero
        eyebrow="📊 SigRank Research"
        terminalText="REPORTS"
        title="Quarterly Reports"
        subtitle={
          <>
            Original findings on AI operator token efficiency, computed from
            live telemetry. The citation source for AI efficiency data.
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Published Reports
        </h2>
        <div className="flex flex-col gap-4">
          {REPORTS.map((report) => (
            <Link
              key={report.slug}
              href={`/research/${report.slug}`}
              className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface px-5 py-4 transition-colors hover:border-gold/40 hover:bg-bg-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-gold">
                  {report.quarter}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  {report.date}
                </span>
              </div>
              <h3 className="text-base font-semibold text-text-primary group-hover:text-gold">
                {report.title}
              </h3>
              <p className="text-sm text-text-secondary">
                {report.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
