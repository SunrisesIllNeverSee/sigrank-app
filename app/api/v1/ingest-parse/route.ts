/**
 * POST /api/v1/ingest-parse — parse a ccusage/Codex paste, return a preview.
 *
 * No DB write. Returns the four token pillars + compression ratio so the
 * PasteForm can show a preview before the operator confirms submission.
 *
 * Request body: { text: string }
 * Response:     ParsePreview JSON or { error, detail }
 */

import { NextResponse, type NextRequest } from 'next/server'
import { ingestMeta } from '@/lib/ingest'
import { pillarsToCore5 } from '@/lib/ingest/bridge'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json', detail: 'Body is not valid JSON.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).text !== 'string') {
    return NextResponse.json({ error: 'missing_field', detail: 'Required field: text (string).' }, { status: 400 })
  }

  const text = ((body as Record<string, unknown>).text as string)

  try {
    const { pillars, meta } = ingestMeta(text)
    // Use placeholder session counts for the parse preview (operator hasn't provided them yet)
    // The real submission will use 1/1 fallback — same as free-tier manual path.
    const bridge = pillarsToCore5({ pillars, sessionsCount: 1, turnsTotal: 1 })

    return NextResponse.json({
      input: pillars.input,
      output: pillars.output,
      cacheCreate: pillars.cacheCreate,
      cacheRead: pillars.cacheRead,
      compressionRatio: bridge.compressionRatio,
      source: meta.source,
      estimated: meta.estimated,
      caveat: meta.caveat,
      costUsd: meta.costUsd,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Parse failed.'
    return NextResponse.json({ error: 'parse_failed', detail }, { status: 422 })
  }
}
