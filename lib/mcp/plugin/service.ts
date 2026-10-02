import "server-only";

import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { getLeaderboard, type LeaderboardRow } from "@/lib/board";
import { getOperator } from "@/lib/board/queries";
import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { formatBetaReport, prepareBetaReport } from "./bug-report";

type Scope = { window: "7d" | "30d" | "90d" | "all"; platform: string; cohort: "public" | "exact4" | "reconstructed4"; view: "total" | "platforms"; category: "all"; population: "claimed_operators" | "public_operators" };
type Args = Record<string, unknown>;

const WINDOWS = new Set(["7d", "30d", "90d", "all"]);
const METRICS = ["yield", "leverage", "velocity", "snr", "construction", "dev10x", "scale_v"] as const;
const SOURCE = "https://signalaf.com/api/plugins/sigrank/mcp";

class ToolError extends Error {
  constructor(public code: string, message: string, public retryable = false) { super(message); }
}

function scopeOf(args: Args): Scope {
  const window = args.window ?? "30d";
  const platform = args.platform ?? "all";
  const cohort = args.cohort ?? "public";
  if (typeof window !== "string" || !WINDOWS.has(window)) throw new ToolError("INVALID_ARGUMENT", "Unsupported window.");
  if (typeof platform !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(platform)) throw new ToolError("INVALID_ARGUMENT", "Invalid platform.");
  if (platform !== "all" && !["claude", "codex", "chatgpt", "gemini", "pi", "multi"].includes(platform)) throw new ToolError("UNSUPPORTED_SCOPE", "Platform is not supported.");
  if (cohort !== "public") throw new ToolError("UNSUPPORTED_SCOPE", "Evidence-class cohorts require stored provenance; existing board rows cannot support them yet.");
  return { window: window as Scope["window"], platform, cohort: "public", view: platform === "all" ? "total" : "platforms", category: "all", population: platform === "all" ? "claimed_operators" : "public_operators" };
}

function provenance(scope: Scope, observed: string | null, ruleset: string | null, url = SOURCE) {
  return {
    source_urls: [url], retrieved_at: new Date().toISOString(),
    observed_at: observed ? `${observed}T00:00:00.000Z` : null,
    dataset_version: null, methodology_version: null, ruleset_version: ruleset,
    adapter_version: null, taxonomy_version: null,
    window: { label: scope.window, start: null, end: null },
    platforms: scope.platform === "all" ? [] : [scope.platform], models: [],
    data_origin: "unknown", measurement_class: "Unverified", verification_status: "unverified",
    ranking_eligible: false, coverage: "unknown", reconstruction_method: null,
    unknown_fields: ["dataset_version", "methodology_version", "adapter_version", "taxonomy_version", "actual_window_bounds", "measurement_class"],
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
  p.platforms = [row.platform || row.operator.primary_domain].filter(Boolean);
  const pillars = row.pending ? { input: null, output: null, cache_write: null, cache_read: null } : {
    input: safeNumber(row.telemetry.fresh_input), output: safeNumber(row.telemetry.output),
    cache_write: safeNumber(row.telemetry.cache_create), cache_read: safeNumber(row.telemetry.cache_read),
  };
  return {
    codename: row.operator.codename,
    display_name: row.operator.display_name || row.operator.codename,
    profile_url: `https://signalaf.com/user/${encodeURIComponent(row.operator.codename)}`,
    class_tier: row.pending ? null : row.snapshot.class_tier,
    archetype: null,
    rank: row.pending || row.global_rank < 1 ? null : row.global_rank,
    percentile: row.pending ? null : safeNumber(row.percentile),
    pillars,
    metrics: {
      yield: safeNumber(c?.yield_), leverage: safeNumber(c?.leverage), velocity: safeNumber(c?.velocity),
      snr: safeNumber(c?.snr), construction: safeNumber(c?.construction),
      dev10x: safeNumber(c?.dev10x), scale_v: safeNumber(c?.scaleV),
    },
    operating_ratio: row.pending ? null : c?.opRatio ?? null,
    provenance: p,
  };
}

function envelope(data: unknown, scope: Scope, warnings: Array<{code: string; message: string}> = []) {
  return { contract_version: "1.0.0", status: "ok", data, provenance: provenance(scope, null, null), warnings, error: null };
}

function requireCodename(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(value))
    throw new ToolError("INVALID_ARGUMENT", "A valid codename is required.");
  return value;
}

async function liveBoard(scope: Scope): Promise<LeaderboardRow[]> {
  const db = getSupabaseServer();
  if (!db) throw new ToolError("UPSTREAM_UNAVAILABLE", "Live SignalAF data is not configured.", true);
  // The general board facade falls back to fixtures on database errors. Probe the
  // source first and reject empty/error states so a fixture is never sold as live.
  const probe = await db.from("metric_snapshots").select("operator_id", { count: "exact", head: true });
  if (probe.error || !probe.count) throw new ToolError("UPSTREAM_UNAVAILABLE", "Live leaderboard is unavailable.", true);
  let rows: LeaderboardRow[];
  try {
    rows = await getLeaderboard({ strictLive: true, window: scope.window === "all" ? "all_time" : scope.window,
      windowFilter: scope.window !== "all" || scope.platform !== "all", platform: scope.platform === "all" ? null : scope.platform,
      perPlatform: scope.platform !== "all", operatorTotal: scope.platform === "all", claimedOnly: scope.platform === "all", sort: "yield_" });
  } catch {
    throw new ToolError("UPSTREAM_UNAVAILABLE", "Live leaderboard read failed.", true);
  }
  return rows.filter(r => !r.operator.isPlaceholder && r.operator.status !== "retired");
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const x = (values.length - 1) * p, lo = Math.floor(x), hi = Math.ceil(x);
  return values[lo] + (values[hi] - values[lo]) * (x - lo);
}

