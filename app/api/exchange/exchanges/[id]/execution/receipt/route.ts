import { NextRequest, NextResponse } from 'next/server'
import { SubmitReceiptSchema } from '@/exchange-gateway/src/schema'
import { getProvider } from '@/exchange-gateway/src/execution-router'
import { updateInternalExecutionState } from '@/exchange-gateway/src/providers/internal'
import { appendExchangeEvent, authenticateCompany, authenticateProposer, getExchangeAdmin, logEncounter } from '@/lib/exchange/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const publicId = (await params).id
  const admin = getExchangeAdmin()

  const { data: record } = await admin.from('exchange_records').select('*').eq('public_id', publicId).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })

  await logEncounter({
    targetDomain: record.target_domain,
    endpoint: `/api/exchange/exchanges/${publicId}/execution/receipt`,
    method: 'POST',
    req,
    result: 'ok',
  })

  if (record.state !== 'delivering' && record.state !== 'delivered' && record.state !== 'verified') {
    return NextResponse.json({ error: 'Exchange must be in delivering, delivered, or verified state to accept execution receipts' }, { status: 409 })
  }

  // Either the company admin or the proposer can submit a receipt
  const companyKey = req.headers.get('x-exchange-company-key')
  const proposerKey = req.headers.get('x-exchange-proposer-key')
  const isCompany = await authenticateCompany(record.target_domain, companyKey)
  const isProposer = authenticateProposer(record, proposerKey)
  if (!isCompany && !isProposer) {
    return NextResponse.json({ error: 'Company administrator or proposer authorization required to submit execution receipt' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SubmitReceiptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const receipt = parsed.data.receipt

  // Verify the execution exists
  const { data: execution } = await admin.from('exchange_executions')
    .select('*')
    .eq('execution_id', receipt.execution_reference.execution_id)
    .eq('exchange_id', record.id)
    .maybeSingle()

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found for this exchange' }, { status: 404 })
  }

  // Persist the receipt
  await admin.from('exchange_execution_receipts').insert({
    execution_id: receipt.execution_reference.execution_id,
    exchange_id: record.id,
    provider: receipt.provider,
    provider_reference: receipt.provider_reference,
    status: receipt.status,
    executor: receipt.executor,
    artifact: receipt.artifact ?? null,
    verification: receipt.verification ?? null,
    settlement: receipt.settlement ?? null,
    timestamps: receipt.timestamps,
    provider_metadata: receipt.provider_metadata ?? null,
    raw: receipt,
  })

  // Update execution state
  const newState = receipt.status === 'verified' ? 'verified' : receipt.status === 'delivered' ? 'delivered' : receipt.status === 'failed' ? 'failed' : receipt.status === 'cancelled' ? 'cancelled' : receipt.status === 'disputed' ? 'disputed' : 'delivered'
  await admin.from('exchange_executions').update({ state: newState, updated_at: new Date().toISOString() }).eq('execution_id', receipt.execution_reference.execution_id)

  // Update internal provider state if applicable
  if (receipt.provider === 'internal') {
    updateInternalExecutionState(receipt.execution_reference.execution_id, newState)
  }

  // Move the exchange forward if the receipt indicates delivery or verification
  if (receipt.status === 'delivered' && record.state === 'delivering') {
    await admin.from('exchange_records').update({ state: 'delivered', updated_at: new Date().toISOString() }).eq('id', record.id)
    await appendExchangeEvent({
      exchangeId: record.id,
      eventType: 'execution_receipt_delivered',
      actor: { type: isCompany ? 'company' : 'proposer', id: isCompany ? record.target_domain : 'proposer' },
      fromState: 'delivering',
      toState: 'delivered',
      payload: { execution_id: receipt.execution_reference.execution_id, provider: receipt.provider, artifact_hash: receipt.artifact?.hash },
    })
  } else if (receipt.status === 'verified' && record.state !== 'verified' && record.state !== 'settled') {
    await admin.from('exchange_records').update({ state: 'verified', updated_at: new Date().toISOString() }).eq('id', record.id)
    await appendExchangeEvent({
      exchangeId: record.id,
      eventType: 'execution_receipt_verified',
      actor: { type: isCompany ? 'company' : 'proposer', id: isCompany ? record.target_domain : 'proposer' },
      fromState: record.state,
      toState: 'verified',
      payload: { execution_id: receipt.execution_reference.execution_id, provider: receipt.provider, verification_status: receipt.verification?.status },
    })
  } else {
    await appendExchangeEvent({
      exchangeId: record.id,
      eventType: 'execution_receipt_submitted',
      actor: { type: isCompany ? 'company' : 'proposer', id: isCompany ? record.target_domain : 'proposer' },
      fromState: record.state as any,
      toState: record.state as any,
      payload: { execution_id: receipt.execution_reference.execution_id, provider: receipt.provider, status: receipt.status },
    })
  }

  return NextResponse.json({
    accepted: true,
    execution_id: receipt.execution_reference.execution_id,
    status: receipt.status,
    exchange_state: receipt.status === 'delivered' ? 'delivered' : receipt.status === 'verified' ? 'verified' : undefined,
  })
}
