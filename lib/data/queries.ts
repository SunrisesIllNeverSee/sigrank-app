/**
 * lib/data/queries.ts — the async DB read facade.
 *
 * Every page / route that needs operator data calls these functions (via the
 * `@/lib/data` barrel); none import Supabase directly. Each follows the same
 * contract:
 *
 *     const sb = getSupabaseServer()
 *     if (!sb) return <fallback>          // no creds → deterministic fallback
 *     try { ...query...; return mapped }  // live data
 *     catch { return <fallback> }         // query error → graceful fallback
 *
 * So the app always builds and renders with no creds present, and degrades
 * gracefully on any Supabase failure. Raw rows are shaped by lib/data/mappers;
 * the no-DB/error path is lib/data/fallback. All functions are async.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";
import { SORT_DEFAULT } from "@/lib/constants";
import { filterToWindow } from "@/lib/data/windows";
import { CLASS_NAME_TO_ID, DISPLAY_METRICS, DISPLAY_RAW, REWARDS } from "@/lib/canon/ids";
import type { SignalClass } from "@/components/sigrank/types";
import {
  MOCK_CLASS_DISTRIBUTION,
  MOCK_COUNTRIES,
  MOCK_HALL,
  MOCK_HISTORY,
  MOCK_HOMEPAGE_STATS,
  MOCK_HOURLY,
  MOCK_WEEKLY,
} from "@/lib/data/mock";
import type {
  ClassDistributionRow,
  CountryCount,
  HallRecord,
  HistoryPoint,
  HomepageStats,
  HourlyPoint,
  LeaderboardRow,
  WeeklyPoint,
} from "@/lib/data/types";
import {
  type BoardParams,
  type DbMetricSnapshot,
  type DbOperator,
  type HistoryParams,
  asDb,
  latestPerOperator,
  latestPerOperatorPlatform,
  mapOperator,
  mapSnapshot,
  num,
  operatorTotalCollapse,
  pendingSnapshot,
  telemetryFromSnapshot,
  toSignalClass,
  ZERO_TELEMETRY,
} from "@/lib/data/mappers";
import { fallbackRows, filterMockBoard, sortValue } from "@/lib/data/fallback";
import { recordValue } from "@/lib/hall/record-value";

// ───────────────────────────────────────────────────────────────────────────
// Bounded-query helpers (2026-07-02 — the (d) sweep).
// PostgREST caps a select at 1000 rows by default; unbounded selects silently
// truncate with NO error. These helpers paginate + fail-loud so a growing
// table can't quietly corrupt rankings/aggregates.
// ───────────────────────────────────────────────────────────────────────────

/** PostgREST's default per-request row cap. Pagination chunks at this size. */
const POSTGREST_PAGE_SIZE = 1000;

/** Hard ceiling for whole-table scans — if we hit this, something is wrong
 *  (the table grew beyond a safe bound). Logs a warning; does NOT silently
 *  continue. 50K rows = ~150 operators × ~365 days of daily snapshots, well
 *  beyond current scale (~21 operators). */
const TABLE_SCAN_CEILING = 50_000;

/** Log a truncation warning (fail-loud, not cap-and-continue). */
function warnTruncation(table: string, hit: number, ceiling: number) {
  console.warn(
    `[queries] ${table} scan hit ${hit} rows (ceiling ${ceiling}) — ` +
      `possible silent truncation. Investigate the table size.`,
  );
}

/**
 * Paginate through ALL rows of a table that would otherwise be capped at 1000
 * by PostgREST. Fetches in `.range(from, to)` chunks until a page returns fewer
 * than PAGE_SIZE rows (the last page) or the ceiling is hit (fail-loud).
 *
 * The `buildQuery` fn receives the supabase client and should return a SELECT
 * query builder (NOT awaited) — the helper applies `.range()` + awaits.
 */
async function fetchAllPaginated<T>(
  sb: SupabaseClient,
  buildQuery: (sb: SupabaseClient) => any,
  table: string,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (from < TABLE_SCAN_CEILING) {
    const to = from + POSTGREST_PAGE_SIZE - 1;
    const { data, error } = await buildQuery(sb).range(from, to);
    if (error) throw error;
    const page = (data ?? []) as T[];
    all.push(...page);
    if (page.length < POSTGREST_PAGE_SIZE) return all; // last page
    from += POSTGREST_PAGE_SIZE;
  }
  // Hit the ceiling — fail-loud (don't silently continue).
  warnTruncation(table, all.length, TABLE_SCAN_CEILING);
  return all;
}

/** Safe per-operator limit — one operator's daily snapshots for ~3yr (with
 *  per-platform rows). Asserts if hit so we know when to raise it. */
const PER_OPERATOR_LIMIT = 1000;

/** Assert a per-operator query didn't silently truncate. */
function assertOperatorLimit(rows: unknown[], codename: string) {
  if (rows.length >= PER_OPERATOR_LIMIT) {
    warnTruncation(
      `metric_snapshots (operator ${codename})`,
      rows.length,
      PER_OPERATOR_LIMIT,
    );
  }
}

