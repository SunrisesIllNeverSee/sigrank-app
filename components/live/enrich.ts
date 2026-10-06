/**
 * components/live/enrich.ts — WS-4 lazy drill-down enrichment client.
 *
 * The board's initial SSR payload ships `trend: []` / `recs: []` by design
 * (lib/board/live-types.ts) — per-operator depth arrives lazily, ONLY when an
 * operator is selected in the dock/workspace. This module is the fetch layer:
 *
 *   GET /api/v1/operators/{codename}                  → verif, supporter, claimed,
 *                                                     age, msgs, mv24/mv7, rank
 *   GET /api/v1/operators/{codename}/history          → trend (the signa_rate
 *                                                     series — the endpoint's
 *                                                     only per-date score; bound
 *                                                     as "score history", never
 *                                                     headlined — DATA_KEYS §7/§11a)
 *                                                     + dated rank/class points
 *   GET /api/v1/operators/{codename}/records          → recs (dynamic metric
 *                                                     records) + recordsStatic
 *                                                     (curated hall titles)
 *   GET /api/v1/operators/{codename}/snapshot-history → snapshots — CLAIMED ONLY:
 *                                                     the route 404s for
 *                                                     unclaimed/retired/private
 *                                                     operators and 400s on
 *                                                     codenames outside its
 *                                                     [a-zA-Z0-9_-]{1,100} gate,
 *                                                     so it is fetched only when
 *                                                     eligibility is proven
 *
 * Cache design: module-level Maps keyed `${window}:${codename}` /
 * `profile:${codename}` holding the in-flight PROMISE. One fetch fan-out per
 * operator per session — repeat selection replays the resolved promise,
 * concurrent consumers share the in-flight one. Nothing is prefetched: no call
 * happens until a selection resolves (the sync.py 1,649-call pattern is banned).
 *
 * Failure discipline: load() never rejects — each channel settles
 * independently and misses land in `errors` so the dock can mark the failed
 * surface while base row data keeps rendering. Un-selecting drops the apply
 * (caller guards with an alive flag); the shared fetch itself is not aborted —
 * a later selection of the same operator reuses it.
 */

import type { LiveOperator } from "@/lib/board/live-types";

/* ---------- API payload shapes (public v1 — app/api/v1/operators/*) ------- */

interface ApiOperator {
  claimed?: boolean;
  verification_status?: string;
  supporter_tier?: string;
  account_age_days?: number;
  total_messages?: number;
  movement_24h?: number;
  movement_7d?: number;
  current_rank?: { global?: number; percentile?: number };
}

interface ApiHistory {
  points?: {
    date?: string;
    signa_rate?: number | null;
    global_rank?: number;
    class_tier?: string;
  }[];
}

interface ApiRecords {
  static_records?: {
    reward_id?: string;
    title?: string;
    value?: string;
    achieved_at?: string;
  }[];
  dynamic_records?: {
    metric?: string;
    metric_name?: string;
    rank?: number;
    value?: string;
    window?: string;
  }[];
}

interface ApiSnapshots {
  entries?: {
    snapshot_id?: string;
    submitted_at?: string;
    platform?: string;
    window?: string;
    yield_?: number | null;
    leverage?: number | null;
    velocity?: number | null;
    snr?: number | null;
    workflow_mode?: string | null;
  }[];
  next_page?: number | null;
}

/* ---------- enriched detail surface (superset of the LiveOperator patch) -- */

/** One dated score-history point (oldest → newest, as the API emits). */
export interface LiveHistoryPoint {
  date: string;
  /** The history endpoint's per-date score (signa_rate) — backs the trend
   *  sparkline only; never surfaced as Yield (DATA_KEYS §7). */
  score: number;
  rank: number;
  klass: string;
}

/** Curated Hall-of-Signal title held by the operator (records have no rank). */
export interface LiveStaticRecord {
  title: string;
  value: string;
  /** achieved_at, ISO — display form handled by the consumer. */
  date: string;
}

/** One scored submission from the claimed-only snapshot ledger. */
export interface LiveSnapshot {
  id: string;
  submittedAt: string;
  platform: string;
  window: string;
  yield_: number | null;
  leverage: number | null;
  velocity: number | null;
  snr: number | null;
  workflowMode: string | null;
}

/** Channels a detail load may partially fail on. */
export type DetailChannel = "profile" | "history" | "records" | "snapshots";

/**
 * The enrichment payload. Extends Partial<LiveOperator> so a plain
 * `(codename) => Partial<LiveOperator>` fetcher remains assignable to the
 * workspace's `fetchDetail` prop; the extra surfaces (history points, static
 * records, snapshot ledger, eligibility, per-channel errors) ride alongside.
 */
