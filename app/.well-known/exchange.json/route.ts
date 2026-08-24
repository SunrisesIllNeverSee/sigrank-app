import { NextRequest, NextResponse } from 'next/server'
import { buildExchangeManifest } from '@/exchange-gateway/src/manifest'
import { logEncounter, requestIdentity } from '@/lib/exchange/server'

export async function GET(req: NextRequest) {
  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const manifest = buildExchangeManifest(base)
  // Log every encounter with the exchange profile — this is the top-of-funnel
  // observability layer. Every agent that reads this file gets recorded.
  await logEncounter({
    targetDomain: manifest.domain,
    endpoint: '/.well-known/exchange.json',
    req,
    result: 'ok',
    metadata: { version: manifest.version, status: manifest.status },
  })
  return NextResponse.json(manifest, {
    headers: {
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  })
}
