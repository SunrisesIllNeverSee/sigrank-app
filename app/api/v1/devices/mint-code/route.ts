import { NextResponse, type NextRequest } from 'next/server'
import { getSessionOperator } from '@/lib/supabase/auth-server'
import { getSupabaseService } from '@/lib/supabase/server'
import { enrollRateLimit, rateLimitedResponse, getClientIp } from '@/lib/api/gate'
import { generateConnectCode } from '@/lib/devices/connect-code'

/**
 * POST /api/v1/devices/mint-code — mint a single-use device connect code (D7 §4.2).
 *
 * Cookie-session auth'd (called by Settings → Connect a device). Resolves the
 * caller's own operator via getSessionOperator() (wraps private.auth_operator_id()),
 * so a code can only ever be minted for the operator you ARE — the anti-squat guard
 * is structural (no codename/operator is read from the request body). Writes via the
 * service-role-only client.
 */
export const dynamic = 'force-dynamic'

const CODE_TTL_MS = 10 * 60_000 // 10 minutes

export async function POST(req: NextRequest) {
  const rl = enrollRateLimit(req)
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter)

  const op = await getSessionOperator()
  if (!op) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const svc = getSupabaseService()
  if (!svc) return NextResponse.json({ error: 'Enrollment is not configured.' }, { status: 503 })

  const nowIso = new Date().toISOString()

  // 1. One live code per operator at a time.
  const { data: live } = await svc
    .from('device_enroll_codes')
    .select('expires_at')
    .eq('operator_id', op.operatorId)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .limit(1)
    .maybeSingle()
  if (live) {
    return NextResponse.json(
      { reason: 'code_already_live', expires_at: (live as { expires_at: string }).expires_at },
      { status: 429 },
    )
  }

  // Housekeeping: clear this operator's expired/unconsumed codes.
  await svc
    .from('device_enroll_codes')
    .delete()
    .eq('operator_id', op.operatorId)
    .is('consumed_at', null)
    .lte('expires_at', nowIso)

  // 2. Generate + insert, retrying only on a PK collision (vanishingly rare at ~75-bit).
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString()
  const createdIp = getClientIp(req)
  let code: string | null = null
  for (let attempt = 0; attempt < 4 && !code; attempt++) {
    const candidate = generateConnectCode()
    const { error } = await svc.from('device_enroll_codes').insert({
      code: candidate,
      operator_id: op.operatorId,
      expires_at: expiresAt,
      created_ip: createdIp,
    })
    if (!error) code = candidate
    else if (error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  if (!code) {
    return NextResponse.json({ error: 'Could not allocate a code, please retry.' }, { status: 503 })
  }

  return NextResponse.json(
    { code, expires_at: expiresAt, expires_in_seconds: Math.round(CODE_TTL_MS / 1000) },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}
