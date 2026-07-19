/**
 * app/research/page.tsx — State of the Index: an introduction to the AI
 * operator token-efficiency landscape.
 *
 * This is the baseline opening — the top-line numbers only. The full
 * operator-level dataset (raw token counts, derived metrics, per-platform
 * breakdowns) will be released once it is documented and cited on Zenodo.
 * Until then, this page presents the situation in aggregate.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/data";
import { toEntry } from "@/lib/leaderboard/to-entry";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, sigrankDataset, researchArticle } from "@/lib/jsonld";

export const revalidate = 3600; // 1h — the seed corpus is stable

export const metadata: Metadata = withOG({
  title: "State of the Index — AI Operator Token Efficiency",
  description:
    "An introduction to the AI operator token-efficiency landscape. Aggregate stats from the SigRank Index — operator count, platform breakdown, total tokens observed.",
  path: "/research",
});

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

// ── Data ───────────────────────────────────────────────────────────────

async function loadIndexStats() {
  const rows = await getLeaderboard({ window: "all_time", windowFilter: true });
  const entries = rows.map(toEntry);

  const platformSet = new Set<string>();
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalTokens = 0;

  for (const e of entries) {
    const platform = e.platform ?? "other";
    platformSet.add(platform);
    const input = e.input ?? 0;
    const output = e.output ?? 0;
    const cacheWrite = e.cacheWrite ?? 0;
    const cacheRead = e.cacheRead ?? 0;
    totalInput += input;
    totalOutput += output;
    totalCacheRead += cacheRead;
    totalTokens += input + output + cacheWrite + cacheRead;
  }

  return {
    operatorCount: entries.length,
    platformCount: platformSet.size,
    totalInput,
    totalOutput,
    totalCacheRead,
    totalTokens,
  };
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function StateOfTheIndexPage() {
  const { operatorCount, platformCount, totalTokens, totalInput, totalOutput, totalCacheRead } =
    await loadIndexStats();
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const cachePct = totalTokens > 0 ? Math.round((totalCacheRead / totalTokens) * 100) : 0;

  const headlineFindings = [
    `${operatorCount.toLocaleString("en-US")} anonymized operators across ${platformCount} platforms.`,
    `${fmt(totalTokens)} total tokens observed (${fmt(totalInput)} input, ${fmt(totalOutput)} output, ${fmt(totalCacheRead)} cache read).`,
    `${cachePct}% of all tokens are served from cache — the cascade economy in aggregate.`,
  ];

  const bibtex = `@misc{sigrank_index_${snapshotDate.replace(/-/g, "")},
  title = {SigRank Index — State of the Index (${snapshotDate})},
  author = {McHenry, Deric J.},
  year = {${snapshotDate.slice(0, 4)}},
  month = {${new Date().toLocaleDateString("en-US", { month: "short" }).toLowerCase()}},
  howpublished = {\\url{https://signalaf.com/research}},
  note = {Anonymized operator-level token telemetry. License: CC-BY-4.0.},
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
              "An introduction to the AI operator token-efficiency landscape. Aggregate stats from the SigRank Index.",
            datePublished: snapshotDate,
            headlineFindings,
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
            {platformCount} platforms. Data as of {snapshotDate}.
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
          This is the baseline: a snapshot of the current operator corpus,
          presented in aggregate. The full operator-level dataset — anonymized
          raw token counts, derived cascade metrics, and per-platform breakdowns
          — will be released once it is documented and cited on Zenodo.
        </p>
      </section>

      {/* ── Headline stats ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Operators" value={operatorCount.toLocaleString("en-US")} />
        <StatCard label="Platforms" value={String(platformCount)} />
        <StatCard label="Total tokens" value={fmt(totalTokens)} />
        <StatCard label="Cache %" value={`${cachePct}%`} />
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
            &ldquo;SigRank Index — State of the Index ({snapshotDate}).{" "}
            {operatorCount.toLocaleString("en-US")} anonymized operators.{" "}
            signalaf.com/research&rdquo;
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
