import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { ExchangeManageClient } from "@/components/exchange/ExchangeManageClient";

export const metadata: Metadata = {
  ...withOG({
    title: "Manage Contribution Exchange",
    description:
      "Manage a single contribution exchange: negotiation, commitment, authorization, delivery, verification and settlement.",
    path: "/exchange/manage",
  }),
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-bg-base px-5 py-12 text-text-primary">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link
            href="/exchange"
            className="font-sans text-sm text-text-muted hover:text-text-primary"
          >
            ← Exchange Gateway
          </Link>
          <code className="font-mono text-xs text-text-dim">{id}</code>
        </div>
        <h1 className="mt-7 font-mono text-4xl font-bold">
          Contribution Exchange
        </h1>
        <p className="mt-3 max-w-3xl font-sans text-text-secondary">
          One shared lifecycle for proposal, negotiation, commitment,
          authorization, delivery, verification and settlement. Credentials remain
          in your browser session only.
        </p>
        <div className="mt-9">
          <ExchangeManageClient publicId={id} />
        </div>
      </div>
    </main>
  );
}
