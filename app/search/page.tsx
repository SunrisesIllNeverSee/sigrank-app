import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { exchangeSearchEnabled } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Search",
  description: "Site-wide search across SigRank operators, wiki, signals, and exchange records.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * /search — site-wide search surface, gated by the `exchange_search`
 * PostHog flag. While the flag is off (0% rollout — Algolia not yet
 * connected) the route 404s and the nav entry stays hidden; flipping the
 * flag in PostHog turns the surface on without a deploy.
 *
 * Current state is a rollout shell: the flag gate is live and evaluated,
 * the Algolia InstantSearch interface plugs in here when the index lands
 * (see docs/VERCEL_MARKETPLACE_PLAN.md step 2a).
 */
export default async function SearchPage() {
  if (!(await exchangeSearchEnabled())) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
        Site Search
      </p>
      <h1 className="font-mono text-2xl font-bold text-text-primary">
        Algolia-powered search is rolling out
      </h1>
      <p className="font-sans text-sm text-text-secondary">
        Site-wide search across operators, wiki, signals, and exchange
        records is being indexed. Until it lands, the leaderboard and wiki
        are the fastest paths in.
      </p>
      <div className="mt-2 flex items-center gap-4 font-mono text-sm">
        <Link href="/board/all" className="text-text-accent underline underline-offset-4 hover:text-text-primary">
          Leaderboard
        </Link>
        <Link href="/wiki" className="text-text-accent underline underline-offset-4 hover:text-text-primary">
          Wiki
        </Link>
      </div>
    </div>
  );
}
