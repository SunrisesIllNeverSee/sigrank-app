import Link from "next/link";
import { vercelMarketplaceBadgeEnabled } from "@/lib/flags";

/**
 * VercelMarketplaceBadge — the "Available on Vercel" pill linking to the
 * /vercel integration surface (deploy button, MCP endpoint, marketplace
 * configuration). Mounted on the homepage and board pages.
 *
 * Server component: visibility is gated by the `vercel_marketplace_badge`
 * PostHog flag, evaluated at render time — on ISR pages the flag value
 * holds until the next revalidation. Renders nothing when the flag is off
 * or undecidable.
 */
export async function VercelMarketplaceBadge() {
  if (!(await vercelMarketplaceBadgeEnabled())) return null;
  return (
    <div className="flex justify-center">
      <Link
        href="/vercel"
        className="inline-flex items-center gap-2 rounded-full border border-bg-border bg-bg-elevated px-3.5 py-1.5 font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        <span aria-hidden="true">▲</span> Available on Vercel
      </Link>
    </div>
  );
}
