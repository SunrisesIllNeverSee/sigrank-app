/**
 * lib/board/live-projection.ts — Phase-2B WS-2: the server-side projection
 * that turns the lib/board LeaderboardRow scope into the typed
 * LiveBoardInitialState consumed by the frozen live-board workspace
 * (components/live/*, contract: ./live-types.ts).
 *
 * This is the production analog of the prototype's sync.py: one call composes
 * the ranked field + hall teaser into the SSR payload for /board/[window].
 * Compact display strings port sync.py's fmt helpers verbatim (compact K/M/B,
 * "132,202.1×", "9.4M/d", "$0.42", "MM/DD/YY") so reference-v1 renderers —
 * which re-parse them via numvOf — behave identically; `num` carries the raw
 * numerics so production math never re-parses a display string.
 *
 * Scope discipline (reviewed acceptance criteria, PHASE2B_IMPLEMENTATION_PLAN):
 *   - The ranking scope is IDENTICAL to app/board/[window]/page.tsx —
 *     getLeaderboard({ window, windowFilter, operatorTotal: true,
 *     claimedOnly: true, mode: "all" }), where windowFilter is off for
 *     all_time (the operator-total collapse already picks the all_time row)
 *     and on for the time-bounded windows.
 *   - operators[] = the first pageSize rows of that scope (default 200);
 *     totalOperators + population.count = the FULL-scope ranked count — the
 *     live denominator, never a constant and never the /stats total.
 *   - fieldStats, movers, hall, fieldMax, featured all derive from the FULL
 *     scope — never the paginated subset.
 *   - No per-operator reads: trend/recs ship empty and enrich lazily on
 *     selection (WS-4 client fetches /api/v1/operators/{codename}/*). The
 *     1,649-call sync.py history loop is deliberately NOT reproduced.
 *
 * Cache strategy (blast-radius protocol): composes ONLY the existing cached
 * getters — getLeaderboard (memoize, 3600s; the param literal below is key-
 * ordered identically to the board page's call so both share ONE memo entry)
 * and getHallOfSignal (unstable_cache, tag "board"). No new corpus reads are
 * introduced, so no new cache key is needed; the projection itself is O(n·log n)
 * CPU over already-cached rows.
 *
 * Non-compounding semantics: canonical compounding fields (yield/lev/dev)
 * render "—" for nc rows. `dev` is a numeric slot in the contract, so it
 * carries 0 with nc=true — mirroring the reference's numvOf("—") → 0 sort
 * semantics; the `nc` flag tells the renderer to show "—". All other canonical
 * fields (snr/vel/scalev/total/cost/eff/opratio/raw) keep their real values,
 * matching the serializer + prototype (nc rows still show "16.2B", "$1.10",
 * "3:1").
 */

import { getHallOfSignal, getLeaderboard } from "@/lib/board/cached";
import { snapshotThroughput } from "@/lib/board/throughput";
import { windowParamToEnum } from "@/lib/board/windows";
import { buildArchetypeOf } from "@/lib/analytics/build-archetypes";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import type { HallRecord, LeaderboardRow } from "@/lib/board/types";
import type {
  FeaturedOperator,
  FieldMaxima,
  FieldStat,
  HallEntry,
  LiveBoardInitialState,
  LiveOperator,
  MoverEntry,
} from "@/lib/board/live-types";

/** Default first page — SSR row count for the workspace table. */
const LIVE_PAGE_SIZE = 200;
/** Movers rail depth — the prototype derives a top-5 module. */
const MOVERS_TOP = 5;
/** Hall teaser depth — the prototype takes the first 3 records. */
const HALL_TEASER = 3;
/** Provenance source label (sync.py LIVE_META.source parity). */
const LIVE_SOURCE = "signalaf.com/api/v1";

/** sync.py compact(): K/M/B suffixes, one decimal — "34.2B", "9.4M", "33.8K". */
function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

/** sync.py num(): trim float noise — `dp` decimals under 1,000, else integer. */
function trimNum(v: number, dp = 2): number {
  return v < 1000 ? Number(v.toFixed(dp)) : Math.round(v);
}