function distribution(values: Array<number | null>) {
  const sorted = values.filter((v): v is number => v !== null && Number.isFinite(v)).sort((a,b) => a-b);
  return { n: sorted.length, min: sorted[0] ?? null, p25: percentile(sorted, .25),
    median: percentile(sorted, .5), p75: percentile(sorted, .75), max: sorted.at(-1) ?? null };
}

async function ownCodename(request: Request): Promise<string | null> {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) throw new ToolError("AUTH_REQUIRED", "Connect your SignalAF account to see your profile.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const db = getSupabaseServer();
  if (!url || !anon || !db) throw new ToolError("UPSTREAM_UNAVAILABLE", "Account lookup is unavailable.", true);
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) throw new ToolError("AUTH_REQUIRED", "Your SignalAF connection has expired.");
  const linked = await db.from("operator_accounts")
    .select("operators:operator_id(codename)").eq("user_id", user.id).maybeSingle();
  if (linked.error) throw new ToolError("UPSTREAM_UNAVAILABLE", "Account lookup failed.", true);
  const op = linked.data?.operators as {codename?: string} | null | undefined;
  return op?.codename || null;
}

export async function callPluginTool(name: string, args: Args, request: Request) {
  try {
    if (name === "report_beta_bug") {
      let report;
      try { report = prepareBetaReport(args); }
      catch (error) { throw new ToolError("INVALID_ARGUMENT", error instanceof Error ? error.message : "Invalid bug report."); }
      const ip = request.headers.get("cf-connecting-ip")
        ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? "unknown";
      const limit = await checkDistributedRateLimit(["sigrank-beta-report", ip], { windowMs: 3_600_000, max: 5 }, false);
      if (!limit.ok) throw new ToolError("RATE_LIMITED", "Too many beta reports. Please try again later.", true);
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
      return { contract_version: "1.0.0", status: "ok", data: {
        reference, sent_at: sentAt, destination: "hello@signalaf.com", sensitive_text_redacted: report.redacted,
      }, provenance: null, warnings: [], error: null };
    }
    const scope = scopeOf(args);
    if (name === "get_leaderboard") {
      if (args.cursor !== undefined && args.cursor !== null) throw new ToolError("INVALID_CURSOR", "Cursor pagination is not available in this release.");
      const limit = args.limit ?? 25;
      if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 100) throw new ToolError("INVALID_ARGUMENT", "limit must be 1–100.");
      const rows = await liveBoard(scope);
      const entries = rows.slice(0, Number(limit)).map(r => operatorDto(r, scope));
      return envelope({ entries, scope, board_url: `https://signalaf.com/board/${scope.window}`,
        returned_count: entries.length, total_eligible: rows.length,
        gated: rows.length > Number(limit), next_cursor: null, sort_metric: "yield" }, scope,
        [{code:"UNVERIFIED_LEGACY",message:"Existing board rows lack a stored measurement class and complete provenance."}]);
    }
    if (name === "get_operator" || name === "get_my_profile") {
      const codename = name === "get_my_profile" ? await ownCodename(request) : requireCodename(args.codename);
      if (!codename) return envelope({ profile_status: "no_profile", operator: null }, scope);
      let op: LeaderboardRow | null;
      try { op = await getOperator(codename, true); }
      catch { throw new ToolError("UPSTREAM_UNAVAILABLE", "Live operator read failed.", true); }
      if (!op || op.operator.isPlaceholder || op.operator.status === "retired") throw new ToolError("NOT_FOUND", "Operator not found.");
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
      if (!ar || !br) throw new ToolError("NOT_FOUND", "One or both operators are unavailable in this scope.");
      // Legacy snapshots lack actual bounds and dataset version. Display both but
      // suppress arithmetic deltas until those comparison prerequisites exist.
      return envelope({ operator_a: operatorDto(ar, scope), operator_b: operatorDto(br, scope),
        comparable: false, reasons: ["Actual window bounds and dataset version are not stored for these rows."],
        scope, delta_a_minus_b: null }, scope);
    }
    if (name === "get_field_stats") {
      const rows = await liveBoard(scope);
      const entries = rows.map(r => operatorDto(r, scope));
      const distributions = Object.fromEntries(METRICS.map(m => [m, distribution(entries.map(e => e.metrics[m]))]));
      return envelope({ scope, population_size: rows.length, included_count: rows.length,
        excluded_count: 0, coverage_complete: true,
        cohort_definition: "Visible, non-retired operators with one selected snapshot in the requested window; legacy evidence class unverified.",
        distributions, archetype_counts: [],
        measurement_class_counts: { "Exact-4": 0, "Reconstructed-4": 0, "Partial": 0, "Unverified": rows.length } }, scope);
    }
    throw new ToolError("INVALID_ARGUMENT", "Unknown tool.");
  } catch (error) {
    const known = error instanceof ToolError ? error : new ToolError("INTERNAL_ERROR", "The request could not be completed.");
    return { contract_version: "1.0.0", status: "error", data: null, provenance: null, warnings: [],
      error: { code: known.code, message: known.message, retryable: known.retryable } };
  }
}