export interface LiveOperatorDetail extends Partial<LiveOperator> {
  /** Dated score/rank/class points for the History surface. */
  history?: LiveHistoryPoint[];
  /** Curated Hall records (titles, not ranked metric records). */
  recordsStatic?: LiveStaticRecord[];
  /** Claimed-only submission ledger — absent when ineligible or unfetched. */
  snapshots?: LiveSnapshot[];
  /** Whether /snapshot-history applies (claimed + codename charset gate). */
  snapshotEligible?: boolean;
  /** current_rank.global — used by the account chip; board rows carry rank
   *  positionally, so this is detail-surface only (never written into `o`). */
  rank?: number;
  /** Channels that failed during this load (partial failure is still ready). */
  errors?: Partial<Record<DetailChannel, true>>;
}

export type FetchDetail = (
  codename: string,
  hint?: { claimed?: boolean },
) => Promise<LiveOperatorDetail | void> | LiveOperatorDetail | void;

/** Dock fetch lifecycle for the selected operator. */
export type DetailStatus = "idle" | "loading" | "ready" | "error";

/* ---------- internals ---------------------------------------------------- */

/** sync.py HIST mapping: last-10 of the score series backs the trend line. */
const TREND_POINTS = 10;
/** How many most-recent history points the sparkline samples from. */
const HISTORY_LIMIT = 60;
/** History / snapshot rows rendered per group inside the drill column. */
const HISTORY_ROWS = 6;
const SNAPSHOT_ROWS = 6;
/** snapshot-history route's codename gate — 400s outside this charset, so the
 *  fetch is never attempted for codenames it cannot serve. */
const SNAPSHOT_CODENAME_RE = /^[a-zA-Z0-9_-]{1,100}$/;

async function api<T>(path: string): Promise<T> {
  const r = await fetch(path, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`http ${r.status}`);
  return (await r.json()) as T;
}

/* profile payload — its own cache entry so the account chip (viewer rank)
   and the detail fan-out share one request per operator. */
const profileCache = new Map<string, Promise<ApiOperator | null>>();

export function fetchOperatorProfile(
  codename: string,
): Promise<ApiOperator | null> {
  const hit = profileCache.get(codename);
  if (hit) return hit;
  const p = api<ApiOperator>(`/api/v1/operators/${encodeURIComponent(codename)}`)
    .catch(() => null);
  profileCache.set(codename, p);
  return p;
}

const detailCache = new Map<string, Promise<LiveOperatorDetail>>();

/**
 * fetchOperatorDetail — the per-selection enrichment fan-out. Session-cached:
 * the resolved promise replays on re-select, so a codename costs one round of
 * fetches per session per window.
 */
export function fetchOperatorDetail(
  codename: string,
  windowEnum?: string,
  hint?: { claimed?: boolean },
): Promise<LiveOperatorDetail> {
  const key = `${windowEnum ?? ""}:${codename}`;
  const hit = detailCache.get(key);
  if (hit) return hit;
  const p = loadDetail(codename, windowEnum, hint).catch((): LiveOperatorDetail => {
    /* loadDetail itself never rejects (allSettled); this is a belt-and-braces
       guard so a throw can never poison the cache with a rejected promise. */
    return {
      errors: { profile: true, history: true, records: true },
    };
  });
  detailCache.set(key, p);
  return p;
}

/**
 * createDetailFetcher — bind the active board window into the 1-arg
 * fetchDetail shape the workspace prop expects.
 */
export function createDetailFetcher(windowEnum?: string): FetchDetail {
  return (codename, hint) => fetchOperatorDetail(codename, windowEnum, hint);
}

