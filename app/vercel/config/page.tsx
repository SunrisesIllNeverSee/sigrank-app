import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { VercelMcpCopyButton } from "@/components/vercel/VercelAcquisition";

export const metadata: Metadata = {
  ...withOG({
    title: "SigRank Vercel Integration — Configuration",
    description:
      "Configure your SigRank Vercel integration. Connect the canonical MCP endpoint, verify installation status, and access SigRank tools from your Vercel projects.",
    path: "/vercel/config",
  }),
  robots: { index: false, follow: false },
};

export default function VercelConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ configurationId?: string; status?: string }>;
}) {
  return <VercelConfigContent searchParams={searchParams} />;
}

async function VercelConfigContent({
  searchParams,
}: {
  searchParams: Promise<{ configurationId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const configurationId = params.configurationId;
  const status = params.status;

  const mcpConfig = `{
  "mcpServers": {
    "sigrank": {
      "url": "https://signalaf.com/api/mcp"
    }
  }
}`;

  return (
    <div className="py-4 sm:py-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">SigRank × Vercel</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        Integration Configuration
      </h1>

      {/* Installation status banner */}
      {status === "installed" && (
        <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <p className="font-mono text-sm font-bold text-green-400">
            ✓ Integration installed successfully
          </p>
          <p className="mt-1 font-sans text-sm text-text-secondary">
            Your SigRank Vercel integration is active. Use the MCP endpoint below to connect your AI tools.
          </p>
        </div>
      )}
      {status === "pending_env" && (
        <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="font-mono text-sm font-bold text-yellow-400">
            ⚠ Installation recorded — finalizing setup
          </p>
          <p className="mt-1 font-sans text-sm text-text-secondary">
            The integration was installed but the server-side token exchange is still being configured.
            The MCP endpoint is already available — you can use it now.
          </p>
        </div>
      )}

      {/* Configuration ID */}
      {configurationId && (
        <div className="mt-6 rounded-lg border border-bg-border bg-bg-surface p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Configuration ID</p>
          <p className="mt-1 font-mono text-sm text-text-primary break-all">{configurationId}</p>
        </div>
      )}

      {/* MCP endpoint */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">MCP Endpoint</h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          Point any Streamable HTTP MCP client at the canonical SigRank endpoint. This is the same
          endpoint used by the Vercel Marketplace integration — no separate configuration is needed.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-bg-border bg-bg-base p-4 font-mono text-xs leading-relaxed text-text-secondary">{mcpConfig}</pre>
        <div className="mt-4">
          <VercelMcpCopyButton />
        </div>
      </section>

      {/* What the integration provides */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">What this integration provides</h2>
        <ul className="mt-4 space-y-3 font-sans text-sm text-text-secondary">
          <li className="flex gap-3">
            <span className="text-gold">→</span>
            <span><strong className="text-text-primary">25 MCP tools</strong> — yield calculation, token cascade analysis, operator benchmarking, signed submission, and SigRank Standard record generation.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">→</span>
            <span><strong className="text-text-primary">Canonical endpoint</strong> — one implementation of the scoring engine, maintained at <code className="font-mono text-text-primary">signalaf.com/api/mcp</code>.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">→</span>
            <span><strong className="text-text-primary">Project-owned relay</strong> — optionally deploy a Vercel-backed MCP URL that relays to the canonical server, without forking metric logic.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">→</span>
            <span><strong className="text-text-primary">Agent discovery</strong> — <code className="font-mono">/.well-known/mcp.json</code> and <code className="font-mono">llms.txt</code> surfaces for automated agent discovery.</span>
          </li>
        </ul>
      </section>

      {/* Links */}
      <section className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/vercel"
          className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
        >
          ← Back to SigRank × Vercel
        </Link>
        <Link
          href="/mcp"
          className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
        >
          View all MCP tools
        </Link>
        <a
          href="https://signalaf.com/api/mcp"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
        >
          Test MCP endpoint
        </a>
      </section>

      {/* No configurationId — show generic help */}
      {!configurationId && (
        <div className="mt-10 rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">No installation detected</p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
            If you just installed the integration and see this message, the OAuth callback may still
            be processing. The MCP endpoint is available regardless of installation status — you can
            use it directly. If you need to reinstall, visit the{" "}
            <Link className="text-gold" href="/vercel">SigRank × Vercel page</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
