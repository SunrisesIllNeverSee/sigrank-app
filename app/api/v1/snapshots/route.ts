/**
 * POST /api/v1/snapshots — receive a signed snapshot from a local agent
 * (api_spec.md §snapshots, snapshot_payload.md).
 *
 * ⚠️ SECURITY GATE (2026-06-18) — LIVE-DB PERSISTENCE IS DISABLED ON PURPOSE.
 * Persisting operators/devices/submissions from this endpoint requires ed25519
 * signature verification + out-of-band device enrollment, which DO NOT EXIST yet.
 * Without them an unauthenticated payload could (a) register or rotate a device's
 * `agent_public_key`, (b) overwrite another operator's denormalized profile, or
 * (c) squat/corrupt a codename (e.g. the #1 operator). A background security
 * review flagged the FK-resolving persistence (commit 4041ec9) as CRITICAL; it is
 * reverted here to the safe behavior: VALIDATE + require the signature header to be
 * present + mock-accept (NO writes). See `Devins_Plans/SECURE_INGEST.md` for the
 * enrollment + verification design that must land before live writes are re-enabled.
 *
 * Flow:
 *   1. zod-validate the payload (validateSnapshot) — fail-closed strict allowlist.
 *   2. Require the `X-Agent-Signature` header to be PRESENT.
 *   3. Run the ingest integrity gates (runIngestGates): plausibility / dedup / throttle /
 *      signature → accept | flag | reject + verification tier. Fabricated, replayed, or
 *      physically implausible payloads are REJECTED here (the anti-gaming layer).
 *   4. Respond { status:'received', ...id, verification_tier, gate_decision, flags }.
 *      IDs are deterministic handles (no RNG / no DB key); nothing is persisted.
 *
 * Validation failure → { status:'rejected', reason, detail }.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { validateSnapshot } from '@/lib/payload/schema'
import { runIngestGates } from '@/lib/ingest/gates'

const SCORING_ETA_SECONDS = 30

/**
 * Derive a deterministic id from parts (no RNG). Used for the submission_id /
 * operator_id response handles so identical payloads reproduce identical ids.
 * These are API-response handles only — never DB keys.
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

  // 2. Require the signature header to be present.
  // NOTE: presence is NOT verification. Real ed25519 verification (lookup the
  // device's registered public key, verify the signature over the canonical
  // payload, re-check agent.snapshot_hash) is part of the GATED secure-ingest path
  // (SECURE_INGEST.md). Until it lands, this route does not persist anything.
  const signature = req.headers.get('x-agent-signature')
  if (!signature) {
    return NextResponse.json(
      {
        status: 'rejected',
        reason: 'signature_invalid',
        detail: 'Missing X-Agent-Signature header.',
      },
      { status: 401 },
    )
  }

  // 3. INGEST INTEGRITY GATES (anti-gaming): plausibility / dedup / throttle / signature.
  // Every submission runs the gate chain so a fabricated, replayed, or physically
  // implausible payload is REJECTED here — the un-gameable-board layer. The proprietary
  // verification battery (Benford / cadence / observer-contamination) plugs in server-side
  // via GateContext.battery (kept off the open agent + public repo). DB writes stay
  // disabled regardless (step 4 / SECURE_INGEST.md).
  const gate = runIngestGates(payload, { signatureB64: signature })
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

  // 4. SECURITY GATE: do NOT persist. Writing operators/devices/submissions from an
  // unverified payload is an auth-bypass + profile-tampering vector (see header).
  // Return deterministic handles only; live persistence is re-enabled ONLY after
  // ed25519 verification + device enrollment ship (SECURE_INGEST.md).
  const submissionId = deterministicId(
    'sub',
    payload.device_id,
    payload.window.type,
    payload.window.start,
    payload.agent.snapshot_hash,
  )
  const operatorId = deterministicId('op', payload.codename.toLowerCase())

  return NextResponse.json(
    {
      status: 'received',
      submission_id: submissionId,
      operator_id: operatorId,
      verification_tier: gate.tier,
      gate_decision: gate.decision,
      flags: gate.reasons.filter((r) => r.severity !== 'reject'),
      scoring_eta_seconds: SCORING_ETA_SECONDS,
    },
    { status: 202 },
  )
}