/**
 * Recompute an operator's global rank + percentile when rank_history is empty.
 * Fetches all latest snapshots, computes Υ yield for each (same as the board),
 * sorts descending, and finds the operator's 1-based position. Percentile is
 * computed as (operators_below / total) * 100.
 *
 * This is the fallback for the P1 rank_history gap (2026-06-27): seeds have
 * rank_history rows, but operators added via the ingest pipeline don't.
 */
async function recomputeRank(
  sb: SupabaseClient,
  operatorId: string,
  _thisSnap: DbMetricSnapshot,
): Promise<{ rank: number; percentile: number }> {
  try {
    const allSnaps = await fetchAllPaginated<DbMetricSnapshot>(
      sb,
      (s) =>
        s
          .from("metric_snapshots")
          .select(SNAPSHOT_COLUMNS)
          .order("snapshot_date", { ascending: false }),
      "metric_snapshots (recomputeRank)",
    );
    if (allSnaps.length === 0) return { rank: 0, percentile: 0 };
    // Collapse to the operator-TOTAL row per operator (BOARD redesign 2026-06-27):
    // prefer each operator's 'multi' snapshot (already a cross-platform sum), else
    // their latest single-platform snapshot — the SAME collapse the operator-total
    // board uses, so a recomputed profile rank ranks the same yield the board does.
    const latest = operatorTotalCollapse(
      asDb<DbMetricSnapshot[]>(allSnaps) ?? [],
    ).byOperator;
    // Compute yield_ for each + sort descending
    const ranked = [...latest.values()]
      .map((s) => {
        const snap = mapSnapshot(s);
        const y =
          snap.cascade && !snap.cascade.nonCompounding
            ? snap.cascade.yield_
            : 0;
        return { operator_id: s.operator_id, yield_: y };
      })
      .sort((a, b) => b.yield_ - a.yield_);
    const total = ranked.length;
    if (total === 0) return { rank: 0, percentile: 0 };
    const idx = ranked.findIndex((r) => r.operator_id === operatorId);
    if (idx === -1) return { rank: 0, percentile: 0 };
    const rank = idx + 1;
    const percentile = total > 1 ? ((total - rank) / (total - 1)) * 100 : 100;
    return { rank, percentile: Math.round(percentile * 100) / 100 };
  } catch {
    return { rank: 0, percentile: 0 };
  }
}

/** Minimal shape of a `rank_history` row we read. */
interface DbRankHistory {
  operator_id: string;
  snapshot_date: string;
  global_rank: number | null;
  percentile: number | null;
}

/**
 * A LeaderboardRow carrying the operator's distinct submitted-platform SET — only
 * populated on the `operatorTotal` board path (BOARD redesign, 2026-06-27), where a
 * single total row stands in for an operator who may have run claude + codex + multi.
 * The UI badges this set ("claude·codex·multi"). It's a structural superset of
 * LeaderboardRow (the base interface lives in lib/data/types.ts, which this layer
 * does not own), so a `LeaderboardRowWithPlatforms[]` is assignable to a
 * `LeaderboardRow[]` and the optional field is read back via to-entry's local cast.
 */
export interface LeaderboardRowWithPlatforms extends LeaderboardRow {
  /** Distinct platforms the operator submitted, e.g. ['claude','codex','multi']. */
  platforms?: string[];
}

/** All columns of metric_snapshots the mapper reads (single source for selects). */
export const SNAPSHOT_COLUMNS =
  "operator_id, snapshot_date, window_type, platform, compression_ratio, prompt_complexity, cross_thread, " +
  "session_depth, token_throughput, signa_rate, sdot_score, sdrm_score, signal_force, " +
  "drift_ratio, class_tier, movement_24h, movement_7d, " +
  "ruleset_version, " +
  "input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens";

/**
 * All operators columns the mapper reads — these are exactly the columns the
 * `operators_public` view exposes (P5 fix, 0008). claim_contact / claim_payment_id
 * are deliberately ABSENT (the view withholds them); selecting them off the view
 * would error, and the public path must never read the PII email.
 */
export const OPERATOR_COLUMNS =
  "operator_id, codename, display_name, claimed, claimed_at, " +
  "current_supporter_tier, verification_status, primary_domain, " +
  "account_age_days, total_messages_lifetime, " +
  // Phase-0 identity fields (migration 0007, apply post-move — null-safe on old rows)
  "handle, avatar_url, bio, links, location, " +
  // Profile visibility (migration 0021) — gates which fields non-owners can see.
  "profile_visibility";

// (Circles feature dropped 2026-06-25 — fresh-slate rebuild later. The circles /
// circle_members / circle_metric_snapshots tables were removed from the DB; the
// query code is gone with them. See ICEBOX.md / AFTER_LAUNCH.md.)

// ───────────────────────────────────────────────────────────────────────────
// Facade functions.
// ───────────────────────────────────────────────────────────────────────────

