"use client";

import { useState } from "react";

const inputClass = "w-full rounded-lg border border-bg-border bg-bg-base px-4 py-2.5 text-text-primary placeholder:text-text-dim focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-text-secondary";
const buttonClass = "rounded-lg bg-gold px-5 py-2.5 font-semibold text-bg-base hover:bg-gold/90 disabled:opacity-50";

/**
 * ExchangeManageClient — single exchange detail + transition controls.
 * Accepts a publicId prop. Requires one of: proposer key, company key, domain agent key.
 */
export function ExchangeManageClient({ publicId }: { publicId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const headers: Record<string, string> = {};
    const proposerKey = form.get("proposerKey");
    const companyKey = form.get("companyKey");
    const domainAgentKey = form.get("domainAgentKey");
    if (proposerKey) headers["x-exchange-proposer-key"] = String(proposerKey);
    if (companyKey) headers["x-exchange-company-key"] = String(companyKey);
    if (domainAgentKey) headers["x-exchange-domain-agent-key"] = String(domainAgentKey);
    try {
      const res = await fetch(`/api/exchange/exchanges/${encodeURIComponent(publicId)}`, { headers });
      if (!res.ok) { setError("Authentication failed or exchange not found"); setData(null); }
      else { const d = await res.json(); setData(d); }
    } catch { setError("Network error"); }
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = String(form.get("message") || "");
    if (!text) return;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (data) {
      const actor = data.actor as string;
      if (actor === "proposer") headers["x-exchange-proposer-key"] = String((document.getElementById("proposerKey") as HTMLInputElement)?.value || "");
      if (actor === "company_admin") headers["x-exchange-company-key"] = String((document.getElementById("companyKey") as HTMLInputElement)?.value || "");
      if (actor === "domain_agent") headers["x-exchange-domain-agent-key"] = String((document.getElementById("domainAgentKey") as HTMLInputElement)?.value || "");
    }
    try {
      const res = await fetch(`/api/exchange/exchanges/${encodeURIComponent(publicId)}/messages`, { method: "POST", headers, body: JSON.stringify({ text }) });
      const d = await res.json();
      if (res.ok) { setMessage("Sent"); (e.target as HTMLFormElement).reset(); }
      else { setMessage(d.error || "Failed"); }
    } catch { setMessage("Network error"); }
  }

  if (!data) {
    return (
      <form onSubmit={load} className="max-w-md space-y-4">
        <p className="text-sm text-text-muted">Exchange: <span className="font-mono text-gold">{publicId}</span></p>
        <div><label className={labelClass}>Proposer key (if you proposed)</label><input className={inputClass} id="proposerKey" name="proposerKey" type="password" /></div>
        <div><label className={labelClass}>Company admin key (if you are the domain)</label><input className={inputClass} id="companyKey" name="companyKey" type="password" /></div>
        <div><label className={labelClass}>Domain agent key (if you are the agent)</label><input className={inputClass} id="domainAgentKey" name="domainAgentKey" type="password" /></div>
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        <button className={buttonClass} type="submit" disabled={loading}>{loading ? "Loading..." : "Open exchange"}</button>
      </form>
    );
  }

  const exchange = data.exchange as Record<string, unknown>;
  const events = (data.events as Record<string, unknown>[]) || [];
  const settlement = data.settlement as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{exchange.title as string}</h2>
          <span className="rounded px-3 py-1 text-sm bg-gold/10 text-gold">{exchange.state as string}</span>
        </div>
        <p className="mt-2 font-mono text-sm text-text-muted">{exchange.public_id as string}</p>
        <p className="mt-1 text-sm text-text-secondary">{exchange.kind as string} → {exchange.target_domain as string}</p>
        {exchange.terms_hash ? <p className="mt-2 text-xs text-text-dim">Terms hash: <span className="font-mono">{String(exchange.terms_hash)}</span></p> : null}
      </div>

      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">Send a message</h3>
        <form onSubmit={sendMessage} className="mt-3 space-y-3">
          <textarea className={inputClass} name="message" rows={3} placeholder="Message the counterparty..." required minLength={1} maxLength={10000} />
          <button className={buttonClass} type="submit">Send</button>
          {message && <p className="text-sm text-text-muted">{message}</p>}
        </form>
      </div>

      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h3 className="text-lg font-semibold text-text-primary">Event log ({events.length})</h3>
        <div className="mt-3 space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="rounded-lg border border-bg-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-gold">{ev.event_type as string}</span>
                <span className="text-xs text-text-dim">{new Date(String(ev.created_at)).toLocaleString()}</span>
              </div>
              {ev.from_state && ev.to_state ? <p className="mt-1 text-xs text-text-muted">{String(ev.from_state)} → {String(ev.to_state)}</p> : null}
            </div>
          ))}
        </div>
      </div>

      {settlement && (
        <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
          <h3 className="text-lg font-semibold text-text-primary">Settlement</h3>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-text-dim">Status:</span> <span className="text-text-primary">{settlement.status as string}</span></div>
            <div><span className="text-text-dim">Gross:</span> <span className="text-text-primary">${Number(settlement.gross_cents ?? 0) / 100}</span></div>
            <div><span className="text-text-dim">Fee:</span> <span className="text-text-primary">${Number(settlement.platform_fee_cents ?? 0) / 100}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
