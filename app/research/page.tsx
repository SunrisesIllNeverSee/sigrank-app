/**
 * app/research/page.tsx — State of the Index: an introduction to the AI
 * operator token-efficiency landscape.
 *
 * The dataset is the current seeded operator corpus, anonymized: every
 * operator is identified only by a `signal-##########` pseudonym (SHA-256 of
 * their codename, truncated). No codenames, no display names, no handles.
 *
 * Three tables are rendered:
 *  1. User totals (raw) — the four token pillars + total per operator
 *  2. User totals (metrics) — derived cascade metrics per operator
 *  3. Platforms (aggregate) — summed token counts per platform
 *
 * CSV downloads are served from /research/csv/[table].
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/data";
import { toEntry } from "@/lib/leaderboard/to-entry";
import { signalId } from "@/lib/research/anonymize";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, sigrankDataset, researchArticle } from "@/lib/jsonld";

export const revalidate = 3600; // 1h — the seed corpus is stable

export const metadata: Metadata = withOG({
  title: "State of the Index — AI Operator Token Efficiency",
  description:
    "An introduction to the AI operator token-efficiency landscape. Anonymized operator-level raw token counts, derived cascade metrics, and per-platform aggregates from the SigRank Index.",
  path: "/research",
});

// ── Types ──────────────────────────────────────────────────────────────

interface RawRow {
  signalId: string;
  platform: string;
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
}

interface MetricsRow {
  signalId: string;
  platform: string;
  classTier: string;
  yield: number | null;
  leverage: number | null;
  dev10x: number | null;
  costPerMillion: number | null;
  snr: number | null;
  velocity: number | null;
  scaleV: number | null;
}

type Nullable = number | null | undefined;

interface PlatformRow {
  platform: string;
  operatorCount: number;
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function fmtY(y: number | null): string {
  if (y === null) return "—";
  if (y >= 1_000_000) return `${(y / 1_000_000).toFixed(2)}M`;
  if (y >= 1_000) return `${(y / 1_000).toFixed(1)}K`;
  if (y >= 1) return y.toFixed(2);
  return y.toFixed(4);
}

function fmtMetric(v: number | null, decimals = 2): string {
  if (v === null) return "—";
  return v.toFixed(decimals);
}

// ── Data ───────────────────────────────────────────────────────────────

async function loadIndexData() {
  const rows = await getLeaderboard({ window: "all_time", windowFilter: true });
  const entries = rows.map(toEntry);

  const rawRows: RawRow[] = [];
  const metricsRows: MetricsRow[] = [];
  const platformMap = new Map<string, PlatformRow>();

  for (const e of entries) {
    const id = signalId(e.codename);
    const platform = e.platform ?? "other";
    const input = e.input ?? 0;
    const output = e.output ?? 0;
    const cacheCreation = e.cacheWrite ?? 0;
    const cacheRead = e.cacheRead ?? 0;
    const total = input + output + cacheCreation + cacheRead;

    rawRows.push({ signalId: id, platform, input, output, cacheCreation, cacheRead, total });

    metricsRows.push({
      signalId: id,
      platform,
      classTier: e.signalClass ?? "—",
      yield: (e.yield_ as Nullable) ?? null,
      leverage: (e.leverage as Nullable) ?? null,
      dev10x: (e.dev10x as Nullable) ?? null,
      costPerMillion: (e.costPerMillion as Nullable) ?? null,
      snr: (e.snr as Nullable) ?? null,
      velocity: (e.velocity as Nullable) ?? null,
      scaleV: (e.scaleV as Nullable) ?? null,
    });

    const p = platformMap.get(platform) ?? {
      platform,
      operatorCount: 0,
      input: 0,
      output: 0,
      cacheCreation: 0,
      cacheRead: 0,
      total: 0,
    };
    p.operatorCount++;
    p.input += input;
    p.output += output;
    p.cacheCreation += cacheCreation;
    p.cacheRead += cacheRead;
    p.total += total;
    platformMap.set(platform, p);
  }

  const platformRows = Array.from(platformMap.values()).sort((a, b) => b.total - a.total);

  return { rawRows, metricsRows, platformRows, operatorCount: entries.length };
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function StateOfTheIndexPage() {
  const { rawRows, metricsRows, platformRows, operatorCount } = await loadIndexData();
  const snapshotDate = new Date().toISOString().slice(0, 10);

  // Intro stats
  const totalInput = platformRows.reduce((s, p) => s + p.input, 0);
  const totalOutput = platformRows.reduce((s, p) => s + p.output, 0);
  const totalCacheRead = platformRows.reduce((s, p) => s + p.cacheRead, 0);
  const totalTokens = platformRows.reduce((s, p) => s + p.total, 0);
  const cachePct = totalTokens > 0 ? Math.round((totalCacheRead / totalTokens) * 100) : 0;

  const headlineFindings = [
    `${operatorCount.toLocaleString("en-US")} anonymized operators across ${platformRows.length} platforms.`,
    `${fmt(totalTokens)} total tokens observed (${fmt(totalInput)} input, ${fmt(totalOutput)} output, ${fmt(totalCacheRead)} cache read).`,
    `${cachePct}% of all tokens are served from cache — the cascade economy in aggregate.`,
    `Dataset licensed CC-BY-4.0. Each operator identified only as signal-##########.`,
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
              "An introduction to the AI operator token-efficiency landscape. Anonymized operator-level raw token counts, derived cascade metrics, and per-platform aggregates.",
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
            {platformRows.length} platforms. Data as of {snapshotDate}.
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
          This is the baseline: a snapshot of the seeded operator corpus,
          anonymized. Each operator is identified only as{" "}
          <code className="font-mono text-sm text-gold">signal-##########</code>{" "}
          — a deterministic pseudonym with no reversible mapping to any
          codename, display name, or handle. The dataset is available for
          download as CSV under CC-BY-4.0.
        </p>
      </section>

      {/* ── Headline stats ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Operators" value={operatorCount.toLocaleString("en-US")} />
        <StatCard label="Platforms" value={String(platformRows.length)} />
        <StatCard label="Total tokens" value={fmt(totalTokens)} />
        <StatCard label="Cache %" value={`${cachePct}%`} />
      </section>

      {/* ── Table 1: Platforms (aggregate) ───────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            Platform Aggregates
          </h2>
          <Link
            href="/research/csv/platforms"
            className="font-mono text-xs text-gold underline underline-offset-2"
          >
            Download CSV →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-bg-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-surface">
                <Th>Platform</Th>
                <Th right>Operators</Th>
                <Th right>Input</Th>
                <Th right>Output</Th>
                <Th right>Cache Create</Th>
                <Th right>Cache Read</Th>
                <Th right>Total</Th>
              </tr>
            </thead>
            <tbody>
              {platformRows.map((p) => (
                <tr key={p.platform} className="border-b border-bg-border-subtle last:border-0">
                  <td className="px-4 py-2 capitalize text-text-primary">{p.platform}</td>
                  <Td right tabular>{p.operatorCount.toLocaleString("en-US")}</Td>
                  <Td right tabular>{fmt(p.input)}</Td>
                  <Td right tabular>{fmt(p.output)}</Td>
                  <Td right tabular>{fmt(p.cacheCreation)}</Td>
                  <Td right tabular>{fmt(p.cacheRead)}</Td>
                  <Td right tabular>{fmt(p.total)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Table 2: User totals (raw) ──────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            User Totals — Raw Token Counts
          </h2>
          <Link
            href="/research/csv/raw"
            className="font-mono text-xs text-gold underline underline-offset-2"
          >
            Download CSV →
          </Link>
        </div>
        <p className="text-sm text-text-muted">
          {rawRows.length.toLocaleString("en-US")} operators. Each identified as
          {" "}<code className="font-mono text-xs text-gold">signal-##########</code>.
          Showing first 50 — download CSV for the full dataset.
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-surface">
                <Th>Signal ID</Th>
                <Th>Platform</Th>
                <Th right>Input</Th>
                <Th right>Output</Th>
                <Th right>Cache Create</Th>
                <Th right>Cache Read</Th>
                <Th right>Total</Th>
              </tr>
            </thead>
            <tbody>
              {rawRows.slice(0, 50).map((r) => (
                <tr key={r.signalId} className="border-b border-bg-border-subtle last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-text-secondary">{r.signalId}</td>
                  <td className="px-4 py-2 capitalize text-text-primary">{r.platform}</td>
                  <Td right tabular>{fmt(r.input)}</Td>
                  <Td right tabular>{fmt(r.output)}</Td>
                  <Td right tabular>{fmt(r.cacheCreation)}</Td>
                  <Td right tabular>{fmt(r.cacheRead)}</Td>
                  <Td right tabular>{fmt(r.total)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Table 3: User totals (metrics) ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            User Totals — Cascade Metrics
          </h2>
          <Link
            href="/research/csv/metrics"
            className="font-mono text-xs text-gold underline underline-offset-2"
          >
            Download CSV →
          </Link>
        </div>
        <p className="text-sm text-text-muted">
          Derived metrics from the four token pillars. Showing first 50 —
          download CSV for the full dataset.
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-surface">
                <Th>Signal ID</Th>
                <Th>Platform</Th>
                <Th>Class</Th>
                <Th right>Υ Yield</Th>
                <Th right>Leverage</Th>
                <Th right>10xDEV</Th>
                <Th right>$/1M</Th>
                <Th right>SNR</Th>
                <Th right>Velocity</Th>
                <Th right>Scale V</Th>
              </tr>
            </thead>
            <tbody>
              {metricsRows.slice(0, 50).map((r) => (
                <tr key={r.signalId} className="border-b border-bg-border-subtle last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-text-secondary">{r.signalId}</td>
                  <td className="px-4 py-2 capitalize text-text-primary">{r.platform}</td>
                  <td className="px-4 py-2 text-text-secondary">{r.classTier}</td>
                  <Td right tabular gold>{fmtY(r.yield)}</Td>
                  <Td right tabular>{fmtMetric(r.leverage, 1)}</Td>
                  <Td right tabular>{fmtMetric(r.dev10x, 2)}</Td>
                  <Td right tabular>{fmtMetric(r.costPerMillion, 2)}</Td>
                  <Td right tabular>{fmtMetric(r.snr, 4)}</Td>
                  <Td right tabular>{fmtMetric(r.velocity, 2)}</Td>
                  <Td right tabular>{fmtMetric(r.scaleV, 2)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* ── Data availability ───────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Data availability
        </h2>
        <p className="text-base text-text-secondary">
          CSV downloads available:{" "}
          <Link href="/research/csv/raw" className="text-gold underline underline-offset-2">raw token counts</Link>
          ,{" "}
          <Link href="/research/csv/metrics" className="text-gold underline underline-offset-2">cascade metrics</Link>
          ,{" "}
          <Link href="/research/csv/platforms" className="text-gold underline underline-offset-2">platform aggregates</Link>
          . Licensed{" "}
          <Link
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-gold underline underline-offset-2"
            rel="license"
          >
            CC-BY-4.0
          </Link>
          . Attribution required — cite as shown above. See the{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            methodology page
          </Link>{" "}
          for computation details and the live leaderboard for current data.
        </p>
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

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-dim ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  tabular,
  gold,
}: {
  children: React.ReactNode;
  right?: boolean;
  tabular?: boolean;
  gold?: boolean;
}) {
  return (
    <td
      className={`px-4 py-2 ${right ? "text-right" : ""} ${
        tabular ? "tabular-nums" : ""
      } ${gold ? "font-mono text-gold" : "text-text-secondary"}`}
    >
      {children}
    </td>
  );
}