/** Global / filtered leaderboard. */
export async function getLeaderboard(
  params: BoardParams = {},
): Promise<LeaderboardRow[]> {
  const sb = getSupabaseServer();
  if (!sb) return filterMockBoard(params);
  try {
    // Live path: read latest metric_snapshots, join operators + rank_history.
    // We sort/filter/re-rank in JS so the live board is shape- and order-
    // identical to filterMockBoard (the schema-parity contract).
    // Paginated — PostgREST caps unbounded selects at 1000 rows (silent truncation).
    const allSnaps = await fetchAllPaginated<DbMetricSnapshot>(
      sb,
      (s) =>
        s
          .from("metric_snapshots")
          .select(SNAPSHOT_COLUMNS)
          .order("snapshot_date", { ascending: false }),
      "metric_snapshots (getLeaderboard)",
    );
    // DB empty/unreachable → mock fallback (graceful-degradation contract).
    if (allSnaps.length === 0) return filterMockBoard(params);
    // 730: narrow to the window (exact window_type + buffer) BEFORE dedupe so each
    // operator's latest snapshot WITHIN the window wins — but ONLY when the caller
    // opts in (the /board route). Legacy callers (metric pages, /api/v1/leaderboard,
    // home/transmitters/hall) keep their pre-730 full-field behaviour.
    const windowed =
      params.windowFilter && params.window
        ? filterToWindow(allSnaps, params.window)
        : allSnaps;
    // Collapse ladder (precedence top→bottom):
    //   allSnapshots  — keep EVERY (operator, platform, window) point ("off" board).
    //   operatorTotal — ONE total row per operator: the operator's 'multi' snapshot
    //                   (which already SUMS every platform) when present, else their
    //                   latest single-platform row. The clean default board.
    //   perPlatform   — one row per (operator, platform) (FIX H per-platform view).
    //   else          — latest snapshot per operator (legacy behaviour).
    // operatorTotal also yields the distinct platform SET per operator so the UI can
    // badge "claude·codex·multi" on the single total row.
    let platformsByOperator: Map<string, string[]> | null = null;
    let snapRows: DbMetricSnapshot[];
    if (params.allSnapshots) {
      snapRows = windowed;
    } else if (params.operatorTotal) {
      const collapsed = operatorTotalCollapse(windowed);
      platformsByOperator = collapsed.platformsByOperator;
      snapRows = [...collapsed.byOperator.values()];
    } else if (params.perPlatform) {
      snapRows = [...latestPerOperatorPlatform(windowed).values()];
    } else {
      snapRows = [...latestPerOperator(windowed).values()];
    }
    // Honest empty: a connected DB whose requested window has zero rows returns an
    // empty board (NOT fabricated mock seeds). Mock is only for an empty/broken DB.
    if (snapRows.length === 0)
      return params.windowFilter ? [] : filterMockBoard(params);

    const opIds = new Set(snapRows.map((s) => s.operator_id));
    // Fetch all operators_public (paginated) — the IN clause with 1600+ UUIDs
    // exceeds PostgREST's URL length limit, causing a silent error → mock fallback.
    // With <2k operators, fetching all is cheaper than batching the IN filter.
    const opData = await fetchAllPaginated<DbOperator>(
      sb,
      (s) =>
        s
          .from("operators_public")
          .select(OPERATOR_COLUMNS)
          .order("operator_id"),
      "operators_public (getLeaderboard)",
    );
    const opById = new Map<string, DbOperator>(
      opData.filter((o) => opIds.has(o.operator_id)).map((o) => [o.operator_id, o]),
    );

    // Latest rank_history per operator for percentile (global_rank is recomputed
    // from the filtered view below, mirroring the mock re-ranking).
    // Paginated — PostgREST caps unbounded selects at 1000 rows (silent truncation).
    const rankData = await fetchAllPaginated<DbRankHistory>(
      sb,
      (s) =>
        s
          .from("rank_history")
          .select("operator_id, snapshot_date, global_rank, percentile")
          .order("snapshot_date", { ascending: false }),
      "rank_history (getLeaderboard)",
    );
    const pctById = new Map<string, number>();
    for (const r of rankData) {
      if (!pctById.has(r.operator_id))
        pctById.set(r.operator_id, num(r.percentile));
    }

    let rows: LeaderboardRowWithPlatforms[] = [];
    for (const snap of snapRows) {
      const op = opById.get(snap.operator_id);
      if (!op) continue;
      // operatorTotal: the distinct platforms this operator submitted (for the UI
      // multi-platform badge). Only attached on the operatorTotal path; other paths
      // leave `platforms` undefined (the per-row platform column is the source there).
      const platforms = platformsByOperator?.get(snap.operator_id);
      rows.push({
        operator: mapOperator(op),
        snapshot: mapSnapshot(snap),
        global_rank: 0, // recomputed after sort
        percentile: pctById.get(snap.operator_id) ?? 0,
        telemetry: telemetryFromSnapshot(snap),
        window_type: snap.window_type ?? null,
        platform: snap.platform ?? op.primary_domain ?? null,
        snapshot_date: snap.snapshot_date ?? null,
        ...(platforms && platforms.length > 0 ? { platforms } : {}),
      });
    }
    // Honest empty (mirrors the latest.size===0 guard above): if operators didn't
    // resolve for the windowed snapshots (e.g. RLS divergence on an anon-key deploy),
    // a windowFilter board returns [] rather than fabricated mock seeds.
    if (rows.length === 0)
      return params.windowFilter ? [] : filterMockBoard(params);

    // Apply the same filter → sort → re-rank → limit pipeline as the mock path.
    if (params.platform && params.platform !== "all") {
      rows = rows.filter(
        (r) =>
          r.operator.primary_domain.toLowerCase() ===
          params.platform!.toLowerCase(),
      );
    }
    if (params.classScope && params.classScope !== "all") {
      rows = rows.filter(
        (r) =>
          r.snapshot.class_tier.toLowerCase() ===
          params.classScope!.toLowerCase(),
      );
    }
    const sort = params.sort ?? SORT_DEFAULT;
    rows.sort((a, b) => sortValue(b, sort) - sortValue(a, sort));
    rows = rows.map((r, i) => ({ ...r, global_rank: i + 1 }));
    if (params.limit && params.limit > 0) rows = rows.slice(0, params.limit);
    return rows;
  } catch {
    return filterMockBoard(params);
  }
}

