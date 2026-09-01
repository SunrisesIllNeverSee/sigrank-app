import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Developer Portal — API, MCP & CLI Docs",
  description:
    "Developer resources for SigRank SignalAF: REST API, OpenAPI schema, authentication, MCP server, Vercel integration, CLI quickstart, errors, rate limits, and versioning policy.",
  path: "/developers",
});

const resources = [
  ["OpenAPI 3.0", "/openapi.json", "Machine-readable REST API contract"],
  ["Authentication", "/auth.md", "OAuth, public reads, protected writes"],
  ["MCP server", "/mcp", "Model Context Protocol setup and tools"],
  ["SigRank for Vercel", "/vercel", "Deploy MCP, run the free diagnostic, and connect Agent Tools"],
  ["MCP manifest", "/.well-known/mcp.json", "Machine-readable MCP discovery"],
  ["Agent index", "/llms.txt", "When to use SignalAF and canonical resources"],
  ["Methodology", "/methodology", "Metric definitions and evidence boundary"],
] as const;

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
        SignalAF developers
      </p>
      <h1 className="mt-3 font-mono text-3xl font-bold text-text-primary sm:text-4xl">
        SignalAF Developer Portal
      </h1>
      <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed text-text-secondary">
        SigRank SignalAF exposes public operator-benchmark data through a versioned
        REST API, an OpenAPI document, the official <code className="font-mono">sigrank</code>{" "}
        CLI, Model Context Protocol tools, and a Vercel-native deployment path. Public read endpoints do not require
        credentials. Protected writes use the authentication flow documented in{" "}
        <Link href="/auth.md" className="text-gold hover:text-text-primary">auth.md</Link>.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">Quickstart</h2>
        <div className="mt-4 space-y-3 rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-sm text-text-secondary">{`# Read the public leaderboard
curl -s https://signalaf.com/api/v1/leaderboard

# Inspect the API contract
curl -s https://signalaf.com/openapi.json

# Connect the remote MCP server
https://signalaf.com/api/mcp

# Run the official CLI / local MCP server
npx sigrank`}</pre>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">Developer resources</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {resources.map(([title, href, desc]) => (
            <Link key={href} href={href} className="rounded-lg border border-bg-border bg-bg-surface p-4 transition-colors hover:border-gold/50">
              <h3 className="font-mono text-sm font-bold text-text-primary">{title}</h3>
              <p className="mt-2 font-sans text-sm text-text-secondary">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="authentication" className="mt-10 scroll-mt-24">
        <h2 className="font-mono text-xl font-bold text-text-primary">Authentication</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Public leaderboard and operator reads are credential-free. User-authorized
          writes use Supabase OAuth/session authentication. Bulk corpus access can use
          an issued API key via <code className="font-mono">x-api-key</code>; there is
          currently no self-service key issuance UI. See <Link href="/auth.md" className="text-gold">auth.md</Link>.
        </p>
      </section>

      <section id="errors" className="mt-10 scroll-mt-24">
        <h2 className="font-mono text-xl font-bold text-text-primary">Errors</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          REST failures use RFC 9457 Problem Details with media type{" "}
          <code className="font-mono">application/problem+json</code>. Every problem
          includes HTTP <code className="font-mono">status</code>, a stable machine-readable{" "}
          <code className="font-mono">code</code>, human-readable <code className="font-mono">detail</code>,
          and, when recovery is possible, a <code className="font-mono">hint</code>.
        </p>
      </section>

      <section id="rate-limits" className="mt-10 scroll-mt-24">
        <h2 className="font-mono text-xl font-bold text-text-primary">Rate limits</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Public list reads use a 60-request, 60-second best-effort per-instance
          window. Responses expose <code className="font-mono">RateLimit-Policy</code>{" "}
          and <code className="font-mono">RateLimit</code> structured fields, with
          compatibility <code className="font-mono">RateLimit-Limit</code>,{" "}
          <code className="font-mono">RateLimit-Remaining</code>, and{" "}
          <code className="font-mono">RateLimit-Reset</code> fields. A 429 also includes{" "}
          <code className="font-mono">Retry-After</code>.
        </p>
      </section>

      <section id="versioning" className="mt-10 scroll-mt-24">
        <h2 className="font-mono text-xl font-bold text-text-primary">Versioning and deprecation</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Stable REST endpoints are versioned in the URL, currently{" "}
          <code className="font-mono">/api/v1</code>. Breaking contract changes ship
          under a new major API path. When a v1 operation is scheduled for retirement,
          SignalAF will return a <code className="font-mono">Deprecation</code> header and
          an HTTP-date <code className="font-mono">Sunset</code> header on that operation,
          while the OpenAPI document and this page identify its replacement.
        </p>
      </section>

      <section id="sandbox" className="mt-10 scroll-mt-24">
        <h2 className="font-mono text-xl font-bold text-text-primary">Sandbox</h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          No separate hosted write sandbox exists today. For non-mutating integration work,
          use the public read API or run <code className="font-mono">npx sigrank</code>{" "}
          locally. Do not send test writes to production. A hosted write sandbox is a
          separate product/infrastructure decision.
        </p>
      </section>
    </div>
  );
}
