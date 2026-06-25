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
 *   4. PERSIST — gated by SIGRANK_INGEST_WRITE (default OFF) and only for an
 *      ENROLLED device (operator_id resolved FROM THE DEVICE, §5.4, never the
 *      payload codename):
 *        verified+accept   → materialize_verified_snapshot RPC (one tx) + revalidate
 *        flagged/unverified → audit row only (insertSubmissionOnly), never ranked
 *      An unenrolled device OR the flag being OFF → persist nothing (the safe
 *      pre-flip behavior this route shipped with).
 *
 * THE FLIP (§0.8/§7): set SIGRANK_INGEST_WRITE=1 in prod ONLY after the 3 pre-flip
 * gates are green (canon-parity, getSupabaseService loud-fail, real-Postgres insert)
 * + LEAD sign-off. Merging this code does NOT enable writes.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { validateSnapshot } from '@/lib/payload/schema'
import { runIngestGates, type GateContext } from '@/lib/ingest/gates'
import { getSupabaseService } from '@/lib/supabase/server'
import {
  materializeVerifiedSnapshot,
  insertSubmissionOnly,
  revalidateTouchedWindows,
  type MaterializeResult,
} from '@/lib/ingest/materialize'

const SCORING_ETA_SECONDS = 30

/** Persist stays OFF until this is set in prod — the verify-before-write flip (§0.8/§7). */
const PERSIST_ENABLED = process.env.SIGRANK_INGEST_WRITE === '1'

/** Throttle window: count a device's submissions in the trailing 60s (cap = GATE_LIMITS). */
const THROTTLE_WINDOW_MS = 60_000

interface ResolvedDeviceRow {
  device_id: string
  operator_id: string
  agent_public_key: string
  trust_status: string
  codename: string | null
}

/** Normalize a supabase to-one embed (object) vs to-many (array) to the codename. */
function embeddedCodename(operators: unknown): string | null {
  if (Array.isArray(operators)) return (operators[0] as { codename?: string })?.codename ?? null
  return (operators as { codename?: string } | null)?.codename ?? null
}

/**
 * Derive a deterministic id from parts (no RNG). Used for the submission_id /
 * operator_id response handles when nothing real is persisted, so identical
 * payloads reproduce identical ids. API-response handles only — never DB keys.
 */
function deterministicId(prefix: string, ...parts: string[]): string {
  let h = 0
  const s = parts.join('|')
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return `${prefix}_${(h >>> 0).toString(16).padStart(8, '0')}`
}

