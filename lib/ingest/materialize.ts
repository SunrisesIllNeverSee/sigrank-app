import "server-only";

/**
 * lib/ingest/materialize.ts — verified submission → metric_snapshots → board (D7 §6).
 *
 * Called inline by app/api/v1/snapshots/route.ts AFTER the gate chain decides. Two
 * persist paths, both via the service-role-ONLY client (loud-fail on a blank key):
 *
 *   materializeVerifiedSnapshot()  verified+accept → ONE transaction (the
 *                                  materialize_verified_snapshot RPC, 0013):
 *                                  append-only snapshot_submissions INSERT +
 *                                  metric_snapshots live-upload UPSERT. Then the
 *                                  route revalidates the touched board slug(s).
 *   insertSubmissionOnly()         accepted-but-unverified / flagged → audit row
 *                                  only (status 'validated'); NOT ranked, NOT
 *                                  materialized.
 *
 * SECURITY CORE (§5.4): operator_id is ALWAYS taken from the enrolled device row,
 * NEVER from the payload codename. The caller resolves the device by payload.device_id
 * and passes it here; an UNENROLLED device (no row) must never reach these functions —
 * the route persists nothing for it (no operator to bind, preserving today's safe
 * behavior for unauthenticated payloads).
 *
 * The board ranks by Υ recomputed ON READ from the 4 raw pillar columns, so this
 * module recomputes signa_rate / class_tier / signal_force from the un-fakeable
 * pillars and IGNORES the agent's self-reported composites (the un-gameable layer).
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { pillarsToCore5 } from "@/lib/ingest/bridge";
import { scoreSnapshot } from "@/lib/analytics/scoring-engine";
import { boardWindowByEnum } from "@/lib/board/windows";
import { memoInvalidatePrefix } from "@/lib/board/memo";
import {
  decideAllTime,
  sumPillars,
  type Pillars,
} from "@/lib/ingest/all-time-guard";
import type { SnapshotPayloadV1 } from "@/lib/ingest/payload-schema";
import type { GateReason, GateResult } from "@/lib/ingest/gates";

/** The enrolled-device facts the persist path needs (resolved FROM the device, §5.4). */
export interface ResolvedDevice {
  device_id: string;
  operator_id: string;
}

/** Persist outcome the route maps to an HTTP status. */
export type MaterializeResult =
  | {
      ok: true;
      metricSnapshotId: string | null;
      /** Set when the all-time guard kept the board row from shrinking; the
       *  route adds it to the gate reasons so it is flagged, not silent. */
      allTimeGuard?: GateReason;
    }
  | {
      ok: false;
      reason:
        "persistence_unavailable" | "duplicate_snapshot" | "persist_failed";
      detail: string;
    };

/** Background-metric clamp bounds (§6.1): a fabricated lifetime/age can't inflate signal_force. */
const MAX_ACCOUNT_AGE_DAYS = 3650; // 10y
const MAX_TOTAL_MESSAGES = 5_000_000;

/** Round to a column scale so a value can never numeric_value_out_of_range → abort the tx (review P3). */
const round = (n: number, dp: number): number => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};
const clampMax = (n: number, max: number): number =>
  Math.max(-max, Math.min(max, n));

/** The server-recomputed, column-scale-safe values for one snapshot. Pure + DB-free (testable). */
export interface RecomputedSnapshot {
  pillars: {
    input: number;
    output: number;
    cacheCreate: number;
    cacheRead: number;
  };
  signaRate: number;
  classTier: string;
  compressionRatio: number;
  promptComplexity: number;
  crossThread: number;
  sessionDepth: number;
  tokenThroughput: number;
  signalForce: number;
  messageVolume: number;
  accountAgeDays: number;
  totalMessages: number;
}

/**
 * recomputeFromPillars — the un-fakeable recompute (§6.1). Pure: takes the validated
 * payload, derives the board number from the 4 raw pillars + clamped background metrics.
 * Exported so materialize.test.mjs can assert the cascade anchor without a DB.
 */