/** Single operator by codename (identity + latest snapshot + rank). */
export async function getOperator(
  codename: string,
): Promise<LeaderboardRow | null> {
  const sb = getSupabaseServer();
  const fromMock = () =>
    fallbackRows().find(
      (r) => r.operator.codename.toLowerCase() === codename.toLowerCase(),
    ) ?? null;
  if (!sb) return fromMock();
  try {
    // Identity by codename (case-insensitive), then latest snapshot + rank.
    const { data: opData, error: opError } = await sb
      .from("operators_public")
      .select(OPERATOR_COLUMNS)
      .ilike("codename", codename)
      .limit(1)
      .maybeSingle();
    if (opError) throw opError;
    const op = asDb<DbOperator | null>(opData);
    if (!op) return fromMock();

    // BOARD redesign (2026-06-27): the profile headline (rank / class / cascade) must
    // agree with the board's operator-TOTAL row, so we pick the operator's total the
    // SAME way the board does — prefer their `platform='multi'` snapshot (which already
    // SUMS every platform), falling back to their latest single-platform snapshot. We
    // read all of the operator's snapshots (date-desc) and run operatorTotalCollapse,
    // rather than a blind .limit(1) that could land on a single-platform row and
    // disagree with the board. (The per-platform×window Submissions grid is a separate
    // query — getOperatorSubmissions — and is untouched.)
    const { data: snapData, error: snapError } = await sb
      .from("metric_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("operator_id", op.operator_id)
      .order("snapshot_date", { ascending: false })
      .limit(PER_OPERATOR_LIMIT);
    if (snapError) throw snapError;
    const allOpSnaps = asDb<DbMetricSnapshot[] | null>(snapData) ?? [];
    assertOperatorLimit(allOpSnaps, op.codename);
    const snap =
      operatorTotalCollapse(allOpSnaps).byOperator.get(op.operator_id) ?? null;
    if (!snap) {
      // Operator EXISTS but has no cascade data yet (freshly-claimed account, no
      // verified submission). Render an identity-only PENDING profile — never a 404.
      return {
        operator: mapOperator(op),
        snapshot: pendingSnapshot(),
        global_rank: 0,
        percentile: 0,
        telemetry: ZERO_TELEMETRY,
        pending: true,
      };
    }

    const { data: rankData } = await sb
      .from("rank_history")
      .select("operator_id, snapshot_date, global_rank, percentile")
      .eq("operator_id", op.operator_id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const rank = asDb<DbRankHistory | null>(rankData);

    // P1 fix (2026-06-27): rank_history is only populated for seed operators
    // (manual insert). Operators added via the ingest pipeline
    // (materialize_verified_snapshot) get NO rank_history row, so their profile
    // shows "rank #0". When rank_history returns 0/null, recompute the rank
    // the same way the board does: fetch all latest snapshots, compute Υ, sort
    // descending, find this operator's position. This is O(n) but n is small
    // (currently ~21 operators). The "right" fix is to populate rank_history
    // in materialize_verified_snapshot (a future migration), but this fallback
    // fixes every existing profile immediately without a DB change.
    let globalRank = num(rank?.global_rank);
    let percentile = num(rank?.percentile);
    if (globalRank === 0) {
      const recomputed = await recomputeRank(sb, op.operator_id, snap);
      globalRank = recomputed.rank;
      percentile = recomputed.percentile;
    }

    return {
      operator: mapOperator(op),
      snapshot: mapSnapshot(snap),
      global_rank: globalRank,
      percentile,
      telemetry: telemetryFromSnapshot(snap),
    };
  } catch {
    return fromMock();
  }
}

/** One operator submission cell: a (platform, window) point with its score. */
export interface OperatorSubmission {
  /** Lowercase platform ('claude'/'codex'/'multi'/…). */
  platform: string;
  /** Window bucket ('7d'/'30d'/'90d'/'all_time'/'today'). */
  window: string;
  /** Snapshot date 'YYYY-MM-DD' (most recent for this platform×window). */
  snapshotDate: string | null;
  classTier: SignalClass;
  /** Υ Yield (null when non-compounding — no cache pillar). */
  yield_: number | null;
  signaRate: number | null;
  totalTokens: number | null;
}

/** Map one DB snapshot → a submission cell. */
function toSubmission(
  snap: DbMetricSnapshot,
  primaryDomain: string | null,
): OperatorSubmission {
  const s = mapSnapshot(snap);
  const t = telemetryFromSnapshot(snap);
  const c = s.cascade;
  return {
    platform: (snap.platform ?? primaryDomain ?? "other").toLowerCase(),
    window: snap.window_type ?? "all_time",
    snapshotDate: snap.snapshot_date ?? null,
    classTier: s.class_tier,
    yield_: c && !c.nonCompounding ? c.yield_ : null,
    signaRate: snap.signa_rate ?? null,
    totalTokens: t
      ? t.fresh_input + t.output + t.cache_create + t.cache_read
      : null,
  };
}

/**
 * All of an operator's submissions, one per (platform, window) — the data behind the
 * profile Submissions grid (FIX I3 / owner 2026-06-26: "show all their submissions —
 * claude/codex/multi × 7/30/90/all"). Latest snapshot per (platform, window) wins
 * (rows arrive date-desc → first seen). Empty when the operator has no verified
 * submission yet. Per-platform cells populate as FIX H multi-platform submissions land.
 */
export async function getOperatorSubmissions(
  codename: string,
): Promise<OperatorSubmission[]> {
  const sb = getSupabaseServer();
  const dedupe = (rows: OperatorSubmission[]): OperatorSubmission[] => {
    const seen = new Map<string, OperatorSubmission>();
    for (const r of rows) {
      const k = `${r.platform}|${r.window}`;
      if (!seen.has(k)) seen.set(k, r);
    }
    return [...seen.values()];
  };
  // Degraded/mock path: the single fallback row → one submission cell.
  if (!sb) {
    const r = fallbackRows().find(
      (x) => x.operator.codename.toLowerCase() === codename.toLowerCase(),
    );
    if (!r || r.pending) return [];
    const t = r.telemetry;
    const c = r.snapshot.cascade;
    return [
      {
        platform: (
          r.platform ??
          r.operator.primary_domain ??
          "other"
        ).toLowerCase(),
        window: r.window_type ?? "all_time",
        snapshotDate: r.snapshot_date ?? null,
        classTier: r.snapshot.class_tier,
        yield_: c && !c.nonCompounding ? c.yield_ : null,
        signaRate: r.snapshot.signa_rate ?? null,
        totalTokens: t
          ? t.fresh_input + t.output + t.cache_create + t.cache_read
          : null,
      },
    ];
  }
  try {
    const { data: opData, error: opError } = await sb
      .from("operators_public")
      .select("operator_id, primary_domain")
      .ilike("codename", codename)
      .limit(1)
      .maybeSingle();
    if (opError) throw opError;
    const op = asDb<{
      operator_id: string;
      primary_domain: string | null;
    } | null>(opData);
    if (!op) return [];
    const { data: snapData, error: snapError } = await sb
      .from("metric_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("operator_id", op.operator_id)
      .order("snapshot_date", { ascending: false })
      .limit(PER_OPERATOR_LIMIT);
    if (snapError) throw snapError;
    const snaps = asDb<DbMetricSnapshot[] | null>(snapData) ?? [];
    assertOperatorLimit(snaps, codename);
    return dedupe(snaps.map((s) => toSubmission(s, op.primary_domain)));
  } catch {
    return [];
  }
}

/** Score history for one operator. */
export async function getOperatorHistory(
  codename: string,
  params: HistoryParams = {},
): Promise<HistoryPoint[]> {
  const sb = getSupabaseServer();
  const fromMock = () => {
    const points = MOCK_HISTORY[codename] ?? [];
    return params.limit && params.limit > 0
      ? points.slice(-params.limit)
      : points;
  };
  if (!sb) return fromMock();
  try {
    // Resolve the operator id from the codename first.
    const { data: opData, error: opError } = await sb
      .from("operators_public")
      .select("operator_id")
      .ilike("codename", codename)
      .limit(1)
      .maybeSingle();
    if (opError) throw opError;
    const op = asDb<{ operator_id: string } | null>(opData);
    if (!op) return fromMock();

    // Per-snapshot scores + token pillars (for Υ Yield), oldest → newest.
    const { data: snapData, error: snapError } = await sb
      .from("metric_snapshots")
      .select(
        "snapshot_date, signa_rate, class_tier, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens",
      )
      .eq("operator_id", op.operator_id)
      .order("snapshot_date", { ascending: true })
      .limit(PER_OPERATOR_LIMIT);
    if (snapError) throw snapError;
    const snaps =
      asDb<Array<{
        snapshot_date: string;
        signa_rate: number | null;
        class_tier: string | null;
        input_tokens: number | null;
        output_tokens: number | null;
        cache_read_tokens: number | null;
        cache_creation_tokens: number | null;
      }> | null>(snapData) ?? [];
    if (snaps.length === 0) return fromMock();
    assertOperatorLimit(snaps, codename);

    // Per-date global_rank from rank_history (keyed by date).
    const { data: rankData } = await sb
      .from("rank_history")
      .select("snapshot_date, global_rank")
      .eq("operator_id", op.operator_id)
      .limit(PER_OPERATOR_LIMIT);
    const rankByDate = new Map<string, number>();
    if (rankData && (rankData as unknown[]).length >= PER_OPERATOR_LIMIT) {
      warnTruncation(
        `rank_history (operator ${codename})`,
        (rankData as unknown[]).length,
        PER_OPERATOR_LIMIT,
      );
    }
    for (const r of (rankData as Array<{
      snapshot_date: string;
      global_rank: number | null;
    }>) ?? []) {
      rankByDate.set(r.snapshot_date, num(r.global_rank));
    }

    const points: HistoryPoint[] = snaps.map((s) => {
      const input = num(s.input_tokens);
      const output = num(s.output_tokens);
      const cacheRead = num(s.cache_read_tokens);
      // Υ Yield = (cache_read × output) / input² — guard against div-by-zero.
      const yield_ = input > 0 ? (cacheRead * output) / (input * input) : 0;
      return {
        date: s.snapshot_date,
        signa_rate: num(s.signa_rate),
        yield_,
        global_rank: rankByDate.get(s.snapshot_date) ?? 0,
        class_tier: toSignalClass(s.class_tier),
      };
    });
    return params.limit && params.limit > 0
      ? points.slice(-params.limit)
      : points;
  } catch {
    return fromMock();
  }
}

/** Per-metric leaderboard (sorted by a single metric column). */
export async function getMetricLeaders(
  metric: string,
  params: BoardParams = {},
): Promise<LeaderboardRow[]> {
  return getLeaderboard({ ...params, sort: metric });
}

/** Hall of Signal records. */
export async function getHallOfSignal(
  params: BoardParams = {},
): Promise<HallRecord[]> {
  const sb = getSupabaseServer();
  if (!sb) return MOCK_HALL;
  try {
    void params;
    // Hall records derive from badge awards. We embed the badge catalog (for the
    // record title) and the operator (for the codename), newest awards first.
    const { data, error } = await sb
      .from("operator_badges")
      .select(
        "awarded_at, source_note, " +
          "badges:badge_id ( badge_name ), " +
          "operators:operator_id ( codename, display_name )",
      )
      .order("awarded_at", { ascending: false });
    if (error) throw error;

    type HallJoin = {
      awarded_at: string | null;
      source_note: string | null;
      badges: { badge_name: string | null } | null;
      operators: {
        codename: string | null;
        display_name: string | null;
      } | null;
    };
    const rows = (data as unknown as HallJoin[] | null) ?? [];
    if (rows.length === 0) return MOCK_HALL;

    const records: HallRecord[] = rows.map((r) => {
      // source_note may carry an explicit RW.xx reward id; otherwise fall back to
      // the Hall-of-Signal reserved reward (RW.15 / BG.16) from the canon catalog.
      const note = r.source_note ?? "";
      const rwMatch = note.match(/RW\.\d+/);
      const rewardId = rwMatch && REWARDS[rwMatch[0]] ? rwMatch[0] : "RW.15";
      return {
        reward_id: rewardId,
        title:
          r.badges?.badge_name ?? REWARDS[rewardId]?.reward ?? "Hall of Signal",
        operator_codename:
          r.operators?.display_name || r.operators?.codename || "unknown",
        value: note || (r.badges?.badge_name ?? ""),
        date: (r.awarded_at ?? "").slice(0, 10),
        isPlaceholder: false,
      };
    });
    return records;
  } catch {
    return MOCK_HALL;
  }
}

/** Homepage aggregate stats. */
export async function getHomepageStats(): Promise<HomepageStats> {
  const sb = getSupabaseServer();
  if (!sb) return MOCK_HOMEPAGE_STATS;
  try {
    // Singleton aggregate block (system_stats.id is pinned TRUE), with the top
    // operator's codename embedded via the top_operator_id FK.
    const { data, error } = await sb
      .from("system_stats")
      .select(
        "total_operators, total_snapshots, total_tokens_scored, transmitter_count, " +
          "top_signa_rate, operators:top_operator_id ( codename )",
      )
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const s = data as {
      total_operators: number | null;
      total_snapshots: number | null;
      total_tokens_scored: number | null;
      transmitter_count: number | null;
      top_signa_rate: number | null;
      operators: { codename: string | null } | null;
    } | null;
    if (!s) return MOCK_HOMEPAGE_STATS;

    // Two extra, independently-defensive reads so a missing column/table (e.g. before
    // migration 0021 lands) degrades to 0 rather than collapsing the whole block to
    // MOCK. Both are daily-stale under the homepage ISR — fine for the fogged strip.
    let active_last_hour = 0;
    try {
      const { count } = await sb
        .from("operators")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", new Date(Date.now() - 3_600_000).toISOString());
      active_last_hour = count ?? 0;
    } catch {
      /* leave 0 */
    }

    let comparisons_ran = 0;
    try {
      const { data: c } = await sb
        .from("site_counters")
        .select("value")
        .eq("key", "comparisons_ran")
        .maybeSingle();
      comparisons_ran = num((c as { value: number | null } | null)?.value);
    } catch {
      /* site_counters may not exist yet — leave 0 */
    }

    return {
      total_operators: num(s.total_operators),
      total_snapshots: num(s.total_snapshots),
      total_tokens_scored: num(s.total_tokens_scored),
      transmitter_count: num(s.transmitter_count),
      top_operator_codename:
        s.operators?.codename ?? MOCK_HOMEPAGE_STATS.top_operator_codename,
      top_signa_rate: num(s.top_signa_rate),
      active_last_hour,
      comparisons_ran,
      isPlaceholder: false,
    };
  } catch {
    return MOCK_HOMEPAGE_STATS;
  }
}

/**
 * Bump the public "comparisons ran" counter (site_counters via the atomic
 * increment_site_counter RPC). Fire-and-forget + fully defensive: safe to call
 * before migration 0021 lands — the RPC error is swallowed (it's a vanity stat).
 */
export async function bumpComparisonsRan(): Promise<void> {
  const sb = getSupabaseServer();
  if (!sb) return;
  try {
    await sb.rpc("increment_site_counter", { counter_key: "comparisons_ran" });
  } catch {
    /* RPC/table not present yet, or transient — ignore */
  }
}

/** Class distribution across the active population. */
export async function getClassDistribution(): Promise<ClassDistributionRow[]> {
  const sb = getSupabaseServer();
  if (!sb) return MOCK_CLASS_DISTRIBUTION;
  try {
    // Count each operator once, by their latest snapshot's class_tier.
    // Paginated — PostgREST caps unbounded selects at 1000 rows (silent truncation).
    const rows = await fetchAllPaginated<{
      operator_id: string;
      snapshot_date: string;
      class_tier: string | null;
    }>(
      sb,
      (s) =>
        s
          .from("metric_snapshots")
          .select("operator_id, snapshot_date, class_tier")
          .order("snapshot_date", { ascending: false }),
      "metric_snapshots (getClassDistribution)",
    );
    if (rows.length === 0) return MOCK_CLASS_DISTRIBUTION;

    const seen = new Set<string>();
    const counts = new Map<SignalClass, number>();
    for (const r of rows) {
      if (seen.has(r.operator_id)) continue;
      seen.add(r.operator_id);
      const cls = toSignalClass(r.class_tier);
      counts.set(cls, (counts.get(cls) ?? 0) + 1);
    }

    // Emit in the same canonical class order the mock board uses.
    const order: SignalClass[] = [
      "TRANSMITTER",
      "ARCH+",
      "ARCH",
      "POWER",
      "BASE",
      "SEEKER",
      "REFINER",
      "BEARER",
      "IGNITER",
    ];
    return order.map((cls) => ({
      class_tier: cls,
      class_id: CLASS_NAME_TO_ID[cls],
      count: counts.get(cls) ?? 0,
    }));
  } catch {
    return MOCK_CLASS_DISTRIBUTION;
  }
}

// getCircles / getCircle removed 2026-06-25 (Circles feature dropped — fresh-slate
// rebuild later; the route was already archived 06-22). See ICEBOX.md.

/**
 * getOnlineHourly — 24h operators-online curve for the activity board.
 * TODO(ONLINE.LIVE): no per-hour online aggregation exists yet; returns mock.
 * (Real item — the "operators online" widgets; backlog, post-auth.)
 */
export async function getOnlineHourly(): Promise<HourlyPoint[]> {
  return MOCK_HOURLY;
}

/**
 * getOnlineWeekly — 7-day online band (daily max + avg) for the activity board.
 * TODO(ONLINE.LIVE): weekly aggregation is not in the schema yet; returns mock.
 * (Real item — the "operators online" widgets; backlog, post-auth.)
 */
export async function getOnlineWeekly(): Promise<WeeklyPoint[]> {
  return MOCK_WEEKLY;
}

/**
 * getOnlineByCountry — live operators online by country (BlitzStars "Live").
 * TODO(ONLINE.LIVE): country geo-aggregation is not in the schema yet; returns mock.
 * (Real item — the "operators online" widgets; backlog, post-auth.)
 */
export async function getOnlineByCountry(): Promise<CountryCount[]> {
  return MOCK_COUNTRIES;
}

/**
 * OperatorReport — the cascade report block from the MCP submission.
 * Computed locally in the MCP (mode detection + badges + health score),
 * submitted alongside the 4 token pillars, stored as-is in operator_reports.
 */
export interface OperatorReport {
  report: {
    current_mode: string;
    mode_confidence: number;
    mode_distribution: Record<string, number>;
    mode_weighted_yield: number;
    peak_yield: number;
    health_score: number;
    weekly_snapshots?: Array<{
      weekStart: string;
      pillars: {
        input: number;
        output: number;
        cacheCreate: number;
        cacheRead: number;
      };
      yield: number;
      mode: string;
      mode_confidence: number;
      dayCount: number;
    }>;
    badges: {
      earned_this_week: string[];
      in_progress: Array<{
        id: string;
        label: string;
        icon: string;
        progress: number;
        target: number;
        display: string;
      }>;
      collection: string[];
    };
  };
  report_visible: boolean;
  created_at: string;
}

/**
 * getOperatorReport — fetch the latest cascade report for an operator.
 * Returns null if no report exists (operator hasn't submitted with the new MCP yet).
 * The report_visible flag controls whether visitors can see the full Report tab.
 */
export async function getOperatorReport(
  operatorId: string,
): Promise<OperatorReport | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("operator_reports")
      .select("report, report_visible, created_at")
      .eq("operator_id", operatorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as OperatorReport | null;
  } catch {
    return null;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Operator records (reverse lookup: operator → records they hold).
// ───────────────────────────────────────────────────────────────────────────

/** A static curated Hall record held by an operator. */
export interface OperatorStaticRecord {
  reward_id: string;
  title: string;
  value: string;
  achieved_at: string;
  is_placeholder: boolean;
}

/** A dynamic metric record — the operator is #1/#2/#3 on a metric board. */
export interface OperatorDynamicRecord {
  metric: string;
  metric_name: string;
  rank: number;
  value: string;
  window: string;
}

/** The full records payload for an operator (reverse lookup). */
export interface OperatorRecordsResult {
  codename: string;
  static_records: OperatorStaticRecord[];
  dynamic_records: OperatorDynamicRecord[];
}

/** The 15 metric boards (9 cascade + 6 raw) — mirrors OperatorRecords.tsx. */
const RECORD_CASCADE_BOARDS = DISPLAY_METRICS.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
}));
const RECORD_RAW_BOARDS = DISPLAY_RAW.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
}));
const RECORD_ALL_BOARDS = [...RECORD_CASCADE_BOARDS, ...RECORD_RAW_BOARDS];

