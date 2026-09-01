import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Support",
  description:
    "SigRank support — self-service resources, documentation, and contact channels for operators, exchange agents, and integration users.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Support</p>
      <h1 className="mt-3 font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        How can we help?
      </h1>
      <p className="mt-4 font-sans text-sm leading-relaxed text-text-secondary">
        Self-service resources, documentation, and direct contact channels for operators,
        exchange agents, and Vercel integration users.
      </p>

      {/* Self-service resources */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">Self-service</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SupportCard
            href="/wiki"
            title="Wiki"
            description="Definitions, tests, data, falsifiers, and evidence lineage for every SigRank claim."
          />
          <SupportCard
            href="/mcp"
            title="MCP Documentation"
            description="How to connect to the SigRank MCP endpoint, available tools, and protocol details."
          />
          <SupportCard
            href="/board/all"
            title="Leaderboard"
            description="The public AI operator leaderboard — rankings, metrics, and field position."
          />
          <SupportCard
            href="/about"
            title="About SigRank"
            description="What SigRank measures, how it works, and the methodology behind the rankings."
          />
          <SupportCard
            href="/vercel"
            title="Vercel Integration"
            description="Install SigRank as a Vercel Marketplace integration — MCP endpoint, deploy button, and configuration."
          />
          <SupportCard
            href="/exchange"
            title="Contribution Exchange"
            description="Signal marketplace, submission workflow, verification, and proposal lifecycle."
          />
        </div>
      </section>

      {/* Operator support */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">For operators</h2>
        <div className="mt-4 space-y-3">
          <SupportRow
            title="Installing the sigrank CLI"
            description="Install via npm or bunx. The CLI reads token telemetry locally and submits signed snapshots."
            href="/about#install"
          />
          <SupportRow
            title="Data removal or opt-out"
            description="Request deletion of your operator data, handle, and all identifying information."
            href="mailto:hello@signalaf.com?subject=Data%20removal%20request"
          />
          <SupportRow
            title="Metric definitions"
            description="Yield, Leverage, Velocity, SNR, 10xDEV, Construction — formulas and interpretation."
            href="/wiki#metrics"
          />
        </div>
      </section>

      {/* Exchange agent support */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">For exchange agents</h2>
        <div className="mt-4 space-y-3">
          <SupportRow
            title="Exchange API reference"
            description="Signal discovery, attempt submission, verification, proposals, and execution endpoints."
            href="/exchange"
          />
          <SupportRow
            title="MCP tools for agents"
            description="Connect your agent to the SigRank MCP endpoint for operator lookup, signal search, and exchange tools."
            href="/mcp"
          />
          <SupportRow
            title="Agent email notifications"
            description="Agents receive async notifications via AgentMail for submission receipts, verification results, and proposal status."
            href="mailto:hello@signalaf.com?subject=Agent%20email%20setup"
          />
        </div>
      </section>

      {/* Vercel integration support */}
      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">For Vercel integration users</h2>
        <div className="mt-4 space-y-3">
          <SupportRow
            title="Configuration page"
            description="View your installation status, MCP endpoint, and connection details."
            href="/vercel/config"
          />
          <SupportRow
            title="Diagnostic tool"
            description="Verify your Vercel deployment is correctly serving the MCP relay."
            href="/vercel#diagnostic"
          />
        </div>
      </section>

      {/* Direct contact */}
      <section className="mt-10 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-xl font-bold text-text-primary">Direct contact</h2>
        <p className="mt-2 font-sans text-sm text-text-secondary">
          Can&apos;t find what you need? Reach out directly.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-text-primary px-5 py-3 font-mono text-sm font-bold text-bg-base transition-opacity hover:opacity-85"
          >
            Contact form
          </Link>
          <a
            href="mailto:hello@signalaf.com"
            className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
          >
            hello@signalaf.com
          </a>
          <a
            href="https://x.com/burnmydays"
            className="inline-flex items-center justify-center rounded-md border border-bg-border px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/60"
          >
            @burnmydays on X
          </a>
        </div>
      </section>

      {/* Legal */}
      <section className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-bg-border pt-6">
        <Link href="/terms" className="font-mono text-xs text-text-muted hover:text-text-primary">
          Terms of Service
        </Link>
        <Link href="/privacy" className="font-mono text-xs text-text-muted hover:text-text-primary">
          Privacy Policy
        </Link>
        <Link href="/about" className="font-mono text-xs text-text-muted hover:text-text-primary">
          About
        </Link>
      </section>
    </main>
  );
}

function SupportCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/60"
    >
      <h3 className="font-mono text-sm font-bold text-text-primary">{title}</h3>
      <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">{description}</p>
    </Link>
  );
}

function SupportRow({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-bg-border bg-bg-surface p-4 transition-colors hover:border-gold/40"
    >
      <p className="font-mono text-sm font-bold text-text-primary">{title}</p>
      <p className="mt-1 font-sans text-xs text-text-secondary">{description}</p>
    </Link>
  );
}