export function recomputeFromPillars(
  payload: SnapshotPayloadV1,
): RecomputedSnapshot {
  const rt = payload.raw_telemetry;
  const pillars = {
    input: rt.tokens_input_fresh,
    output: rt.tokens_output,
    cacheCreate: rt.tokens_cache_creation,
    cacheRead: rt.tokens_cache_read,
  };
  const bridge = pillarsToCore5({
    pillars,
    sessionsCount: rt.sessions_count,
    turnsTotal: rt.turns_total,
  });

  const accountAgeDays = Math.max(
    1,
    Math.min(payload.background_metrics.account_age_days, MAX_ACCOUNT_AGE_DAYS),
  );
  const totalMessages = Math.max(
    0,
    Math.min(
      payload.background_metrics.total_messages_lifetime,
      MAX_TOTAL_MESSAGES,
    ),
  );
  const messageVolume = Math.max(
    0,
    Math.min(payload.background_metrics.message_volume, MAX_TOTAL_MESSAGES),
  );

  const scored = scoreSnapshot({
    raw: bridge.core5,
    pcConfidence: bridge.pcConfidence,
    totalMessagesLifetime: totalMessages,
    accountAgeDays,
  });

  return {
    pillars,
    // column scales (schema.sql): signa_rate/prompt_complexity NUMERIC(5,2),
    // compression_ratio NUMERIC(5,4), session_depth NUMERIC(6,2), signal_force NUMERIC(10,2).
    signaRate: round(clampMax(scored.signa_rate, 999.99), 2),
    classTier: scored.class_tier,
    compressionRatio: round(
      clampMax(bridge.core5.compression_ratio, 9.9999),
      4,
    ),
    promptComplexity: round(
      clampMax(bridge.core5.prompt_complexity, 999.99),
      2,
    ),
    crossThread: Math.round(bridge.core5.cross_thread),
    sessionDepth: round(clampMax(bridge.core5.session_depth, 9999.99), 2),
    tokenThroughput: Math.round(bridge.tokensTotal),
    signalForce: round(clampMax(scored.signal_force, 99_999_999.99), 2),
    messageVolume,
    accountAgeDays,
    totalMessages,
  };
}

/** window.end (ISO, any offset) → UTC 'YYYY-MM-DD' for snapshot_date (§6.2). */
function snapshotDateUTC(windowEnd: string): string {
  return new Date(windowEnd).toISOString().slice(0, 10);
}

/**
 * materializeVerifiedSnapshot — the verified+accept path. ONE transaction via the
 * 0013 RPC: append-only submission INSERT + metric_snapshots live-upload UPSERT.
 *
 * DEFENSIVE RE-ASSERT (§6.2 P2): refuse to materialize anything that is not
 * verified+accept, so a future refactor can never leak a flagged/unverified row
 * onto the board (the board ranks everything it finds in metric_snapshots).
 */
