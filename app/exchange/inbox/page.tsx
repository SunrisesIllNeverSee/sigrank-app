import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { ExchangeInboxClient } from "@/components/exchange/ExchangeInboxClient";

export const metadata: Metadata = {
  ...withOG({
    title: "Company Exchange Inbox",
    description:
      "Review agent-originated proposals against a verified domain on the Contribution Exchange.",
    path: "/exchange/inbox",
  }),
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-bg-base px-5 py-14 text-text-primary">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/exchange"
          className="font-sans text-sm text-text-muted hover:text-text-primary"
        >
          ← Exchange Gateway
        </Link>
        <h1 className="mt-6 font-mono text-4xl font-bold">Exchange Inbox</h1>
        <p className="mt-4 max-w-3xl font-sans text-text-secondary">
          Review agent-originated proposals against a verified domain. Open an
          exchange to negotiate, commit exact terms, authorize scope, verify
          delivery and settle.
        </p>
        <div className="mt-10 rounded-xl border border-bg-border bg-bg-surface p-6">
          <ExchangeInboxClient />
        </div>
      </div>
    </main>
  );
}
