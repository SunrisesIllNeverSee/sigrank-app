"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  snapshot_id: string;
  submitted_at: string;
  platform: string;
  window: string;
  period_start: string;
  period_end: string;
  ruleset_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_write_tokens: number | null;
  cache_read_tokens: number | null;
  yield_: number | null;
  operating_ratio: string | null;
  processed_tokens_per_day: number | null;
  output_tokens_per_day: number | null;
  workflow_mode: "hitl" | "agentic" | null;
  workflow_evidence_url: string | null;
}

const fmt = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, notation: "compact" }).format(n);
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });

export function SnapshotHistory({ codename }: { codename: string }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function load(page: number) {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/operators/${encodeURIComponent(codename)}/snapshot-history?page=${page}`);
      if (!response.ok) throw new Error("history unavailable");
      const body = await response.json() as { entries: HistoryEntry[]; next_page: number | null };
      setEntries((current) => page === 0 ? body.entries : [...current, ...body.entries]);
      setNextPage(body.next_page);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(0); }, [codename]);

  return (
    <section className="mt-6 space-y-3" aria-label="Snapshot history">
      <h3 className="font-mono text-sm text-text-primary">Snapshot history</h3>
      {entries.map((entry) => (
        <article key={entry.snapshot_id} className="rounded-lg border border-bg-border bg-bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-text-primary">
            <strong>{entry.platform} · {entry.window}</strong>
            {entry.workflow_mode && <span className="rounded border border-bg-border px-2 py-0.5 uppercase">{entry.workflow_mode}</span>}
            <span className="text-text-secondary">Submitted {date(entry.submitted_at)}</span>
          </div>
          <p className="mt-2 font-mono text-xs text-text-secondary">
            Period {date(entry.period_start)}–{date(entry.period_end)} · Ruleset {entry.ruleset_version}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-text-primary sm:grid-cols-4">
            <span>I {fmt(entry.input_tokens)}</span><span>O {fmt(entry.output_tokens)}</span>
            <span>W {fmt(entry.cache_write_tokens)}</span><span>R {fmt(entry.cache_read_tokens)}</span>
          </div>
          <p className="mt-3 font-mono text-xs text-text-secondary">
            Υ {fmt(entry.yield_)} · Ratio {entry.operating_ratio ?? "—"} · Processed/day {fmt(entry.processed_tokens_per_day)} · Output/day {fmt(entry.output_tokens_per_day)}
          </p>
          {entry.workflow_mode === "agentic" && entry.workflow_evidence_url?.startsWith("https://") && (
            <a href={entry.workflow_evidence_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-gold underline">Workflow evidence ↗</a>
          )}
        </article>
      ))}
      {!loading && !error && entries.length === 0 && <p className="text-xs text-text-secondary">No public snapshot history yet.</p>}
      {error && <button type="button" onClick={() => void load(nextPage ?? 0)} className="text-xs text-gold underline">History unavailable. Retry</button>}
      {nextPage !== null && !loading && !error && entries.length > 0 && (
        <button type="button" onClick={() => void load(nextPage)} className="rounded border border-bg-border px-3 py-2 font-mono text-xs text-text-primary">Load more</button>
      )}
      {loading && <p className="text-xs text-text-secondary">Loading snapshots…</p>}
    </section>
  );
}