/** sync.py f"{x:,.2f}" — comma-grouped fixed-2, e.g. "90,677,589.75". */
function comma2(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** sync.py seen(): 'YYYY-MM-DD' → "MM/DD/YY"; missing → "—". */
function seen(date: string | null | undefined): string {
  if (!date) return "—";
  const [y, m, d] = date.slice(0, 10).split("-");
  return y && m && d ? `${m}/${d}/${y.slice(2)}` : "—";
}

/** Momentum copy — locked semantic: rank spots over trailing 7d (U+2212). */
function deltaCopy(mv7: number): string {
  return `${mv7 >= 0 ? "+" : "−"}${Math.abs(mv7)} spots vs 7d`;
}

/** sync.py WTAG: "all_time" → "ALL-TIME", "30d" → "30D". */
function windowTag(windowEnum: string): string {
  return windowEnum.toUpperCase().replace("ALL_TIME", "ALL-TIME");
}

/** Python str.title(): first letter of each word upper, rest lower —
 *  "ALL-TIME" → "All-Time", "7D" → "7D", "30D" → "30D". */
function titleCase(s: string): string {
  return s.replace(/[a-zA-Z]+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

/** The row's display handle: the operator's real @handle when set, else the
 *  canonical display name (operatorDisplayName) — never a bare raw codename
 *  where a display identity exists (AGENTS.md display-name rule). */
function displayHandle(row: LeaderboardRow): string {
  return row.operator.handle
    ? `@${row.operator.handle}`
    : operatorDisplayName(row);
}

/** Cascade → build-archetype classifier input (canon §8a axes). Falls back to
 *  raw-pillar axes when the cascade is absent (legacy rows); all-zero axes
 *  classify as "input-bound", matching the prototype's default. */
function archetypeOf(row: LeaderboardRow) {
  const c = row.snapshot.cascade;
  const t = row.telemetry;
  const axes = c
    ? { leverage: c.leverage, velocity: c.velocity, construction: c.construction }
    : t.fresh_input > 0
      ? {
          leverage: t.cache_read / t.fresh_input,
          velocity: t.output / t.fresh_input,
          construction:
            t.cache_read > 0 ? t.cache_create / t.cache_read : 0,
        }
      : { leverage: 0, velocity: 0, construction: 0 };
  return buildArchetypeOf(axes);
}

/** LeaderboardRow → LiveOperator (the compact workspace row shape). */
export function toLiveOperator(row: LeaderboardRow): LiveOperator {
  const { operator, snapshot: s } = row;
  const c = s.cascade;
  const t = row.telemetry;
  const nc = c?.nonCompounding === true;
  /** Cascade only when the row actually compounds (cache_write > 0) — the
   *  gate for the canonical compounding fields that render "—" otherwise. */
  const comp = c && !c.nonCompounding ? c : null;
  const totalTokens = t.fresh_input + t.output + t.cache_create + t.cache_read;
  const throughput = snapshotThroughput({
    inputTokens: t.fresh_input,
    outputTokens: t.output,
    cacheWriteTokens: t.cache_create,
    cacheReadTokens: t.cache_read,
    windowStart: row.window_start,
    windowEnd: row.window_end,
  });
  const archetype = archetypeOf(row).key;
  /* Null-preserving movement: the contract types mv7/mv24 as number | null
     because "no movement data" (fresh row, unmaintained rollup) must never
     surface as a real 0-spot delta. ScoredSnapshot declares the fields
     non-null, but mapSnapshot's num() coercion and mock/fallback rows mean a
     null can still arrive here — emit null, not Math.round(null)→0. */
  const mv7 = s.movement_7d == null ? null : Math.round(s.movement_7d);

  // Drill-down sub-line (sync.py): "<archetype> signature · <klass> tier ·
  // <total> observed" + supporter/verified/recs context bits.
  const bits = [
    `${archetype} signature`,
    `${s.class_tier} tier`,
    `${compact(totalTokens)} observed`,
  ];
  if (operator.current_supporter_tier !== "free")
    bits.push(`${operator.current_supporter_tier} supporter`);
  if (operator.verification_status === "verified") bits.push("verified");

  return {
    codename: operator.codename,
    slug: operator.codename, // share slug === API codename verbatim
    name: operatorDisplayName(row),
    handle: displayHandle(row),
    /* Operator-supplied public location — already on the leaderboard payload
       (OPERATOR_COLUMNS selects operators.location; mappers nulls it for
       private profiles). Rendered as the `◍ <location>` tertiary line. */
    location: operator.location ?? null,
    /* Public avatar image — same privacy gate as location (avatar_url is
       already in OPERATOR_COLUMNS + mappers.ts). The workspace renders the
       image over the gradient-initial tile when present. */
    avatarUrl: operator.avatar_url ?? null,
    klass: s.class_tier,
    archetype,
    claimed: operator.claimed,
    nc,
    wf: row.workflow_mode ?? null,
    total: compact(totalTokens),
    yield: comp ? compact(comp.yield_) : "—",
    snr: trimNum(c ? c.snr : s.compression_ratio, 3),
    vel: c ? trimNum(c.velocity, 2) : 0,
    lev: comp
      ? `${comp.leverage.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`
      : "—",
    dev: comp?.dev10x != null ? trimNum(comp.dev10x, 2) : 0,
    pct: trimNum(row.percentile, 1),
    scalev: c ? trimNum(c.scaleV, 2) : 0,
    mv24: s.movement_24h == null ? null : Math.round(s.movement_24h),
    mv7,
    ptpd: throughput ? `${compact(throughput.processedTokensPerDay)}/d` : null,
    otpd: throughput ? `${compact(throughput.outputTokensPerDay)}/d` : null,
    // "lev:1:vel" → "lev:1" (sync.py rsplit(":",1)[0]).
    opratio: c ? c.opRatio.split(":").slice(0, 2).join(":") : null,
    raw: {
      i: compact(t.fresh_input),
      o: compact(t.output),
      cr: compact(t.cache_read),
      cw: compact(t.cache_create),
    },
    /* Σ TOTAL pillar sub-line (prod parity — the legacy board renders
       I·O·W·R under the total cell). Same telemetry as `raw`/`total`,
       compact(); keys follow the prod label order (w = cache_create,
       r = cache_read). Null on nc rows per the owner spec — the nc flag
       is the "—" renderer for compounding surfaces. */
    pillars: nc
      ? null
      : {
          i: compact(t.fresh_input),
          o: compact(t.output),
          w: compact(t.cache_create),
          r: compact(t.cache_read),
        },
    // Lazy-enriched (WS-4): history/records are per-operator fetches on
    // selection — never bulk-loaded into the board payload.
    trend: [],
    recs: [],
    sub: bits.join(" · "),
    verif: operator.verification_status,
    supporter: operator.current_supporter_tier,
    /* No delta copy when movement is unknown — the empty string falls through
       to the trend-derived delta in profileFor instead of printing "+0 spots". */
    delta: mv7 == null ? "" : deltaCopy(mv7),
    last: seen(s.snapshot_date ?? row.snapshot_date),
    age: operator.account_age_days,
    msgs: operator.total_messages_lifetime,
    cost: c ? `$${c.costPerMillion.toFixed(2)}` : "—",
    eff: c ? compact(c.efficiency) : "—",
    platform: (row.platform ?? operator.primary_domain ?? "other").toLowerCase(),
    num: {
      // numvOf("—") → 0 parity: nc rows carry 0 in compounding math paths.
      yield: comp ? comp.yield_ : 0,
      lev: comp ? comp.leverage : 0,
      total: totalTokens,
      cost: c ? c.costPerMillion : 0,
    },
  };
}

/**
 * projectLiveBoard — the pure core: LeaderboardRow scope + hall records →
 * LiveBoardInitialState. Every aggregate derives from `rows` (the FULL
 * ranking scope); `operators` is the only member truncated to pageSize.
 */
export function projectLiveBoard(
  rows: LeaderboardRow[],
  hall: HallRecord[],
  windowEnum: string,
  opts: { pageSize?: number; generatedAt?: string } = {},
): LiveBoardInitialState {
  const pageSize = opts.pageSize ?? LIVE_PAGE_SIZE;
  const wtag = windowTag(windowEnum);

  // ── Full-scope aggregates (never the paginated subset) ───────────────
  // fieldMax = the workspace's RMAX equivalent: per-axis maxima over the
  // whole ranked field so client radar/rail normalization can't skew to a
  // page subset. Compounding axes (yield/lev/dev) read only compounding rows;
  // vel/snr/scalev read every row that carries them. `|| 1` floor matches the
  // reference's empty-field fallback.
  let maxYield = 0;
  let maxLev = 0;
  let maxVel = 0;
  let maxSnr = 0;
  let maxDev = 0;
  let maxScale = 0;
  const compoundingYields: number[] = [];
  for (const r of rows) {
    const c = r.snapshot.cascade;
    if (c && !c.nonCompounding) {
      if (c.yield_ > maxYield) maxYield = c.yield_;
      if (c.leverage > maxLev) maxLev = c.leverage;
      if (c.dev10x != null && c.dev10x > maxDev) maxDev = c.dev10x;
      compoundingYields.push(c.yield_);
    }
    if (c) {
      if (c.velocity > maxVel) maxVel = c.velocity;
      if (c.scaleV > maxScale) maxScale = c.scaleV;
    }
    const snr = c ? c.snr : r.snapshot.compression_ratio;
    if (snr > maxSnr) maxSnr = snr;
  }
  const fieldMax: FieldMaxima = {
    yield: maxYield || 1,
    lev: maxLev || 1,
    vel: maxVel || 1,
    snr: maxSnr || 1,
    dev: maxDev || 1,
    scalev: maxScale || 1,
  };

  compoundingYields.sort((a, b) => a - b);
  const mid = Math.floor(compoundingYields.length / 2);
  const medianYield =
    compoundingYields.length === 0
      ? 0
      : compoundingYields.length % 2 === 0
        ? (compoundingYields[mid - 1] + compoundingYields[mid]) / 2
        : compoundingYields[mid];

  // FIELD_STATS — the live field's own stat strip. Deliberately scope-derived
  // (not /stats): the corpus total includes ghost-filtered rows and must
  // never be conflated with the live denominator (D-F01 caveat, DATA_KEYS).
  const fieldStats: FieldStat[] = [
    { field: "total_operators", value: rows.length.toLocaleString("en-US") },
    { field: "median_yield", value: comma2(medianYield) },
    { field: "top_yield", value: comma2(maxYield) },
    { field: "window", value: `${titleCase(wtag)} · live` },
  ];

  // MOVERS — top positive movement_7d over the FULL scope (locked momentum
  // semantic; reference deriveMovers shape).
  const movers: MoverEntry[] = [...rows]
    .filter((r) => r.snapshot.movement_7d > 0)
    .sort((a, b) => b.snapshot.movement_7d - a.snapshot.movement_7d)
    .slice(0, MOVERS_TOP)
    .map((r) => ({
      codename: r.operator.codename,
      slug: r.operator.codename,
      handle: displayHandle(r),
      klass: r.snapshot.class_tier,
      mv7: Math.round(r.snapshot.movement_7d),
      delta: deltaCopy(Math.round(r.snapshot.movement_7d)),
    }));

  // HALL teaser — first N records, "<display name> — value" display line.
  // Identity stays on `codename`; the label resolves operatorDisplayName so
  // live rows never surface raw signal-… slugs as the headline.
  const nameByCodename = new Map(
    rows.map((r) => [r.operator.codename, operatorDisplayName(r)]),
  );
  const hallEntries: HallEntry[] = hall
    .filter((h) => !h.isPlaceholder)
    .slice(0, HALL_TEASER)
    .map((h) => ({
      value: `${nameByCodename.get(h.operator_codename) ?? h.operator_codename} — ${h.value}`,
      codename: h.operator_codename,
      metric: h.title,
    }));

  // FEATURED — the rank-1 context block (sync.py FEATURED shape).
  const top = rows[0];
  let featured: FeaturedOperator | null = null;
  if (top) {
    const topOp = toLiveOperator(top);
    featured = {
      codename: top.operator.codename,
      name: operatorDisplayName(top),
      handle: topOp.handle,
      rank: top.global_rank,
      klass: top.snapshot.class_tier,
      archetype: topOp.archetype,
      yield: topOp.yield,
      delta: topOp.delta,
      blurb: `Live rank-1 operator — ${archetypeOf(top).name} composition.`,
    };
  }

  return {
    meta: {
      window: windowEnum,
      generatedAt: opts.generatedAt ?? new Date().toISOString(),
      ruleset: rows[0]?.snapshot.ruleset_version ?? null,
      source: LIVE_SOURCE,
    },
    operators: rows.slice(0, pageSize).map(toLiveOperator),
    population: { count: rows.length, tag: `LIVE FIELD · ${wtag}` },
    fieldStats,
    movers,
    hall: hallEntries,
    featured,
    fieldMax,
    totalOperators: rows.length,
  };
}

/**
 * getLiveBoardInitialState — the WS-2 server entry point for /board/[window].
 * `window` accepts the route slug ("all", "30d") or the DB enum ("all_time").
 * Reads the same ranking scope the board page renders (claimed, mode-resolved,
 * operator-total), then projects it into the typed workspace payload.
 */
export async function getLiveBoardInitialState(
  window: string,
  opts: { pageSize?: number; generatedAt?: string } = {},
): Promise<LiveBoardInitialState> {
  const windowEnum = windowParamToEnum(window);
  const [rows, hall] = await Promise.all([
    // Same params (and same key order → same memo key) as the /board page:
    // all_time reads the full snapshot set (operatorTotalCollapse picks the
    // all_time row per op); bounded windows push the filter to PostgREST.
    getLeaderboard({
      window: windowEnum,
      windowFilter: windowEnum !== "all_time",
      operatorTotal: true,
      claimedOnly: true,
      mode: "all",
    }),
    getHallOfSignal(),
  ]);
  return projectLiveBoard(rows, hall, windowEnum, opts);
}
