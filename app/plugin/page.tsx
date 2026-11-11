import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "SigRank | SignalAF Plugin",
  description: "Performative stats and benchmarks for AI users, not models. Explore and interpret the SignalAF AI Operator Leaderboard in ChatGPT, Codex and Claude.",
  path: "/plugin",
});

const ANALYST_MCP_URL = "https://analyst.signalaf.com/api/plugins/sigrank/mcp";

const ADMIN_TOOLS = [
  { name: "get_leaderboard", summary: "Reads the public board for 7d, 30d, 90d or all time.", access: "Read-only" },
  { name: "get_operator", summary: "Reads one public operator profile by codename.", access: "Read-only" },
  { name: "compare_operators", summary: "Compares two public operators over a common window.", access: "Read-only" },
  { name: "get_field_stats", summary: "Reads distributions and field size for the public board.", access: "Read-only" },
  {
    name: "report_beta_bug",
    summary: "Emails a bug report to hello@signalaf.com, only when the user explicitly asks to send it.",
    access: "Sends email",
  },
] as const;

export default function PluginPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">AI Operator Leaderboard</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        SigRank | SignalAF
      </h1>
      <p className="mt-4 font-sans text-lg text-text-secondary">
        Performative stats and benchmarks for AI users, not models.
      </p>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">What the plugin does</h2>
        <p>
          Explore the live 7-day, 30-day, 90-day and all-time boards, read public operator profiles,
          compare operating structures, and understand field statistics. The plugin helps explain
          relationships among fresh input, generated output, context construction and reuse.
          In Codex, an existing local SigRank identity can locate its public profile by codename.
          In Claude, look up any operator by its public codename.
        </p>
        <p>
          Tokenpull measures → SigRank evaluates → SignalAF publishes. The plugin interprets those
          results; it does not scan local logs, enroll an operator, or submit a measurement. Metrics
          describe observable AI operating structure, not intelligence, productivity or work quality.
          Archetypes describe operating patterns, not personality.
        </p>
      </section>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">Use it in Claude</h2>
        <p>
          In Claude Code, add the plugin from its GitHub marketplace:
        </p>
        <pre className="overflow-x-auto rounded border border-border-base bg-surface p-3 font-mono text-xs text-text-primary">
          /plugin install signalaf-analyst --marketplace SunrisesIllNeverSee/signalaf-analyst-claude
        </pre>
        <p>
          It works the same in Claude chat and Cowork. The plugin connects to the same public,
          sign-in-free Analyst server as ChatGPT and Codex, so results match across hosts.
        </p>
        <a
          className="text-gold underline underline-offset-4"
          href="https://github.com/SunrisesIllNeverSee/signalaf-analyst-claude"
        >
          View the Claude plugin on GitHub
        </a>
      </section>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">Boards and data</h2>
        <p>
          The Total / All board ranks claimed operators. The broader By platform / All view and
          general field breakdown can include unclaimed public rows. An unclaimed row is not
          automatically a historical seed. The plugin names the selected window, view, population,
          available operating ratios and provenance so those scopes stay distinct.
        </p>
        <Link className="text-gold underline underline-offset-4" href="/board/30d">
          Open the 30-day board
        </Link>
      </section>

      <section id="it-admins" className="mt-10 scroll-mt-20 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">For IT admins</h2>
        <p>
          <strong className="text-text-primary">Authentication: none.</strong> The connector is public
          and read-only for analysis. There are no accounts, API keys, OAuth or SSO settings to configure.
        </p>
        <p>
          <strong className="text-text-primary">Server URL</strong> (Streamable HTTP):
        </p>
        <pre className="overflow-x-auto rounded border border-border-base bg-surface p-3 font-mono text-xs text-text-primary">
          {ANALYST_MCP_URL}
        </pre>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border-base font-mono text-text-primary">
                <th className="py-2 pr-4 font-semibold">Tool</th>
                <th className="py-2 pr-4 font-semibold">What it does</th>
                <th className="py-2 font-semibold">Access</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_TOOLS.map(tool => (
                <tr key={tool.name} className="border-b border-border-base align-top">
                  <td className="py-2 pr-4 font-mono text-text-primary">{tool.name}</td>
                  <td className="py-2 pr-4">{tool.summary}</td>
                  <td className="py-2">{tool.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong className="text-text-primary">Data handling.</strong> The server receives only tool
          arguments: codenames, time windows, board views and filters, and, for a bug report, the
          report text and an optional reply email. It does not receive prompts, conversation content or
          account identity. Lookups are not stored in a SignalAF database. A short diagnostic log line
          (method, tool name, client name and user agent, but no arguments) is written only when a
          request stalls or times out, and our hosting provider keeps standard request logs under its
          own retention. Rate-limit counters keyed by IP address expire within about an hour. Bug
          reports are kept while the issue is open and for up to 90 days after it closes, as set out in
          the privacy policy.
        </p>
        <p>
          <strong className="text-text-primary">Network.</strong> The connector needs outbound HTTPS
          to <span className="font-mono">analyst.signalaf.com</span> only. Add it to your allowlist if
          your organization restricts domains.
        </p>
        <p>
          <strong className="text-text-primary">Disabling.</strong> Admins can turn the connector off
          for the whole organization in Claude&apos;s connector settings, like any other connector.
        </p>
        <p>
          <strong className="text-text-primary">Contact.</strong>{" "}
          <a className="text-gold underline underline-offset-4" href="mailto:hello@signalaf.com">hello@signalaf.com</a>
          {" · "}
          <Link className="text-gold underline underline-offset-4" href="/privacy">Privacy policy</Link>
          {" · "}
          <Link className="text-gold underline underline-offset-4" href="/terms">Terms</Link>
        </p>
      </section>

      <section className="mt-10 space-y-4 font-sans text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-xl font-bold text-text-primary">Beta support</h2>
        <p>
          The beta troubleshooter can help draft a short reproducible bug report. It sends a report
          to SignalAF support only after you approve the displayed contents. Do not include
          passwords, private logs or conversation transcripts.
        </p>
        <div className="flex flex-wrap gap-5">
          <Link className="text-gold underline underline-offset-4" href="/contact">Report an issue</Link>
          <Link className="text-gold underline underline-offset-4" href="/privacy">Privacy policy</Link>
          <Link className="text-gold underline underline-offset-4" href="/terms">Terms</Link>
        </div>
      </section>
    </div>
  );
}
