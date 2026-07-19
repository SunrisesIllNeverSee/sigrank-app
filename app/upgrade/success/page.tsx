import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Payment complete",
  description:
    "Thank you for supporting SigRank.",
  path: "/upgrade/success",
});

/**
 * Stripe Checkout success_url target.
 * Exists so a completed Checkout lands on a real page instead of a 404.
 */
export default function UpgradeSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-3xl" aria-hidden>
        ✓
      </div>
      <h1 className="text-2xl font-semibold">Thank you</h1>
      <p className="opacity-70">
        Your contribution is appreciated. The leaderboard stays free for
        everyone because of supporters like you.
      </p>
      <Link
        href="/"
        className="rounded-md border px-4 py-2 text-sm hover:opacity-80"
      >
        Back to the board
      </Link>
    </main>
  );
}
