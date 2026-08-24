"use client";

import { useState } from "react";

const inputClass = "w-full rounded-lg border border-bg-border bg-bg-base px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-text-secondary";
const buttonClass = "rounded-lg bg-gold px-5 py-2.5 font-semibold text-bg-base hover:bg-gold/90 disabled:opacity-50";

/**
 * ExchangeControlClient — human governance panel for a domain's exchange policy.
 * Requires a company admin key to read/update.
 */
export function ExchangeControlClient() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function load(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const domain = String(form.get("domain"));
    const key = String(form.get("key"));
    try {
      const res = await fetch(`/api/exchange/companies/control?domain=${encodeURIComponent(domain)}`, { headers: { "x-exchange-company-key": key } });
      if (!res.ok) { setError("Authentication failed or domain not found"); setAuthed(false); }
      else { const d = await res.json(); setData(d); setAuthed(true); }
    } catch { setError("Network error"); }
    setLoading(false);
  }

  if (!authed) {
    return (
      <form onSubmit={load} className="max-w-md space-y-4">
        <div><label className={labelClass}>Domain</label><input className={inputClass} name="domain" defaultValue="signalaf.com" required /></div>
        <div><label className={labelClass}>Company admin key</label><input className={inputClass} name="key" type="password" required /></div>
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        <button className={buttonClass} type="submit" disabled={loading}>{loading ? "Loading..." : "Open control panel"}</button>
      </form>
    );
  }

  const company = data?.company as Record<string, unknown> | undefined;
  const escalations = (data?.escalations as Record<string, unknown>[]) || [];
  const activity = (data?.activity as Record<string, unknown>[]) || [];
  const economics = data?.economics as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="text-xl font-semibold text-text-primary">{company?.legal_name as string ?? "Company"}</h2>
        <p className="mt-1 text-text-muted">{company?.domain as string}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-text-dim">Agent mode:</span> <span className="text-text-primary">{company?.agent_mode as string}</span></div>
          <div><span className="text-text-dim">Transactions:</span> <span className={company?.transaction_enabled ? "text-gold" : "text-text-muted"}>{company?.transaction_enabled ? "enabled" : "private-alpha gated"}</span></div>
        </div>
      </div>

      {escalations.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-6">
          <h3 className="text-lg font-semibold text-gold">Escalations ({escalations.length})</h3>
          <div className="mt-3 space-y-2">
            {escalations.slice(0, 10).map((esc, i) => (
              <div key={i} className="rounded-lg border border-bg-border p-3 text-sm">
                <span className="font-mono text-gold">{esc.public_id as string}</span>
                <span className="ml-2 text-text-secondary">{esc.title as string}</span>
                <div className="mt-1 text-xs text-text-muted">Reasons: {Array.isArray(esc.escalation_reasons) ? esc.escalation_reasons.join(", ") : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">Recent activity ({activity.length})</h3>
        <div className="mt-3 space-y-2">
          {activity.length === 0 && <p className="text-sm text-text-muted">No exchanges yet.</p>}
          {activity.slice(0, 20).map((x, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-bg-border p-3 text-sm">
              <div>
                <span className="font-mono text-gold">{x.public_id as string}</span>
                <span className="ml-2 text-text-secondary">{x.title as string}</span>
              </div>
              <span className="rounded px-2 py-0.5 text-xs bg-bg-base text-text-muted">{x.state as string}</span>
            </div>
          ))}
        </div>
      </div>

      {economics && (
        <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
          <h3 className="text-lg font-semibold text-text-primary">Economics</h3>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-text-dim">Settled:</span> <span className="text-text-primary">{String(economics.settled_count ?? 0)}</span></div>
            <div><span className="text-text-dim">Gross:</span> <span className="text-text-primary">${Number(economics.gross_cents ?? 0) / 100}</span></div>
            <div><span className="text-text-dim">Platform fees:</span> <span className="text-text-primary">${Number(economics.platform_fee_cents ?? 0) / 100}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
