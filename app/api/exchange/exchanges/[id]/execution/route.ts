import { NextRequest, NextResponse } from 'next/server'
import { getProvider } from '@/exchange-gateway/src/execution-router'
import { authenticateCompany, authenticateDomainAgent, authenticateProposer, getExchangeAdmin, logEncounter } from '@/lib/exchange/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const publicId = (await params).id
  const admin = getExchangeAdmin()

  const { data: record } = await admin.from('exchange_records').select('id, target_domain, proposer_key_hash').eq('public_id', publicId).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })

  // ─── Authentication ───
  // Execution data (executions + receipts + live provider observations) is
  // sensitive. Only authenticated principals may read it: the company admin,
  // the domain agent, or the proposer who created the exchange. This mirrors
  // the auth model on GET /api/exchange/exchanges/{id}.
  const isCompany = await authenticateCompany(record.target_domain, req.headers.get('x-exchange-company-key'))
  const isProposer = authenticateProposer(record, req.headers.get('x-exchange-proposer-key'))
  const isDomainAgent = await authenticateDomainAgent(record.target_domain, req.headers.get('x-exchange-domain-agent-key'))
  if (!isCompany && !isProposer && !isDomainAgent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await logEncounter({
    targetDomain: record.target_domain,
    endpoint: `/api/exchange/exchanges/${publicId}/execution`,
    method: 'GET',
    req,
    result: 'ok',
  })

  // ─── Canonical state from the database ───
  // Explicit field projection — never select('*') on execution records.
  const { data: executions } = await admin.from('exchange_executions')
    .select('execution_id, provider, provider_reference, mode, state, task, budget, deadline, created_at')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  const { data: receipts } = await admin.from('exchange_execution_receipts')
    .select('execution_id, receipt_id, provider, amount, currency, state, created_at')
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
