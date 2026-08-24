import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Pricing — Free During Build Stage · SigRank SignalAF",
  description:
    "SignalAF is free during the build stage. Early users who sign up now are grandfathered into tiered perks based on their signup number. Public leaderboard, REST API, MCP server, CLI, and score calculator are all free.",
  path: "/pricing",
});

const freeFeatures = [
  ["Public leaderboard", "/board/all", "Full operator rankings, all time windows"],
  ["Score calculator", "/score", "Paste token counts, get your Yield — no account"],
  ["REST API", "/developers", "Public reads, OpenAPI spec, rate-limited"],
  ["MCP server", "/mcp", "Streamable HTTP + CLI, 3 tools, no auth required"],
  ["CLI tool", "/developers", "npx sigrank — local scanner and MCP server"],
  ["Field analysis", "/field", "1,498 operator field distribution and statistics"],
];

const earlyTiers = [
  { range: "1–100", label: "Founding operators" },
  { range: "101–250", label: "Early operators" },
  { range: "251–500", label: "Build-stage operators" },
  { range: "501–750", label: "Build-stage operators" },
  { range: "751–1000", label: "Launch operators" },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
        SignalAF pricing
      </p>
      <h1 className="mt-3 font-mono text-3xl font-bold text-text-primary sm:text-4xl">
        Free during the build stage
      </h1>
      <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed text-text-secondary">
        SignalAF is free right now. The public leaderboard, REST API, MCP server,
        CLI, score calculator, and field analysis are all available at no cost
        during the active build stage. No credit card, no trial, no freemium gates.
      </p>
      <p className="mt-3 max-w-3xl font-sans text-base leading-relaxed text-text-secondary">
        Pricing may change as the platform matures. Operators who sign up during
        the build stage keep their access and receive tiered perks based on when
        they joined.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          What is free now
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {freeFeatures.map(([title, href, desc]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-bg-border bg-bg-surface p-4 transition-colors hover:border-gold/50"
            >
              <h3 className="font-mono text-sm font-bold text-text-primary">
                {title}
              </h3>
              <p className="mt-2 font-sans text-sm text-text-secondary">
                {desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Early operator perks
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          The first 1,000 operators get permanent free access. The earlier you
          sign up, the more perks you keep. Specific perks are being finalized,
          but your signup position is locked the moment you join.
        </p>

        <div className="mt-4 rounded-lg border border-bg-border bg-bg-surface p-5">
          <h3 className="font-mono text-sm font-bold text-text-primary">
            What early operators get
          </h3>
          <ul className="mt-3 space-y-2 font-sans text-sm text-text-secondary">
            <li>Permanent free access to all current and future public features</li>
            <li>Special features and tools built specifically for early operators that will not be available to later users</li>
            <li>Priority access to new capabilities before they launch publicly</li>
            <li>Direct input on roadmap and product direction — the earlier you join, the more weight your voice carries</li>
            <li>Permanent recognition as a founding or build-stage operator on your profile</li>
          </ul>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="py-2 pr-4 text-left font-mono text-xs uppercase tracking-wide text-text-secondary">
                  Signup #
                </th>
                <th className="py-2 text-left font-mono text-xs uppercase tracking-wide text-text-secondary">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {earlyTiers.map((tier) => (
                <tr key={tier.range} className="border-b border-bg-border/50">
                  <td className="py-3 pr-4 font-mono text-text-primary">
                    {tier.range}
                  </td>
                  <td className="py-3 font-sans text-text-primary">
                    {tier.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-sans text-xs leading-relaxed text-text-tertiary">
          The earlier your tier, the more of the above you receive. The tier
          structure and signup-order commitment will not change.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Premium and support
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Premium operator insights and cascade reports are available via x402
          USDC micropayments. Optional build support is available through{" "}
          <Link href="/upgrade" className="text-gold hover:text-text-primary">
            /upgrade
          </Link>
          . These fund ongoing development and data collection.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          Developer resources
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          API documentation, OpenAPI spec, authentication, MCP setup, and CLI
          quickstart are at{" "}
          <Link href="/developers" className="text-gold hover:text-text-primary">
            /developers
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
