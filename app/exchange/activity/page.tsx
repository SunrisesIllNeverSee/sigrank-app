import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { ExchangeActivityClient } from "@/components/exchange/ExchangeActivityClient";

export const metadata: Metadata = {
  ...withOG({
    title: "Exchange Activity — observability dashboard",
    description:
      "Observe contribution exchange states, encounter data and governance for signalaf.com on the Contribution Exchange.",
    path: "/exchange/activity",
  }),
  robots: { index: false, follow: false },
};

export default function ExchangeActivityPage() {
  return (
    <main className="min-h-screen bg-bg-base px-5 py-12 text-text-primary">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/exchange"
          className="font-sans text-sm text-text-dim hover:text-text-primary"
        >
          ← Exchange
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-gold">
          Observability dashboard
        </p>
        <h1 className="mt-3 font-mono text-4xl font-bold">Exchange Activity</h1>
        <p className="mt-4 max-w-3xl font-sans text-lg leading-8 text-text-secondary">
          Live visibility into contribution exchange states, encounter data and
          governance for signalaf.com. Exchange and encounter endpoints require
          authentication.
        </p>
        <div className="mt-10">
          <ExchangeActivityClient />
        </div>
      </div>
    </main>
  );
}
