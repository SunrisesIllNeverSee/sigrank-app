/**
 * app/user/[codename]/page.tsx — the operator profile page (was /operators/[codename], owner 2026-06-22).
 *
 * "The single most important page after the homepage" (site_architecture.md
 * §Operator profile). AUTH_LAUNCH_DIRECTIVES D6: a GitHub-style multi-tab workspace —
 * a persistent identity header (avatar / name / class / rank) over three tabs:
 *
 *   • Stats        — view-only cascade dashboard (KPIs, radars, op-ratio, heat, trend)
 *   • Submissions  — manual project/build showcase (D9 — not yet built; empty state)
 *   • Social       — self-promo identity: handle, location, bio, links
 *
 * RSC: reads the operator + history through the @/lib/data facade (mock fallback when
 * Supabase is unset). The three panels are server-rendered here and handed to the
 * ProfileTabs client island, which only mounts the active one. ScoreBreakdown-style
 * client islands receive plain serializable props resolved here, so RS.xx weights never
 * reach the client.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import {
  getOperator,
  isOperatorRetired,
} from "@/lib/board";
import { decodeCodename } from "@/lib/route-params";
import { withOG } from "@/lib/seo";
import { operatorProfileRobots } from "@/lib/seo/indexing-policy";
import type { Operator } from "@/lib/analytics/scoring-types";
import { CompareAgainstMe } from "@/components/profile/CompareAgainstMe";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ClaimedBadge } from "@/components/claim/ClaimedBadge";
import { TrackProfileView } from "@/components/analytics/TrackProfileView";

import { ProfileBody } from "./ProfileBody";
import { ProfileWorkspace } from "@/components/profile-v2/ProfileWorkspace";

// ISR: revalidate every 6 hours. Profile data doesn't change frequently —
// operators submit snapshots at most a few times per day, and on-demand
// revalidation via revalidateTouchedWindows fires on snapshot submit so
// the page updates immediately after a submission regardless of the ISR
// window. The 21600s ISR is a safety net that cuts cold-miss DB queries
// 6x vs the previous 3600s, which matters because the /user/[codename]
// route does 8 DB queries on a cold miss and Supabase compute is a cost
// constraint. The data-layer cache (unstable_cache on getOperator etc.)
// provides a second tier at 90-300s for data freshness.
//
// FIX (2026-08-28): removed `force-static` and the explicit Cache-Control
// header in next.config.ts. force-static + the explicit s-maxage=21600
// header overrode Vercel's native ISR edge caching, preventing
// revalidatePath() from busting the edge CDN cache after a snapshot submit.
// Without force-static, `revalidate` alone gives ISR with native Vercel
// edge caching that respects revalidatePath — the profile now updates
// immediately after a submission instead of serving stale HTML for up to 6h.
export const revalidate = 21600;

/**
 * On-demand ISR: return [] so no profiles are prerendered at build time,
 * but each profile is generated on first visit then ISR-cached for 21600s (6h).
 * Without this, Next.js 15 treats the dynamic route as fully dynamic (ƒ),
 * rendering every request on demand with no caching — the p95 3.8s TTFB.
 * With generateStaticParams returning [], the route becomes ISR (○ with
 * dynamicParams=true default), so the first visit generates + caches, and
 * subsequent visits hit the edge cache until revalidate expires.
 */
export function generateStaticParams() {
  return [];
}

/**
 * Resolve the display name for an operator. display_name now carries both the
 * claimed operator's chosen name AND the seed's real handle (public tokscale
 * footprints, migrated from SEED_IDENTITY → Supabase 2026-06-20); otherwise the
 * codename. This mirrors the board's cell so profile and board agree on who is who.
 */
