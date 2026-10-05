/**
 * lib/seo/indexing-policy.ts — the single search-index eligibility contract
 * for operator profile surfaces (SEARCH-RECOVERY Phase 1).
 *
 * One policy governs both consumers, so they can never disagree:
 *
 *   app/user/[codename]/page.tsx  — `robots` metadata (index,follow vs
 *                                   noindex,follow) via operatorProfileRobots.
 *   app/sitemap.ts                — sitemap inclusion via operatorSitemapEntry.
 *
 * A profile is search-indexable iff the operator is claimed, not retired, not
 * private, and has at least one metric snapshot. `verification_status` is
 * deliberately NOT part of the contract — it currently flags too few
 * legitimate live users to be an index-eligibility signal.
 *
 * This module is import-free by design so `node --test` suites can import the
 * real predicate directly (see __tests__/seo/indexing-policy.test.mjs) — a
 * mirrored copy could drift from production behavior undetected.
 */

export interface SearchIndexableOperator {
  claimed: boolean;
  status?: string | null;
  profile_visibility?: string | null;
}

/**
 * Is this operator profile eligible for Google Search indexing?
 * `hasMetricSnapshot` is supplied by the caller because the signal differs by
 * surface: the profile page knows it as `!row.pending`; the sitemap derives it
 * from a snapshot-existence query.
 */
export function isIndexableOperatorProfile(
  operator: SearchIndexableOperator,
  hasMetricSnapshot: boolean,
): boolean {
  return (
    operator.claimed === true &&
    operator.status !== "retired" &&
    operator.profile_visibility !== "private" &&
    hasMetricSnapshot
  );
}

/**
 * `robots` metadata for an operator profile page. Ineligible profiles emit
 * `noindex, follow` — the page stays a 200 for humans and Google still follows
 * its links (the profile is part of the product surface; it is only excluded
 * from the index). Never 404 or redirect a profile solely over indexing.
 */
export function operatorProfileRobots(
  operator: SearchIndexableOperator,
  hasMetricSnapshot: boolean,
): { index: boolean; follow: boolean } {
  return isIndexableOperatorProfile(operator, hasMetricSnapshot)
    ? { index: true, follow: true }
    : { index: false, follow: true };
}

export interface SitemapOperatorRecord extends SearchIndexableOperator {
  codename: string;
}

export interface OperatorSitemapEntry {
  url: string;
  changeFrequency: "daily";
  priority: number;
}

/**
 * A sitemap entry for an operator profile, or null when the profile is not
 * search-indexable. Invariant: a /user/<codename> URL appears in sitemap.xml
 * iff its page is eligible for `index,follow`. Entries carry no `lastModified`
 * — Phase 1 emits no synthesized freshness timestamps.
 */
export function operatorSitemapEntry(
  operator: SitemapOperatorRecord,
  hasMetricSnapshot: boolean,
  origin: string,
): OperatorSitemapEntry | null {
  if (!isIndexableOperatorProfile(operator, hasMetricSnapshot)) return null;
  return {
    // encodeURIComponent keeps <loc> byte-identical to the page's
    // self-canonical (generated from the already-encoded raw codename).
    url: `${origin}/user/${encodeURIComponent(operator.codename)}`,
    changeFrequency: "daily",
    priority: 0.8,
  };
}
