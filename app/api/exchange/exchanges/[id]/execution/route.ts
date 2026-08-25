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

  // ─── Canonical state from the database ───
  const { data: executions } = await admin.from('exchange_executions')
    .select('*')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  const { data: receipts } = await admin.from('exchange_execution_receipts')
    .select('*')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  // ─── Live provider observations (non-authoritative) ───
  // These are labeled as observations. They must NOT silently overwrite
  // the database or the Contribution Exchange record.
  const providerObservations: Record<string, { state: string; observed_at: string; authoritative: boolean; message?: string }> = {}
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
          providerObservations[exec.execution_id] = {
            state: status.state,
            observed_at: status.updated_at,
            authoritative: false,
            message: status.message,
          }
        } catch {
          // Provider may be unavailable — skip observation
        }
      }
    }
  }

  return NextResponse.json({
    executions: (executions ?? []).map((e: any) => ({
      ...e,
      state_source: 'database',
    })),
    receipts: receipts ?? [],
    provider_observations: providerObservations,
  })
}
