import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Pricing — SignalAF is Free · SigRank SignalAF",
  description:
    "SignalAF is free. The public leaderboard, REST API, MCP server, CLI, and score calculator are all free. Optional support and premium insights are available.",
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

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
        SignalAF pricing
      </p>
      <h1 className="mt-3 font-mono text-3xl font-bold text-text-primary sm:text-4xl">
        SignalAF is free
      </h1>
      <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed text-text-secondary">
        The public SigRank benchmark is free to use. The leaderboard, REST API,
        MCP server, CLI, score calculator, and field analysis are all available
        at no cost. No credit card, no trial, no freemium gates.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          What is free
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
