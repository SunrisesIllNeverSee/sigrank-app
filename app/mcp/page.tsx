import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPage } from "@/lib/jsonld";

/**
 * app/mcp/page.tsx — the MCP server landing page.
 *
 * Agent-facing page that explains what the SigRank MCP server does, how to
 * install it, and what tools it exposes. Linked from llms.txt + sitemap so
 * AI engines and agents can discover it.
 */

export const metadata: Metadata = withOG({
  title: "MCP Server — 15 remote tools + 24 local tools for AI agents",
  description:
    "SigRank MCP server gives AI agents 15 remote tools (HTTP, no install) and 24 local tools (npx sigrank, stdio) to measure, rank, benchmark, compare, and improve token efficiency. Works with Claude, Cursor, Cline, Windsurf, Cloudflare Playground, and any MCP-compatible client.",
  path: "/mcp",
});

const REMOTE_TOOLS = [
  {
    name: "rank_paste",
    desc: "Compute cascade metrics (Υ, SNR, Leverage, Velocity, 10xDEV) from 4 token counts — no install needed",
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
    name: "simulate_change",
    desc: "What-if predictor — test pillar changes and see the exact Υ delta before committing",
  },
  {
    name: "diagnose_cascade",
    desc: "Identify efficiency leaks with severity, findings, and estimated Υ impact per fix",
  },
  {
    name: "suggest_improvements",
    desc: "Ranked, simulated improvement strategies sorted by Υ yield impact",
  },
  {
    name: "self_improve",
    desc: "One-click optimize — diagnose → suggest → simulate the best change in one call",
  },
  {
    name: "rank_windows",
    desc: "Score 7d / 30d / 90d / all-time windows in one call",
  },
  {
    name: "benchmark_me",
    desc: "Answers 'How good am I?' — benchmarks your cascade against the live field: percentile, rank, strongest/weakest metric, one-line interpretation",
  },
  {
    name: "rank_if",
    desc: "Counterfactual rank simulator — 'What would it take to reach top 10%?' — finds the smallest pillar change to hit a target percentile",
  },
  {
    name: "operator_gap",
    desc: "What specifically separates two operators — primary cause, secondary cause, offsetting weakness, most explanatory factor",
  },
  {
    name: "field_anomaly",
    desc: "Unusual patterns in the leaderboard — high velocity with low leverage, near-zero cache write in top 50, largest 7d improvements, extreme divergence",
  },
  {
    name: "who_operates_like_me",
    desc: "Nearest-neighbor finder — operators whose signature most resembles yours, with similarity % and where they outperform you",
  },
  {
    name: "compare_to_field",
    desc: "YOU vs FIELD vs TOP 10% vs TOP 1% comparison table for yield, leverage, velocity, and SNR",
  },
  {
    name: "operator_signature",
    desc: "Portable identity object — signature code, archetype, dominant trait, and closest comparable operators",
  },
];

const LOCAL_TOOLS = [
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
    desc: "Pull telemetry from local session logs (17 platform adapters)",
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
  { name: "tokenpull_compare", desc: "4-source pillar audit (tokenpull vs ccusage vs token-dashboard vs tokscale)" },
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
    desc: "Full cycle: diagnose → suggest → simulate, with mode detection and scoped analysis",
  },
  {
    name: "discover_peers",
    desc: "Find mentors, peers, and complementary operators for your operator",
  },
  {
    name: "tokscale_breakdown",
    desc: "Per-model token breakdown across platforms",
  },
  {
    name: "tokscale_market_share",
    desc: "AI tool market share from local tokscale data",
  },
  {
    name: "tokscale_developer_profile",
    desc: "Per-developer usage profile (model mix, sessions, workspaces)",
  },
  {
    name: "tokscale_model_trends",
    desc: "Model adoption over time (first/last seen, monthly curve)",
  },
  {
    name: "tokscale_cost_analysis",
    desc: "Cost per developer per model",
  },
  {
    name: "tokscale_device_profile",
    desc: "Device fingerprinting (installed tools, session counts, day-of-week)",
  },
  {
    name: "tokscale_mcp_usage",
    desc: "MCP server usage (detected servers, active days)",
  },
  {
    name: "tokscale_competitive_intel",
    desc: "Competitive intelligence for any AI tool",
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
  { name: "Any MCP client", config: "npx sigrank or bunx sigrank (stdio transport)" },
];

