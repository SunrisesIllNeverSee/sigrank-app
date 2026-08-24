"use client";

import { useState } from "react";

const inputClass = "w-full rounded-lg border border-bg-border bg-bg-base px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-text-secondary";
const buttonClass = "rounded-lg bg-gold px-5 py-2.5 font-semibold text-bg-base hover:bg-gold/90 disabled:opacity-50";

/**
 * ExchangeInboxClient — lists exchanges for a domain.
 * Requires a company admin key or domain agent key.
 */
export function ExchangeInboxClient() {
  const [loading, setLoading] = useState(false);
  const [exchanges, setExchanges] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState("");

  async function load(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const domain = String(form.get("domain"));
    const key = String(form.get("key"));
    const header = form.get("keyType") === "domain_agent" ? "x-exchange-domain-agent-key" : "x-exchange-company-key";
    try {
      const res = await fetch(`/api/exchange/exchanges?domain=${encodeURIComponent(domain)}`, { headers: { [header]: key } });
      if (!res.ok) { setError("Authentication failed"); setExchanges(null); }
      else { const d = await res.json(); setExchanges(d.exchanges || []); }
    } catch { setError("Network error"); }
    setLoading(false);
  }

  if (exchanges === null) {
    return (
      <form onSubmit={load} className="max-w-md space-y-4">
        <div><label className={labelClass}>Domain</label><input className={inputClass} name="domain" defaultValue="signalaf.com" required /></div>
        <div><label className={labelClass}>Key type</label><select className={inputClass} name="keyType" defaultValue="company"><option value="company">Company admin key</option><option value="domain_agent">Domain agent key</option></select></div>
        <div><label className={labelClass}>Key</label><input className={inputClass} name="key" type="password" required /></div>
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        <button className={buttonClass} type="submit" disabled={loading}>{loading ? "Loading..." : "Open inbox"}</button>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">{exchanges.length} exchange(s)</p>
      {exchanges.length === 0 && <p className="text-text-muted">No exchanges yet.</p>}
      {exchanges.map((x, i) => (
        <a key={i} href={`/exchange/manage/${x.public_id}`} className="block rounded-lg border border-bg-border bg-bg-surface p-4 hover:border-gold/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gold">{x.public_id as string}</span>
            <span className="rounded px-2 py-0.5 text-xs bg-bg-base text-text-muted">{x.state as string}</span>
          </div>
          <p className="mt-1 text-text-primary">{x.title as string}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-dim">
            <span>{x.kind as string}</span>
            {Boolean(x.escalation_required) && <span className="text-gold">escalation required</span>}
            <span>{new Date(String(x.created_at)).toLocaleDateString()}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
