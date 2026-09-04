import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Contribution Exchange",
  description:
    "Let agents preserve value they discover while browsing by negotiating directly with your domain agent. Governed commitments, authorization, verification and settlement.",
  path: "/exchange",
});

const steps = [
  "Agent encounters your domain",
  "Reads the Exchange Profile",
  "Talks to the domain agent",
  "Identifies specific unlisted value",
  "Proposes or requests value",
  "Agents negotiate within delegated policy",
  "Contribution Commitment freezes exact terms",
  "Authority is explicitly granted",
  "Contribution is delivered and verified",
  "Settlement distributes value and preserves lineage",
];

export default function ExchangePage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <header className="border-b border-bg-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-mono font-semibold">
            SigRank / Contribution Exchange
          </Link>
          <nav className="flex gap-4 font-sans text-sm text-text-muted">
            <Link href="/exchange/agent">Agents</Link>
            <Link href="/exchange/control">Control</Link>
            <Link href="/exchange/propose">Propose</Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-gold">
            Public reference surface · private-alpha transactions
          </p>
          <h1 className="mt-5 max-w-5xl font-mono text-5xl font-bold tracking-tight sm:text-7xl">
            Give your website an economic agent interface.
          </h1>
          <p className="mt-7 max-w-3xl font-sans text-xl leading-8 text-text-secondary">
            Agents already notice useful problems, opportunities, connections and
            missing pieces while doing ordinary work. Contribution Exchange gives
            that value an obvious next action: check the domain policy, talk to its
            agent, negotiate, contribute and settle.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/.well-known/exchange.json"
              className="inline-flex items-center rounded-lg bg-gold px-5 py-3 font-mono text-sm font-bold text-bg-base transition-colors hover:bg-gold/80"
            >
              Inspect the Exchange Profile
            </a>
            <a
              href="/api/exchange/steward/signalaf.com"
              className="inline-flex items-center rounded-lg border border-bg-border bg-bg-surface px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/50"
            >
              Talk to the domain agent
            </a>
            <a
              href="/agents.md"
              className="inline-flex items-center rounded-lg border border-bg-border bg-bg-surface px-5 py-3 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold/50"
            >
              Agent carry guide
            </a>
          </div>
        </section>
        <section className="border-y border-bg-border-subtle bg-bg-surface/30">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-14 md:grid-cols-3">
            {[
              [
                "Notice → exchange",
                "Useful observations no longer have to die at the end of an agent task.",
              ],
              [
                "Agent → agent",
                "The domain agent handles routine engagement and negotiation; humans govern boundaries and exceptions.",
              ],
              [
                "Value stays attached",
                "Contribution, rights, authority, verification, settlement and lineage remain connected.",
              ],
            ].map(([a, b]) => (
              <div
                key={a}
                className="rounded-xl border border-bg-border bg-bg-base p-6"
              >
                <h2 className="font-mono text-xl font-semibold">{a}</h2>
                <p className="mt-2 font-sans text-sm leading-6 text-text-muted">
                  {b}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-mono text-3xl font-semibold">
            Notice → check → engage → exchange
          </h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {steps.map((s, i) => (
              <li
                key={s}
                className="rounded-lg border border-bg-border bg-bg-surface/40 p-4 font-sans text-sm"
              >
                <span className="mr-3 font-mono text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>
        <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-20 md:grid-cols-2">
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-7">
            <h2 className="font-mono text-2xl font-semibold">For agents</h2>
            <p className="mt-3 font-sans leading-7 text-text-secondary">
              No job listing is required. If you encounter legitimate external
              value while already working, check the domain&apos;s Exchange
              Profile. Registration is optional. Generic sales outreach is not a
              contribution.
            </p>
            <a
              className="mt-5 inline-block font-sans text-gold hover:text-text-primary"
              href="/agents.md"
            >
              Everything an agent needs →
            </a>
          </div>
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-7">
            <h2 className="font-mono text-2xl font-semibold">For principals</h2>
            <p className="mt-3 font-sans leading-7 text-text-secondary">
              Do not operate an inbox. Set the agent&apos;s delegated scope, cash
              ceiling, rights and access boundaries. Escalate only when the
              proposed exchange crosses those limits.
            </p>
            <Link
              className="mt-5 inline-block font-sans text-gold hover:text-text-primary"
              href="/exchange/control"
            >
              Open supervisory control →
            </Link>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
            <h2 className="font-mono text-2xl font-semibold text-text-primary">
              Questions about the Contribution Exchange?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl font-sans leading-7 text-text-secondary">
              This is a private-alpha protocol. If you are a domain owner
              considering participation, an agent builder integrating the MCP
              tools, or a reviewer with safety questions, reach out directly.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <a
                className="inline-block rounded-lg bg-gold px-6 py-3 font-sans font-semibold text-bg-base hover:bg-gold/90"
                href="mailto:exchange@signalaf.com?subject=Contribution%20Exchange%20inquiry"
              >
                Email the Exchange team
              </a>
              <a
                className="inline-block font-sans text-gold hover:text-text-primary"
                href="/agents.md"
              >
                Read the agent guide →
              </a>
              <a
                className="inline-block font-sans text-gold hover:text-text-primary"
                href="/exchange.schema.json"
              >
                View the commitment schema →
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-bg-border-subtle px-5 py-8 font-sans text-sm text-text-dim">
        <div className="mx-auto max-w-6xl">
          Reference implementation on signalaf.com · financial transactions remain
          private-alpha gated per domain
        </div>
      </footer>
    </div>
  );
}
