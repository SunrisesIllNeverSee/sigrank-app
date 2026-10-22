import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { withOG, SITE_ORIGIN } from "@/lib/seo";
import { buildShareCard, type ShareCardMetrics } from "@/lib/share/mcp-card";

/**
 * app/share/mcp/page.tsx — shareable card for MCP tool results.
 *
 * The share_url format generated in tool outputs is:
 *   https://signalaf.com/share/mcp?t=<tool_name>&d=<url_encoded_json_params>
 *
 * This page reads `t` (tool name) + `d` (encoded JSON params), re-runs the tool
 * via the local /api/mcp JSON-RPC route, and renders a visual share card with
 * the headline cascade metrics + SigRank/SignalAF branding. The sibling
 * opengraph-image.tsx generates the social preview image.
 */

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ t?: string; d?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { t, d } = await searchParams;
  const card = await buildShareCard(t, d);

  if (!card.ok) {
    return withOG({
      title: "MCP Share — SignalAF",
      description: "This share link is invalid or the tool result could not be loaded.",
      path: "/share/mcp",
    });
  }

  const m = card;
  const metricBits = [
    m.yield ? `Υ ${m.yield}` : null,
    m.leverage ? `Leverage ${m.leverage}` : null,
    m.velocity ? `Velocity ${m.velocity}` : null,
    m.percentile ? `${m.percentile} percentile` : null,
    m.signalClass ? m.signalClass : null,
  ].filter(Boolean);
  const description =
    m.interpretation ??
    `${m.toolTitle}${metricBits.length ? ` — ${metricBits.join(" · ")}` : ""}`;

  return withOG({
    title: `${m.toolTitle} — SignalAF`,
    description,
    path: `/share/mcp?t=${encodeURIComponent(t ?? "")}&d=${encodeURIComponent(d ?? "")}`,
  });
}

// ── Metric cell ─────────────────────────────────────────────────────────────
function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | null;
  accent?: boolean;
}) {
  if (value == null) return null;
  return (
    <div className="flex flex-col gap-1 rounded-md border border-bg-border/60 bg-bg-surface/60 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </span>
      <span
        className={`font-mono text-2xl font-bold ${accent ? "text-gold" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ShareCard({ m }: { m: ShareCardMetrics }) {
  const hasMetrics =
    m.yield ??
    m.leverage ??
    m.velocity ??
    m.snr ??
    m.signalClass ??
    m.percentile ??
    m.rank;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header — tool title + class chip */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
          MCP Tool Result
        </p>
        <h1 className="font-mono text-3xl font-bold tracking-wide text-text-primary">
          {m.toolTitle}
        </h1>
        <code className="font-mono text-sm text-text-secondary">
          {m.toolName}
        </code>
      </div>

      {/* Identity line — class · percentile · rank */}
      {(m.signalClass || m.percentile || m.rank) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {m.signalClass && (
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-xs font-bold text-gold">
              {m.signalClass}
            </span>
          )}
          {m.percentile && (
            <span className="rounded-full border border-bg-border bg-bg-surface px-3 py-1 font-mono text-xs text-text-secondary">
              {m.percentile} percentile
            </span>
          )}
          {m.rank && (
            <span className="rounded-full border border-bg-border bg-bg-surface px-3 py-1 font-mono text-xs text-text-secondary">
              Rank {m.rank}
            </span>
          )}
        </div>
      )}

      {/* Metric grid */}
      {hasMetrics ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Υ Yield" value={m.yield} accent />
          <Metric label="Leverage" value={m.leverage} />
          <Metric label="Velocity" value={m.velocity} />
          <Metric label="SNR" value={m.snr} />
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-bg-border/60 bg-bg-surface/60 px-4 py-6 text-center">
          <p className="font-sans text-sm text-text-muted">
            No headline cascade metrics in this result.
          </p>
        </div>
      )}

      {/* Interpretation */}
      {m.interpretation && (
        <div className="mt-6 rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-sans text-base leading-relaxed text-text-primary">
            {m.interpretation}
          </p>
        </div>
      )}

      {/* Raw JSON (collapsible via <details>) */}
      <details className="mt-6 group">
        <summary className="cursor-pointer font-mono text-xs text-text-muted transition-colors hover:text-text-secondary">
          ▸ Raw tool result (JSON)
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-md border border-bg-border/50 bg-bg-base p-4 font-mono text-xs leading-relaxed text-text-secondary">
{JSON.stringify(m.raw, null, 2)}
        </pre>
      </details>

      {/* Branding footer */}
      <footer className="mt-10 flex flex-col gap-3 border-t border-bg-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-bold text-gold">SigRank</span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
            SignalAF
          </span>
        </div>
        <Link
          href="/mcp"
          className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
        >
          signalaf.com/mcp — MCP server →
        </Link>
      </footer>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
        Share link error
      </p>
      <h1 className="mt-3 font-mono text-3xl font-bold text-text-primary">
        Could not load this share card
      </h1>
      <div className="mt-6 rounded-lg border border-bg-border bg-bg-surface p-5">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-secondary">
{message}
        </pre>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/mcp"
          className="font-mono text-sm text-gold underline hover:text-text-primary"
        >
          MCP server →
        </Link>
        <Link
          href="/"
          className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
        >
          Home →
        </Link>
      </div>
    </div>
  );
}

export default async function ShareMcpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { t, d } = await searchParams;
  const card = await buildShareCard(t, d);

  // JSON-LD: describe the shared computation as a SoftwareApplication action.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: card.ok ? card.toolTitle : "SigRank MCP Share",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    url: `${SITE_ORIGIN}/share/mcp`,
    author: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {card.ok ? <ShareCard m={card} /> : <ErrorCard message={card.error} />}
    </>
  );
}