export async function materializeVerifiedSnapshot(
  payload: SnapshotPayloadV1,
  signature: string,
  device: ResolvedDevice,
  gate: GateResult,
): Promise<MaterializeResult> {
  if (!(gate.tier === "verified" && gate.decision === "accept")) {
    throw new Error(
      `materializeVerifiedSnapshot called with non-verified gate (tier=${gate.tier}, decision=${gate.decision})`,
    );
  }

  const svc = getSupabaseService();
  if (!svc) {
    return {
      ok: false,
      reason: "persistence_unavailable",
      detail: "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    };
  }

  const r = recomputeFromPillars(payload);

  if (payload.window.type === "all_time") {
    const guarded = await guardAllTimeUpload(svc, payload, signature, device, gate, r);
    if (guarded) return guarded;
  }

  const { data, error } = await svc.rpc("materialize_verified_snapshot", {
    p_operator_id: device.operator_id, // resolved FROM DEVICE (§5.4), never from payload
    p_device_id: device.device_id,
    p_window_type: payload.window.type,
    p_window_start: payload.window.start,
    p_window_end: payload.window.end,
    p_ruleset_version: payload.agent.ruleset_version,
    p_snapshot_hash: payload.agent.snapshot_hash,
    p_payload_json: payload,
    p_input: r.pillars.input,
    p_output: r.pillars.output,
    p_cache_creation: r.pillars.cacheCreate,
    p_cache_read: r.pillars.cacheRead,
    p_snapshot_date: snapshotDateUTC(payload.window.end),
    p_signa_rate: r.signaRate,
    p_class_tier: r.classTier,
    // FIX H (migration 0015): the per-submission platform → its own board slot.
    // The payload's platform.primary is a validated enum (lib/payload/schema.ts);
    // the RPC keys (operator, date, window, platform) so claude/codex don't collide.
    p_platform: payload.platform.primary,
    // p_submitted_at intentionally OMITTED → the RPC's COALESCE(p_submitted_at, now())
    // stamps submitted_at with the SERVER clock. The per-device throttle counts on this
    // column, so a client-supplied timestamp must never set it (review P2: a backdated
    // submitted_at would make the throttle window always read 0 → unbounded writes). The
    // client's claimed submitted_at is still preserved inside p_payload_json.
    p_schema_version: payload.schema_version,
    p_signature: signature,
    p_codename: payload.codename,
    p_tier: payload.tier,
    p_verification_tier: gate.tier,
    p_compression_ratio: r.compressionRatio,
    p_prompt_complexity: r.promptComplexity,
    p_cross_thread: r.crossThread,
    p_session_depth: r.sessionDepth,
    p_token_throughput: r.tokenThroughput,
    p_signal_force: r.signalForce,
    p_live_signa_rate: r.signaRate,
    p_message_volume: r.messageVolume,
    p_account_age_days: r.accountAgeDays,
    p_total_messages: r.totalMessages,
  });

  if (error) {
    // 23505 = unique_violation on uq_submissions_snapshot_hash → exact-hash replay (§0.4).
    if (error.code === "23505") {
      return {
        ok: false,
        reason: "duplicate_snapshot",
        detail: "snapshot_hash already accepted",
      };
    }
    return { ok: false, reason: "persist_failed", detail: error.message };
  }

  return { ok: true, metricSnapshotId: (data as string | null) ?? null };
}

/**
 * insertSubmissionOnly — accepted-but-unverified / flagged path: write the
 * constraint-complete audit row (status 'validated'), do NOT materialize. The row
 * is never ranked (the board reads metric_snapshots, which this does not touch).
 */
export async function insertSubmissionOnly(
  payload: SnapshotPayloadV1,
  signature: string,
  device: ResolvedDevice,
  gate: GateResult,
): Promise<MaterializeResult> {
  const svc = getSupabaseService();
  if (!svc) {
    return {
      ok: false,
      reason: "persistence_unavailable",
      detail: "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    };
  }

  const res = await insertAuditSubmission(
    svc,
    payload,
    signature,
    device,
    gate,
    recomputeFromPillars(payload),
  );
  return res.ok ? { ok: true, metricSnapshotId: null } : res;
}

type ServiceClient = NonNullable<ReturnType<typeof getSupabaseService>>;
type AuditResult =
  | { ok: true; submissionId: string }
  | Extract<MaterializeResult, { ok: false }>;

/** The status-'validated' audit row (never ranked). Returns its submission_id. */
async function insertAuditSubmission(
  svc: ServiceClient,
  payload: SnapshotPayloadV1,
  signature: string,
  device: ResolvedDevice,
  gate: GateResult,
  r: RecomputedSnapshot,
): Promise<AuditResult> {
  const { data, error } = await svc
    .from("snapshot_submissions")
    .insert({
      operator_id: device.operator_id, // FROM DEVICE (§5.4)
      device_id: device.device_id,
      // submitted_at OMITTED → column DEFAULT now() (server clock). Throttle integrity:
      // never let a client timestamp set the throttle-keyed column (review P2). The client's
      // claimed submitted_at remains in payload_json.
      window_type: payload.window.type,
      platform: payload.platform.primary,
      window_start: payload.window.start,
      window_end: payload.window.end,
      schema_version: payload.schema_version,
      ruleset_version: payload.agent.ruleset_version,
      snapshot_hash: payload.agent.snapshot_hash,
      signature,
      payload_json: payload,
      codename: payload.codename,
      tier: payload.tier,
      verification_tier: gate.tier,
      status: "validated",
      input_tokens: r.pillars.input,
      output_tokens: r.pillars.output,
      cache_creation_tokens: r.pillars.cacheCreate,
      cache_read_tokens: r.pillars.cacheRead,
    })
    .select("submission_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        reason: "duplicate_snapshot",
        detail: "snapshot_hash already accepted",
      };
    }
    return { ok: false, reason: "persist_failed", detail: error.message };
  }

  return { ok: true, submissionId: (data as { submission_id: string }).submission_id };
}

type MetricRow = Record<string, unknown> & {
  snapshot_date: string;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cache_read_tokens: number | string | null;
  cache_creation_tokens: number | string | null;
  window_end: string | null;
};

const rowPillars = (row: MetricRow): Pillars => ({
  input: Number(row.input_tokens ?? 0),
  output: Number(row.output_tokens ?? 0),
  cacheRead: Number(row.cache_read_tokens ?? 0),
  cacheCreate: Number(row.cache_creation_tokens ?? 0),
});

/** A carried-forward row keeps its source's window_end, so its date trails snapshot_date. */
const isCarried = (row: MetricRow): boolean =>
  row.window_end != null && snapshotDateUTC(row.window_end) !== row.snapshot_date;

