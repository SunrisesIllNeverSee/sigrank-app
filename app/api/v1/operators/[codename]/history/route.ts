/**
 * GET /api/v1/operators/{codename}/history — score history for trend charts
 * (api_spec.md §operators/{codename}/history).
 *
 * Reads through the @/lib/data facade so it 200s on seed data with Supabase
 * unset. window param passes through as the API enum; limit caps the number of
 * (most-recent) points returned.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getOperator, getOperatorHistory } from '@/lib/data'

const MAX_LIMIT = 365

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  const { codename } = await params

  const operator = await getOperator(codename)
  if (!operator) {
    return NextResponse.json(
      { status: 'not_found', detail: `No operator with codename "${codename}".` },
      { status: 404 },
    )
  }

  const sp = req.nextUrl.searchParams
  const windowParam = sp.get('window') ?? '30d'
  const limitRaw = Number.parseInt(sp.get('limit') ?? '', 10)
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : undefined

  const points = await getOperatorHistory(codename, { window: windowParam, limit })

  const body = {
    codename: operator.operator.codename,
    claimed: operator.operator.claimed,
    window: windowParam,
    points: points.map((p) => ({
      date: p.date,
      signa_rate: p.signa_rate,
      global_rank: p.global_rank,
      class_tier: p.class_tier, // UPPERCASE canonical SignalClass
    })),
    is_placeholder: operator.operator.isPlaceholder ?? false,
  }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, max-age=120' },
  })
}
