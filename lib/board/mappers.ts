/**
 * lib/data/mappers.ts — shared data primitives for the data facade.
 *
 * This is the LEAF module of the lib/data split (mappers ← fallback ← queries ←
 * index barrel). It holds:
 *   - the raw Supabase row shapes shared across the live + fallback paths
 *     (DbOperator / DbMetricSnapshot),
 *   - the query-param contracts (BoardParams / HistoryParams),
 *   - the pure transforms that translate raw snake_case DB rows into the facade
 *     return types, keeping the live path shape-identical to the mock path.
 *
 * These helpers never throw on a missing optional column — they coalesce to the
 * same defaults the mock literals use. All are synchronous + side-effect free.
 *
 * Consumers still import everything from `@/lib/data` (the barrel); this module
 * is an internal split, not a new public surface.
 */

import { computeCascadeMetrics } from "@/lib/ingest/bridge";
import type { TelemetryRaw } from "@/lib/board/types";
import type { SignalClass } from "@/components/sigrank/types";
import type {
  Operator,
  ScoredSnapshot,
  SupporterTier,
} from "@/lib/analytics/scoring-types";

// ───────────────────────────────────────────────────────────────────────────
// Raw DB row shapes (snake_case columns mirroring supabase/schema.sql), shared
// by the live query path and the cold-store/mock fallback path.
// ───────────────────────────────────────────────────────────────────────────

/** Minimal shape of an `operators` row we read. */
export interface DbOperator {
  operator_id: string;
  codename: string;
  display_name: string | null;
  claimed: boolean | null;
  claimed_at: string | null;
  // P5 (0008): claim_contact (PII email), claim_payment_id, and stripe_customer_id
  // are NOT read into the public path — operator reads go through the
  // operators_public view, which excludes them. Service-role writes still set them.
  current_supporter_tier: string | null;
  verification_status: string | null;
  primary_domain: string | null;
  account_age_days: number | null;
  total_messages_lifetime: number | null;
  // Phase-0 identity fields (migration 0007, apply post-move)
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  links: { github?: string; site?: string; x?: string } | null;
  location: string | null;
  // Profile visibility (migration 0021) — 'public' | 'private'. Null-safe on
  // pre-migration rows (defaults to 'public' in mapOperator).
  profile_visibility: string | null;
  // status — active, dormant, banned, retired. Retired = opted-out operator
  // (PII stripped, codename changed to signal-<hash>, still on board, no profile page).
  status: string | null;
}

/** Minimal shape of a `metric_snapshots` row we read. */
export interface DbMetricSnapshot {
  operator_id: string;
  snapshot_date: string;
  source_submission_id?: string | null;
  window_start?: string | null;
  window_end?: string | null;
  workflow_mode?: "hitl" | "agentic" | "hybrid" | null;
  workflow_evidence_url?: string | null;
  workflow_mode_version?: string | null;
  mode_assessed_at?: string | null;
  /** PK — final tie-breaker when window/date/platform all tie (same-date
   *  uploads stamp one row per window with identical dates). Optional: cold
   *  snapshot.json rows predate its inclusion in the select. */
  metric_snapshot_id?: string | null;
  /** 730 window bucket: '7d' | '30d' | '90d' | 'all_time' (TEXT, schema 0001). */
  window_type: string | null;
  /** Per-submission AI platform (migration 0015, FIX H). Backfilled from the
   *  operator's primary_domain on legacy rows; carried per-snapshot going forward
   *  so claude/codex/multi get distinct (operator, window, platform) slots. */
  platform: string | null;
  compression_ratio: number | null;
  prompt_complexity: number | null;
  cross_thread: number | null;
  session_depth: number | null;
  token_throughput: number | null;
  signa_rate: number | null;
  sdot_score: number | null;
  sdrm_score: number | null;
  signal_force: number | null;
  drift_ratio: number | null;
  class_tier: string | null;
  movement_24h: number | null;
  movement_7d: number | null;
  ruleset_version: string | null;
  // The 4 raw token pillars (migration 0005, nullable). When present, the
  // cascade layer is derived on read via computeCascadeMetrics(); when all four
  // are null (legacy rows) cascade stays null. Canon: DB stores pillars only.
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_tokens: number | null;
  cache_read_tokens: number | null;
  /** Per-snapshot account age / lifetime messages — used to backfill the
   *  unmaintained operators rollup columns (see applySnapshotRollups). */
  account_age_days?: number | null;
  total_messages?: number | null;
}