/**
 * guardAllTimeUpload — all-time never shrinks (lib/ingest/all-time-guard.ts).
 * Returns null when the upload may replace the board row as usual (the caller
 * runs the 0013 RPC). Otherwise it writes the status-'validated' audit row (the
 * scanned numbers stay on record) and upserts this date's all_time row with the
 * guarded totals: the previous row carried forward, or for 'multi' the sum of
 * the scan's guarded platform rows. Reads fail closed: no read, no write.
 */
async function guardAllTimeUpload(
  svc: ServiceClient,
  payload: SnapshotPayloadV1,
  signature: string,
  device: ResolvedDevice,
  gate: GateResult,
  r: RecomputedSnapshot,
): Promise<MaterializeResult | null> {
  const platform = payload.platform.primary;
  const snapshotDate = snapshotDateUTC(payload.window.end);
  const allTime = () =>
    svc
      .from("metric_snapshots")
      .select("*")
      .eq("operator_id", device.operator_id)
      .eq("window_type", "all_time");

  const prevRes = await allTime()
    .eq("platform", platform)
    .order("snapshot_date", { ascending: false })
    .limit(1);
  if (prevRes.error) {
    return { ok: false, reason: "persist_failed", detail: prevRes.error.message };
  }
  const prev = ((prevRes.data ?? []) as MetricRow[])[0] ?? null;

  let scanPlatformSum: Pillars | null = null;
  if (platform === "multi") {
    const scanRes = await allTime()
      .eq("snapshot_date", snapshotDate)
      .neq("platform", "multi");
    if (scanRes.error) {
      return { ok: false, reason: "persist_failed", detail: scanRes.error.message };
    }
    const scanRows = (scanRes.data ?? []) as MetricRow[];
    if (scanRows.some(isCarried)) scanPlatformSum = sumPillars(scanRows.map(rowPillars));
  }

  const decision = decideAllTime({
    platform,
    next: r.pillars,
    previous: prev ? rowPillars(prev) : null,
    scanPlatformSum,
  });
  if (decision.action === "replace") return null;

  const now = new Date().toISOString();
  let row: Record<string, unknown>;
  let detail: string;
  if (decision.action === "hold" && prev) {
    const prevDate = prev.snapshot_date;
    // Same columns as the previous row (its source submission, window, pillars and
    // derived scores); only the identity and timestamps are new.
    row = { ...prev };
    delete row.metric_snapshot_id;
    row = {
      ...row,
      snapshot_date: snapshotDate,
      last_seen: now,
      generated_at: now,
      movement_24h: 0,
      movement_7d: 0,
    };
    detail = `all_time ${platform} scan has less ${decision.shrunk.join(", ")} than the board row from ${prevDate}; kept those totals`;
  } else if (decision.action === "platform_sum") {
    const s = recomputeFromPillars({
      ...payload,
      raw_telemetry: {
        ...payload.raw_telemetry,
        tokens_input_fresh: decision.pillars.input,
        tokens_output: decision.pillars.output,
        tokens_cache_read: decision.pillars.cacheRead,
        tokens_cache_creation: decision.pillars.cacheCreate,
      },
    });
    row = {
      operator_id: device.operator_id,
      snapshot_date: snapshotDate,
      window_type: "all_time",
      platform,
      source_submission_id: null, // set to this upload's audit row below
      window_start: payload.window.start,
      window_end: payload.window.end,
      input_tokens: s.pillars.input,
      output_tokens: s.pillars.output,
      cache_creation_tokens: s.pillars.cacheCreate,
      cache_read_tokens: s.pillars.cacheRead,
      signa_rate: s.signaRate,
      class_tier: s.classTier,
      ruleset_version: payload.agent.ruleset_version,
      compression_ratio: s.compressionRatio,
      prompt_complexity: s.promptComplexity,
      cross_thread: s.crossThread,
      session_depth: s.sessionDepth,
      token_throughput: s.tokenThroughput,
      signal_force: s.signalForce,
      live_signa_rate: s.signaRate,
      message_volume: s.messageVolume,
      account_age_days: s.accountAgeDays,
      total_messages: s.totalMessages,
      workflow_mode: null,
      workflow_evidence_url: null,
      workflow_mode_version: null,
      mode_assessed_at: null,
      last_seen: now,
      generated_at: now,
      movement_24h: 0,
      movement_7d: 0,
    };
    detail = `all_time multi scan has less ${decision.shrunk.join(", ")} than its platform rows (one was held); multi set to their sum`;
  } else {
    throw new Error("all-time guard: hold without a previous row");
  }

  const audit = await insertAuditSubmission(svc, payload, signature, device, gate, r);
  if (!audit.ok) return audit;
  if (decision.action === "platform_sum") row.source_submission_id = audit.submissionId;

  const { data, error } = await svc
    .from("metric_snapshots")
    .upsert(row, { onConflict: "operator_id,snapshot_date,window_type,platform" })
    .select("metric_snapshot_id")
    .single();
  if (error) return { ok: false, reason: "persist_failed", detail: error.message };

  return {
    ok: true,
    metricSnapshotId: (data as { metric_snapshot_id: string }).metric_snapshot_id,
    allTimeGuard: {
      code:
        decision.action === "hold" ? "all_time_shrink_held" : "all_time_platform_sum",
      gate: "all_time_guard",
      severity: "flag",
      detail,
    },
  };
}

