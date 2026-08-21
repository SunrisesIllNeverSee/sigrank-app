/**
 * POST /api/v1/snapshots — receive a signed snapshot from an enrolled local agent
 * (api_spec.md §snapshots, D7 §5/§6).
 *
 * VERIFY-BEFORE-WRITE (D7). Flow:
 *   1. zod-validate (validateSnapshot) — fail-closed strict allowlist.
 *   2. Require the X-Agent-Signature header to be PRESENT.
 *   3. Resolve the device by payload.device_id (service-role read) + pre-fetch the
 *      dedup + throttle state, then run the LIVE gate chain (the gate callbacks are
 *      sync, so all DB state is fetched up front): a TRUSTED enrolled device with a
 *      valid ed25519 signature → tier 'verified'; a bad signature on an enrolled
 *      device → HARD reject (422); an unenrolled/revoked device → 'unverified'
 *      (accepted, never ranked).
 *   4. PERSIST — gated by SIGRANK_INGEST_WRITE (LIVE in prod since ~2026-07-20)
 *      and only for an ENROLLED device (operator_id resolved FROM THE DEVICE,
 *      §5.4, never the payload codename):
 *        verified+accept   → materialize_verified_snapshot RPC (one tx) + revalidate
 *        flagged/unverified → audit row only (insertSubmissionOnly), never ranked
 *      An unenrolled device OR the flag being OFF → persist nothing.
 *
 * The 3 pre-flip gates (canon-parity, getSupabaseService loud-fail, real-Postgres
 * insert) were designed for the paste era (manual self-reported token verification).
 * The MCP eliminated that need — it pulls real token counts from local session logs
 * and signs them with a device key. The flip was enabled ~2026-07-20.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { validateSnapshot } from "@/lib/ingest/payload-schema";
import { runIngestGates, type GateContext } from "@/lib/ingest/gates";
import { runBattery } from "@/lib/ingest/battery";
import { checkAndStoreAttestation } from "@/lib/ingest/attestation";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import {
  materializeVerifiedSnapshot,
  insertSubmissionOnly,
  revalidateTouchedWindows,
  type MaterializeResult,
} from "@/lib/ingest/materialize";
import { captureServer } from "@/lib/infra/posthog/server";

const SCORING_ETA_SECONDS = 30;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_TO = "hello@signalaf.com";
const ALERT_FROM = "SigRank Alerts <hello@signalaf.com>";

/**
 * Notify the owner about a submission issue (rejected or flagged).
 * Fires BOTH a PostHog event (for querying/dashboards) AND an email alert
 * (for real-time awareness). Best-effort — never blocks the response.
 *
 * Privacy: codename + platform + reason codes only. No token values,
 * no gate internals, no PII beyond what's already public on the board.
 */