/**
 * The deterministic pick rule for "one snapshot per key" (2026-09-27 bug fix).
 *
 * Every upload stamps a row per (window_type, platform) with the SAME
 * snapshot_date, so `ORDER BY snapshot_date DESC` leaves the interesting rows
 * in a same-date tie — Postgres returns those in arbitrary order, and the
 * board/profile collapsed onto whatever came back first (the all-time board
 * rendered a 7d row; the profile landed on 90d). The ladder:
 *
 *   bucket 0 — preferWindow + platform='multi'   (the window's own total)
 *   bucket 1 — preferWindow + single platform    (the window's own stats)
 *   bucket 2 — other window + 'multi'            (a cross-platform total)
 *   bucket 3 — anything else                     (freshest available data)
 *
 * Within a bucket the newest snapshot_date wins; same-date ties resolve on
 * metric_snapshot_id so the pick is a TOTAL order independent of input order.
 * preferWindow=null collapses buckets to (multi-first, then latest).
 */
function pickPerKey(
  rows: readonly DbMetricSnapshot[],
  keyOf: (r: DbMetricSnapshot) => string,
  preferWindow?: string | null,
): Map<string, DbMetricSnapshot> {
  const buckets = new Map<string, (DbMetricSnapshot | undefined)[]>();
  /** Better within a bucket: later date; same date → larger id (total order). */
  const better = (r: DbMetricSnapshot, cur: DbMetricSnapshot | undefined) =>
    !cur ||
    r.snapshot_date > cur.snapshot_date ||
    (r.snapshot_date === cur.snapshot_date &&
      (r.metric_snapshot_id ?? "") > (cur.metric_snapshot_id ?? ""));
  for (const r of rows) {
    const key = keyOf(r);
    let b = buckets.get(key);
    if (!b) {
      b = [undefined, undefined, undefined, undefined];
      buckets.set(key, b);
    }
    const i =
      (preferWindow != null && r.window_type === preferWindow ? 0 : 2) +
      (r.platform === "multi" ? 0 : 1);
    if (better(r, b[i])) b[i] = r;
  }
  const out = new Map<string, DbMetricSnapshot>();
  for (const [key, b] of buckets) {
    const pick = b[0] ?? b[1] ?? b[2] ?? b[3];
    if (pick) out.set(key, pick);
  }
  return out;
}

/**
 * Roll the per-snapshot account_age_days / total_messages onto the operator
 * when the operators rollup columns are unmaintained (null / 0). The snapshot
 * values are written by the ingest path on every submission, so they reflect
 * the account at snapshot time — for the chosen (all-time) row that IS the
 * operator's lifetime count.
 */
export function applySnapshotRollups(
  operator: Operator,
  snap: DbMetricSnapshot,
): Operator {
  if (operator.account_age_days === 0 && snap.account_age_days != null)
    operator.account_age_days = snap.account_age_days;
  if (
    !operator.total_messages_lifetime &&
    snap.total_messages != null &&
    snap.total_messages > 0
  )
    operator.total_messages_lifetime = snap.total_messages;
  return operator;
}

// ───────────────────────────────────────────────────────────────────────────
// Query-param contracts (shared by the mock fallback path + the live reads).
// ───────────────────────────────────────────────────────────────────────────

