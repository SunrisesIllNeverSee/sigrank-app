import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import Link from "next/link";
import { SupportCheckout } from "@/components/billing/SupportCheckout";

/**
 * app/upgrade/page.tsx — the "back the build" checkout-start page.
 *
 * Target of the homepage's "Support the build" CTA. The heavy lifting is the
 * client SupportCheckout island, which POSTs to
 * /api/v1/billing/create-checkout-session and redirects to Stripe. With no
 * Stripe creds the API 503s and the island shows "not live yet" — it NEVER
 * falsely completes a sale. ?tier= preselects patron (the early-supporter tier).
 *
 * Owner directive 2026-07-19: no paid tiers, no subscriptions, no "precision
 * tier" promises. This page is a one-time "pay what helps" donation only.
 */

export const metadata: Metadata = withOG({
  title: "Back the build",
  description:
    "Support SigRank with a one-time contribution. The leaderboard is free and stays free.",
  path: "/upgrade",
});

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  void tier; // preset selection is handled inside SupportCheckout
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-2 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-gold">
          ◈ Back the build
        </span>
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Support the build
        </h1>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The leaderboard is free and stays free. If you find SigRank useful,
          consider a one-time contribution to support the ongoing build. No
          subscriptions, no tiers, no paywalls — just support if you want to.
        </p>
      </header>

      <SupportCheckout />

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What your support does
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Your contribution funds the ongoing build — server costs, data
          infrastructure, and the time it takes to keep the leaderboard
          accurate and independent. The leaderboard itself — the board, the
          Hall, the metrics pages — stays free for everyone.
        </p>
      </section>

      <p className="text-center font-mono text-[11px] text-text-dim">
        Secure checkout via Stripe ·{" "}
        {/* TODO(sweep 2026-06-22): /pro removed in ITEM 1 — repointed to /wiki; restore the Pro explainer target when Stripe goes live in the new repo. */}
        <Link
          href="/wiki"
          className="text-text-muted underline hover:text-text-secondary"
        >
          what you&apos;re backing
        </Link>
      </p>
    </div>
  );
}
