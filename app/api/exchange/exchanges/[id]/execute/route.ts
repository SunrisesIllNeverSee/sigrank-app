import { NextRequest, NextResponse } from 'next/server'
import { CreateExecutionSchema } from '@/exchange-gateway/src/schema'
import { routeExecution } from '@/exchange-gateway/src/execution-router'
import { mergeExchangePolicy } from '@/exchange-gateway/src/policy'
import { appendExchangeEvent, authenticateCompany, getExchangeAdmin, logEncounter } from '@/lib/exchange/server'
import type { ContributionCommitment } from '@/exchange-gateway/src/types'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const publicId = (await params).id
  const admin = getExchangeAdmin()

  const { data: record } = await admin.from('exchange_records').select('*').eq('public_id', publicId).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })

  await logEncounter({
    targetDomain: record.target_domain,
    endpoint: `/api/exchange/exchanges/${publicId}/execute`,
    method: 'POST',
    req,
    result: 'ok',
  })

  if (record.state !== 'authorized' && record.state !== 'delivering') {
    return NextResponse.json({ error: 'Exchange must be authorized before execution can be routed' }, { status: 409 })
  }

  if (!(await authenticateCompany(record.target_domain, req.headers.get('x-exchange-company-key')))) {
    return NextResponse.json({ error: 'Company administrator authorization required to route execution' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateExecutionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const commitment = record.commitment as ContributionCommitment | undefined
  if (!commitment) {
    return NextResponse.json({ error: 'No commitment found on this exchange; cannot route execution' }, { status: 409 })
  }

  const company = await admin.from('exchange_companies').select('exchange_policy, categories').eq('domain', record.target_domain).maybeSingle()
  const policy = mergeExchangePolicy(company?.data?.exchange_policy, company?.data?.categories ?? [])

  const result = await routeExecution(commitment, policy, {
    provider_id: parsed.data.provider_id,
    mode: parsed.data.mode,
    principal_approved: true,
    task_title: parsed.data.task_title,
    task_description: parsed.data.task_description,
    deliverables: parsed.data.deliverables,
    acceptance_criteria: parsed.data.acceptance_criteria,
    budget: parsed.data.budget_amount ? { amount: parsed.data.budget_amount, currency: parsed.data.budget_currency ?? 'USD' } : undefined,
    deadline: parsed.data.deadline,
  })

  if (!result.reference) {
    const status = result.mode === 'no_execution_required' ? 200 : 409
    return NextResponse.json({
      execution_created: false,
      mode: result.mode,
      provider: result.provider_id,
      assessment: result.assessment,
      reason: result.reason,
    }, { status })
  }

  const { error: executionInsertError } = await admin.from('exchange_executions').insert({
    exchange_id: record.id,
    execution_id: result.reference.execution_id,
    contribution_id: commitment.contribution_id,
    source_commitment_hash: commitment.provenance.terms_hash,
    provider: result.reference.provider,
    provider_reference: result.reference.provider_reference,
    mode: result.mode,
    state: 'created',
    task: {
      title: parsed.data.task_title ?? commitment.contribution.title,
      description: parsed.data.task_description ?? commitment.contribution.description,
      deliverables: parsed.data.deliverables ?? ['Work as described in the contribution'],
      acceptance_criteria: parsed.data.acceptance_criteria ?? commitment.verification.criteria,
    },
    budget: parsed.data.budget_amount ? { amount: parsed.data.budget_amount, currency: parsed.data.budget_currency ?? 'USD' } : null,
    authority: {
      inspect: commitment.authorization.inspect,
      test: commitment.authorization.test,
      modify: commitment.authorization.modify,
      deploy: commitment.authorization.deploy,
      access_scope: commitment.authorization.access_scope ?? [],
    },
    verification: {
      criteria: commitment.verification.criteria,
      evidence_required: commitment.verification.evidence ?? [],
    },
    deadline: parsed.data.deadline ?? null,
    provenance: {
      originator: commitment.parties.contributor.id,
      contribution_lineage: commitment.provenance.parent ? [commitment.provenance.parent] : [],
    },
    message: result.reason,
  })
  if (executionInsertError) {
    return NextResponse.json({ error: 'Execution was created by the provider but could not be persisted', execution_id: result.reference.execution_id }, { status: 500 })
  }

  if (record.state === 'authorized' && (result.mode === 'self_executed' || result.mode === 'external_provider' || result.mode === 'direct_agent')) {
    const { error: exchangeUpdateError } = await admin.from('exchange_records')
      .update({ state: 'delivering', updated_at: new Date().toISOString() })
      .eq('id', record.id)
    if (exchangeUpdateError) {
      return NextResponse.json({ error: 'Execution persisted but exchange state could not advance to delivering', execution_id: result.reference.execution_id }, { status: 500 })
    }

    await appendExchangeEvent({
      exchangeId: record.id,
      eventType: 'execution_routed',
      actor: { type: 'company', id: record.target_domain },
      fromState: 'authorized',
      toState: 'delivering',
      payload: { mode: result.mode, provider: result.reference.provider, execution_id: result.reference.execution_id },
    })
  }

  return NextResponse.json({
    execution_created: true,
    execution_id: result.reference.execution_id,
    mode: result.mode,
    provider: result.provider_id,
    reference: result.reference,
    assessment: result.assessment,
    reason: result.reason,
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const publicId = (await params).id
  const admin = getExchangeAdmin()

  const { data: record } = await admin.from('exchange_records').select('id, target_domain').eq('public_id', publicId).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })

  const { data: executions } = await admin.from('exchange_executions')
    .select('*')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  const { data: receipts } = await admin.from('exchange_execution_receipts')
    .select('*')
    .eq('exchange_id', record.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    executions: executions ?? [],
    receipts: receipts ?? [],
  })
}