/** Common query params for board-style reads. */
export interface BoardParams {
  /** Website workflow board; omitted by legacy API/MCP callers. */
  mode?: import("@/lib/board/workflow-mode").BoardMode;
  /** Plugin reads fail closed instead of substituting demo/cold-store rows. */
  strictLive?: boolean;
  /** API window enum (e.g. '30d'); maps from WINDOW_API_MAP. */
  window?: string;
  /**
   * 730: when true, `window` is applied as a board FILTER (exact window_type +
   * recency buffer, lib/data/windows.ts). Default false → `window` is a passthrough
   * label and is NOT used to filter, so the metric sub-pages + /api/v1/leaderboard
   * keep their pre-730 full-field behaviour. ONLY the /board/[window] route opts in.
   * (Won't-fix, owner 2026-06-20: the metric pages EXPLAIN metrics, they don't
   * window-filter — windowFilter stays board-only by design.)
   */
  windowFilter?: boolean;
  /**
   * Everything board (owner 2026-06-24): when true, do NOT collapse to one row per
   * operator — every window point (each operator's 7d/30d/90d/all snapshots) renders
   * as a distinct row, all ranked by Υ together. Off by default so windowed/legacy
   * boards keep their one-row-per-operator behaviour. Window weights/experience are a
   * later scoring change; for now mixed window rows just sort by their own Υ.
   */
  allSnapshots?: boolean;
  /**
   * Per-platform board slots (migration 0015, FIX H): when true, collapse to one
   * row per (operator, platform) instead of one per operator — so an operator who
   * ran claude AND codex in the window shows BOTH, labeled. No effect under
   * allSnapshots (which already keeps every row). Behaviour-preserving until
   * multi-platform submissions exist (legacy rows carry one platform per operator).
   */
  perPlatform?: boolean;
  /**
   * Operator-total board (BOARD redesign, 2026-06-27): when true, collapse to ONE
   * row per operator that represents their cross-platform TOTAL — preferring the
   * operator's `platform==='multi'` snapshot (the MCP already sums every active
   * platform's pillars into that one cascade), falling back to their latest single-
   * platform snapshot when no 'multi' row exists. This is the clean default board:
   * one total row per operator, no double-counting (multi already contains
   * claude+codex). Takes precedence over perPlatform / latestPerOperator when set;
   * no effect under allSnapshots (which keeps every row). See operatorTotalCollapse.
   */
  operatorTotal?: boolean;
  /** primary_domain filter, or null/undefined for all. */
  platform?: string | null;
  /**
   * Claimed-only board (2026-09-27): when true, drop unclaimed operators BEFORE
   * the sort+re-rank so `global_rank` is the position on the displayed board —
   * contiguous, and on the same basis as the profile rank (which ranks the
   * claimed set). Without it the /board pages filtered claimed AFTER ranking,
   * producing gappy corpus-wide ranks (#105 at display position ~10).
   */
  claimedOnly?: boolean;
  /** Lowercase class scope (e.g. 'transmitter'), or 'all'/undefined. */
  classScope?: string;
  /** Sort key (a metric_snapshots column). */
  sort?: string;
  /** Max rows. */
  limit?: number;
}

/** History query params. */
export interface HistoryParams {
  window?: string;
  /** Max points (most recent first). */
  limit?: number;
}

// ───────────────────────────────────────────────────────────────────────────
// Narrowing sets + coercion helpers.
// ───────────────────────────────────────────────────────────────────────────

const SUPPORTER_TIERS: ReadonlySet<string> = new Set<SupporterTier>([
  "free",
  "patron",
  "pro",
  "circle_sponsor",
]);

const VERIFICATION_STATUSES: ReadonlySet<string> = new Set<
  Operator["verification_status"]
>(["unverified", "verified", "audited"]);

/** Permanent experience stages — TRANSMITTER is a badge, not a permanent class. */
const SIGNAL_CLASSES: ReadonlySet<string> = new Set<SignalClass>([
  "ARCH+ I", "ARCH+ II", "ARCH+ III",
  "ARCH I", "ARCH II", "ARCH III",
  "POWER I", "POWER II", "POWER III",
  "BASE I", "BASE II", "BASE III",
  "SEEKER I", "SEEKER II", "SEEKER III",
  "REFINER I", "REFINER II", "REFINER III",
  "BEARER I", "BEARER II", "BEARER III",
  "IGNITER I", "IGNITER II", "IGNITER III",
]);

/**
 * Cast a Supabase `.select()` result to our hand-written row type. The supabase
 * client returns a generic/structural type (and models to-one embeds as arrays),
 * so we route through `unknown` — the documented, `any`-free pattern — to assert
 * the runtime shape we know each query produces.
 */
export function asDb<T>(data: unknown): T {
  return data as T;
}