export default function MCPPage() {
  const mcpJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SigRank MCP Server",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform (Node.js)",
    description:
      "MCP server giving AI agents 15 remote tools (HTTP, no install) and 24 local tools (npx sigrank, stdio) to measure, rank, benchmark, compare, and improve token efficiency. The yield cascade metric and live leaderboard as MCP tools.",
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
      <JsonLd data={[
        mcpJsonLd,
        faqPage([
          {
            question: "What is the SigRank MCP server?",
            answer:
              "The SigRank MCP server is a Model Context Protocol server that gives AI agents 15 remote tools (HTTP, no install) and 24 local tools (npx sigrank, stdio) to measure, rank, benchmark, compare, and improve token efficiency. Agents can pull the live leaderboard, get operator profiles, compute cascade metrics, diagnose inefficiencies, simulate changes, benchmark against the field, and find what it takes to reach a target rank. Remote tools work over Streamable HTTP; local tools run as a stdio process reading your session logs on-device.",
          },
          {
            question: "How many tools does the SigRank MCP server expose?",
            answer:
              "The SigRank MCP server exposes 15 remote tools (rank_paste, get_leaderboard, get_operator, simulate_change, diagnose_cascade, suggest_improvements, self_improve, rank_windows, benchmark_me, rank_if, operator_gap, field_anomaly, who_operates_like_me, compare_to_field, operator_signature) over Streamable HTTP at https://signalaf.com/api/mcp, and 24 local tools via `npx sigrank` (stdio). The local tools include the remote analytical tools plus submit_paste, submit_verified, tokenpull, tokenpull_submit, watch_tokenpull, tokenpull_compare, enroll, discover_peers, and 8 tokscale analytics tools.",
          },
          {
            question: "Which AI clients support the SigRank MCP server?",
            answer:
              "The remote HTTP endpoint works with any MCP client that supports Streamable HTTP transport, including Cloudflare AI Playground, web agents, and remote MCP clients. The local stdio server works with Claude, Cursor, Cline, Windsurf, and Codex — install it by running `npx sigrank`. The server reads your session logs on-device without sending prompts or code to any server.",
          },
        ]),
      ]} />

      <h1 className="font-mono text-3xl font-bold tracking-wide text-text-primary">
        SigRank MCP Server
      </h1>
      <p className="mt-3 font-sans text-base text-text-secondary">
        15 remote tools (HTTP, no install) + 24 local tools (npx sigrank) —
        measure, rank, benchmark, compare, and improve token efficiency. The yield
        cascade and live leaderboard as MCP tools.
      </p>

      {/* Remote endpoint */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Remote endpoint (HTTP, no install)
        </h2>
        <div className="mt-4 rounded-lg border border-bg-border bg-bg-surface p-4">
          <code className="font-mono text-sm text-text-primary">
            https://signalaf.com/api/mcp
          </code>
          <p className="mt-2 font-sans text-xs text-text-muted">
            Streamable HTTP transport. Protocol 2025-06-18. No auth required.
            Discovery card at{" "}
            <code className="font-mono text-text-secondary">
              /.well-known/mcp.json
            </code>
            . Works with Cloudflare AI Playground, web agents, and any MCP
            client that supports Streamable HTTP.
          </p>
        </div>
      </section>

      {/* Remote tools */}
      <section className="mt-6">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Remote tools ({REMOTE_TOOLS.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {REMOTE_TOOLS.map((t) => (
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

      {/* Resources */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Resources (6)
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {[
            { uri: "sigrank://methodology", desc: "How SigRank measures AI operators — the cascade metric system, formulas, and class taxonomy" },
            { uri: "sigrank://metrics", desc: "Definitions of Yield (Υ), Leverage, Velocity, SNR, 10xDEV, Scale V, and class tiers" },
            { uri: "sigrank://platforms", desc: "AI platforms tracked by SigRank" },
            { uri: "sigrank://formulas", desc: "The frozen canonical formulas — Υ, Leverage, Velocity, SNR, 10xDEV, Scale V" },
            { uri: "sigrank://classes", desc: "The 24-stage class taxonomy from IGNITER III to ARCH+ I with token thresholds" },
            { uri: "sigrank://benchmarks", desc: "Current field-wide benchmark statistics (median, top 10%, top 1%) from the live leaderboard" },
          ].map((r) => (
            <div
              key={r.uri}
              className="flex flex-col gap-1 rounded-md border border-bg-border/50 bg-bg-surface/50 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4"
            >
              <code className="font-mono text-sm font-bold text-gold sm:min-w-[220px]">
                {r.uri}
              </code>
              <span className="font-sans text-sm text-text-secondary">
                {r.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Prompts */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Prompts (5)
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {[
            { name: "benchmark-my-operator", desc: "Compute cascade metrics, compare against the live field, and get a one-line interpretation" },
            { name: "how-do-i-reach-top-10", desc: "Counterfactual analysis — finds the smallest pillar change needed to reach a target percentile" },
            { name: "explain-my-signature", desc: "Computes operating archetype, dominant trait, and finds comparable operators" },
            { name: "diagnose-inefficiency", desc: "Identifies efficiency leaks with severity, findings, and estimated yield impact per fix" },
            { name: "field-anomaly-report", desc: "Scans the live leaderboard for unusual patterns — no input required" },
          ].map((p) => (
            <div
              key={p.name}
              className="flex flex-col gap-1 rounded-md border border-bg-border/50 bg-bg-surface/50 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4"
            >
              <code className="font-mono text-sm font-bold text-text-primary sm:min-w-[220px]">
                {p.name}
              </code>
              <span className="font-sans text-sm text-text-secondary">
                {p.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Local install */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Local install (stdio, 24 tools)
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
            — same thing. Bun users:{" "}
            <code className="font-mono text-text-secondary">
              bunx sigrank
            </code>
            . No API key required for read tools. Submit tools need
            a Supabase anon key (free, set during{" "}
            <code className="font-mono text-text-secondary">
              sigrank enroll
            </code>
            ). The local server reads session logs from 17 AI coding tools
            (Claude Code, Codex, Devin, Amp, Kimi, pi-agent, oh-my-pi, OpenClaw,
            Droid, Codebuff, Hermes, Kilo, Qwen, Goose, Gemini, Copilot, OpenCode).
          </p>
        </div>
      </section>

      {/* Client setup */}
      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Client setup (local stdio)
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

      {/* Local tools */}
      <section className="mt-8">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Local tools ({LOCAL_TOOLS.length})
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {LOCAL_TOOLS.map((t) => (
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
