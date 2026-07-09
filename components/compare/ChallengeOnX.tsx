"use client";

/**
 * ChallengeOnX — social viral loop for the compare page.
 *
 * Generates a pre-filled X/Twitter intent link so a visitor can tag an
 * operator's X handle with a throw-down challenge. Works regardless of the
 * GATE_CHALLENGES flag — it's just a share button, not part of the challenge
 * backend.
 *
 * If an operator has no X handle, the tweet falls back to their display name
 * (no @ tag). If neither operator has an X handle, the button still works —
 * it just posts the compare link without tags.
 */

import Link from "next/link";

interface ChallengeOnXProps {
  /** Display name for operator A. */
  nameA: string;
  /** Display name for operator B. */
  nameB: string;
  /** X handle for operator A (without @), if they have one. */
  xA?: string | null;
  /** X handle for operator B (without @), if they have one. */
  xB?: string | null;
  /** Compare page URL (with ?a=&b= params). */
  compareUrl: string;
}

export function ChallengeOnX({
  nameA,
  nameB,
  xA,
  xB,
  compareUrl,
}: ChallengeOnXProps) {
  // Build the tag text: @handle if available, otherwise just the name
  const tagA = xA ? `@${xA}` : nameA;
  const tagB = xB ? `@${xB}` : nameB;

  const text = `⚔️ Throw-down challenge:\n\n${tagA} vs ${tagB}\n\nToken cascade head-to-head. Who compounds signal better?\n\n${compareUrl}`;

  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <Link
      href={intentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-text-muted/30 bg-bg-surface px-4 py-2 font-mono text-xs font-bold text-text-secondary transition-colors hover:border-text-muted/60 hover:bg-bg-surface/80"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 fill-current"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Challenge on X
    </Link>
  );
}