/**
 * getOperatorRecords — the reverse lookup from operator → records they hold.
 *
 * Combines:
 *  a. Static curated Hall records (getHallOfSignal filtered to this operator,
 *     checked against BOTH codename and display_name — the Hall may store either).
 *  b. Dynamic metric records — for each of the 15 metric boards (9 cascade + 6
 *     raw), check if this operator is #1, #2, or #3.
 *
 * Returns null when the codename is not found in the leaderboard (genuine 404).
 * Reads through the same facade functions the profile page uses, so it 200s on
 * seed data with Supabase unset and degrades gracefully on any DB failure.
 */
export async function getOperatorRecords(
  codename: string,
): Promise<OperatorRecordsResult | null> {
  // Resolve the operator first (404 if genuinely unknown). getOperator reads
  // through the cached facade and handles the mock-fallback path.
  const operator = await getOperator(codename);
  if (!operator) return null;

  // Static curated records from the Hall of Signal.
  const hallRecords = await getHallOfSignal();
  const names = new Set<string>([operator.operator.codename]);
  if (operator.operator.display_name)
    names.add(operator.operator.display_name);
  const staticRecords: OperatorStaticRecord[] = hallRecords
    .filter((r) => names.has(r.operator_codename))
    .map((r) => ({
      reward_id: r.reward_id,
      title: r.title,
      value: r.value,
      achieved_at: r.date,
      is_placeholder: r.isPlaceholder,
    }));

  // Dynamic metric records (top 3 on each board). Uses the same default board
  // the profile page fetches (getLeaderboard() with no params → full field).
  const boardRows = await getLeaderboard();
  const dynamicRecords: OperatorDynamicRecord[] = [];
  for (const board of RECORD_ALL_BOARDS) {
    const sorted = [...boardRows]
      .sort((a, z) => sortValue(z, board.sort) - sortValue(a, board.sort))
      .slice(0, 3);
    const rank = sorted.findIndex(
      (r) => r.operator.codename === operator.operator.codename,
    );
    if (rank === -1) continue; // not in top 3
    const row = sorted[rank];
    const value = recordValue(row, board.canonId);
    if (value === "—") continue; // non-compounding on a compounding metric
    dynamicRecords.push({
      metric: board.canonId,
      metric_name: board.name,
      rank: rank + 1,
      value,
      window: row.window_type ?? "all_time",
    });
  }
  dynamicRecords.sort((a, b) => a.rank - b.rank);

  return {
    codename: operator.operator.codename,
    static_records: staticRecords,
    dynamic_records: dynamicRecords,
  };
}
