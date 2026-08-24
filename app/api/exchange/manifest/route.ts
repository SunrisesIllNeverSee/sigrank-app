import { NextRequest, NextResponse } from 'next/server'
import { buildExchangeManifest } from '@/exchange-gateway/src/manifest'
export function GET(req: NextRequest){const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`; return NextResponse.json(buildExchangeManifest(base), { headers: { 'cache-control': 'public, max-age=300' } })}