/** Coerce a possibly-null DB value to a finite number, else a fallback. */
export function num(v: number | null | undefined, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Narrow a free-text supporter tier to the SupporterTier union. */
export function toSupporterTier(v: string | null | undefined): SupporterTier {
  return v && SUPPORTER_TIERS.has(v) ? (v as SupporterTier) : "free";
}

/** Narrow a free-text verification status to the union. */
export function toVerification(
  v: string | null | undefined,
): Operator["verification_status"] {
  return v && VERIFICATION_STATUSES.has(v)
    ? (v as Operator["verification_status"])
    : "unverified";
}

/** Narrow a free-text class_tier to the SignalClass union (defaults IGNITER III). */
export function toSignalClass(v: string | null | undefined): SignalClass {
  return v && SIGNAL_CLASSES.has(v) ? (v as SignalClass) : "IGNITER III";
}

/** Map a DB operators row → facade Operator (live rows are never placeholders). */
export function mapOperator(o: DbOperator): Operator {
  // profile_visibility='private' (migration 0021): only codename + computed
  // metrics are public — display_name, handle, avatar, bio, links, location are
  // owner-only. mapOperator is the funnel for EVERY public read path (board,
  // profile, /api/v1/*, fallback rows), so redacting here covers all of them.
  // Owner-facing reads (/me/edit, /api/v1/profile) hit the operators base table
  // directly — they never pass through this mapper.
  const priv = o.profile_visibility === "private";
  return {
    operator_id: o.operator_id,
    codename: o.codename,
    display_name: priv ? null : (o.display_name ?? null),
    claimed: o.claimed ?? false,
    claimed_at: o.claimed_at ?? null,
    // P5 (0008): never surfaced through the public read path — the operators_public
    // view excludes both, so live/view-sourced rows carry null here.
    claim_payment_id: null,
    claim_contact: null,
    current_supporter_tier: toSupporterTier(o.current_supporter_tier),
    verification_status: toVerification(o.verification_status),
    primary_domain: o.primary_domain ?? "other",
    account_age_days: num(o.account_age_days),
    total_messages_lifetime: num(o.total_messages_lifetime),
    isPlaceholder: false,
    // Phase-0 identity fields (migration 0007, apply post-move)
    handle: priv ? null : (o.handle ?? null),
    avatar_url: priv ? null : (o.avatar_url ?? null),
    bio: priv ? null : (o.bio ?? null),
    links: priv ? null : (o.links ?? null),
    location: priv ? null : (o.location ?? null),
    profile_visibility: priv ? "private" : "public",
    status: o.status ?? null,
  };
}

/** Map a DB metric_snapshots row → facade ScoredSnapshot. */
export function mapSnapshot(s: DbMetricSnapshot): ScoredSnapshot {
  return {
    signa_rate: num(s.signa_rate),
    class_tier: toSignalClass(s.class_tier),
    compression_ratio: num(s.compression_ratio),
    // Live snapshots carry no per-value confidence column; precision is implied
    // by an 'audited' operator, but at this layer we expose the free-tier 'low'.
    prompt_complexity: { value: num(s.prompt_complexity), confidence: "low" },
    cross_thread: num(s.cross_thread),
    session_depth: num(s.session_depth),
    token_throughput: num(s.token_throughput),
    signal_force: num(s.signal_force),
    drift_ratio: s.drift_ratio ?? null,
    sdot_score: s.sdot_score ?? null,
    sdrm_score: s.sdrm_score ?? null,
    movement_24h: num(s.movement_24h),
    movement_7d: num(s.movement_7d),
    ruleset_version: s.ruleset_version ?? "1.0",
    // LAST column (2026-06-28): carry the snapshot date through so the board can show
    // a real date instead of the literal "active". DbMetricSnapshot.snapshot_date is
    // always selected (queries.ts §SELECT); null-safe for the empty/pending row.
    snapshot_date: s.snapshot_date || null,
    // Cascade is DERIVED on read from the 4 raw token pillars (migration 0005),
    // mirroring the mock path (mock.ts feeds the same computeCascadeMetrics).
    // Null ONLY when all four pillars are absent (legacy pre-0005 rows). A
    // non-Claude row with cacheCreate=0 still gets a real CascadeMetrics
    // (nonCompounding:true) — that's the engine's job, not a null here.
    cascade: pillarsAllNull(s)
      ? null
      : computeCascadeMetrics({
          input: num(s.input_tokens),
          output: num(s.output_tokens),
          cacheCreate: num(s.cache_creation_tokens),
          cacheRead: num(s.cache_read_tokens),
        }),
  };
}

/** True when a snapshot carries none of the 4 pillars (legacy pre-0005 row). */
export function pillarsAllNull(s: DbMetricSnapshot): boolean {
  return (
    s.input_tokens == null &&
    s.output_tokens == null &&
    s.cache_creation_tokens == null &&
    s.cache_read_tokens == null
  );
}

/**
 * Per-row telemetry rebuilt from the 4 pillars so the live TOTAL column +
 * yield_/leverage/dev10x sorting match the mock path. Legacy rows (no pillars)
 * fall back to a zero block. sessions/turns aren't on metric_snapshots → 0.
 */
export function telemetryFromSnapshot(s: DbMetricSnapshot): TelemetryRaw {
  return {
    fresh_input: num(s.input_tokens),
    output: num(s.output_tokens),
    cache_read: num(s.cache_read_tokens),
    cache_create: num(s.cache_creation_tokens),
    sessions: 0,
    turns: 0,
  };
}

/** A zero telemetry block — for an operator with no cascade data yet. */
export const ZERO_TELEMETRY: TelemetryRaw = {
  fresh_input: 0,
  output: 0,
  cache_read: 0,
  cache_create: 0,
  sessions: 0,
  turns: 0,
};

/** All-null snapshot row → mapSnapshot yields cascade=null + class IGNITER + zeros. */
const EMPTY_DB_SNAPSHOT: DbMetricSnapshot = {
  operator_id: "",
  snapshot_date: "",
  window_type: null,
  platform: null,
  compression_ratio: null,
  prompt_complexity: null,
  cross_thread: null,
  session_depth: null,
  token_throughput: null,
  signa_rate: null,
  sdot_score: null,
  sdrm_score: null,
  signal_force: null,
  drift_ratio: null,
  class_tier: null,
  movement_24h: null,
  movement_7d: null,
  ruleset_version: null,
  input_tokens: null,
  output_tokens: null,
  cache_creation_tokens: null,
  cache_read_tokens: null,
};

/**
 * A "pending" snapshot for an operator that EXISTS but has no cascade data yet
 * (freshly-claimed account, no verified submission). cascade is null, so the
 * profile renders an identity-only pending state instead of 404ing.
 */
export function pendingSnapshot(): ScoredSnapshot {
  return mapSnapshot(EMPTY_DB_SNAPSHOT);
}

/**
 * Dedupe snapshot rows down to the representative per operator (see pickPerKey
 * for the deterministic ladder). When preferWindow is set (the board's own
 * window), that window's rows win; 'multi' — the cross-platform total — is
 * preferred otherwise. Same-date ties break on metric_snapshot_id.
 */
export function latestPerOperator(
  rows: DbMetricSnapshot[],
  preferWindow?: string | null,
): Map<string, DbMetricSnapshot> {
  return pickPerKey(rows, (r) => r.operator_id, preferWindow);
}

/**
 * Per-platform dedupe (FIX H): representative snapshot per (operator_id,
 * platform). Same ladder as latestPerOperator but keyed on the platform too,
 * so claude/codex/multi each keep their own row. A null platform (pre-0015
 * row read before backfill) folds under the operator's '∅' bucket.
 */
export function latestPerOperatorPlatform(
  rows: DbMetricSnapshot[],
  preferWindow?: string | null,
): Map<string, DbMetricSnapshot> {
  return pickPerKey(
    rows,
    (r) => `${r.operator_id}|${r.platform ?? "∅"}`,
    preferWindow,
  );
}

/** The output of operatorTotalCollapse: one chosen snapshot per operator + the
 *  distinct platform set that operator has submitted (for the UI multi-badge). */
export interface OperatorTotalCollapse {
  /** Chosen "total" snapshot per operator_id (multi-preferred, latest-by-date). */
  byOperator: Map<string, DbMetricSnapshot>;
  /** Distinct platforms each operator has submitted, e.g. ['claude','codex','multi'].
   *  Ordered by first-seen in the (date-desc) input. Excludes null/∅ platforms. */
  platformsByOperator: Map<string, string[]>;
}

/**
 * Operator-total collapse (BOARD redesign, 2026-06-27): one row per operator that
 * is their cross-platform TOTAL. The MCP already submits a `platform='multi'`
 * snapshot whose pillars SUM every active platform's cascade, so that row IS the
 * operator's total — we must NOT re-sum claude+codex+multi (multi already contains
 * them → double-count). So per operator we PREFER their latest 'multi' snapshot;
 * when an operator has no 'multi' row (single-platform operator) we fall back to
 * their latest single-platform snapshot.
 *
 * `preferWindow` (2026-09-27): when set — the board's own window enum — a
 * matching window_type row outranks every other window (see pickPerKey), so
 * /board/all picks each operator's `all_time`+`multi` row and a same-date `7d`
 * row can't leapfrog it. Operators with no `preferWindow` row fall back to
 * their latest `multi`, then their latest of anything.
 *
 * Also returns the distinct platform SET per operator (all non-null platforms they
 * submitted) so the UI can badge "claude·codex·multi" on the single total row.
 */
export function operatorTotalCollapse(
  rows: DbMetricSnapshot[],
  preferWindow?: string | null,
): OperatorTotalCollapse {
  const byOperator = pickPerKey(rows, (r) => r.operator_id, preferWindow);
  // Distinct submitted platforms per operator (first-seen order; null/∅ excluded).
  const platformsByOperator = new Map<string, string[]>();
  for (const r of rows) {
    const p = r.platform;
    if (p != null && p !== "") {
      const set = platformsByOperator.get(r.operator_id);
      if (!set) platformsByOperator.set(r.operator_id, [p]);
      else if (!set.includes(p)) set.push(p);
    }
  }

  return { byOperator, platformsByOperator };
}
