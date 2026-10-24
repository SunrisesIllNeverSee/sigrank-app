import { NextRequest, NextResponse } from 'next/server'
import { logEncounter } from '@/lib/exchange/server'
import schema from '@/lib/exchange-gateway/exchange-signal-1.0.schema.json'

// Serves the JSON Schema (draft 2020-12) for exchange-signal/1.0 — the URL the
// Exchange manifest advertises at signals.schema. The document mirrors
// ExchangeSignalInputSchema in lib/exchange-gateway/src/signal-schema.ts.
export async function GET(req: NextRequest) {
  // Every schema read is an exchange encounter — same top-of-funnel
  // observability as /.well-known/exchange.json.
  await logEncounter({
    targetDomain: req.nextUrl.hostname,
    endpoint: '/schemas/exchange-signal/1.0',
    req,
    result: 'ok',
    metadata: { schema_version: 'exchange-signal/1.0' },
  })
  return new NextResponse(JSON.stringify(schema, null, 2), {
    headers: {
      'content-type': 'application/schema+json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'access-control-allow-origin': '*',
      'x-signalaf-capability': 'contribution_exchange',
      'x-signalaf-activation': 'explicit_request',
    },
  })
}
