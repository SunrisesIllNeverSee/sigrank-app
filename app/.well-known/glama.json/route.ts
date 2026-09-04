import { NextRequest, NextResponse } from 'next/server'

const CLAIMS: Record<string, string> = {
  'signalaf.com': 'glama_claim_c6dKAWMpwWQQ_FrPVwTkZr6bFLSwbBc6',
  'sigeconomy.com': 'glama_claim_wbGrlkXVi5ckXCWgB3e1dxb0QmHLwvJ5',
}

export async function GET(req: NextRequest) {
  const host = req.nextUrl.host
  const claim = CLAIMS[host]

  if (!claim) {
    return new NextResponse('Not found', { status: 404 })
  }

  return NextResponse.json(
    {
      $schema: 'https://glama.ai/mcp/schemas/connector.json',
      claim,
    },
    {
      headers: {
        'cache-control': 'public, max-age=3600',
        'access-control-allow-origin': '*',
      },
    }
  )
}
