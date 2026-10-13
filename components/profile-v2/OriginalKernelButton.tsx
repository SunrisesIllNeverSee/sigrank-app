"use client";

import { useState } from "react";

interface OriginalKernel {
  submissionId: string;
  submittedAt: string;
  snapshotHash: string | null;
  source: string;
  kernel: unknown;
}

/** Authenticated owner inspection only. Public Raw/Metrics table remains
 * unchanged; private submitted metadata is fetched only on deliberate click. */
export function OriginalKernelButton({ codename, submissionId }: { codename: string; submissionId: string }) {
  const [data, setData] = useState<OriginalKernel | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const open = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/v1/operators/${encodeURIComponent(codename)}/submissions/${encodeURIComponent(submissionId)}/kernel`, { cache: "no-store" });
      if (!r.ok) throw Error(r.status === 404 ? "Original kernel unavailable" : "Unable to read original kernel");
      setData(await r.json() as OriginalKernel);
    } catch (e) { setError(e instanceof Error ? e.message : "Unavailable"); }
    finally { setLoading(false); }
  };
  return <>
    <button type="button" disabled={loading} onClick={open}
      className="rounded border border-bg-border px-2 py-1 text-[10px] text-gold hover:border-gold">
      {loading ? "LOADING" : "KERNEL ↗"}
    </button>
    {error && <span role="alert" className="block text-[10px] text-red-400">{error}</span>}
    {data && <div role="dialog" aria-modal="true" aria-label="Original submitted kernel"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onKeyDown={(e) => { if (e.key === "Escape") setData(null); }}>
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded border border-gold/40 bg-bg-surface p-5 text-left shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><h3 className="text-sm font-bold text-gold">ORIGINAL SUBMITTED KERNEL</h3>
            <p className="mt-1 text-[10px] text-text-muted">{data.submittedAt} · {data.source}</p>
            <p className="mt-1 break-all text-[10px] text-text-muted">Snapshot hash: {data.snapshotHash ?? "not available"}</p></div>
          <button type="button" autoFocus className="rounded border border-gold px-3 py-1 text-gold" onClick={() => setData(null)}>CLOSE ✕</button>
        </div>
        <p className="mb-2 text-xs text-text-muted">This original JSON may include private submission metadata. It is visible only in your authenticated session and is not rendered on public profiles.</p>
        {(() => {
          const payload = data.kernel && typeof data.kernel === "object" && !Array.isArray(data.kernel)
            ? data.kernel as Record<string, unknown> : {};
          const submittedRaw = { original_pillars: payload.original_pillars ?? null, raw_telemetry: payload.raw_telemetry ?? null, reparsed_pillars: payload.reparsed_pillars ?? null };
          const submittedMetrics = { core_metrics: payload.core_metrics ?? null, background_metrics: payload.background_metrics ?? null, cascade: payload.cascade ?? null };
          return <>
            <h4 className="mt-3 mb-1 text-xs font-bold text-gold">RAW · AS SUBMITTED</h4>
            <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all border border-bg-border bg-bg-base p-3 text-[11px] text-text-secondary">{JSON.stringify(submittedRaw, null, 2)}</pre>
            <h4 className="mt-3 mb-1 text-xs font-bold text-gold">METRICS · AS SUBMITTED</h4>
            <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all border border-bg-border bg-bg-base p-3 text-[11px] text-text-secondary">{JSON.stringify(submittedMetrics, null, 2)}</pre>
          </>;
        })()}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gold">FULL ORIGINAL JSON · PRIVATE METADATA INCLUDED</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all border border-bg-border bg-bg-base p-4 text-[11px] text-text-secondary">{JSON.stringify(data.kernel, null, 2)}</pre>
        </details>
      </div>
    </div>}
  </>;
}
