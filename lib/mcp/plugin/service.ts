import "server-only";

import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { getLeaderboard, type LeaderboardRow } from "@/lib/board";
import { getOperator } from "@/lib/board/queries";
import { isPublishedBoardRow } from "@/lib/board/published-row";
import { describeBuildArchetype } from "@/lib/analytics/build-archetypes";
import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { safeName, trustedClientIp, ttlMemo } from "@/lib/mcp/untrusted";
import { METRICS, SORT_METRICS, finite, tokenCount, summarizeField, orderedEntries, fieldPage, type SortMetric } from "./field-analysis";
import { getHistoricalBoard } from "@/lib/history/board-2026-07-31";
import { formatBetaReport, prepareBetaReport } from "./bug-report";

type Scope = { dataset: "live"; window: "7d" | "30d" | "90d" | "all"; platform: string; cohort: "public" | "exact4" | "reconstructed4"; view: "total" | "platforms"; category: "all"; population: "claimed_operators" | "public_operators" };
type Args = Record<string, unknown>;

const WINDOWS = new Set(["7d", "30d", "90d", "all"]);
const CONTRACT_VERSION = "1.2.0";
const SOURCE = "https://signalaf.com/api/plugins/sigrank/mcp";

class ToolError extends Error {
  constructor(public code: string, message: string, public retryable = false) { super(message); }
}

const SUPPORTED_PLATFORMS = ["claude", "codex", "chatgpt", "gemini", "pi", "multi"] as const;
// Unambiguous client/product names agents send for a supported platform. Vendor
// names (anthropic, google, openai, gpt) are deliberately not mapped: they do not
// name one platform.
const PLATFORM_ALIASES: Record<string, string> = {
  "claude-code": "claude", "claude-desktop": "claude", "claude-ai": "claude", "claude-cowork": "claude",
  "codex-cli": "codex", "openai-codex": "codex", "codex-mcp-client": "codex",
  "chatgpt-desktop": "chatgpt", "chatgpt-app": "chatgpt",
  "gemini-cli": "gemini",
};
/** Lowercase, trim, underscores to hyphens, then map unambiguous client names. Non-strings pass through. */
export function normalizePlatform<T>(platform: T): T | string {
  if (typeof platform !== "string") return platform;
  const key = platform.trim().toLowerCase().replace(/_/g, "-");
  return PLATFORM_ALIASES[key] ?? key;
}
const FIND_CODENAMES = "Find valid codenames with get_leaderboard (entries[].codename).";

function scopeOf(args: Args, defaultView: Scope["view"] = "total"): Scope {
  const window = args.window ?? "all";
  if (args.dataset !== undefined && args.dataset !== "live") throw new ToolError("UNSUPPORTED_SCOPE", "Use get_historical_board for the frozen July archive.");
  const rawPlatform = args.platform ?? "all";
  const platform = normalizePlatform(rawPlatform);
  const cohort = args.cohort ?? "public";
  const view = args.view ?? defaultView;
  if (typeof window !== "string" || !WINDOWS.has(window)) throw new ToolError("INVALID_ARGUMENT", "Unsupported window.");
  if (typeof platform !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(platform)) throw new ToolError("INVALID_ARGUMENT", "Invalid platform.");
  if (platform !== "all" && !(SUPPORTED_PLATFORMS as readonly string[]).includes(platform)) throw new ToolError("UNSUPPORTED_SCOPE", `Platform is not supported. Use one of: all, ${SUPPORTED_PLATFORMS.join(", ")}.`);
  if (view !== "total" && view !== "platforms") throw new ToolError("INVALID_ARGUMENT", "view must be total or platforms.");
  if (cohort !== "public") throw new ToolError("UNSUPPORTED_SCOPE", "Evidence-class cohorts (exact4, reconstructed4) require stored provenance; existing board rows cannot support them yet. Use cohort \"public\" (the default) or omit the argument.");
  return { dataset: "live", window: window as Scope["window"], platform, cohort: "public", view, category: "all", population: view === "total" ? "claimed_operators" : "public_operators" };
}