export async function POST(req: NextRequest) {
  // Body must be JSON.
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { status: 'rejected', reason: 'schema_invalid', detail: 'Body is not valid JSON.' },
      { status: 400 },
    )
  }

  // 1. Schema validation.
  const result = validateSnapshot(raw)
  if (!result.ok) {
    return NextResponse.json(
      { status: 'rejected', reason: result.reason, detail: result.detail },
      { status: 400 },
    )
  }
  const payload = result.data

  // 2. Require the signature header to be present (presence ≠ verification — step 3 verifies).
  const signature = req.headers.get('x-agent-signature')
  if (!signature) {
    return NextResponse.json(
      { status: 'rejected', reason: 'signature_invalid', detail: 'Missing X-Agent-Signature header.' },
      { status: 401 },
    )
  }

  // 3. Pre-fetch the live gate state (async) so the SYNC gate callbacks read in-memory
  // values: the enrolled device (+ its operator codename), exact-hash dedup, and the
  // device's trailing-window submission count for throttle.
  const svc = getSupabaseService()
  let device: ResolvedDeviceRow | null = null
  let dupHash = false
  let recentCount = 0
  if (svc) {
    const sinceIso = new Date(Date.now() - THROTTLE_WINDOW_MS).toISOString()
    const [devRes, dupRes, throttleRes] = await Promise.all([
      svc
        .from('devices')
        .select('device_id, operator_id, agent_public_key, trust_status, operators:operator_id(codename)')
        .eq('device_id', payload.device_id)
        .maybeSingle(),
      svc
        .from('snapshot_submissions')
        .select('submission_id', { count: 'exact', head: true })
        .eq('snapshot_hash', payload.agent.snapshot_hash),
      svc
        .from('snapshot_submissions')
        .select('submission_id', { count: 'exact', head: true })
        .eq('device_id', payload.device_id)
        .gte('submitted_at', sinceIso),
    ])
    const d = devRes.data as
      | { device_id: string; operator_id: string; agent_public_key: string; trust_status: string; operators: unknown }
      | null
    if (d) {
      device = {
        device_id: d.device_id,
        operator_id: d.operator_id,
        agent_public_key: d.agent_public_key,
        trust_status: d.trust_status,
        codename: embeddedCodename(d.operators),
      }
    }
    dupHash = (dupRes.count ?? 0) > 0
    recentCount = throttleRes.count ?? 0
  }

  const ctx: GateContext = {
    signatureB64: signature,
    // Only a TRUSTED enrolled device yields a key (§5.3); revoked/unenrolled → null → unverified.
    lookupDeviceKey: (id) =>
      device && device.device_id === id && device.trust_status === 'trusted'
        ? device.agent_public_key
        : null,
    // Exact-hash dedup ONLY. isReplay is deliberately unwired → live-upload (§0.4):
    // same (operator, window) with newer numbers UPSERTs; only an exact hash rejects.
    isDuplicateHash: () => dupHash,
    recentSubmissionCount: () => recentCount,
  }

  // 4. Ingest integrity gates (anti-gaming). First reject wins.
  const gate = runIngestGates(payload, ctx)
  if (gate.decision === 'reject') {
    const top = gate.reasons.find((r) => r.severity === 'reject')
    return NextResponse.json(
      {
        status: 'rejected',
        reason: top?.code ?? 'gate_rejected',
        detail: top?.detail ?? 'failed an ingest integrity gate',
        gate: { decision: gate.decision, tier: gate.tier, reasons: gate.reasons },
      },
      { status: 422 },
    )
  }

  // 5. Persist (env-gated; ENROLLED devices only — operator resolved FROM THE DEVICE, §5.4).
  let persisted = false
  if (PERSIST_ENABLED && svc && device) {
    // Sanity guard (§5.4): a codename disagreeing with the device's bound operator is
    // rejected — the operator is authoritative from the device; a mismatch signals
    // confusion/tampering (we never trust the payload codename for resolution).
    if (device.codename && device.codename !== payload.codename) {
      return NextResponse.json(
        {
          status: 'rejected',
          reason: 'codename_device_mismatch',
          detail: 'payload codename does not match the codename bound to this device',
        },
        { status: 422 },
      )
    }

    const resolved = { device_id: device.device_id, operator_id: device.operator_id }
    let res: MaterializeResult
    if (gate.decision === 'accept' && gate.tier === 'verified') {
      res = await materializeVerifiedSnapshot(payload, signature, resolved, gate)
      if (res.ok) revalidateTouchedWindows(payload.window.type)
    } else {
      // accepted-but-unverified / flagged (e.g. revoked device, or a plausibility flag): audit only.
      res = await insertSubmissionOnly(payload, signature, resolved, gate)
    }

    if (!res.ok) {
      if (res.reason === 'duplicate_snapshot') {
        return NextResponse.json(
          { status: 'rejected', reason: 'duplicate_snapshot', detail: res.detail },
          { status: 422 },
        )
      }
      if (res.reason === 'persistence_unavailable') {
        return NextResponse.json({ status: 'persistence_unavailable', detail: res.detail }, { status: 503 })
      }
      return NextResponse.json({ status: 'persist_failed', detail: res.detail }, { status: 500 })
    }
    persisted = true
  }

  // Response: real operator_id when the device is known; deterministic handles otherwise.
  const operatorId = device?.operator_id ?? deterministicId('op', payload.codename.toLowerCase())
  const submissionId = deterministicId(
    'sub',
    payload.device_id,
    payload.window.type,
    payload.window.start,
    payload.agent.snapshot_hash,
  )

  return NextResponse.json(
    {
      status: 'received',
      submission_id: submissionId,
      operator_id: operatorId,
      verification_tier: gate.tier,
      gate_decision: gate.decision,
      persisted,
      flags: gate.reasons.filter((r) => r.severity !== 'reject'),
      scoring_eta_seconds: SCORING_ETA_SECONDS,
    },
    { status: 202 },
  )
}
