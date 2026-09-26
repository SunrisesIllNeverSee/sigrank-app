/**
 * lib/board/live.ts — the explicit LIVE-BOARD read contract.
 *
 * The public board pages (/board/7d · /30d · /90d · /all) and the matching
 * API scope (GET /api/v1/leaderboard?scope=live) share ONE population rule —
 * this module is where it lives:
 *
 *   LIVE POPULATION = claimed operators OR The Field.
 *
 * Why The Field is kept: it is the documented average/baseline operator
 * (operator_id f1e1d000-…, codename 'the-field') — the "you vs. the field"
 * anchor the owner confirmed stays on the ranked board
 * (__tests__/board/the-field-board-exclusion.test.mjs). It is unclaimed, so a
 * bare `claimed` filter silently drops it — exactly the drift this scope
 * exists to prevent.
 *
 * Everything else (unclaimed seed corpus) belongs to the seeded/reference
 * archive at sigeconomy.com/all-time — never to the live shell.
 *
 * Ordering rule (Codex finding): eligibility is applied BEFORE sort/rank/
 * limit so displayed ranks and counts describe the live population, not a
 * post-limit subset of the full field.
 *
 * Provenance rule: the live scope never silently renders hand-authored mock
 * rows. Source is reported per response — 'supabase' (live DB), 'snapshot'
 * (the real cold-store build snapshot, labelled with its date), or
 * 'unavailable' (neither exists → honest empty + retry UI).
 */

import type { LeaderboardRowWithPlatforms } from "@/lib/board/queries";
import type { BoardParams } from "@/lib/board/mappers";

/** The Field — the intentional baseline operator kept on the live board. */
export const FIELD_OPERATOR_ID = "f1e1d000-0000-4000-8000-000000000001";
export const FIELD_CODENAME = "the-field";

/** Minimal operator shape the eligibility check needs (Operator-compatible). */
export interface LiveEligibleOperator {
  operator_id?: string | null;
  codename?: string | null;
  claimed?: boolean | null;
}

/** Live-board eligibility: claimed operator OR The Field baseline. */
export function isLiveBoardOperator(op: LiveEligibleOperator): boolean {
  if (op.claimed === true) return true;
  return (
    op.operator_id === FIELD_OPERATOR_ID || op.codename === FIELD_CODENAME
  );
}

/** Where a live-board response's data came from. */
export type LiveBoardSource = "supabase" | "snapshot" | "unavailable";

/**
 * Explicit breakdown modes for the live scope. 'total' = one operator-total
 * row per operator (the default board); 'platforms' = one row per
 * (operator, platform) for the "By platform" view + platform filters.
 */
export type LiveBoardBreakdown = "total" | "platforms";

/** Live-board query contract — validated at the API edge, mapped to BoardParams. */
export interface LiveBoardQuery {
  /** DB window_type enum: '7d' | '30d' | '90d' | 'all_time'. */
  window: string;
  /** Row shape: operator totals (default) or per-(operator, platform) rows. */
  breakdown?: LiveBoardBreakdown;
  /** primary_domain / row-platform filter (lowercase), or null for all. */
  platform?: string | null;
  /** Lowercase class scope, or 'all'/undefined. */
  classScope?: string;
  /** Sort key (a metric_snapshots column). */
  sort?: string;
  /** Max rows. */
  limit?: number;
}

/** Live-board response contract — rows plus the population/provenance meta. */
export interface LiveBoardResult {
  /** Ranked rows (eligibility → filters → sort → rank → limit already applied). */
  rows: LeaderboardRowWithPlatforms[];
  /** Data provenance for the header's source/freshness label. */
  source: LiveBoardSource;
  /**
   * Date the served data is based on: the newest snapshot_date among eligible
   * rows (supabase), or the cold-store's generated_at date (snapshot). Null
   * when unavailable.
   */
  sourceDate: string | null;
  /**
   * Eligible live operators in this window BEFORE platform/class filters and
   * limit — the denominator the header names ("N live operators").
   */
  population: number;
  /** Distinct operators in `rows` (post-filter, post-limit). */
  returnedOperators: number;
}

/** Map a live query to the shared BoardParams shape the pipeline consumes. */
export function liveBoardParams(q: LiveBoardQuery): BoardParams {
  const breakdown = q.breakdown ?? "total";
  return {
    window: q.window,
    // '/board/all' = the latest submitted operator-total selection across
    // window types (NOT a lifetime aggregate): no window_type filter so an
    // operator whose only snapshots are 7d/30d/90d still appears. Bounded
    // windows filter to their own window_type (+ recency buffer).
    windowFilter: q.window !== "all_time",
    operatorTotal: breakdown === "total",
    perPlatform: breakdown === "platforms",
    platform: q.platform ?? null,
    classScope: q.classScope,
    sort: q.sort,
    limit: q.limit,
    live: true,
  };
}
