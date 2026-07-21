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
}

// ───────────────────────────────────────────────────────────────────────────
// Query-param contracts (shared by the mock fallback path + the live reads).
// ───────────────────────────────────────────────────────────────────────────

/** Common query params for board-style reads. */
export interface BoardParams {
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

const SIGNAL_CLASSES: ReadonlySet<string> = new Set<SignalClass>([
  "TRANSMITTER",
  "ARCH+",
  "ARCH",
  "POWER",
  "BASE",
  "SEEKER",
  "REFINER",
  "BEARER",
  "IGNITER",
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

/** Narrow a free-text class_tier to the SignalClass union (defaults IGNITER). */
export function toSignalClass(v: string | null | undefined): SignalClass {
  return v && SIGNAL_CLASSES.has(v) ? (v as SignalClass) : "IGNITER";
}

/** Map a DB operators row → facade Operator (live rows are never placeholders). */
export function mapOperator(o: DbOperator): Operator {
  return {
    operator_id: o.operator_id,
    codename: o.codename,
    display_name: o.display_name ?? null,
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
    handle: o.handle ?? null,
    avatar_url: o.avatar_url ?? null,
    bio: o.bio ?? null,
    links: o.links ?? null,
    location: o.location ?? null,
    profile_visibility:
      o.profile_visibility === "private" ? "private" : "public",
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
 * Dedupe snapshot rows ordered snapshot_date DESC down to the latest per
 * operator. Supabase JS has no DISTINCT ON, so we keep the first occurrence of
 * each operator_id from a descending-ordered result.
 */
export function latestPerOperator(
  rows: DbMetricSnapshot[],
): Map<string, DbMetricSnapshot> {
  const byOp = new Map<string, DbMetricSnapshot>();
  for (const r of rows) {
    if (!byOp.has(r.operator_id)) byOp.set(r.operator_id, r);
  }
  return byOp;
}

/**
 * Per-platform dedupe (FIX H): latest snapshot per (operator_id, platform) from a
 * descending-ordered result. Same contract as latestPerOperator but keyed on the
 * platform too, so claude/codex/multi each keep their own row. A null platform
 * (pre-0015 row read before backfill) folds under the operator's '∅' bucket.
 */
export function latestPerOperatorPlatform(
  rows: DbMetricSnapshot[],
): Map<string, DbMetricSnapshot> {
  const byOpPlatform = new Map<string, DbMetricSnapshot>();
  for (const r of rows) {
    const key = `${r.operator_id}|${r.platform ?? "∅"}`;
    if (!byOpPlatform.has(key)) byOpPlatform.set(key, r);
  }
  return byOpPlatform;
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
 * their latest single-platform snapshot. Input is date-DESC (same contract as
 * latestPerOperator), so "latest" = first-seen.
 *
 * Also returns the distinct platform SET per operator (all non-null platforms they
 * submitted) so the UI can badge "claude·codex·multi" on the single total row.
 */
export function operatorTotalCollapse(
  rows: DbMetricSnapshot[],
): OperatorTotalCollapse {
  // Latest 'multi' row per operator (first-seen wins under date-desc input).
  const multiByOp = new Map<string, DbMetricSnapshot>();
  // Latest ANY row per operator — the single-platform fallback.
  const latestByOp = new Map<string, DbMetricSnapshot>();
  // Distinct submitted platforms per operator (first-seen order; null/∅ excluded).
  const platformsByOperator = new Map<string, string[]>();

  for (const r of rows) {
    const op = r.operator_id;
    if (!latestByOp.has(op)) latestByOp.set(op, r);
    if (r.platform === "multi" && !multiByOp.has(op)) multiByOp.set(op, r);
    const p = r.platform;
    if (p != null && p !== "") {
      const set = platformsByOperator.get(op);
      if (!set) platformsByOperator.set(op, [p]);
      else if (!set.includes(p)) set.push(p);
    }
  }

  // Prefer the 'multi' total; fall back to the operator's latest single-platform row.
  const byOperator = new Map<string, DbMetricSnapshot>();
  for (const [op, latest] of latestByOp) {
    byOperator.set(op, multiByOp.get(op) ?? latest);
  }

  return { byOperator, platformsByOperator };
}
