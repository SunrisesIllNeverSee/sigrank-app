import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Checkout canceled",
  description:
    "Your SigRank checkout was canceled. No charge was made — come back any time.",
  path: "/upgrade/canceled",
});

/** Stripe Checkout cancel_url target (subscription + claim flows). */
export default function UpgradeCanceledPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Checkout canceled</h1>
      <p className="opacity-70">
        No charge was made — you can upgrade any time.
      </p>
      {/* TODO(sweep 2026-06-22): /pro removed in ITEM 1 — repointed to /wiki; restore tiers page when Stripe is live in the new repo. */}
      <Link
        href="/wiki"
        className="rounded-md border px-4 py-2 text-sm hover:opacity-80"
      >
        View tiers
      </Link>
    </main>
  );
}
