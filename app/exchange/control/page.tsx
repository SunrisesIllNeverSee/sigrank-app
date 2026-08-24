import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { ExchangeControlClient } from "@/components/exchange/ExchangeControlClient";

export const metadata: Metadata = withOG({
  title: "Exchange Control — policy, escalations and economics",
  description:
    "Govern a domain Exchange Agent: delegation policy, principal escalations, activity and settled economics.",
  path: "/exchange/control",
});

export default function ExchangeControlPage() {
  return (
    <main className="min-h-screen bg-bg-base px-5 py-12 text-text-primary">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/exchange"
          className="font-sans text-sm text-text-dim hover:text-text-primary"
        >
          ← Exchange
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-gold">
          Human supervisory surface
        </p>
        <h1 className="mt-3 font-mono text-4xl font-semibold">
          Govern the agent. Do not operate the inbox.
        </h1>
        <p className="mt-4 max-w-3xl font-sans text-lg leading-8 text-text-secondary">
          Set what the domain agent may engage, what requires a principal, and where
          execution authority stops. Routine agent-to-agent exchange should proceed
          without a human polling proposals.
        </p>
        <div className="mt-10">
          <ExchangeControlClient />
        </div>
      </div>
    </main>
  );
}