function resolveName(operator: Operator): string {
  // display_name now carries the seed's real handle too (migrated to Supabase
  // 2026-06-20) — one rule covers claimed + seed.
  return operator.display_name ?? operator.codename;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codename: string }>;
}): Promise<Metadata> {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename);
  // Retired operators (opt-out): no metadata (they redirect to the leaderboard).
  if (await isOperatorRetired(codename)) return { title: "SigRank Leaderboard" };
  const row = await getOperator(codename);
  if (!row) return { title: "Operator not found" };
  const name = resolveName(row.operator);
  const c = row.snapshot.cascade;
  const yieldLabel =
    c && !c.nonCompounding
      ? ` · Υ ${c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(0)}`
      : "";
  const title = `${name}${yieldLabel}`;
  const description = row.pending
    ? `${name} — an operator on SigRank (not ranked yet).`
    : `${name} — ${row.snapshot.class_tier}, rank #${row.global_rank} on the SigRank leaderboard.`;
  // robots comes from the shared indexing policy (lib/seo/indexing-policy.ts):
  // claimed + non-retired + non-private + at least one metric snapshot gets
  // index,follow; everyone else (seed/unclaimed, private, no-snapshot) keeps a
  // live 200 page but emits noindex,follow. !row.pending == "has a snapshot".
  const meta = withOG({
    title,
    description,
    path: `/user/${rawCodename}`,
  });
  return { ...meta, robots: operatorProfileRobots(row.operator, !row.pending) };
}

export default async function OperatorProfilePage({
  params,
}: {
  params: Promise<{ codename: string }>;
}) {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename); // see decodeCodename — fixes "·"/space seed codenames 404

  // PERF (2026-08-28): parallelize isOperatorRetired + getOperator.
  // Was 2 sequential awaits (2 round trips); now 1 Promise.all.
  // isOperatorRetired is uncached (fresh status check), getOperator is
  // unstable_cache'd at 90s. Running them in parallel saves ~200ms on
  // cold misses.
  const [retired, row] = await Promise.all([
    isOperatorRetired(codename),
    getOperator(codename),
  ]);

  // Retired operators (opt-out): redirect to the leaderboard. No profile page,
  // no 404 — they stay on the board with their tokens but aren't clickable.
  if (retired) redirect("/leaderboard");
  if (!row) notFound();

  const { operator } = row;

  // PERF (2026-08-28): streaming via Suspense.
  // The action row renders immediately with just getOperator data (critical
  // path). The heavy body (5 parallel DB queries: history, submissions,
  // report, leaderboard, hall) streams in via <Suspense> — including the
  // V2 identity hero, which lives inside OverviewView.

  // Auth state (isOwner, isSignedIn, hasOperator) is resolved CLIENT-SIDE via
  // ProfileAuthGate so this page stays ISR-cached (edge s-maxage=21600).
  // Server renders with isOwner=false — correct for non-owners and for the
  // (currently zero) private profiles. Owners see a brief default state before
  // the client gate resolves, then interactive features (ReportTab toggle,
  // LabTab sliders, ClaimTab) appear.

  return (
    <Suspense fallback={<div>Loading profile workspace…</div>}>
    <ProfileWorkspace name={resolveName(operator)} codename={operator.codename}
      rank={row.pending ? null : row.global_rank} tier={row.snapshot.class_tier}
      platform={operator.primary_domain}
      yieldLabel={row.snapshot.cascade?.nonCompounding ? "—" : (row.snapshot.cascade?.yield_?.toFixed(2) ?? "—")}
      actions={<div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/board/all"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          ← Leaderboard
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/compare?a=${encodeURIComponent(operator.codename)}`}
            className="rounded-md border border-bg-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Compare →
          </a>
          <CompareAgainstMe codename={operator.codename} />
          {operator.claimed && <ClaimedBadge claimed={operator.claimed} />}
          <ProfileEditModal codename={operator.codename} />
        </div>
      </div>}>
      <TrackProfileView codename={operator.codename} />

      {/* V2: the identity hero now lives inside OverviewView — the old
          <header> block was removed so the identity renders once. The action
          row above (back / compare / edit) stays on the critical path. */}

      {/* Streaming body — fetches 5 heavy queries (history, submissions,
          report, leaderboard, hall) and renders the split-flap card, records,
          and tabs. Wrapped in Suspense so the header above renders immediately
          (FCP) while this body streams in as data resolves. */}
      <Suspense
        fallback={
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-lg border border-bg-border bg-bg-surface p-8">
            <span className="font-mono text-2xl text-text-dim animate-pulse">Υ</span>
            <p className="font-mono text-xs text-text-muted">Loading cascade data…</p>
          </div>
        }
      >
        <ProfileBody row={row} rawCodename={rawCodename} />
      </Suspense>
    </ProfileWorkspace>
    </Suspense>
  );
}