function provenance(scope: Scope, observed: string | null, ruleset: string | null, url = `https://signalaf.com/board/${scope.window}`) {
  return {
    source_urls: [url, SOURCE], retrieved_at: new Date().toISOString(),
    observed_at: observed ? `${observed}T00:00:00.000Z` : null,
    dataset_version: null, methodology_version: null, ruleset_version: ruleset,
    adapter_version: null, taxonomy_version: null,
    window: { label: scope.window, start: null, end: null },
    platforms: scope.platform === "all" ? [] : [scope.platform], models: [],
    data_origin: "unknown", measurement_class: null, verification_status: null,
    ranking_eligible: false, coverage: "unknown", reconstruction_method: null,
    unknown_fields: ["dataset_version", "methodology_version", "adapter_version", "taxonomy_version", "actual_window_bounds", "measurement_class", "verification_status"],
  };
}

function safeNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function operatorDto(row: LeaderboardRow, scope: Scope) {
  const c = row.snapshot.cascade;
  const p = provenance(scope, row.snapshot_date ?? row.snapshot.snapshot_date ?? null,
    row.snapshot.ruleset_version || null,
    `https://signalaf.com/user/${encodeURIComponent(row.operator.codename)}`);
  p.ranking_eligible = !row.pending && row.global_rank > 0;
  p.platforms = [row.platform || row.operator.primary_domain].filter(Boolean);
  const pillars = row.pending ? { input: null, output: null, cache_write: null, cache_read: null } : {
    input: tokenCount(row.telemetry.fresh_input), output: tokenCount(row.telemetry.output),
    cache_write: tokenCount(row.telemetry.cache_create), cache_read: tokenCount(row.telemetry.cache_read),
  };
  const archetype = describeBuildArchetype(pillars);
  return {
    codename: row.operator.codename,
    display_name: safeName(row.operator.display_name, row.operator.codename),
    profile_url: `https://signalaf.com/user/${encodeURIComponent(row.operator.codename)}`,
    class_tier: row.pending ? null : row.snapshot.class_tier,
    archetype: archetype?.key ?? null,
    archetype_details: archetype,
    rank: row.pending || row.global_rank < 1 ? null : row.global_rank,
    percentile: row.pending ? null : safeNumber(row.percentile),
    pillars,
    metrics: {
      yield: c?.nonCompounding ? null : safeNumber(c?.yield_), leverage: c?.nonCompounding ? null : safeNumber(c?.leverage), velocity: safeNumber(c?.velocity),
      snr: safeNumber(c?.snr), construction: safeNumber(c?.construction),
      dev10x: c?.nonCompounding ? null : safeNumber(c?.dev10x), scale_v: safeNumber(c?.scaleV),
    },
    operating_ratio: row.pending ? null : c?.opRatio ?? null,
    provenance: p,
  };
}

function envelope(data: unknown, scope: Scope, warnings: Array<{code: string; message: string}> = []) {
  return { contract_version: CONTRACT_VERSION, status: "ok", data, provenance: provenance(scope, null, null), warnings, error: null };
}

function requireCodename(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(value))
    throw new ToolError("INVALID_ARGUMENT", "A valid codename is required.");
  return value;
}

async function loadLiveBoard(scope: Scope, platformRecords = false): Promise<LeaderboardRow[]> {
  const db = getSupabaseService();
  if (!db) throw new ToolError("UPSTREAM_UNAVAILABLE", "Live SignalAF data is not configured.", true);
  // The general board facade falls back to fixtures on database errors. Probe the
  // source first and reject empty/error states so a fixture is never sold as live.
  const probe = await db.from("metric_snapshots").select("operator_id", { count: "exact", head: true });
  if (probe.error || !probe.count) throw new ToolError("UPSTREAM_UNAVAILABLE", "Live leaderboard is unavailable.", true);
  let rows: LeaderboardRow[];
  try {
    rows = await getLeaderboard({ strictLive: true, window: scope.window === "all" ? "all_time" : scope.window,
      windowFilter: platformRecords || scope.window !== "all" || scope.view === "platforms", platform: scope.platform === "all" ? null : scope.platform,
      perPlatform: platformRecords || scope.platform !== "all", operatorTotal: !platformRecords && scope.view === "total" && scope.platform === "all", claimedOnly: scope.view === "total", sort: "yield_" });
  } catch {
    throw new ToolError("UPSTREAM_UNAVAILABLE", "Live leaderboard read failed.", true);
  }
  return rows.filter(isPublishedBoardRow);
}

/** Live board read, memoized for 45s per scope (results identical within the TTL). */
export const liveBoard = ttlMemo(45_000, (scope: Scope) => JSON.stringify(scope), loadLiveBoard);

export const platformBoard = ttlMemo(45_000, (scope: Scope) => JSON.stringify(scope), (scope: Scope) => loadLiveBoard(scope, true));

