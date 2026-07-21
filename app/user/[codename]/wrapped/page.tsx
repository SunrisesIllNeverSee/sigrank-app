/**
 * app/user/[codename]/wrapped/page.tsx — the operator "Wrapped" summary (was /operators/...).
 *
 * A Spotify-Wrapped-style period recap for one operator, framed entirely around
 * TOKEN TELEMETRY (CANON §I / §VII) — never word/prompt content. RSC: reads the
 * operator + score history through the @/lib/data facade (mock fallback when
 * Supabase is unset, so the page always builds/renders with no creds) and maps
 * the raw telemetry / identity / scored snapshot + history into the serializable
 * prop contract of <WrappedStats/>.
 *
 * Every value WrappedStats receives is resolved here and passed as plain
 * serializable props. Values with no canonical telemetry source (wall-clock
 * session duration, streak length, top model) are surfaced as
 * OPERATOR_OVERRIDE_REQUIRED placeholders rather than invented (build decision
 * D1: stub-now, finalize-later), and any prop with no truthful per-operator
 * value is omitted so WrappedStats falls back to its own copy.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOperator, getOperatorHistory, isOperatorRetired } from "@/lib/board";
import { decodeCodename } from "@/lib/route-params";
import type { HistoryPoint, LeaderboardRow } from "@/lib/board";
import { WrappedStats } from "@/components/sigrank/WrappedStats";
import type { Badge } from "@/components/sigrank/types";
import { SignaHistoryChart } from "@/components/charts/SignaHistoryChart";
import { TrackWrappedView } from "@/components/analytics/TrackWrappedView";
import { withOG } from "@/lib/seo";

// ISR: revalidate every hour — same rationale as the profile page.
export const revalidate = 3600;

/** Fallback for values with no canonical token-telemetry source. */
const UNTRACKED = "—";

/** Compact token formatting (e.g. 18450 → "18.5K"). Token-framed display only. */
function compact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Total tokens scored across the window = sum of the four canonical telemetry token fields. */
function totalTokens(row: LeaderboardRow): number {
  const t = row.telemetry;
  return t.fresh_input + t.output + t.cache_read + t.cache_create;
}

/** Three-letter month label from an ISO date literal (deterministic, no clock read). */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function monthLabel(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7));
  return MONTHS[m - 1] ?? isoDate.slice(5, 7);
}

/**
 * Bucket history points into per-month activity rows (snapshots per month).
 * Returns undefined when there is no history so WrappedStats keeps its own
 * fallback rather than receiving an empty array (its max() would be -Infinity).
 */
function activityByMonth(
  history: HistoryPoint[],
): { label: string; sessions: number }[] | undefined {
  if (history.length === 0) return undefined;
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const p of history) {
    const label = monthLabel(p.date);
    if (!counts.has(label)) order.push(label);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return order.map((label) => ({ label, sessions: counts.get(label) ?? 0 }));
}

/** Inclusive ISO date range from the (chronological) history, or undefined when empty. */
function dateRange(history: HistoryPoint[]): string | undefined {
  if (history.length === 0) return undefined;
  const first = history[0].date;
  const last = history[history.length - 1].date;
  return first === last ? first : `${first} to ${last}`;
}

/** Derive truthful period badges from the scored snapshot + identity facts. */
function deriveBadges(row: LeaderboardRow): Badge[] {
  const { snapshot, operator } = row;
  const badges: Badge[] = [
    {
      name: `${snapshot.class_tier} Class`,
      description: `SIGNA RATE ${snapshot.signa_rate.toFixed(1)}`,
    },
  ];
  if (snapshot.compression_ratio >= 0.85) {
    badges.push({
      name: "High Compression",
      description: `Compression ${snapshot.compression_ratio.toFixed(4)}`,
    });
  }
  if (operator.verification_status === "audited") {
    badges.push({
      name: "Audit Verified",
      description: "Telemetry independently audited",
    });
  } else if (operator.verification_status === "verified") {
    badges.push({
      name: "Verified Operator",
      description: "Telemetry source verified",
    });
  }
  if (totalTokens(row) >= 1_000_000_000) {
    badges.push({
      name: "Billion Token Club",
      description: "1B+ tokens scored this window",
    });
  }
  if (snapshot.cross_thread >= 30) {
    badges.push({
      name: "Continuity Keeper",
      description: `Cross-thread ${Math.round(snapshot.cross_thread)}`,
    });
  }
  return badges;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codename: string }>;
}): Promise<Metadata> {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename); // see lib/route-params — '·'/space codenames arrive URL-encoded in pages
  if (await isOperatorRetired(codename)) return { title: "SigRank Leaderboard" };
  const row = await getOperator(codename);
  if (!row) return { title: "Operator not found" };
  const name = row.operator.display_name ?? row.operator.codename;
  return withOG({
    title: `${name} · Wrapped`,
    description: `${name}'s token-telemetry recap — ${compact(totalTokens(row))} tokens scored, SIGNA RATE ${row.snapshot.signa_rate.toFixed(1)}.`,
    path: `/user/${rawCodename}/wrapped`,
  });
}

export default async function OperatorWrappedPage({
  params,
}: {
  params: Promise<{ codename: string }>;
}) {
  const { codename: rawCodename } = await params;
  const codename = decodeCodename(rawCodename); // see lib/route-params — '·'/space codenames arrive URL-encoded in pages
  if (await isOperatorRetired(codename)) redirect("/leaderboard");
  const row = await getOperator(codename);
  if (!row) notFound();

  const history = await getOperatorHistory(codename);
  const { operator, snapshot, telemetry } = row;
  const total = totalTokens(row);
  const name = operator.display_name ?? operator.codename;

  return (
    <div className="flex flex-col gap-8">
      <TrackWrappedView />
      <a
        href={`/user/${operator.codename}`}
        className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
      >
        ← {name}
      </a>

      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-bold text-text-primary">
          Wrapped
        </h1>
        <p className="font-mono text-xs text-text-muted">
          {name}&apos;s token-telemetry recap — every number below is scored
          from token counts, not content.
        </p>
      </header>

      <WrappedStats
        stats={{
          sessions: telemetry.sessions,
          messagesSent: operator.total_messages_lifetime,
          totalTokens: total,
          // Wall-clock session duration / streak not in token-telemetry CANON.
          timeWithDroid: UNTRACKED,
          longestSession: UNTRACKED,
          daysSinceJoining: operator.account_age_days,
          longestStreak: 0,
          tokenBreakdown: {
            input: telemetry.fresh_input,
            output: telemetry.output,
            // No "thinking" telemetry field in CANON; cache-creation tokens are
            // the closest distinct write-side cache cost surfaced separately.
            thinking: telemetry.cache_create,
            cache: telemetry.cache_read,
          },
          dateRange: dateRange(history),
        }}
        activityByMonth={activityByMonth(history)}
        topModel={operator.primary_domain ?? UNTRACKED}
        totalTokensDisplay={compact(total)}
        badges={deriveBadges(row)}
        tagline={`${total.toLocaleString()} tokens scored this window at SIGNA RATE ${snapshot.signa_rate.toFixed(1)} — compression ${snapshot.compression_ratio.toFixed(4)}, ${Math.round(snapshot.cross_thread)} cross-thread continuity.`}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
          SIGNA RATE · trajectory
        </h3>
        <SignaHistoryChart history={history} />
      </div>
    </div>
  );
}
