import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { VercelMcpCopyButton } from "@/components/vercel/VercelAcquisition";

export const metadata: Metadata = {
  ...withOG({
    title: "Import SigRank Resources — Vercel Integration",
    description:
      "Import your existing SigRank resources into your Vercel project. Connect your operator identity, exchange signals, and MCP configuration.",
    path: "/vercel/import",
  }),
  robots: { index: false, follow: false },
};

export default async function VercelImportPage({
  searchParams,
}: {
  searchParams: Promise<{
    installation_id?: string;
    state?: string;
    return?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div className="py-4 sm:py-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">SigRank × Vercel</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        Import Resources
      </h1>

      <p className="mt-4 font-sans text-sm leading-relaxed text-text-secondary">
        Connect your existing SigRank resources to your Vercel project. This imports your
        operator identity, exchange signals, and MCP configuration so agents running in your
        Vercel deployments can use them directly.
      </p>

      {params.installation_id && (
        <div className="mt-6 rounded-lg border border-bg-border bg-bg-surface p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Installation</p>
          <p className="mt-1 font-mono text-sm text-text-primary break-all">{params.installation_id}</p>
        </div>
      )}

      {/* Resource selection — this is the import flow */}
      <section className="mt-10 space-y-6">
        <h2 className="font-mono text-xl font-bold text-text-primary">Select resources to import</h2>

        {/* Operator identity */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono text-sm font-bold text-text-primary">Operator Identity</h3>
              <p className="mt-1 font-sans text-xs text-text-secondary">
                Your SigRank codename and agent key. Required for exchange participation, submission,
                and signed SigRank Standard records.
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 accent-gold"
              name="import_operator"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Codename (e.g. vincentkoc)"
              className="flex-1 rounded-md border border-bg-border bg-bg-base px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted"
              name="codename"
            />
            <input
              type="password"
              placeholder="Agent key"
              className="flex-1 rounded-md border border-bg-border bg-bg-base px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted"
              name="agent_key"
            />
          </div>
        </div>

        {/* MCP configuration */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono text-sm font-bold text-text-primary">MCP Configuration</h3>
              <p className="mt-1 font-sans text-xs text-text-secondary">
                The canonical MCP endpoint URL. This will be added to your Vercel project as
                <code className="font-mono text-text-primary"> SIGRANK_MCP_URL</code> so your
                deployed agents can connect automatically.
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 accent-gold"
              name="import_mcp"
            />
          </div>
          <div className="mt-3">
            <code className="font-mono text-xs text-text-primary">https://signalaf.com/api/mcp</code>
          </div>
        </div>

        {/* Exchange signals */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono text-sm font-bold text-text-primary">Exchange Signals</h3>
              <p className="mt-1 font-sans text-xs text-text-secondary">
                Your published exchange signals. Agents in your Vercel deployments will be able to
                discover and attempt these signals.
              </p>
            </div>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-gold"
              name="import_signals"
            />
          </div>
          <p className="mt-3 font-sans text-xs text-text-muted">
            Sign in to select specific signals to import.
          </p>
        </div>

        {/* Wiki contributions */}
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-mono text-sm font-bold text-text-primary">Wiki Contributions</h3>
              <p className="mt-1 font-sans text-xs text-text-secondary">
                Your contributed wiki evidence pages. Imported as environment references for
                agents that need to cite SigRank evidence.
              </p>
            </div>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-gold"
              name="import_wiki"
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <section className="mt-8 flex flex-wrap gap-3">
        {params.return ? (
          <a
            href={params.return}
            className="inline-flex items-center justify-center rounded-md bg-text-primary px-5 py-3 font-mono text-sm font-bold text-bg-base transition-opacity hover:opacity-85"
          >
            Import & Return to Vercel
          </a>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-text-primary px-5 py-3 font-mono text-sm font-bold text-bg-base transition-opacity hover:opacity-85"
          >
            Import Resources
          </button>
        )}
        <Link
          href="/vercel/config"
          className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
        >
          Skip — Go to Configuration
        </Link>
      </section>

      {params.state && (
        <input type="hidden" name="state" value={params.state} />
      )}
    </div>
  );
}
