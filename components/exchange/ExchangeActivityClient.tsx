"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * ExchangeActivityClient — observability dashboard for the Contribution Exchange.
 *
 * Fetches `/api/exchange/exchanges?domain=signalaf.com` (requires an auth key).
 * When the endpoint returns 401/403, shows an authentication-required placeholder
 * instead of raw data. Encounter data is also auth-gated. Lists the canonical
 * exchange states as a legend and links to the full governance panel.
 */

type ExchangeRow = {
  id: string;
  state: string;
  domain: string;
  title?: string;
  updatedAt?: string;
};

const EXCHANGE_STATES: { state: string; label: string }[] = [
  { state: "proposed", label: "Agent submitted a proposal" },
  { state: "negotiating", label: "Agents are negotiating terms" },
  { state: "committed", label: "Contribution Commitment frozen" },
  { state: "authorized", label: "Authority explicitly granted" },
  { state: "delivering", label: "Contribution being delivered" },
  { state: "verifying", label: "Delivery under verification" },
  { state: "settled", label: "Value distributed, lineage preserved" },
  { state: "rejected", label: "Proposal or exchange rejected" },
  { state: "expired", label: "Exchange expired without action" },
];

export function ExchangeActivityClient() {
  const [data, setData] = useState<ExchangeRow[] | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchExchanges() {
    setLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      const res = await fetch("/api/exchange/exchanges?domain=signalaf.com");
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        setData(null);
        return;
      }
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.exchanges ?? []);
    } catch {
      setError("Network error — could not reach the exchange API.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Auth-gated data panel */}
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xl font-semibold">Exchange feed</h2>
          <button
            onClick={fetchExchanges}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/50 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Fetch exchanges"}
          </button>
        </div>

        {authRequired && (
          <div className="mt-5 rounded-lg border border-gold/30 bg-gold/5 p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Authentication required to view exchange activity
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              The <code className="font-mono text-gold">/api/exchange/exchanges</code>{" "}
              endpoint requires an authenticated session or API key. Sign in or
              provide credentials to see live exchange data for signalaf.com.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-bg-border p-4 font-sans text-sm text-text-muted">
            {error}
          </div>
        )}

        {data && data.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left text-text-dim">
                  <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wide">
                    ID
                  </th>
                  <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wide">
                    State
                  </th>
                  <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wide">
                    Title
                  </th>
                  <th className="py-2 font-mono text-xs uppercase tracking-wide">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-bg-border-subtle hover:bg-bg-hover"
                  >
                    <td className="py-2 pr-4 font-mono text-xs text-gold">
                      <Link href={`/exchange/manage/${row.id}`}>{row.id}</Link>
                    </td>
                    <td className="py-2 pr-4 text-text-secondary">{row.state}</td>
                    <td className="py-2 pr-4 text-text-secondary">
                      {row.title ?? "—"}
                    </td>
                    <td className="py-2 text-text-dim">
                      {row.updatedAt ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.length === 0 && !authRequired && (
          <p className="mt-5 font-sans text-sm text-text-muted">
            No exchanges returned for signalaf.com.
          </p>
        )}

        {!data && !authRequired && !error && !loading && (
          <p className="mt-5 font-sans text-sm text-text-muted">
            Click <span className="text-gold">Fetch exchanges</span> to load live
            data. The endpoint requires authentication.
          </p>
        )}
      </div>

      {/* MCP observability data (auth-gated) */}
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-xl font-semibold">MCP observability</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          MCP and WebMCP call analytics (initializations, tool listings, tool
          calls, denials, rate limits, latency) are available via the
          observability API. This endpoint requires admin authentication.
          Data sources: Supabase (durable), PostHog (behavioral), Vercel
          (operational).
        </p>
        <div className="mt-4">
          <Link
            href="/api/exchange/observability/summary?period=7d"
            className="font-sans text-sm text-gold hover:text-text-primary"
          >
            View MCP observability summary (requires admin auth) →
          </Link>
        </div>
      </div>

      {/* Exchange state legend */}
      <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-xl font-semibold">Exchange state legend</h2>
        <p className="mt-3 font-sans text-sm text-text-muted">
          Every contribution exchange moves through these lifecycle states.
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {EXCHANGE_STATES.map(({ state, label }) => (
            <li
              key={state}
              className="flex items-start gap-3 rounded-lg border border-bg-border-subtle bg-bg-elevated p-3"
            >
              <span className="rounded border border-gold/30 px-2 py-0.5 font-mono text-xs text-gold">
                {state}
              </span>
              <span className="font-sans text-sm text-text-secondary">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Governance link */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
        <p className="font-sans text-sm text-text-secondary">
          Need to govern delegation policy, review escalations or inspect settled
          economics?{" "}
          <Link
            href="/exchange/control"
            className="font-mono text-gold hover:text-text-primary"
          >
            Open the full governance panel →
          </Link>
        </p>
      </div>
    </div>
  );
}