/**
 * revalidateShareSurfaces — bust the /s/<codename> share landing page and its
 * card.png OG/share image (owner 2026-10-21). Both render operator numbers and
 * the verification mark, and previously lagged up to an hour (revalidate =
 * 3600 / s-maxage=3600). Both codename casings, like /user/.
 */
function revalidateShareSurfaces(codename: string): void {
  for (const c of new Set([codename, codename.toLowerCase()])) {
    revalidatePath(`/s/${c}`);
    revalidatePath(`/s/${c}/card.png`);
  }
}

/**
 * revalidateTouchedWindows — refresh the static board pages AND the operator
 * profile cache a new verified row affects (§6.4): the specific window slug +
 * the deduped default "/board/off" (which replaced the removed "everything"
 * firehose, PR#10). all_time → "all". Also bust the "operator" cache tag so
 * the profile page (getOperator, getOperatorHistory, getOperatorSubmissions,
 * getOperatorReport — all tagged "operator" in cached.ts) refreshes
 * immediately instead of waiting up to 120s for the unstable_cache TTL.
 * Finally revalidate the operator's profile page path itself so the ISR
 * static cache (export const revalidate = 120) is also busted, plus the
 * /s/<codename> share page and card.png (revalidateShareSurfaces).
 */
export function revalidateTouchedWindows(
  windowType: string,
  codename?: string,
): void {
  const win = boardWindowByEnum(windowType);
  if (win) revalidatePath(`/board/${win.slug}`);
  revalidatePath("/board/off");
  revalidatePath("/");
  // /board/all aggregates EVERY window (windowFilter:false + collapse), so a
  // 7d-only submission still changes it — bust it unconditionally, not just
  // when the submitted window_type is 'all_time'.
  if (win?.slug !== "all") revalidatePath("/board/all");
  revalidateTag("operator", "max");
  revalidateTag("board", "max");
  // Also bust the in-memory memo cache for getLeaderboard (the 2MB workaround).
  // revalidateTag("board") only invalidates unstable_cache entries; the memo
  // cache is a separate layer and needs explicit invalidation.
  memoInvalidatePrefix("board:");
  if (codename) {
    revalidatePath(`/user/${codename}`);
    revalidatePath(`/user/${codename.toLowerCase()}`);
    revalidateShareSurfaces(codename);
  }
}

/**
 * revalidateOperatorIndexState — bust every surface that can serve stale
 * index-state after a policy-relevant operator flag changes outside the
 * snapshot pipeline (POST /api/v1/claim flips `claimed`; POST /api/v1/profile
 * can flip `profile_visibility`). The sitemap↔robots contract
 * (lib/seo/indexing-policy.ts) requires the ISR profile page (21600s), the
 * prerendered sitemap, and the tagged data caches to agree — without this the
 * sitemap can advertise a URL whose cached page still emits noindex.
 */
export function revalidateOperatorIndexState(codename: string): void {
  revalidateTag("operator", "max");
  revalidateTag("board", "max");
  memoInvalidatePrefix("board:");
  revalidatePath(`/user/${codename}`);
  revalidatePath(`/user/${codename.toLowerCase()}`);
  // Wrapped emits the same policy-driven robots (3600s ISR).
  revalidatePath(`/user/${codename}/wrapped`);
  revalidatePath(`/user/${codename.toLowerCase()}/wrapped`);
  revalidateShareSurfaces(codename);
  revalidatePath("/sitemap.xml");
  // Claimed membership changes the claimed-only live board surfaces too.
  revalidatePath("/board/all");
  revalidatePath("/board/off");
  revalidatePath("/");
}
