import { NextRequest, NextResponse } from 'next/server'
import { getProvider } from '@/exchange-gateway/src/execution-router'
import { getExchangeAdmin, logEncounter } from '@/lib/exchange/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const publicId = (await params).id
  const admin = getExchangeAdmin()

  const { data: record } = await admin.from('exchange_records').select('id, target_domain').eq('public_id', publicId).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })

  await logEncounter({
    targetDomain: record.target_domain,
    endpoint: `/api/exchange/exchanges/${publicId}/execution`,
    method: 'GET',
    req,
    result: 'ok',
  })

  const { data: executions } = await admin.from('exchange_executions')
    .select('*')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  const { data: receipts } = await admin.from('exchange_execution_receipts')
    .select('*')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  // If there's an active execution, try to get live status from the provider
  const liveStatuses: Record<string, unknown> = {}
  for (const exec of executions ?? []) {
    if (exec.state === 'created' || exec.state === 'accepted' || exec.state === 'executing' || exec.state === 'funded') {
      const provider = getProvider(exec.provider)
      if (provider) {
        try {
          const status = await provider.getExecution({
            execution_id: exec.execution_id,
            provider: exec.provider,
            provider_reference: exec.provider_reference,
            created_at: exec.created_at,
          })
          liveStatuses[exec.execution_id] = status
        } catch {
          // Provider may be unavailable — skip live status
        }
      }
    }
  }

  return NextResponse.json({
    executions: executions ?? [],
    receipts: receipts ?? [],
    live_status: liveStatuses,
  })
}