function readOrder(args: Args) {
  const metric = args.sort_by ?? "yield", order = args.order ?? "desc", limit = args.limit ?? 25;
  if (!(SORT_METRICS as readonly unknown[]).includes(metric) || (order !== "asc" && order !== "desc"))
    throw new ToolError("INVALID_ARGUMENT", "Unsupported sort metric or order.");
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 100)
    throw new ToolError("INVALID_ARGUMENT", "limit must be 1–100.");
  return { metric: metric as SortMetric, order: order as "asc" | "desc", limit: Number(limit) };
}
function page<T>(entries: T[], query: unknown, limit: number, cursor: unknown) {
  try { return fieldPage(entries, query, limit, cursor); }
  catch { throw new ToolError("INVALID_CURSOR", "Cursor is invalid, belongs to another query, or the field changed. Restart from the first page."); }
}
function snapshotCoverage(rows: LeaderboardRow[]) {
  const dates = rows.map(r => r.snapshot_date ?? r.snapshot.snapshot_date)
    .filter((x): x is string => typeof x === "string" && Number.isFinite(Date.parse(x))).sort();
  const periods = new Set(rows.map(r => {
    const start = r.window_start ? Date.parse(r.window_start) : NaN;
    const end = r.window_end ? Date.parse(r.window_end) : NaN;
    return Number.isFinite(start) && Number.isFinite(end) && end > start
      ? `${r.window_start}/${r.window_end}` : "unknown";
  }));
  return { earliest_snapshot: dates[0] ?? null, latest_snapshot: dates.at(-1) ?? null,
    missing_snapshot_dates: rows.length - dates.length,
    common_period: periods.size === 1 && !periods.has("unknown") ? [...periods][0] : null,
    periods_aligned: periods.size === 1 && !periods.has("unknown") };
}
function historicalResult(args: Args) {
  if (args.window !== undefined || args.view !== undefined || args.cohort !== undefined)
    throw new ToolError("INVALID_ARGUMENT", "The historical tool reads only the frozen July 31 snapshot, with its original classification.");
  const board = getHistoricalBoard(), { metric, order, limit } = readOrder(args);
  if (args.dataset !== undefined && args.dataset !== "july_2026") throw new ToolError("INVALID_ARGUMENT", "Unsupported archive dataset.");
  const platform = normalizePlatform(args.platform ?? "all");
  if (typeof platform !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(platform)) throw new ToolError("INVALID_ARGUMENT", "Invalid platform.");
  const names = args.codenames;
  if (names !== undefined && (!Array.isArray(names) || names.length < 1 || names.length > 10 || names.some(n => typeof n !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(n))))
    throw new ToolError("INVALID_ARGUMENT", "Supply 1–10 public archive codenames.");
  const selected = board.entries.filter(e => (platform === "all" || (e.platform ?? e.primaryDomain)?.toLowerCase() === platform)
    && (!names || (names as string[]).some(n => n.toLowerCase() === e.codename.toLowerCase())));
  if (names && (names as string[]).some(n => !selected.some(e => e.codename.toLowerCase() === n.toLowerCase())))
    throw new ToolError("NOT_FOUND", "An archive codename is unavailable in this platform scope. List archive entries with get_historical_board (no codenames filter) to see valid codenames.");
  const entries = selected.map(e => ({ codename: e.codename, display_name: safeName(e.subLabel, e.codename), rank: e.rank,
    platform: e.platform ?? e.primaryDomain ?? "unknown", source_label: e.isSeed === true ? "seeded" : e.isSeed === false ? "recorded_real" : "unknown",
    class_tier: e.signalClass, operating_ratio: e.opRatio ?? null,
    pillars: { input: tokenCount(e.input), output: tokenCount(e.output), cache_write: tokenCount(e.cacheWrite), cache_read: tokenCount(e.cacheRead) },
    metrics: { yield: finite(e.yield_), leverage: finite(e.leverage), velocity: finite(e.velocity), snr: finite(e.snr),
      construction: tokenCount(e.cacheRead) && tokenCount(e.cacheWrite) !== null ? e.cacheWrite! / e.cacheRead! : null,
      dev10x: finite(e.dev10x), scale_v: finite(e.scaleV) } }));
  const scope = { dataset: "july_2026", platform, snapshot_at: board.meta.generatedAt };
  const sorted = orderedEntries(entries, metric, order), result = page(sorted, { scope, names: names ?? null, metric, order }, limit, args.cursor);
  return { contract_version: CONTRACT_VERSION, status: "ok", data: { scope, archive: board.meta,
    population_size: entries.length, ...summarizeField(entries), entries: result.entries.map((e, i) => ({ ...e, position: result.offset + i + 1 })),
    returned_count: result.entries.length, next_cursor: result.next_cursor, sort_metric: metric, sort_order: order,
    board_url: "https://signalaf.com/board/history" },
    provenance: { source_urls: ["https://signalaf.com/board/history"], retrieved_at: new Date().toISOString(),
      observed_at: board.meta.generatedAt, dataset_version: board.meta.gitBlob, data_origin: "frozen_reference_snapshot" },
    warnings: [{ code: "HISTORICAL_REFERENCE", message: "Frozen proof-of-concept field; source labels are recorded provenance, not verification or live users. Original archived ranks and classification are preserved; position is the requested sort." }], error: null };
}

