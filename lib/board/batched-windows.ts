/**
 * lib/board/batched-windows.ts — submission-based batch tracking for
 * rolled-forward 90d and all-time token totals.
 *
 * PROBLEM: Users lose all-time totals when platforms delete old session log
 * files. The `all` window re-reads local files on every run — when Claude
 * Code purges old .jsonl files, those tokens vanish from every window
 * including `all`. The user's lifetime yield erodes instead of growing.
 *
 * SOLUTION: Track tokens by submission deltas. Each submission captures the
 * current total; the difference between submissions is a batch with its own
 * 90-day clock. The baseline + all deltas = all-time, and it never decreases.
 *
 * DATA SOURCE: snapshot_submissions (append-only, already stores every verified
 * submission with pillars + timestamp + payload_json containing platform.primary).
 * This is a COMPUTED VIEW over existing data — no migration needed.
 *
 * MODEL:
 *   B0 = first submission's all-time pillars (baseline)
 *   D_n = max(0, S_n.all - S_{n-1}.all) per pillar (delta — never negative)
 *
 * WINDOWS at time T:
 *   90d = sum of batches where (T - batch.date) <= 90 days
 *   all = B0 + D1 + D2 + ... (all batches — never decreases)
 *   7d/30d = NOT computed here (read from latest metric_snapshots — files
 *            <30d old are safe from deletion)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/infra/supabase/server";

// ── Types ───────────────────────────────────────────────────────────────────

/** The four canonical token pillars. */
export interface Pillars {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

/** A single batch in the submission history. */
export interface Batch {
  /** ISO date string (submitted_at). */
  date: string;
  /** 'baseline' for the first submission, 'delta' for subsequent ones. */
  type: "baseline" | "delta";
  /** Token pillars for this batch. */
  pillars: Pillars;
  /** Days since this batch's submission date (at query time). */
  ageDays: number;
}

/** Batched windows for a single platform. */
export interface PlatformBatched {
  /** Rolled-forward 90d pillars (sum of batches <=90 days old). */
  "90d": Pillars;
  /** All-time pillars (sum of all batches — never decreases). */
  all: Pillars;
  /** Full batch history for transparency/debugging. */
  batches: Batch[];
  /** Number of submissions archived for this platform. */
  submissionCount: number;
  /** Date of the first (baseline) submission, ISO string. */
  baselineDate: string | null;
}

/** Batched windows for all platforms + combined. */
export interface BatchedWindows {
  perPlatform: Record<string, PlatformBatched>;
  combined: {
    "90d": Pillars;
    all: Pillars;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const ZERO_PILLARS: Pillars = {
  input: 0,
  output: 0,
  cacheCreate: 0,
  cacheRead: 0,
};

/** Subtract pillars per-field, clamping each at 0 (no negative deltas). */
function maxDelta(prev: Pillars, curr: Pillars): Pillars {
  return {
    input: Math.max(0, curr.input - prev.input),
    output: Math.max(0, curr.output - prev.output),
    cacheCreate: Math.max(0, curr.cacheCreate - prev.cacheCreate),
    cacheRead: Math.max(0, curr.cacheRead - prev.cacheRead),
  };
}

/** Add two pillar objects field-by-field. */
function addPillars(a: Pillars, b: Pillars): Pillars {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheCreate: a.cacheCreate + b.cacheCreate,
    cacheRead: a.cacheRead + b.cacheRead,
  };
}

/** Days between two ISO timestamps (floor). */
function daysBetween(fromIso: string, toMs: number): number {
  return Math.floor((toMs - new Date(fromIso).getTime()) / 86_400_000);
}

// ── Raw DB row shape ────────────────────────────────────────────────────────

interface SubmissionRow {
  submitted_at: string;
  window_type: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_tokens: number | null;
  cache_read_tokens: number | null;
  payload_json: {
    platform?: { primary?: string };
  } | null;
}

// ── Core computation ────────────────────────────────────────────────────────

/**
 * Compute rolled-forward 90d and all-time pillars from submission history.
 *
 * Reads `snapshot_submissions` (append-only) for the operator, filtered to
 * `window_type = 'all_time'`, sorted by `submitted_at ASC`. Groups by
 * platform (from `payload_json->platform->primary`). For each platform:
 *   B0 = first submission's pillars (baseline)
 *   D_n = max(0, S_n - S_{n-1}) per pillar (delta)
 *
 * Then computes 90d (sum of batches <=90 days old) and all (sum of all batches).
 *
 * @param operatorId UUID of the operator
 * @returns Batched windows per platform + combined, or null if no data
 */
export async function computeBatchedWindows(
  operatorId: string,
): Promise<BatchedWindows | null> {
  const sb = getSupabaseServer();
  if (!sb) return null;

  try {
    // Query all all_time submissions for this operator, oldest first.
    // Paginated (PostgREST caps at 1000 rows per request).
    const allRows: SubmissionRow[] = [];
    let offset = 0;
    const pageSize = 1000;
    // Safety ceiling: 365 daily submissions × 10 platforms = 3650.
    const maxRows = 10_000;

    for (;;) {
      const { data, error } = await sb
        .from("snapshot_submissions")
        .select(
          "submitted_at, window_type, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, payload_json",
        )
        .eq("operator_id", operatorId)
        .eq("window_type", "all_time")
        .eq("status", "scored")
        .order("submitted_at", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      const rows = (data ?? []) as SubmissionRow[];
      allRows.push(...rows);
      if (rows.length < pageSize) break;
      offset += pageSize;
      if (allRows.length >= maxRows) break;
    }

    if (allRows.length === 0) return null;

    // Group by platform.
    const byPlatform = new Map<string, SubmissionRow[]>();
    for (const row of allRows) {
      const platform =
        row.payload_json?.platform?.primary ?? "other";
      const arr = byPlatform.get(platform);
      if (arr) arr.push(row);
      else byPlatform.set(platform, [row]);
    }

    const now = Date.now();
    const perPlatform: Record<string, PlatformBatched> = {};
    let combined90d = { ...ZERO_PILLARS };
    let combinedAll = { ...ZERO_PILLARS };

    for (const [platform, rows] of byPlatform) {
      // Compute batches: B0 (baseline) + deltas.
      const batches: Batch[] = [];
      let prev: Pillars | null = null;

      for (const row of rows) {
        const pillars: Pillars = {
          input: row.input_tokens ?? 0,
          output: row.output_tokens ?? 0,
          cacheCreate: row.cache_creation_tokens ?? 0,
          cacheRead: row.cache_read_tokens ?? 0,
        };

        if (prev === null) {
          // First submission = baseline.
          batches.push({
            date: row.submitted_at,
            type: "baseline",
            pillars,
            ageDays: daysBetween(row.submitted_at, now),
          });
        } else {
          // Subsequent = delta (max(0, current - previous)).
          const delta = maxDelta(prev, pillars);
          batches.push({
            date: row.submitted_at,
            type: "delta",
            pillars: delta,
            ageDays: daysBetween(row.submitted_at, now),
          });
        }
        prev = pillars;
      }

      // Compute windows from batches.
      let p90d = { ...ZERO_PILLARS };
      let pAll = { ...ZERO_PILLARS };
      for (const batch of batches) {
        pAll = addPillars(pAll, batch.pillars);
        if (batch.ageDays <= 90) {
          p90d = addPillars(p90d, batch.pillars);
        }
      }

      const baselineBatch = batches.find((b) => b.type === "baseline");

      perPlatform[platform] = {
        "90d": p90d,
        all: pAll,
        batches,
        submissionCount: rows.length,
        baselineDate: baselineBatch?.date ?? null,
      };

      combined90d = addPillars(combined90d, p90d);
      combinedAll = addPillars(combinedAll, pAll);
    }

    return {
      perPlatform,
      combined: {
        "90d": combined90d,
        all: combinedAll,
      },
    };
  } catch {
    // Graceful degradation: return null → caller falls back to metric_snapshots.
    return null;
  }
}

/**
 * Pure function: compute batched windows from a pre-fetched submission list.
 * Exported for unit testing (no Supabase dependency).
 */
export function computeBatchedWindowsFromRows(
  rows: SubmissionRow[],
  nowMs: number = Date.now(),
): BatchedWindows | null {
  if (rows.length === 0) return null;

  const byPlatform = new Map<string, SubmissionRow[]>();
  for (const row of rows) {
    const platform = row.payload_json?.platform?.primary ?? "other";
    const arr = byPlatform.get(platform);
    if (arr) arr.push(row);
    else byPlatform.set(platform, [row]);
  }

  const perPlatform: Record<string, PlatformBatched> = {};
  let combined90d = { ...ZERO_PILLARS };
  let combinedAll = { ...ZERO_PILLARS };

  for (const [platform, platformRows] of byPlatform) {
    const batches: Batch[] = [];
    let prev: Pillars | null = null;

    for (const row of platformRows) {
      const pillars: Pillars = {
        input: row.input_tokens ?? 0,
        output: row.output_tokens ?? 0,
        cacheCreate: row.cache_creation_tokens ?? 0,
        cacheRead: row.cache_read_tokens ?? 0,
      };

      if (prev === null) {
        batches.push({
          date: row.submitted_at,
          type: "baseline",
          pillars,
          ageDays: daysBetween(row.submitted_at, nowMs),
        });
      } else {
        const delta = maxDelta(prev, pillars);
        batches.push({
          date: row.submitted_at,
          type: "delta",
          pillars: delta,
          ageDays: daysBetween(row.submitted_at, nowMs),
        });
      }
      prev = pillars;
    }

    let p90d = { ...ZERO_PILLARS };
    let pAll = { ...ZERO_PILLARS };
    for (const batch of batches) {
      pAll = addPillars(pAll, batch.pillars);
      if (batch.ageDays <= 90) {
        p90d = addPillars(p90d, batch.pillars);
      }
    }

    const baselineBatch = batches.find((b) => b.type === "baseline");

    perPlatform[platform] = {
      "90d": p90d,
      all: pAll,
      batches,
      submissionCount: platformRows.length,
      baselineDate: baselineBatch?.date ?? null,
    };

    combined90d = addPillars(combined90d, p90d);
    combinedAll = addPillars(combinedAll, pAll);
  }

  return {
    perPlatform,
    combined: {
      "90d": combined90d,
      all: combinedAll,
    },
  };
}
