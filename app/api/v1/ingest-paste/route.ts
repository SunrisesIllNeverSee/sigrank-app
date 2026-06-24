/**
 * POST /api/v1/ingest-paste — accept a ccusage/Codex paste, score it, persist.
 *
 * This is the web-paste submission path: the operator pastes ccusage JSON in
 * the browser instead of running the signed local agent. Confidence is 'medium'
 * (real token counts, no ed25519 signature).
 *
 * Flow:
 *   1. Parse the raw_paste via ingestMeta() → four token pillars.
 *   2. Bridge pillars → Core5Raw via pillarsToCore5().
 *   3. Score via scoreSnapshot() → SIGNA RATE + class.
 *   4. Persist to Supabase snapshot_submissions (if configured); else mock-accept.
 *   5. Return { status:'received', submission_id, signa_rate, class_tier }.
 *
 * No X-Agent-Signature required (this is the web path, not the agent path).
 * The submission is stored with source='web_paste' and confidence='medium'.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { ingestMeta } from '@/lib/ingest'
import { pillarsToCore5 } from '@/lib/ingest/bridge'
import { scoreSnapshot } from '@/lib/scoring/engine'

const SCORING_ETA_SECONDS = 10

function deterministicId(prefix: string, ...parts: string[]): string {
  let h = 0
  const s = parts.join('|')
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 }
  return `${prefix}_${(h >>> 0).toString(16).padStart(8, '0')}`
}

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ status: 'rejected', reason: 'invalid_json', detail: 'Body is not valid JSON.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ status: 'rejected', reason: 'schema_invalid', detail: 'Body must be an object.' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const codename = typeof b.codename === 'string' ? b.codename.trim() : ''
  const rawPaste = typeof b.raw_paste === 'string' ? b.raw_paste : ''
  const windowType = typeof b.window_type === 'string' ? b.window_type : '30d'
  const windowEnd  = typeof b.window_end  === 'string' ? b.window_end  : new Date().toISOString()
  const platformRaw = b.telemetry && typeof (b.telemetry as Record<string, unknown>).platform === 'object'
    ? ((b.telemetry as Record<string, unknown>).platform as Record<string, unknown>).primary as string ?? 'claude'
    : 'claude'

  if (!codename) {
    return NextResponse.json({ status: 'rejected', reason: 'missing_codename', detail: 'codename is required.' }, { status: 400 })
  }
  if (!rawPaste) {
    return NextResponse.json({ status: 'rejected', reason: 'missing_paste', detail: 'raw_paste is required.' }, { status: 400 })
  }

  // 1. Parse
  let pillars, meta
  try {
    const result = ingestMeta(rawPaste)
    pillars = result.pillars
    meta    = result.meta
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Parse failed.'
    return NextResponse.json({ status: 'rejected', reason: 'parse_failed', detail }, { status: 422 })
  }

  // 2. Bridge → Core5Raw (use 1/1 session fallback for free-tier paste path)
  const bridge = pillarsToCore5({ pillars, sessionsCount: 1, turnsTotal: 1 })

  // 3. Score
  const scored = scoreSnapshot({
    raw: bridge.core5,
    pcConfidence: 'low',
    totalMessagesLifetime: 0,
    accountAgeDays: 0,
  })

  // 4. Persist (non-blocking; mock-accept if Supabase not configured)
  const submissionId = deterministicId('paste', codename.toLowerCase(), windowEnd, rawPaste.slice(0, 32))
  const operatorId   = deterministicId('op', codename.toLowerCase())

  // 4. Record the paste in the append-only inbox ONLY — do NOT persist to the
  //    live board. (OWNER decision 2026-06-19): paste = RUN-NUMBERS. It computes
  //    the score (returned below → frontend shows the projected/ghost rank), but
  //    it does NOT save to the board. Board persistence requires an account +
  //    submission review (the future auth/review path reads this same inbox).
  //    `snapshot_submissions` is an audit log, NOT what the board reads (the board
  //    reads operators + metric_snapshots — untouched here, so paste never ranks).
  const sb = getSupabaseServer()
  if (sb) {
    try {
      await sb.from('snapshot_submissions').insert({
        operator_id: operatorId,
        window_type: windowType,
        window_end:  windowEnd,
        schema_version: '1.0',
        ruleset_version: 'paste-v1',
        snapshot_hash: submissionId,
        signature: 'web_paste',
        payload_json: {
          codename,
          source: 'web_paste',
          confidence: 'medium',
          // status: pending — NOT promoted to the board. account + review gates that.
          status: 'pending_review',
          pillars,
          meta,
          scored: { signa_rate: scored.signa_rate, class_tier: scored.class_tier },
          platform: platformRaw,
          window_type: windowType,
          window_end:  windowEnd,
        },
      })
    } catch { /* graceful fallback — still ack */ }
  }

  // 5. Respond
  return NextResponse.json(
    {
      status: 'received',
      submission_id: submissionId,
      operator_id: operatorId,
      signa_rate: Math.round(scored.signa_rate * 10) / 10,
      class_tier: scored.class_tier,
      compression_ratio: Math.round(bridge.compressionRatio * 1000) / 1000,
      source: meta.source,
      estimated: meta.estimated,
      scoring_eta_seconds: SCORING_ETA_SECONDS,
    },
    { status: 202 },
  )
}
