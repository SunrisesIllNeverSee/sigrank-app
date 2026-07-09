import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Payment complete",
  description:
    "Thank you for backing SigRank — your founding-supporter perks are locked in.",
  path: "/upgrade/success",
});

/**
 * Stripe Checkout success_url target (subscription + claim flows).
 * Stub for the token-only launch — exists so a completed TEST-mode Checkout
 * lands on a real page instead of a 404. Reading ?session_id / ?claim to show
 * the finalized tier wires in at billing finalize (Gate-2).
 */
export default function UpgradeSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-3xl" aria-hidden>
        ✓
      </div>
      <h1 className="text-2xl font-semibold">Payment complete</h1>
      <p className="opacity-70">
        Your supporter tier is active. Pro metrics and any claimed operator
        entry unlock on the next board read.
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
