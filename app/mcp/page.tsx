import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * app/mcp/page.tsx — the MCP server landing page.
 *
 * Agent-facing page that explains what the SigRank MCP server does, how to
 * install it, and what tools it exposes. Linked from llms.txt + sitemap so
 * AI engines and agents can discover it.
 */

export const metadata: Metadata = withOG({
  title: "MCP Server — 15 tools for AI agents",
  description:
    "SigRank MCP server gives any AI agent 15 tools to measure, rank, and improve token efficiency. Install with npx sigrank. Works with Claude, Cursor, Cline, Windsurf, and any MCP-compatible client.",
  path: "/mcp",
});

const TOOLS = [
  {
    name: "rank_paste",
    desc: "Paste token counts, get projected SigRank rank in seconds",
  },
  {
    name: "get_leaderboard",
    desc: "Pull the live global leaderboard from signalaf.com",
  },
  {
    name: "get_operator",
    desc: "Get any operator's profile, class tier, and cascade breakdown",
  },
  {
    name: "submit_paste",
    desc: "Submit token telemetry to the live board (paste mode)",
  },
  {
    name: "submit_verified",
    desc: "Submit ed25519-signed telemetry (verified mode)",
  },
  {
    name: "tokenpull",
    desc: "Pull telemetry from ccusage, tokscale, or tokendash",
  },
  { name: "tokenpull_submit", desc: "Pull telemetry and submit in one call" },
  {
    name: "watch_tokenpull",
    desc: "Continuous monitoring with periodic submissions",
  },
  {
    name: "rank_windows",
    desc: "Compare rank across 7d / 30d / 90d / all-time windows",
  },
  { name: "tokenpull_compare", desc: "Head-to-head operator comparison" },
  { name: "enroll", desc: "Register as an operator on the leaderboard" },
  {
    name: "simulate_change",
    desc: "Model what-if scenarios (what if cache hit rate +10%?)",
  },
  {
    name: "diagnose_cascade",
    desc: "Identify inefficiencies in token usage patterns",
  },
  {
    name: "suggest_improvements",
    desc: "Get actionable recommendations to improve yield",
  },
  {
    name: "self_improve",
    desc: "Scope improvements to the agent's own telemetry",
  },
];

const REGISTRIES = [
  {
    name: "Official MCP Registry",
    url: "https://registry.modelcontextprotocol.io",
  },
  {
    name: "Smithery",
    url: "https://smithery.ai/server/@SunrisesIllNeverSee/sigrank-mcp",
  },
  {
    name: "Glama",
    url: "https://glama.ai/mcp/servers/@SunrisesIllNeverSee/sigrank-mcp",
  },
  {
    name: "Cline Marketplace",
    url: "https://github.com/cline/mcp-marketplace",
  },
  { name: "npm", url: "https://www.npmjs.com/package/sigrank" },
  { name: "GitHub", url: "https://github.com/SunrisesIllNeverSee/sigrank-mcp" },
];

const CLIENTS = [
  {
    name: "Claude Desktop",
    config: "~/Library/Application Support/Claude/claude_desktop_config.json",
  },
  { name: "Cursor", config: "Settings → MCP → Add Server" },
  { name: "Cline", config: 'Marketplace → search "SigRank"' },
  { name: "Windsurf", config: "Settings → MCP Servers → Add" },
  { name: "Any MCP client", config: "npx sigrank (stdio transport)" },
];

export default function MCPPage() {
  const mcpJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SigRank MCP Server",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform (Node.js)",
    description:
      "MCP server giving AI agents 15 tools to measure, rank, and improve token efficiency. The yield cascade metric and live leaderboard as MCP tools.",
    url: "https://signalaf.com/mcp",
    downloadUrl: "https://www.npmjs.com/package/sigrank",
    installUrl: "npx sigrank",
    author: {
      "@type": "Organization",
      name: "SigRank",
      url: "https://signalaf.com",
    },
    license: "https://opensource.org/licenses/MIT",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd data={mcpJsonLd} />

      <h1 className="font-mono text-3xl font-bold tracking-wide text-text-primary">
        SigRank MCP Server
      </h1>
      <p className="mt-3 font-sans text-base text-text-secondary">
        15 tools any AI agent can call — measure, rank, and improve token
        efficiency. The yield cascade and live leaderboard as MCP tools.
      </p>

      {/* Install */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Install
        </h2>
        <div className="mt-4 rounded-lg border border-bg-border bg-bg-surface p-4">
          <code className="font-mono text-sm text-text-primary">
            npx sigrank
          </code>
          <p className="mt-2 font-sans text-xs text-text-muted">
            Or{" "}
            <code className="font-mono text-text-secondary">
              npx sigrank-mcp
            </code>{" "}
            — same thing. No API key required for read tools. Submit tools need
            a Supabase anon key (free, set during{" "}
            <code className="font-mono text-text-secondary">
              sigrank enroll
            </code>
            ).
          </p>
        </div>
      </section>

      {/* Client setup */}
      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Client setup
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="py-2 pr-4 text-left font-mono text-xs font-bold text-text-secondary">
                  Client
                </th>
                <th className="py-2 text-left font-mono text-xs font-bold text-text-secondary">
                  Where
                </th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.name} className="border-b border-bg-border/50">
                  <td className="py-2 pr-4 font-sans text-sm text-text-primary">
                    {c.name}
                  </td>
                  <td className="py-2 font-mono text-xs text-text-muted">
                    {c.config}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tools */}
      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Tools ({TOOLS.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {TOOLS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-1 rounded-md border border-bg-border/50 bg-bg-surface/50 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4"
            >
              <code className="font-mono text-sm font-bold text-text-primary sm:min-w-[180px]">
                {t.name}
              </code>
              <span className="font-sans text-sm text-text-secondary">
                {t.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Registries */}
      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Find us on
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {REGISTRIES.map((r) => (
            <a
              key={r.name}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-bg-border bg-bg-surface px-3 py-1 font-mono text-xs text-text-secondary transition-colors hover:border-text-muted/60 hover:text-text-primary"
            >
              {r.name}
            </a>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/score"
          className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
        >
          Try the score calculator →
        </Link>
        <Link
          href="/board/all"
          className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
        >
          View the leaderboard →
        </Link>
        <a
          href="https://github.com/SunrisesIllNeverSee/sigrank-mcp"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
        >
          GitHub repo →
        </a>
        <a
          href="https://www.npmjs.com/package/sigrank"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-text-secondary underline hover:text-text-primary"
        >
          npm →
        </a>
      </section>
    </div>
  );
}
