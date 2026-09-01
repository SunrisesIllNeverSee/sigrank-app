import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "SigRank Vercel Integration Documentation",
  description:
    "Complete documentation for the SigRank Vercel Marketplace integration — installation, configuration, MCP connection, verification, workflows, permissions, privacy, troubleshooting, and uninstall.",
  path: "/docs/integrations/vercel",
});

export default function VercelIntegrationDocs() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Documentation</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        SigRank Vercel Integration
      </h1>
      <p className="mt-2 font-mono text-[11px] text-text-dim">
        Last updated 2026-09-01 · Version 1.0
      </p>

      <nav className="mt-8 rounded-lg border border-bg-border bg-bg-surface p-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">Contents</p>
        <ol className="mt-2 flex flex-col gap-1 font-sans text-sm text-text-secondary">
          <li><a href="#overview" className="hover:text-text-primary">1. Overview</a></li>
          <li><a href="#installation" className="hover:text-text-primary">2. Installation</a></li>
          <li><a href="#configuration" className="hover:text-text-primary">3. Configuration</a></li>
          <li><a href="#mcp-connection" className="hover:text-text-primary">4. MCP Connection</a></li>
          <li><a href="#verification" className="hover:text-text-primary">5. Verification</a></li>
          <li><a href="#workflows" className="hover:text-text-primary">6. Example Workflows</a></li>
          <li><a href="#permissions" className="hover:text-text-primary">7. Permissions &amp; API Scopes</a></li>
          <li><a href="#privacy" className="hover:text-text-primary">8. Privacy Boundaries</a></li>
          <li><a href="#troubleshooting" className="hover:text-text-primary">9. Troubleshooting</a></li>
          <li><a href="#uninstall" className="hover:text-text-primary">10. Uninstall Behavior</a></li>
        </ol>
      </nav>

      {/* 1. Overview */}
      <section id="overview" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">1. Overview</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            The SigRank Vercel integration connects your Vercel projects to the SigRank MCP
            (Model Context Protocol) endpoint. This gives your deployed AI agents and development
            tools direct access to operator evaluation, exchange signals, and SigRank&apos;s
            metric tools without custom wiring.
          </p>
          <p>
            The integration provides:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li><strong className="text-text-primary">MCP endpoint access</strong> — connect any MCP-compatible client to <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">https://signalaf.com/api/mcp</code></li>
            <li><strong className="text-text-primary">Project-owned relay</strong> — one-click deploy a Vercel project that relays MCP traffic to SigRank, keeping your deployment URL as the entry point</li>
            <li><strong className="text-text-primary">Resource import</strong> — import your existing operator identity, exchange signals, and MCP configuration into your Vercel project</li>
            <li><strong className="text-text-primary">Environment variable sync</strong> — the MCP endpoint URL is automatically added to your project environment variables</li>
          </ul>
          <p>
            SigRank evaluates AI <strong className="text-text-primary">operators</strong> — developers
            using AI coding tools — not AI models. The integration does not evaluate your Vercel
            deployments themselves; it provides tools that agents running in or alongside your
            deployments can use.
          </p>
        </div>
      </section>

      {/* 2. Installation */}
      <section id="installation" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">2. Installation</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <h3 className="font-semibold text-text-primary">Via Vercel Marketplace</h3>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            <li>Navigate to the SigRank integration page on the Vercel Marketplace.</li>
            <li>Click <strong className="text-text-primary">Add</strong>.</li>
            <li>Select the Vercel project you want to connect.</li>
            <li>Choose environments: Production, Preview, Development (all three recommended).</li>
            <li>Click <strong className="text-text-primary">Connect</strong>.</li>
            <li>You will be redirected to <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">https://signalaf.com/vercel/config</code> to complete configuration.</li>
          </ol>

          <h3 className="mt-4 font-semibold text-text-primary">Via Vercel CLI</h3>
          <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-base p-4 font-mono text-xs text-text-primary"><code>{`vc i sigrank`}</code></pre>
          <p>
            This opens the same installation flow from your terminal. Run it in your project
            directory after <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">vercel link</code>.
          </p>

          <h3 className="mt-4 font-semibold text-text-primary">After installation</h3>
          <p>
            The integration adds the following environment variable to your project:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li><code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">SIGRANK_MCP_URL</code> — the canonical MCP endpoint URL (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">https://signalaf.com/api/mcp</code>)</li>
          </ul>
          <p>
            If you used a custom prefix during installation, the variable name will include
            that prefix (e.g., <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">SIGRANK_SIGRANK_MCP_URL</code>).
          </p>
        </div>
      </section>

      {/* 3. Configuration */}
      <section id="configuration" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">3. Configuration</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            After installation, you are redirected to the{" "}
            <Link href="/vercel/config" className="text-text-muted underline hover:text-text-secondary">configuration page</Link>.
            This page shows:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Installation status (active, pending, or revoked)</li>
            <li>Your configuration ID</li>
            <li>The canonical MCP endpoint URL with a copy button</li>
            <li>What the integration provides</li>
            <li>Links to MCP documentation and the acquisition page</li>
          </ul>
          <p>
            You can return to the configuration page at any time from your Vercel dashboard:
            Integrations → SigRank → Configure.
          </p>

          <h3 className="mt-4 font-semibold text-text-primary">Existing accounts</h3>
          <p>
            If you already have a SigRank account, your operator identity and MCP
            configuration are automatically available after installation — no
            separate import step is needed. Your codename, agent key, and exchange
            signals are accessible via the{" "}
            <Link href="/vercel/config" className="text-text-muted underline hover:text-text-secondary">configuration page</Link>.
          </p>
        </div>
      </section>

      {/* 4. MCP Connection */}
      <section id="mcp-connection" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">4. MCP Connection</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            The canonical MCP endpoint is:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-base p-4 font-mono text-xs text-text-primary"><code>{`https://signalaf.com/api/mcp`}</code></pre>
          <p>
            The endpoint uses MCP SDK v2 with Streamable HTTP transport. Any MCP-compatible
            client can connect directly.
          </p>

          <h3 className="mt-4 font-semibold text-text-primary">Client configuration</h3>
          <p>
            Add the following to your MCP client configuration (e.g., Claude Desktop, Cursor,
            or any MCP-compatible agent):
          </p>
          <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-base p-4 font-mono text-xs text-text-primary"><code>{`{
  "mcpServers": {
    "sigrank": {
      "url": "https://signalaf.com/api/mcp"
    }
  }
}`}</code></pre>

          <h3 className="mt-4 font-semibold text-text-primary">Project-owned relay (optional)</h3>
          <p>
            For a Vercel-native deployment URL, you can deploy the SigRank MCP relay starter kit.
            This gives you a <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">*.vercel.app/api/mcp</code> endpoint
            that relays to the canonical SigRank endpoint. The relay keeps implementation and
            metric logic centralized in SignalAF — you don&apos;t fork the tools.
          </p>
          <p>
            The starter kit is available at{" "}
            <Link href="https://github.com/SunrisesIllneverSee/sigrank-mcp/tree/main/examples/vercel-remote-mcp" className="text-text-muted underline hover:text-text-secondary">
              sigrank-mcp/examples/vercel-remote-mcp
            </Link>{" "}
            with a one-click deploy button.
          </p>

          <h3 className="mt-4 font-semibold text-text-primary">Discovery</h3>
          <p>
            The canonical endpoint publishes MCP discovery metadata at:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li><code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">/.well-known/mcp.json</code> — MCP server discovery</li>
            <li><code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">/llms.txt</code> — LLM-readable site summary</li>
          </ul>
        </div>
      </section>

      {/* 5. Verification */}
      <section id="verification" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">5. Verification</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <h3 className="font-semibold text-text-primary">Verify the MCP endpoint is live</h3>
          <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-base p-4 font-mono text-xs text-text-primary"><code>{`curl -s https://signalaf.com/api/mcp | head -20`}</code></pre>

          <h3 className="mt-4 font-semibold text-text-primary">Verify your relay deployment</h3>
          <p>
            If you deployed the project-owned relay, use the{" "}
            <Link href="/vercel#diagnostic" className="text-text-muted underline hover:text-text-secondary">diagnostic tool</Link>{" "}
            on the acquisition page to verify your <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">*.vercel.app</code> deployment is correctly serving the MCP relay.
          </p>
          <p>
            The diagnostic tool validates:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>HTTPS protocol is used</li>
            <li>The host is a <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">*.vercel.app</code> domain</li>
            <li>No credentials or ports in the URL</li>
            <li>The endpoint responds to MCP protocol requests</li>
          </ul>

          <h3 className="mt-4 font-semibold text-text-primary">Verify environment variables</h3>
          <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-base p-4 font-mono text-xs text-text-primary"><code>{`vercel env ls`}</code></pre>
          <p>
            Confirm <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">SIGRANK_MCP_URL</code> is present in your project&apos;s environment variables.
          </p>
        </div>
      </section>

      {/* 6. Example Workflows */}
      <section id="workflows" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">6. Example Workflows</h2>
        <div className="mt-3 flex flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">

          <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
            <h3 className="font-semibold text-text-primary">Operator lookup</h3>
            <p className="mt-1">An agent connected to the SigRank MCP endpoint can look up an operator&apos;s metrics, rank, and archetype:</p>
            <pre className="mt-2 overflow-x-auto rounded border border-bg-border bg-bg-base p-3 font-mono text-xs text-text-primary"><code>{`# MCP tool call
get_operator(codename="vincentkoc")
# Returns: yield, leverage, velocity, SNR, 10xDEV, archetype, class, rank`}</code></pre>
          </div>

          <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
            <h3 className="font-semibold text-text-primary">Exchange signal discovery</h3>
            <p className="mt-1">Agents can discover active exchange signals to attempt:</p>
            <pre className="mt-2 overflow-x-auto rounded border border-bg-border bg-bg-base p-3 font-mono text-xs text-text-primary"><code>{`# MCP tool call
list_signals(status="open")
# Returns: signal_id, domain, publisher, task_type, deadline, reward`}</code></pre>
          </div>

          <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
            <h3 className="font-semibold text-text-primary">Board rankings query</h3>
            <p className="mt-1">Query the current leaderboard for any time window:</p>
            <pre className="mt-2 overflow-x-auto rounded border border-bg-border bg-bg-base p-3 font-mono text-xs text-text-primary"><code>{`# MCP tool call
get_board(window="30d", platform="claude-code")
# Returns: ranked operator list with metrics`}</code></pre>
          </div>

          <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
            <h3 className="font-semibold text-text-primary">Wiki evidence lookup</h3>
            <p className="mt-1">Agents can retrieve evidence definitions and falsifier results:</p>
            <pre className="mt-2 overflow-x-auto rounded border border-bg-border bg-bg-base p-3 font-mono text-xs text-text-primary"><code>{`# MCP tool call
get_wiki_entry(topic="yield")
# Returns: definition, formula, test coverage, falsifier results, evidence maturity`}</code></pre>
          </div>
        </div>
      </section>

      {/* 7. Permissions */}
      <section id="permissions" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">7. Permissions &amp; API Scopes</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            The integration requests the following Vercel API scopes:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-bg-border text-left">
                  <th className="py-2 pr-4 font-semibold text-text-primary">Scope</th>
                  <th className="py-2 pr-4 font-semibold text-text-primary">Access</th>
                  <th className="py-2 font-semibold text-text-primary">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Integration Configuration</td>
                  <td className="py-2 pr-4">Read and write</td>
                  <td className="py-2">Read and update installation configuration state</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Integration Resource</td>
                  <td className="py-2 pr-4">Read</td>
                  <td className="py-2">Read which projects are connected to the integration</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Deployments</td>
                  <td className="py-2 pr-4">Read</td>
                  <td className="py-2">Read deployment status for MCP endpoint verification</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Projects</td>
                  <td className="py-2 pr-4">Read</td>
                  <td className="py-2">Read project details for configuration display</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Project Environment Variables</td>
                  <td className="py-2 pr-4">Read and write</td>
                  <td className="py-2">Add SIGRANK_MCP_URL to connected projects automatically</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Teams</td>
                  <td className="py-2 pr-4">Read</td>
                  <td className="py-2">Read team details for installation context</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Current User</td>
                  <td className="py-2 pr-4">Read</td>
                  <td className="py-2">Identify the installing user for account mapping</td>
                </tr>
                <tr className="border-b border-bg-border">
                  <td className="py-2 pr-4 font-mono text-text-primary">Billing</td>
                  <td className="py-2 pr-4">Read</td>
                  <td className="py-2">Read Vercel plan for feature availability</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            The integration does <strong className="text-text-primary">not</strong> request:
            Deployment Checks, Global Project Environment Variables, Project Protection Bypass,
            Domains, Global Config, or Drains.
          </p>
        </div>
      </section>

      {/* 8. Privacy */}
      <section id="privacy" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">8. Privacy Boundaries</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            The integration follows SigRank&apos;s privacy-first principles:
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong className="text-text-primary">No prompt content</strong> — the MCP endpoint
              exchanges tool calls and responses (operator metrics, signal data, wiki entries).
              It never receives or processes your code, prompts, or conversation content.
            </li>
            <li>
              <strong className="text-text-primary">No deployment source access</strong> — the
              integration reads deployment status (URL, state) but does not access your source
              code, build logs, or runtime data.
            </li>
            <li>
              <strong className="text-text-primary">OAuth token storage</strong> — the Vercel
              access token is stored server-side in a Supabase table protected by Row-Level
              Security. It is never exposed to the browser or in rendered pages.
            </li>
            <li>
              <strong className="text-text-primary">No third-party data sharing</strong> — the
              integration does not share your Vercel project data with any third party. The
              OAuth token is used only to read project/deployment metadata for the configuration
              page.
            </li>
            <li>
              <strong className="text-text-primary">Analytics</strong> — SigRank uses PostHog for
              product analytics. Page views on the configuration and import pages are tracked
              anonymously. No token content, no source code, no deployment secrets are ever
              tracked. See our{" "}
              <Link href="/privacy" className="text-text-muted underline hover:text-text-secondary">Privacy Policy</Link>{" "}
              for full details.
            </li>
          </ul>
        </div>
      </section>

      {/* 9. Troubleshooting */}
      <section id="troubleshooting" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">9. Troubleshooting</h2>
        <div className="mt-3 flex flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">

          <div>
            <h3 className="font-semibold text-text-primary">MCP endpoint returns 403</h3>
            <p className="mt-1">
              Vercel&apos;s bot protection may block programmatic requests via TLS fingerprinting.
              If you&apos;re using Node.js <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">fetch</code>,
              use <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">curl</code> as
              a fallback. The sigrank-mcp CLI already handles this automatically.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary">Environment variable not appearing</h3>
            <p className="mt-1">
              After installation, run <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">vercel env pull</code> to
              sync the latest environment variables to your local development environment. If the
              variable is still missing, disconnect and reconnect the integration.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary">Configuration page shows &ldquo;pending&rdquo;</h3>
            <p className="mt-1">
              This means the OAuth callback completed but the server-side environment variables
              (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">VERCEL_CLIENT_ID</code> and{" "}
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">VERCEL_CLIENT_SECRET</code>)
              are not yet configured on the SignalAF side. This is a server-side configuration
              issue — contact{" "}
              <a href="mailto:hello@signalaf.com" className="text-text-muted underline hover:text-text-secondary">hello@signalaf.com</a>{" "}
              if it persists.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary">Relay deployment returns 502</h3>
            <p className="mt-1">
              The relay forwards requests to <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">https://signalaf.com/api/mcp</code>.
              If SignalAF is temporarily unavailable, the relay returns a 502. Retry after a
              few minutes. Check{" "}
              <a href="https://signalaf.com" className="text-text-muted underline hover:text-text-secondary">signalaf.com</a>{" "}
              is reachable.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary">MCP client cannot connect</h3>
            <p className="mt-1">
              Verify your MCP client configuration uses the correct URL format. The endpoint
              uses Streamable HTTP transport, not SSE. Ensure your client supports MCP SDK v2.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Uninstall */}
      <section id="uninstall" className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">10. Uninstall Behavior</h2>
        <div className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            To uninstall the integration:
          </p>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            <li>Go to your Vercel dashboard → Integrations → SigRank.</li>
            <li>Click <strong className="text-text-primary">Settings</strong>.</li>
            <li>Click <strong className="text-text-primary">Delete SigRank</strong>.</li>
          </ol>
          <p>
            When you uninstall:
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>The OAuth access token is revoked and marked as &ldquo;revoked&rdquo; in the SigRank database.</li>
            <li>The integration stops receiving Vercel API access for your projects.</li>
            <li>Environment variables added by the integration (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">SIGRANK_MCP_URL</code>) remain in your project until you manually remove them via <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">vercel env rm</code>.</li>
            <li>Your SigRank account, operator data, and exchange history are <strong className="text-text-primary">not</strong> affected. Uninstalling only severs the Vercel connection.</li>
            <li>Any deployed MCP relay continues to work — it forwards to the canonical endpoint independently of the integration.</li>
          </ul>
          <p>
            To fully remove the relay, delete the relay project from your Vercel dashboard
            separately.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-bg-border pt-6">
        <Link href="/vercel" className="font-mono text-xs text-text-muted hover:text-text-primary">Vercel Integration</Link>
        <Link href="/mcp" className="font-mono text-xs text-text-muted hover:text-text-primary">MCP Docs</Link>
        <Link href="/eula" className="font-mono text-xs text-text-muted hover:text-text-primary">EULA</Link>
        <Link href="/privacy" className="font-mono text-xs text-text-muted hover:text-text-primary">Privacy Policy</Link>
        <Link href="/support" className="font-mono text-xs text-text-muted hover:text-text-primary">Support</Link>
      </div>
    </main>
  );
}
