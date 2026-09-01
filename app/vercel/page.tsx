import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import {
  VercelDeployButton,
  VercelDiagnostic,
  VercelMcpCopyButton,
} from "@/components/vercel/VercelAcquisition";

export const metadata: Metadata = withOG({
  title: "SigRank for Vercel — AI Operator & Agent Evaluation",
  description:
    "Connect Vercel AI projects to SigRank through MCP, deploy a project-owned remote endpoint in one click, and scan public Vercel deployments for distribution and agent readiness.",
  path: "/vercel",
});

const mcpConfig = `{
  "mcpServers": {
    "sigrank": {
      "url": "https://signalaf.com/api/mcp"
    }
  }
}`;

export default function VercelPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">SigRank × Vercel</p>
      <h1 className="mt-3 max-w-4xl font-mono text-3xl font-bold leading-tight text-text-primary sm:text-5xl">
        Measure the people and agents operating your AI stack.
      </h1>
      <p className="mt-5 max-w-3xl font-sans text-base leading-relaxed text-text-secondary sm:text-lg">
        SigRank gives Vercel-hosted AI projects a native path into operator evaluation, cascade analysis, live benchmarking, and MCP tools. Use the canonical hosted endpoint immediately or deploy a project-owned relay to Vercel in one click.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        <VercelDeployButton />
        <VercelMcpCopyButton />
        <Link
          href="/mcp"
          className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
        >
          View all MCP tools
        </Link>
      </div>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          ["Install", "Point any Streamable-HTTP MCP client at the canonical SignalAF endpoint. No local install is required for the remote toolset."],
          ["Deploy", "Create a Vercel-owned MCP URL backed by the canonical SigRank remote server, without copying metric logic or maintaining a fork."],
          ["Evaluate", "Score cascades, benchmark operators, compare signatures, diagnose inefficiency, and expose portable SigRank Standard records to agents."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-bg-border bg-bg-surface p-5">
            <h2 className="font-mono text-lg font-bold text-text-primary">{title}</h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Free utility</p>
            <h2 className="mt-2 font-mono text-2xl font-bold text-text-primary">Vercel distribution diagnostic</h2>
          </div>
          <span className="font-mono text-xs text-text-muted">Public surfaces only · no account access</span>
        </div>
        <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-text-secondary">
          Check whether a public Vercel deployment exposes the basics that search engines and agents can actually discover: rendered metadata, robots, sitemap, llms.txt, MCP discovery, and real 404 behavior.
        </p>
        <div className="mt-5">
          <VercelDiagnostic />
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-bg-border bg-bg-surface p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Canonical endpoint</p>
          <h2 className="mt-2 font-mono text-xl font-bold text-text-primary">Use SigRank over Streamable HTTP</h2>
          <pre className="mt-4 overflow-x-auto rounded-md border border-bg-border bg-bg-base p-4 font-mono text-xs leading-relaxed text-text-secondary">{mcpConfig}</pre>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            The endpoint is <code className="font-mono text-text-primary">https://signalaf.com/api/mcp</code>. It keeps the remote tool surface and cascade implementation canonical instead of recreating them per integration.
          </p>
        </div>

        <div className="rounded-xl border border-bg-border bg-bg-surface p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Vercel Agent Tools</p>
          <h2 className="mt-2 font-mono text-xl font-bold text-text-primary">Marketplace-ready MCP surface</h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-text-secondary">
            SigRank already exposes a remote MCP server suitable for Vercel&apos;s Agent Tools model. The integration surface uses that canonical endpoint so Marketplace installation can expose the same tools without a second implementation.
          </p>
          <ul className="mt-4 space-y-2 font-sans text-sm text-text-secondary">
            <li>• Streamable HTTP at <code className="font-mono">/api/mcp</code></li>
            <li>• machine-readable discovery at <code className="font-mono">/.well-known/mcp.json</code></li>
            <li>• public developer documentation at <Link className="text-gold" href="/mcp">/mcp</Link></li>
            <li>• canonical Standard records and operator-evaluation tools</li>
          </ul>
        </div>
      </section>

      <section className="mt-14 rounded-xl border border-gold/30 bg-bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Why this exists</p>
        <h2 className="mt-2 font-mono text-2xl font-bold text-text-primary">Vercel measures the application. SigRank measures the operating layer.</h2>
        <p className="mt-3 max-w-4xl font-sans text-sm leading-relaxed text-text-secondary">
          Runtime logs, traces, tokens, and application telemetry tell you what the software did. SigRank adds a complementary evaluation layer for how human operators and AI workflows compound, reuse context, produce output, and move against a field benchmark.
        </p>
      </section>
    </main>
  );
}
