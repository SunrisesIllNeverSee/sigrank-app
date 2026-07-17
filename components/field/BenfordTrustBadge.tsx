/**
 * BenfordTrustBadge — one-line trust signal linking to methodology.
 *
 * Shows "Verified by Benford's Law" with the chi-square threshold and a
 * link to the methodology page for details. Placed up-front on the field
 * page as a credibility signal.
 */

import Link from "next/link";

export default function BenfordTrustBadge() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-bg-surface">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-gold"
        >
          <path
            d="M3 8.5L6.5 12L13 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-1 flex-col">
        <span className="font-sans text-sm font-bold text-text-primary">
          Verified by Benford&apos;s Law
        </span>
        <span className="font-mono text-xs text-text-muted">
          All 5 token pillars pass chi-square goodness-of-fit (&chi;&sup2; &lt;
          15.51, p &gt; 0.05). 1,611 non-flagged operators.
        </span>
      </div>
      <Link
        href="/methodology"
        className="font-sans text-xs text-gold underline hover:text-text-primary"
      >
        Details
      </Link>
    </div>
  );
}