export async function callPluginTool(name: string, args: Args, request: Request) {
  try {
    if (name === "report_beta_bug") {
      let report;
      try { report = prepareBetaReport(args); }
      catch (error) { throw new ToolError("INVALID_ARGUMENT", error instanceof Error ? error.message : "Invalid bug report."); }
      const ip = trustedClientIp(request.headers);
      const perIp = await checkDistributedRateLimit(["sigrank-beta-report", ip], { windowMs: 3_600_000, max: 5 }, true);
      const global = perIp.ok ? await checkDistributedRateLimit(["sigrank-beta-report", "global"], { windowMs: 3_600_000, max: 50 }, true) : perIp;
      if (!perIp.ok || !global.ok) throw new ToolError("RATE_LIMITED", "Too many beta reports. Please try again later.", true);
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new ToolError("UPSTREAM_UNAVAILABLE", "Beta reporting is unavailable. Use https://signalaf.com/contact.", true);
      const reference = `SRB-${randomUUID().slice(0, 8).toUpperCase()}`;
      const sentAt = new Date().toISOString();
      try {
        const { error } = await new Resend(key).emails.send({
          from: "SigRank Beta <hello@signalaf.com>",
          to: "hello@signalaf.com",
          ...(report.replyEmail ? { replyTo: report.replyEmail } : {}),
          subject: `[SigRank beta ${reference}] ${report.summary}`,
          text: formatBetaReport(report, reference, sentAt),
        });
        if (error) throw error;
      } catch {
        throw new ToolError("DELIVERY_FAILED", "The report was not confirmed sent. Please use https://signalaf.com/contact.", true);
      }
      return { contract_version: CONTRACT_VERSION, status: "ok", data: {
        reference, sent_at: sentAt, destination: "hello@signalaf.com", sensitive_text_redacted: report.redacted,
      }, provenance: null, warnings: [], error: null };
    }
    if (name === "get_historical_board") return historicalResult(args);
    const scope = scopeOf(args);
    if (name === "get_platform_stats") {
      const rows = await platformBoard(scope);
      const unique = new Map<string, LeaderboardRow>();
      for (const row of rows) unique.set(JSON.stringify([row.operator.codename, (row.platform ?? row.operator.primary_domain ?? "unknown").toLowerCase()]), row);
      const records = [...unique.values()], groups = new Map<string, LeaderboardRow[]>();
      for (const row of records) {
        const platform = (row.platform ?? row.operator.primary_domain ?? "unknown").toLowerCase();
        groups.set(platform, [...(groups.get(platform) ?? []), row]);
      }
      const memberships = new Map<string, number>();
      for (const record of records) memberships.set(record.operator.codename, (memberships.get(record.operator.codename) ?? 0) + 1);
      const operatorCount = memberships.size;
      return envelope({ scope, denominator: "operator_platform_records", record_count: records.length,
        unique_operator_count: operatorCount, overlapping_operators: [...memberships.values()].filter(n => n > 1).length,
        ...snapshotCoverage(records),
        groups: [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([platform, group]) => ({ platform, population_size: group.length,
          ...snapshotCoverage(group), ...summarizeField(group.map(r => operatorDto(r, scope))) })) }, scope,
        [{ code: "PLATFORM_COMPARISON_SCOPE", message: "Each operator may appear once per platform. Counts describe selected snapshots, not equal-duration activity or causal platform performance. Check period alignment and sample sizes." }]);
    }
    if (name === "get_leaderboard") {
      const { metric, order, limit } = readOrder(args);
      const rows = await liveBoard(scope), sorted = orderedEntries(rows.map(r => operatorDto(r, scope)), metric, order);
      const result = page(sorted, { scope, metric, order }, limit, args.cursor);
      const entries = result.entries.map((entry, i) => ({ ...entry, position: result.offset + i + 1 }));
      return envelope({ entries, scope, board_url: `https://signalaf.com/board/${scope.window}`,
        returned_count: entries.length, total_eligible: rows.length,
        gated: result.next_cursor !== null, next_cursor: result.next_cursor, sort_metric: metric, sort_order: order }, scope,
        [{code:"BOARD_PROVENANCE_LIMITED",message:"Rank is the published board placement; position follows this requested metric/order. Non-compounding Yield/Leverage/10xDEV are unavailable, matching board ranking rules. The public board does not publish per-row verification classes."}]);
    }
    if (name === "get_operator") {
      const codename = requireCodename(args.codename);
      let op: LeaderboardRow | null;
      try { op = await getOperator(codename, true); }
      catch { throw new ToolError("UPSTREAM_UNAVAILABLE", "Live operator read failed.", true); }
      if (!op || op.operator.isPlaceholder || op.operator.status === "retired") throw new ToolError("NOT_FOUND", `Operator not found. ${FIND_CODENAMES}`);
      const rows = await liveBoard(scope);
      const selected = rows.find(r => r.operator.codename.toLowerCase() === codename.toLowerCase());
      const row = selected ?? { ...op, pending: true };
      return envelope({ profile_status: selected ? "measured" : "no_measurement", operator: operatorDto(row, scope) }, scope,
        selected ? [] : [{code:"NO_WINDOW_MEASUREMENT",message:"No public measurement exists for the requested window."}]);
    }
    if (name === "compare_operators") {
      const a = requireCodename(args.codename_a), b = requireCodename(args.codename_b);
      const rows = await liveBoard(scope);
      const ar = rows.find(r => r.operator.codename.toLowerCase() === a.toLowerCase());
      const br = rows.find(r => r.operator.codename.toLowerCase() === b.toLowerCase());
      if (!ar || !br) throw new ToolError("NOT_FOUND", `One or both operators are unavailable in this scope. ${FIND_CODENAMES}`);
      const operatorA = operatorDto(ar, scope), operatorB = operatorDto(br, scope);
      const delta = Object.fromEntries(METRICS.map(metric => {
        const av = operatorA.metrics[metric], bv = operatorB.metrics[metric];
        return [metric, av === null || bv === null ? null : av - bv];
      }));
      const warnings = ar.snapshot_date !== br.snapshot_date
        ? [{code:"SNAPSHOT_DATES_DIFFER",message:"These are the currently published board snapshots, observed on different dates. Deltas describe displayed token-flow metrics, not equal-duration activity."}]
        : [];
      return envelope({ operator_a: operatorA, operator_b: operatorB,
        comparable: true, reasons: [], scope, delta_a_minus_b: delta }, scope, warnings);
    }
    if (name === "get_field_stats") {
      const rows = await liveBoard(scope);
      const entries = rows.map(r => operatorDto(r, scope));
      const summaries = summarizeField(entries);
      return envelope({ scope, population_size: rows.length, included_count: rows.length,
        excluded_count: 0, coverage_complete: true,
        cohort_definition: `${scope.view === "total" ? "Claimed" : "Public including unclaimed"}, non-retired operators with one selected snapshot in the requested board window. Measurement class and verification state are not published per row by this board. Unclaimed does not prove a historical seed.`,
        ...summaries, snapshot_coverage: snapshotCoverage(rows), archetype_counts: Array.from(
          entries.reduce((counts, entry) => {
            const key = entry.archetype ?? "Unknown";
            counts.set(key, (counts.get(key) ?? 0) + 1);
            return counts;
          }, new Map<string, number>()),
          ([archetype, count]) => ({ archetype, count }),
        ),
        measurement_class_counts: { "Exact-4": 0, "Reconstructed-4": 0, "Partial": 0, "Unverified": 0, "Unknown": rows.length } }, scope);
    }
    throw new ToolError("INVALID_ARGUMENT", "Unknown tool.");
  } catch (error) {
    const known = error instanceof ToolError ? error : new ToolError("INTERNAL_ERROR", "The request could not be completed.");
    return { contract_version: CONTRACT_VERSION, status: "error", data: null, provenance: null, warnings: [],
      error: { code: known.code, message: known.message, retryable: known.retryable } };
  }
}