async function notifySubmissionIssue(
  codename: string,
  outcome: "rejected" | "flagged",
  reason: string,
  detail: string,
  meta: {
    platform?: string;
    windowType?: string;
    flagCodes?: string[];
  },
): Promise<void> {
  // 1. PostHog — always (best-effort, never throws)
  await captureServer(codename, "submission_issue", {
    outcome,
    reason,
    platform: meta.platform ?? "unknown",
    window_type: meta.windowType ?? "unknown",
    flag_codes: meta.flagCodes ?? [],
  }).catch(() => {});

  // 2. Email alert — best-effort, never throws
  if (!RESEND_API_KEY) return;
  try {
    const resend = new Resend(RESEND_API_KEY);
    const subject =
      outcome === "rejected"
        ? `[SigRank] Submission REJECTED — ${codename} (${reason})`
        : `[SigRank] Submission FLAGGED — ${codename} (${reason})`;
    const body = [
      `Operator: ${codename}`,
      `Platform: ${meta.platform ?? "unknown"}`,
      `Window: ${meta.windowType ?? "unknown"}`,
      `Outcome: ${outcome}`,
      `Reason: ${reason}`,
      `Detail: ${detail}`,
      meta.flagCodes && meta.flagCodes.length > 0
        ? `Flag codes: ${meta.flagCodes.join(", ")}`
        : null,
      "",
      `Time: ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    await resend.emails.send({
      from: ALERT_FROM,
      to: ALERT_TO,
      subject,
      text: body,
    });
  } catch {
    // swallow — alerts must never break the request
  }
}

/**
 * The verify-before-write flip (§0.8/§7). LIVE in prod since ~2026-07-20.
 * NOTE: if this var is marked "sensitive" in Vercel, `vercel env pull` returns
 * "" even though the runtime has "1" — verify via PostHog/Supabase, not the CLI.
 * See README.md § SIGRANK_INGEST_WRITE for details.
 */
const PERSIST_ENABLED = process.env.SIGRANK_INGEST_WRITE === "1";

/** Throttle window: count a device's submissions in the trailing 60s (cap = GATE_LIMITS). */
const THROTTLE_WINDOW_MS = 60_000;

interface ResolvedDeviceRow {
  device_id: string;
  operator_id: string;
  agent_public_key: string;
  trust_status: string;
  codename: string | null;
  data_opt_out: boolean;
}

interface EmbeddedOperator {
  codename?: string;
  data_opt_out?: boolean;
}

/** Normalize a supabase to-one embed (object) vs to-many (array) to the operator row. */
function embeddedOperators(operators: unknown): EmbeddedOperator | null {
  if (Array.isArray(operators)) return (operators[0] as EmbeddedOperator) ?? null;
  return (operators as EmbeddedOperator | null) ?? null;
}

/**
 * Derive a deterministic id from parts (no RNG). Used for the submission_id /
 * operator_id response handles when nothing real is persisted, so identical
 * payloads reproduce identical ids. API-response handles only — never DB keys.
 */
function deterministicId(prefix: string, ...parts: string[]): string {
  let h = 0;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `${prefix}_${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export async function POST(req: NextRequest) {
  // Body must be JSON.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    await notifySubmissionIssue("unknown", "rejected", "schema_invalid", "Body is not valid JSON.", {});
    return NextResponse.json(
      {
        status: "rejected",
        reason: "schema_invalid",
        detail: "Body is not valid JSON.",
      },
      { status: 400 },
    );
  }

  // 1. Schema validation.
  const result = validateSnapshot(raw);
  if (!result.ok) {
    const attemptedCodename =
      typeof raw === "object" && raw !== null && "codename" in raw
        ? String((raw as { codename: unknown }).codename ?? "unknown")
        : "unknown";
    const attemptedPlatform =
      typeof raw === "object" && raw !== null && "platform" in raw
        ? String(
            (raw as { platform?: { primary?: string } }).platform?.primary ??
              "unknown",
          )
        : "unknown";
    await notifySubmissionIssue(attemptedCodename, "rejected", result.reason, result.detail, {
      platform: attemptedPlatform,
    });
    return NextResponse.json(
      { status: "rejected", reason: result.reason, detail: result.detail },
      { status: 400 },
    );
  }
  const payload = result.data;

  // 2. Require the signature header to be present (presence ≠ verification — step 3 verifies).
  const signature = req.headers.get("x-agent-signature");
  if (!signature) {
    await notifySubmissionIssue(payload.codename, "rejected", "signature_invalid", "Missing X-Agent-Signature header.", {
      platform: payload.platform.primary,
      windowType: payload.window.type,
    });
    return NextResponse.json(
      {
        status: "rejected",
        reason: "signature_invalid",
        detail: "Missing X-Agent-Signature header.",
      },
      { status: 401 },
    );
  }

  // 3. Pre-fetch the live gate state (async) so the SYNC gate callbacks read in-memory
  // values: the enrolled device (+ its operator codename), exact-hash dedup, and the
  // device's trailing-window submission count for throttle.
  const svc = getSupabaseService();
  let device: ResolvedDeviceRow | null = null;
  let dupHash = false;
  let recentCount = 0;
  if (svc) {
    const sinceIso = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString();
    const [devRes, dupRes, throttleRes] = await Promise.all([
      svc
        .from("devices")
        .select(
          "device_id, operator_id, agent_public_key, trust_status, operators:operator_id(codename, data_opt_out)",
        )
        .eq("device_id", payload.device_id)
        .maybeSingle(),
      svc
        .from("snapshot_submissions")
        .select("submission_id", { count: "exact", head: true })
        .eq("snapshot_hash", payload.agent.snapshot_hash),
      svc
        .from("snapshot_submissions")
        .select("submission_id", { count: "exact", head: true })
        .eq("device_id", payload.device_id)
        .gte("submitted_at", sinceIso),
    ]);
    const d = devRes.data as {
      device_id: string;
      operator_id: string;
      agent_public_key: string;
      trust_status: string;
      operators: unknown;
    } | null;
    if (d) {
      const op = embeddedOperators(d.operators);
      device = {
        device_id: d.device_id,
        operator_id: d.operator_id,
        agent_public_key: d.agent_public_key,
        trust_status: d.trust_status,
        codename: op?.codename ?? null,
        data_opt_out: op?.data_opt_out ?? false,
      };
    }
    dupHash = (dupRes.count ?? 0) > 0;
    recentCount = throttleRes.count ?? 0;
  }

  // 3b. Operator-level opt-out gate: reject submissions when data collection is paused.
  if (device?.data_opt_out) {
    await notifySubmissionIssue(payload.codename, "rejected", "data_opt_out", "Data collection is paused for this operator.", {
      platform: payload.platform.primary,
      windowType: payload.window.type,
    });
    return NextResponse.json(
      {
        status: "rejected",
        reason: "data_opt_out",
        detail:
          "Data collection is paused for this operator. Re-enable in Settings.",
      },
      { status: 403 },
    );
  }

  const ctx: GateContext = {
    signatureB64: signature,
    // Only a TRUSTED enrolled device yields a key (§5.3); revoked/unenrolled → null → unverified.
    lookupDeviceKey: (id) =>
      device && device.device_id === id && device.trust_status === "trusted"
        ? device.agent_public_key
        : null,
    // Exact-hash dedup ONLY. isReplay is deliberately unwired → live-upload (§0.4):
    // same (operator, window) with newer numbers UPSERTS; only an exact hash rejects.
    isDuplicateHash: () => dupHash,
    recentSubmissionCount: () => recentCount,
    // Gate 5 battery — proprietary anomaly detection (Benford / cadence / contamination).
    // Server-only plug-in; never shipped to the public repo or open agent.
    battery: runBattery,
  };

  // 4. Ingest integrity gates (anti-gaming). First reject wins.
  const gate = runIngestGates(payload, ctx);
  if (gate.decision === "reject") {
    const top = gate.reasons.find((r) => r.severity === "reject");
    const rejectCode = top?.code ?? "gate_rejected";
    const rejectDetail = top?.detail ?? "failed an ingest integrity gate";
    await notifySubmissionIssue(payload.codename, "rejected", rejectCode, rejectDetail, {
      platform: payload.platform.primary,
      windowType: payload.window.type,
      flagCodes: gate.reasons.map((r) => r.code),
    });
    return NextResponse.json(
      {
        status: "rejected",
        reason: rejectCode,
        detail: rejectDetail,
        gate: {
          decision: gate.decision,
          tier: gate.tier,
          reasons: gate.reasons,
        },
      },
      { status: 422 },
    );
  }

  // 4b. Source attestation cross-check (S1.3, v1.1 payloads only). If the payload
  // includes source_attestation, cross-check it against historical attestations
  // from this device and store the new entries. Tampering flags upgrade the gate
  // decision from 'accept' to 'flag' (the submission is accepted-but-unverified).
  if (
    payload.source_attestation &&
    payload.source_attestation.length > 0 &&
    svc
  ) {
    const attestation = await checkAndStoreAttestation(
      payload,
      payload.device_id,
      device?.operator_id ?? null,
    );
    if (attestation.flags.length > 0) {
      gate.reasons.push(...attestation.flags);
      // Upgrade the decision to 'flag' if it was 'accept' — attestation tampering
      // means the submission is not trusted enough to materialize onto the board.
      if (gate.decision === "accept") {
        gate.decision = "flag";
        if (gate.tier === "verified") gate.tier = "flagged";
      }
    }
  }

  // 5. Persist (env-gated; ENROLLED devices only — operator resolved FROM THE DEVICE, §5.4).
  let persisted = false;
  if (PERSIST_ENABLED && svc && device) {
    // Sanity guard (§5.4): a codename disagreeing with the device's bound operator is
    // rejected — the operator is authoritative from the device; a mismatch signals
    // confusion/tampering (we never trust the payload codename for resolution).
    // A null device codename means the device hasn't been bound to a codename yet —
    // reject the payload codename rather than letting an arbitrary name through.
    if (device.codename == null) {
      await notifySubmissionIssue(payload.codename, "rejected", "device_codename_not_bound", "Device has no codename bound — complete enrollment first.", {
        platform: payload.platform.primary,
        windowType: payload.window.type,
      });
      return NextResponse.json(
        {
          status: "rejected",
          reason: "device_codename_not_bound",
          detail:
            "this device has no codename bound — complete enrollment first",
        },
        { status: 422 },
      );
    }
    if (device.codename !== payload.codename) {
      await notifySubmissionIssue(payload.codename, "rejected", "codename_device_mismatch", `Payload codename does not match device codename (${device.codename}).`, {
        platform: payload.platform.primary,
        windowType: payload.window.type,
      });
      return NextResponse.json(
        {
          status: "rejected",
          reason: "codename_device_mismatch",
          detail:
            "payload codename does not match the codename bound to this device",
        },
        { status: 422 },
      );
    }

    const resolved = {
      device_id: device.device_id,
      operator_id: device.operator_id,
    };
    let res: MaterializeResult;
    if (gate.decision === "accept" && gate.tier === "verified") {
      res = await materializeVerifiedSnapshot(
        payload,
        signature,
        resolved,
        gate,
      );
      if (res.ok) revalidateTouchedWindows(payload.window.type, payload.codename);
    } else {
      // accepted-but-unverified / flagged (e.g. revoked device, or a plausibility flag): audit only.
      res = await insertSubmissionOnly(payload, signature, resolved, gate);
    }

    if (!res.ok) {
      if (res.reason === "duplicate_snapshot") {
        await notifySubmissionIssue(payload.codename, "rejected", "duplicate_snapshot", res.detail, {
          platform: payload.platform.primary,
          windowType: payload.window.type,
        });
        return NextResponse.json(
          {
            status: "rejected",
            reason: "duplicate_snapshot",
            detail: res.detail,
          },
          { status: 422 },
        );
      }
      if (res.reason === "persistence_unavailable") {
        await notifySubmissionIssue(payload.codename, "rejected", "persistence_unavailable", res.detail, {
          platform: payload.platform.primary,
          windowType: payload.window.type,
        });
        return NextResponse.json(
          { status: "persistence_unavailable", detail: res.detail },
          { status: 503 },
        );
      }
      await notifySubmissionIssue(payload.codename, "rejected", "persist_failed", res.detail, {
        platform: payload.platform.primary,
        windowType: payload.window.type,
      });
      return NextResponse.json(
        { status: "persist_failed", detail: res.detail },
        { status: 500 },
      );
    }
    persisted = true;

    // Update last_seen on the device + operator so engagement tracking works.
    // Without this, last_seen stays at created_at forever and it looks like no
    // one ever comes back (the submission timestamps are the only source of truth).
    // Fire-and-forget — never block the response on this.
    if (svc) {
      const nowIso = new Date().toISOString();
      void Promise.resolve(
        svc
          .from("devices")
          .update({ last_seen: nowIso })
          .eq("device_id", device.device_id),
      ).catch(() => {});
      void Promise.resolve(
        svc
          .from("operators")
          .update({ last_seen: nowIso })
          .eq("operator_id", device.operator_id),
      ).catch(() => {});
    }
  }

  // Response: real operator_id when the device is known; deterministic handles otherwise.
  const operatorId =
    device?.operator_id ??
    deterministicId("op", payload.codename.toLowerCase());
  const submissionId = deterministicId(
    "sub",
    payload.device_id,
    payload.window.type,
    payload.window.start,
    payload.agent.snapshot_hash,
  );

  // snapshot_submitted — activation/core event, recorded server-side from the signed
  // agent request. Booleans/enums only; no token values. `persisted` says whether it
  // actually reached the board (vs accepted-but-unverified / write flag off).
  // `flag_codes` captures WHY a submission was flagged (e.g. cache_without_creation
  // for Codex users) so the owner can query PostHog for platform-specific issues.
  const flagCodes = gate.reasons
    .filter((r) => r.severity !== "reject")
    .map((r) => r.code);

  await captureServer(payload.codename, "snapshot_submitted", {
    source: "agent",
    window_type: payload.window.type,
    platform: payload.platform.primary,
    verification_tier: gate.tier,
    persisted,
    has_cascade:
      payload.raw_telemetry.tokens_cache_creation > 0 &&
      payload.raw_telemetry.tokens_cache_read > 0,
    flag_codes: flagCodes,
  });

  // Notify the owner when a submission has flags (internal signals for review).
  // Flags no longer block the submission from the board — they're recorded as
  // signals and the submission still materializes. The alert is so the owner
  // can review anomalous patterns (e.g. extreme cache ratios, Codex cache gaps).
  if (flagCodes.length > 0) {
    await notifySubmissionIssue(
      payload.codename,
      "flagged",
      flagCodes[0],
      gate.reasons.find((r) => r.severity === "flag")?.detail ?? "Submission has plausibility flags (still ranked).",
      {
        platform: payload.platform.primary,
        windowType: payload.window.type,
        flagCodes,
      },
    );
  }

  return NextResponse.json(
    {
      status: "received",
      submission_id: submissionId,
      operator_id: operatorId,
      verification_tier: gate.tier,
      gate_decision: gate.decision,
      persisted,
      flags: gate.reasons.filter((r) => r.severity !== "reject"),
      scoring_eta_seconds: SCORING_ETA_SECONDS,
    },
    { status: 202 },
  );
}