async function loadDetail(
  codename: string,
  windowEnum?: string,
  hint?: { claimed?: boolean },
): Promise<LiveOperatorDetail> {
  const enc = encodeURIComponent(codename);
  const errors: NonNullable<LiveOperatorDetail["errors"]> = {};

  const [opRes, histRes, recsRes] = await Promise.allSettled([
    fetchOperatorProfile(codename),
    api<ApiHistory>(
      `/api/v1/operators/${enc}/history?window=${encodeURIComponent(
        windowEnum ?? "all_time",
      )}&limit=${HISTORY_LIMIT}`,
    ),
    api<ApiRecords>(`/api/v1/operators/${enc}/records`),
  ]);

  const det: LiveOperatorDetail = { errors };

  /* profile channel → account-context fields + verification/supporter */
  const op = opRes.status === "fulfilled" ? opRes.value : null;
  if (opRes.status === "rejected" || op === null) {
    errors.profile = true;
  } else {
    if (typeof op.claimed === "boolean") det.claimed = op.claimed;
    if (op.verification_status) det.verif = op.verification_status;
    if (op.supporter_tier) det.supporter = op.supporter_tier;
    if (typeof op.account_age_days === "number") det.age = op.account_age_days;
    if (typeof op.total_messages === "number") det.msgs = op.total_messages;
    if (typeof op.movement_24h === "number") det.mv24 = Math.round(op.movement_24h);
    if (typeof op.movement_7d === "number") det.mv7 = Math.round(op.movement_7d);
    const g = op.current_rank?.global;
    if (typeof g === "number" && Number.isFinite(g)) det.rank = g;
  }

  /* history channel → trend (score series, last-N) + dated trajectory points */
  if (histRes.status === "fulfilled") {
    const pts = (histRes.value.points ?? [])
      .filter((p): p is NonNullable<typeof p> & { date: string } => !!p?.date)
      .map<LiveHistoryPoint>((p) => ({
        date: p.date.slice(0, 10),
        score: typeof p.signa_rate === "number" ? p.signa_rate : 0,
        rank: typeof p.global_rank === "number" ? p.global_rank : 0,
        klass: p.class_tier ?? "",
      }));
    det.history = pts;
    det.trend = pts
      .map((p) => p.score)
      .filter((v) => Number.isFinite(v) && v > 0)
      .slice(-TREND_POINTS);
  } else {
    errors.history = true;
  }

  /* records channel → recs (ranked metric boards) + curated hall titles */
  if (recsRes.status === "fulfilled") {
    const r = recsRes.value;
    det.recs = (r.dynamic_records ?? []).map((d) => ({
      metric: d.metric_name ?? d.metric ?? "—",
      rank: typeof d.rank === "number" ? d.rank : 0,
      value: d.value ?? "—",
      window: d.window ?? "—",
    }));
    det.recordsStatic = (r.static_records ?? []).map((s) => ({
      title: s.title ?? "Record",
      value: s.value ?? "—",
      date: s.achieved_at ?? "",
    }));
  } else {
    errors.records = true;
  }

  /* snapshot ledger — claimed-only upstream (404 on unclaimed). Eligibility:
     claimed is proven by the profile payload when it answered, else by the
     caller's hint (the board row already knows `claimed`). The charset gate
     avoids a guaranteed 400 on codenames the route rejects outright. */
  const claimed = op?.claimed ?? hint?.claimed ?? false;
  const eligible = claimed === true && SNAPSHOT_CODENAME_RE.test(codename);
  det.snapshotEligible = eligible;
  if (eligible) {
    try {
      const s = await api<ApiSnapshots>(
        `/api/v1/operators/${enc}/snapshot-history?page=0`,
      );
      det.snapshots = (s.entries ?? []).map((e) => ({
        id: e.snapshot_id ?? "",
        submittedAt: e.submitted_at ?? "",
        platform: e.platform ?? "other",
        window: e.window ?? "—",
        yield_: e.yield_ ?? null,
        leverage: e.leverage ?? null,
        velocity: e.velocity ?? null,
        snr: e.snr ?? null,
        workflowMode: e.workflow_mode ?? null,
      }));
    } catch {
      errors.snapshots = true;
    }
  }

  if (Object.keys(errors).length === 0) delete det.errors;
  return det;
}

/* ---------- merge — detail → LiveOperator -------------------------------- */

const PATCH_KEYS = [
  "verif",
  "supporter",
  "claimed",
  "age",
  "msgs",
  "mv24",
  "mv7",
  "trend",
  "recs",
] as const;

/**
 * mergeDetail — overlay an enriched detail onto a base LiveOperator. Only
 * canonical LiveOperator fields cross the boundary (detail-only surfaces —
 * history/snapshots/rank/errors — stay on the detail object for the drill
 * tabs). `sub` is recomposed sync.py-style so the enrichment's verified/
 * supporter/record context reaches the overview sub-line.
 */
export function mergeDetail(
  o: LiveOperator,
  det: LiveOperatorDetail,
): LiveOperator {
  const patch: Partial<LiveOperator> = {};
  for (const k of PATCH_KEYS) {
    const v = det[k];
    if (v !== undefined) (patch as Record<string, unknown>)[k] = v;
  }
  const merged = { ...o, ...patch };
  if (det.verif !== undefined || det.supporter !== undefined || det.recs?.length) {
    merged.sub = detailSub(merged);
  }
  return merged;
}

/**
 * detailSub — the drill-down sub-line, sync.py semantics:
 *   "<archetype> signature · <klass> tier · <total> observed
 *    [· <tier> supporter] [· verified|audited] [· <metric> #<rank> (<value>)]"
 * Reads the ALREADY-MERGED operator so enriched + base fields compose once.
 */
export function detailSub(o: LiveOperator): string {
  const bits = [
    `${o.archetype} signature`,
    `${o.klass} tier`,
    `${o.total} observed`,
  ];
  if (o.supporter && o.supporter !== "free") bits.push(`${o.supporter} supporter`);
  if (o.verif === "verified" || o.verif === "audited") bits.push(o.verif);
  const r0 = o.recs?.[0];
  if (r0 && r0.rank > 0) bits.push(`${r0.metric} #${r0.rank} (${r0.value})`);
  return bits.join(" · ");
}

/** Display caps shared by the drill tabs. */
export const DRILL_CAPS = { HISTORY_ROWS, SNAPSHOT_ROWS };

/**
 * detailFailed — every data channel failed (or the operator doesn't exist):
 * the dock surfaces its error line while base row data stays rendered. A
 * snapshot ledger that answered still counts as a live surface, so the
 * eligibility branch is folded in.
 */
export function detailFailed(det: LiveOperatorDetail): boolean {
  const e = det.errors;
  if (!e?.profile || !e?.history || !e?.records) return false;
  return det.snapshotEligible !== true || e.snapshots === true;
}
